import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Project } from '../dist/core.js';

test('Cross-agent handoff: start in Claude Code, continue in Codex, finish phase in Antigravity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scopelock-cross-agent-'));
  const src = fileURLToPath(new URL('../examples/task-app/', import.meta.url));
  try {
    for (const f of ['tasks.mjs', 'check.mjs', 'requirements.md']) {
      await copyFile(join(src, f), join(root, f));
    }
    const p = new Project(root);
    await p.init('Cross Agent Handoff Pipeline');
    await p.import(await readFile(join(root, 'requirements.md'), 'utf8'));
    await p.confirm();

    // Define and approve checks for all P01 requirements
    for (const [i, mode] of ['add', 'empty', 'complete'].entries()) {
      const id = 'CHECK-00' + (i + 1);
      await p.defineCheck({
        id,
        title: mode,
        criteria: ['REQ-00' + (i + 1) + '-AC1'],
        command: process.execPath,
        args: ['check.mjs', mode],
        cwd: '.',
        timeoutMs: 10000
      });
      await p.approveCheck(id);
    }

    async function createAgentSession(agentName) {
      const client = new Client({ name: `${agentName}-client`, version: '1.0' });
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [resolve('dist/cli.js'), '--project', root, 'mcp', agentName]
      });
      await client.connect(transport);
      return client;
    }

    // ==========================================
    // AGENT 1: Claude Code begins Phase P01
    // ==========================================
    const claude = await createAgentSession('claude-code');
    try {
      const handoff = JSON.parse((await claude.callTool({ name: 'get_handoff', arguments: {} })).content[0].text);
      assert.equal(handoff.phase.id, 'P01');
      assert.equal(handoff.next.id, 'REQ-001');

      // Claude implements and verifies REQ-001
      await claude.callTool({
        name: 'record_implementation',
        arguments: { id: 'REQ-001', status: 'implemented' }
      });
      const runRes = JSON.parse((await claude.callTool({ name: 'run_check', arguments: { id: 'CHECK-001' } })).content[0].text);
      assert.equal(runRes.status, 'passed');

      await claude.callTool({
        name: 'record_evidence',
        arguments: { criterion: 'REQ-001-AC1', result: 'passed', note: 'Claude verified task creation' }
      });
    } finally {
      await claude.close();
    }

    // Verify Claude's progress recorded
    const stateAfterClaude = await p.view();
    assert.equal(stateAfterClaude.requirements.find(r => r.id === 'REQ-001').verification, 'passed');
    assert.equal(stateAfterClaude.requirements.find(r => r.id === 'REQ-002').verification, 'not_checked');

    // ==========================================
    // AGENT 2: Codex continues without reimporting
    // ==========================================
    const codex = await createAgentSession('codex');
    try {
      const handoff = JSON.parse((await codex.callTool({ name: 'get_handoff', arguments: {} })).content[0].text);
      assert.equal(handoff.phase.id, 'P01');
      // Codex sees REQ-001 is already passed!
      const req1 = handoff.requirements.find(r => r.id === 'REQ-001');
      assert.equal(req1.verification, 'passed');
      // Next task is REQ-002
      assert.equal(handoff.next.id, 'REQ-002');

      // Codex implements and verifies REQ-002
      await codex.callTool({
        name: 'record_implementation',
        arguments: { id: 'REQ-002', status: 'implemented' }
      });
      const runRes = JSON.parse((await codex.callTool({ name: 'run_check', arguments: { id: 'CHECK-002' } })).content[0].text);
      assert.equal(runRes.status, 'passed');

      await codex.callTool({
        name: 'record_evidence',
        arguments: { criterion: 'REQ-002-AC1', result: 'passed', note: 'Codex verified empty task rejection' }
      });
    } finally {
      await codex.close();
    }

    // Verify Codex's progress recorded
    const stateAfterCodex = await p.view();
    assert.equal(stateAfterCodex.requirements.find(r => r.id === 'REQ-002').verification, 'passed');
    assert.equal(stateAfterCodex.requirements.find(r => r.id === 'REQ-003').verification, 'not_checked');

    // ==========================================
    // AGENT 3: Antigravity completes Phase P01
    // ==========================================
    const antigravity = await createAgentSession('antigravity');
    try {
      const handoff = JSON.parse((await antigravity.callTool({ name: 'get_handoff', arguments: {} })).content[0].text);
      assert.equal(handoff.phase.id, 'P01');
      assert.equal(handoff.next.id, 'REQ-003'); // Dependency on REQ-001 is satisfied!

      // Antigravity implements and verifies REQ-003
      await antigravity.callTool({
        name: 'record_implementation',
        arguments: { id: 'REQ-003', status: 'implemented' }
      });
      const runRes = JSON.parse((await antigravity.callTool({ name: 'run_check', arguments: { id: 'CHECK-003' } })).content[0].text);
      assert.equal(runRes.status, 'passed');

      await antigravity.callTool({
        name: 'record_evidence',
        arguments: { criterion: 'REQ-003-AC1', result: 'passed', note: 'Antigravity verified completion' }
      });
    } finally {
      await antigravity.close();
    }

    // Verify Phase P01 exit gate is now PASSED and phase is implemented!
    const finalView = await p.view();
    const p01 = finalView.phases.find(ph => ph.id === 'P01');
    assert.equal(p01.verification, 'passed');
    assert.equal(p01.implementation, 'implemented');

    // Activate next phase P02 without override
    await p.activate('P02');
    assert.equal((await p.read()).activePhase, 'P02');

    // Verify events recorded all three distinct agent actors
    const events = (await p.read()).events;
    assert.ok(events.some(e => e.actor === 'claude-code'));
    assert.ok(events.some(e => e.actor === 'codex'));
    assert.ok(events.some(e => e.actor === 'antigravity'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
