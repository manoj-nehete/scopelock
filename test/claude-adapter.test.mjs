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

test('Claude Code adapter fixture session workflow and exit gate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scopelock-claude-fixture-'));
  const src = fileURLToPath(new URL('../examples/task-app/', import.meta.url));
  try {
    for (const f of ['tasks.mjs', 'check.mjs', 'requirements.md']) {
      await copyFile(join(src, f), join(root, f));
    }
    const p = new Project(root);
    await p.init('Claude Code Fixture Test');
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

    // 1. Existing user configuration must survive
    const existingInstructions = '# Pre-existing team instructions\nDo not delete this line.\n';
    const existingMcp = JSON.stringify({ mcpServers: { customTool: { command: 'node', args: ['custom.js'] } } }, null, 2) + '\n';
    await writeFile(join(root, 'CLAUDE.md'), existingInstructions);
    await writeFile(join(root, '.mcp.json'), existingMcp);

    // 2. Install Claude Code adapter
    const installRes = await connect(p, 'claude-code');
    assert.equal(installRes.installed, true);
    assert.equal(installRes.config, '.mcp.json');
    assert.equal(installRes.instruction, 'CLAUDE.md');

    // Verify existing user settings were preserved
    const installedMcp = JSON.parse(await readFile(join(root, '.mcp.json'), 'utf8'));
    assert.ok(installedMcp.mcpServers.customTool);
    assert.ok(installedMcp.mcpServers.scopelock);
    const installedInstructions = await readFile(join(root, 'CLAUDE.md'), 'utf8');
    assert.ok(installedInstructions.includes('# Pre-existing team instructions'));
    assert.ok(installedInstructions.includes('<!-- ScopeLock managed start -->'));

    // 3. Diagnostics probe
    const probeRes = await probe(p, 'claude-code');
    assert.equal(probeRes.ok, true);
    assert.equal(probeRes.tools, 10);

    // 4. Claude Code MCP session
    const client = new Client({ name: 'claude-code-session-test', version: '1.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve('dist/cli.js'), '--project', root, 'mcp', 'claude-code']
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

      // Claude Code runs approved check
      const goodRun = await client.callTool({ name: 'run_check', arguments: { id: 'CHECK-001' } });
      assert.ok(!goodRun.isError);
      const runData = JSON.parse(goodRun.content[0].text);
      assert.equal(runData.status, 'passed');

      // Claude Code records evidence
      const evidRes = await client.callTool({
        name: 'record_evidence',
        arguments: {
          criterion: 'REQ-001-AC1',
          result: 'passed',
          note: 'Claude Code executed check.mjs add'
        }
      });
      assert.ok(!evidRes.isError);

      // Requirement is now verified
      assert.equal((await p.view()).requirements[0].verification, 'passed');

      // Claude Code proposes scope change
      const propRes = await client.callTool({
        name: 'propose_scope_change',
        arguments: {
          source: (await p.read()).source + '\n## REQ-006: Claude Note\n- Acceptance: Claude.\n',
          reason: 'Claude proposal'
        }
      });
      assert.ok(!propRes.isError);
      assert.equal((await p.read()).scopeRevision, 1);

      // Verify agent events have actor: 'claude-code'
      const state = await p.read();
      const claudeEvents = state.events.filter(e => e.actor === 'claude-code');
      assert.ok(claudeEvents.length >= 4);

      // Agent cannot accept scope changes
      const toolNames = (await client.listTools()).tools.map(t => t.name);
      assert.ok(!toolNames.includes('accept_scope_change'));
    } finally {
      await client.close();
    }

    // 5. Safe uninstall and restore check
    const uninstallRes = await connect(p, 'claude-code', true);
    assert.equal(uninstallRes.installed, false);
    assert.equal(await readFile(join(root, 'CLAUDE.md'), 'utf8'), existingInstructions);
    assert.equal(await readFile(join(root, '.mcp.json'), 'utf8'), existingMcp);

    // Reinstall idempotency
    const reinstallRes = await connect(p, 'claude-code');
    assert.equal(reinstallRes.installed, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

