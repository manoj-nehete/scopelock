import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Project } from '../dist/core.js';
import { connect, probe } from '../dist/adapters.js';

test('Codex adapter fixture session workflow and exit gate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scopelock-codex-fixture-'));
  const src = fileURLToPath(new URL('../examples/task-app/', import.meta.url));
  try {
    for (const f of ['tasks.mjs', 'check.mjs', 'requirements.md']) {
      await copyFile(join(src, f), join(root, f));
    }
    const p = new Project(root);
    await p.init('Codex Fixture Test');
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

    // 1. Existing user configuration must survive in .codex/config.toml and AGENTS.md
    await mkdir(join(root, '.codex'), { recursive: true });
    const existingInstructions = '# Pre-existing Codex instructions\nDo not delete this line.\n';
    const existingConfig = 'model = "gpt-5-preview"\nsandbox = "read-only"\n';
    await writeFile(join(root, 'AGENTS.md'), existingInstructions);
    await writeFile(join(root, '.codex', 'config.toml'), existingConfig);

    // 2. Install Codex adapter
    const installRes = await connect(p, 'codex');
    assert.equal(installRes.installed, true);
    assert.equal(installRes.config, '.codex/config.toml');
    assert.equal(installRes.instruction, 'AGENTS.md');

    // Verify existing user settings were preserved
    const installedConfig = await readFile(join(root, '.codex', 'config.toml'), 'utf8');
    assert.ok(installedConfig.includes('model = "gpt-5-preview"'));
    assert.ok(installedConfig.includes('[mcp_servers.scopelock]'));
    const installedInstructions = await readFile(join(root, 'AGENTS.md'), 'utf8');
    assert.ok(installedInstructions.includes('# Pre-existing Codex instructions'));
    assert.ok(installedInstructions.includes('<!-- ScopeLock managed start -->'));

    // 3. Diagnostics probe
    const probeRes = await probe(p, 'codex');
    assert.equal(probeRes.ok, true);
    assert.equal(probeRes.tools, 10);

    // 4. Codex MCP session
    const client = new Client({ name: 'codex-session-test', version: '1.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve('dist/cli.js'), '--project', root, 'mcp', 'codex']
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

      // Codex runs approved check
      const goodRun = await client.callTool({ name: 'run_check', arguments: { id: 'CHECK-001' } });
      assert.ok(!goodRun.isError);
      const runData = JSON.parse(goodRun.content[0].text);
      assert.equal(runData.status, 'passed');

      // Codex records evidence
      const evidRes = await client.callTool({
        name: 'record_evidence',
        arguments: {
          criterion: 'REQ-001-AC1',
          result: 'passed',
          note: 'Codex executed check.mjs add'
        }
      });
      assert.ok(!evidRes.isError);

      // Requirement is now verified
      assert.equal((await p.view()).requirements[0].verification, 'passed');

      // Codex proposes scope change
      const propRes = await client.callTool({
        name: 'propose_scope_change',
        arguments: {
          source: (await p.read()).source + '\n## REQ-006: Codex Note\n- Acceptance: Codex.\n',
          reason: 'Codex proposal'
        }
      });
      assert.ok(!propRes.isError);
      assert.equal((await p.read()).scopeRevision, 1);

      // Verify agent events have actor: 'codex'
      const state = await p.read();
      const codexEvents = state.events.filter(e => e.actor === 'codex');
      assert.ok(codexEvents.length >= 4);

      // Agent cannot accept scope changes
      const toolNames = (await client.listTools()).tools.map(t => t.name);
      assert.ok(!toolNames.includes('accept_scope_change'));
    } finally {
      await client.close();
    }

    // 5. Safe uninstall and restore check
    const uninstallRes = await connect(p, 'codex', true);
    assert.equal(uninstallRes.installed, false);
    assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), existingInstructions);
    assert.equal(await readFile(join(root, '.codex', 'config.toml'), 'utf8'), existingConfig);

    // Reinstall idempotency
    const reinstallRes = await connect(p, 'codex');
    assert.equal(reinstallRes.installed, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

