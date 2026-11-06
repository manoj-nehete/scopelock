import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Project } from '../dist/core.js';
import { connect, probe } from '../dist/adapters.js';

test('Antigravity real fixture session workflow and exit gate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scopelock-antigravity-fixture-'));
  const src = fileURLToPath(new URL('../examples/task-app/', import.meta.url));
  try {
    for (const f of ['tasks.mjs', 'check.mjs', 'requirements.md']) {
      await copyFile(join(src, f), join(root, f));
    }
    const p = new Project(root);
    await p.init('Antigravity Fixture Test');
    await p.import(await readFile(join(root, 'requirements.md'), 'utf8'));
    await p.confirm();

    for (const [i, mode] of ['add', 'empty', 'complete', 'persistence'].entries()) {
      await p.defineCheck({
        id: 'CHECK-00' + (i + 1),
        title: mode,
        criteria: ['REQ-00' + (i + 1) + '-AC1'],
        command: process.execPath,
        args: ['check.mjs', mode],
        cwd: '.',
        timeoutMs: 10000
      });
    }

    // 1. Install Antigravity adapter
    const installRes = await connect(p, 'antigravity');
    assert.equal(installRes.installed, true);
    assert.ok(installRes.config.includes('.agents/mcp_config.json'));
    assert.ok(installRes.instruction.includes('.agents/rules/scopelock.md'));

    // 2. Diagnostics probe
    const probeRes = await probe(p, 'antigravity');
    assert.equal(probeRes.ok, true);
    assert.equal(probeRes.tools, 10);

    // 3. Antigravity MCP session
    const client = new Client({ name: 'antigravity-session-test', version: '1.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve('dist/cli.js'), '--project', root, 'mcp', 'antigravity']
    });
    await client.connect(transport);

    try {
      // Step A: Read handoff and phase
      const handoffRes = await client.callTool({ name: 'get_handoff', arguments: {} });
      assert.ok(!handoffRes.isError);
      const handoff = JSON.parse(handoffRes.content[0].text);
      assert.equal(handoff.phase.id, 'P01');

      // Step B: Read requirements
      const reqsRes = await client.callTool({ name: 'get_requirements', arguments: { phase: 'P01' } });
      assert.ok(!reqsRes.isError);
      const reqs = JSON.parse(reqsRes.content[0].text);
      assert.equal(reqs.length, 3);

      // Step C: Update implementation to in_progress then implemented
      await client.callTool({
        name: 'record_implementation',
        arguments: { id: 'REQ-001', status: 'in_progress' }
      });
      await client.callTool({
        name: 'record_implementation',
        arguments: { id: 'REQ-001', status: 'implemented' }
      });

      // Implementation does not verify
      assert.equal((await p.view()).requirements[0].implementation, 'implemented');
      assert.equal((await p.view()).requirements[0].verification, 'not_checked');

      // Unapproved check fails
      const badRun = await client.callTool({ name: 'run_check', arguments: { id: 'CHECK-001' } });
      assert.ok(badRun.isError);

      // Human approves check
      await p.approveCheck('CHECK-001');

      // Antigravity runs approved check
      const goodRun = await client.callTool({ name: 'run_check', arguments: { id: 'CHECK-001' } });
      assert.ok(!goodRun.isError);
      const runData = JSON.parse(goodRun.content[0].text);
      assert.equal(runData.status, 'passed');

      // Antigravity records evidence
      const evidRes = await client.callTool({
        name: 'record_evidence',
        arguments: {
          criterion: 'REQ-001-AC1',
          result: 'passed',
          note: 'Antigravity executed check.mjs add'
        }
      });
      assert.ok(!evidRes.isError);

      // Requirement is now verified
      assert.equal((await p.view()).requirements[0].verification, 'passed');

      // Antigravity proposes scope change
      const propRes = await client.callTool({
        name: 'propose_scope_change',
        arguments: {
          source: (await p.read()).source + '\n## REQ-006: Extra\n- Acceptance: Extra.\n',
          reason: 'Antigravity proposal'
        }
      });
      assert.ok(!propRes.isError);
      assert.equal((await p.read()).scopeRevision, 1);

      // Security check: agent cannot accept scope changes
      const toolNames = (await client.listTools()).tools.map(t => t.name);
      assert.ok(!toolNames.includes('accept_scope_change'));
    } finally {
      await client.close();
    }

    // 4. Uninstall and reinstall adapter round trip
    const uninstallRes = await connect(p, 'antigravity', true);
    assert.equal(uninstallRes.installed, false);
    const reinstallRes = await connect(p, 'antigravity');
    assert.equal(reinstallRes.installed, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

