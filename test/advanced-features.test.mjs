import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {Project,getFileFingerprints} from '../dist/core.js';
import {runCheck} from '../dist/runner.js';
import {dashboard} from '../dist/server.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const exec=promisify(execFile);
const cli=resolve('dist/cli.js');

async function withFixture(fn) {
 const root = await mkdtemp(join(tmpdir(), 'scopelock-adv-'));
 try {
  const p = new Project(root);
  await fn(p, root);
 } finally {
  await rm(root, { recursive: true, force: true });
 }
}

test('Feature A: coverage links, missing counts, and correctness disclaimer', () => withFixture(async (p, root) => {
 await p.init('Coverage Project');
 const source = [
  '# Phase P01: Foundation',
  '## REQ-001: Model engine',
  '- Acceptance (manual): Parses correctly.',
  '- Files: src/model.ts',
  '## REQ-002: Check runner',
  '- Acceptance (automated): Tests pass.',
  '- Files: src/runner.ts',
  '## REQ-003: Unlinked item',
  '- Acceptance (manual): User verified.'
 ].join('\n');
 await p.import(source);
 await p.confirm();

 // REQ-001 has files but no check or evidence
 // REQ-002 has files and automated criterion, but no check defined
 // REQ-003 has no files and no evidence
 const cov1 = await p.coverage();
 assert.equal(cov1.summary.totalRequirements, 3);
 assert.equal(cov1.summary.missingFilesCount, 1); // REQ-003
 assert.equal(cov1.summary.missingChecksCount, 1); // REQ-002 has automated AC without check
 assert.equal(cov1.summary.missingEvidenceCount, 3); // All not_checked
 assert.equal(cov1.summary.implementedUnverifiedCount, 0);
 assert.match(cov1.summary.notice, /do not automatically prove semantic correctness/);

 // Mark REQ-001 implemented without verification
 await p.update('REQ-001', 'implemented');
 const cov2 = await p.coverage();
 assert.equal(cov2.summary.implementedUnverifiedCount, 1);

 // Add a check for REQ-002
 await p.defineCheck({
  id: 'CHK-002',
  title: 'Runner test',
  criteria: ['REQ-002-AC1'],
  command: process.execPath,
  args: ['--version'],
  cwd: '.'
 });
 const cov3 = await p.coverage();
 assert.equal(cov3.summary.missingChecksCount, 0);
}));

test('Feature B: dependency graph, blocker calculation, eligible work, and cycle detection', () => withFixture(async (p) => {
 await p.init('Deps Project');
 const source = [
  '# Phase P01: Setup',
  '## REQ-001: Setup item',
  '- Acceptance: Ready.',
  '# Phase P02: Build',
  '- Phase depends: P01',
  '## REQ-002: Core logic',
  '- Acceptance: Built.',
  '- Depends: REQ-001',
  '## REQ-003: Blocked item',
  '- Acceptance: Tested.',
  '- Depends: REQ-002'
 ].join('\n');
 await p.import(source);
 await p.confirm();

 const graph = await p.dependencyGraph();
 assert.equal(graph.phases.length, 2);
 assert.equal(graph.requirements.length, 3);

 // REQ-001 has no dependencies and Phase P01 is active -> eligible to start
 assert.ok(graph.eligibleToStart.includes('REQ-001'));
 // REQ-002 depends on REQ-001 (unverified) -> blocked
 assert.ok(!graph.eligibleToStart.includes('REQ-002'));
 const req2 = graph.requirements.find(r => r.id === 'REQ-002');
 assert.equal(req2.isBlocked, true);
 assert.match(req2.blockerReasons[0], /REQ-001/);

 // Accessible list check
 assert.ok(graph.accessibleList.phases.length > 0);
 assert.ok(graph.accessibleList.requirements.length > 0);
 assert.match(graph.accessibleList.requirements[0], /REQ-001/);

 // Cycle rejection check
 const cycleSource = [
  '# Phase P01: Base',
  '## REQ-001: Item 1',
  '- Acceptance: Yes.',
  '- Depends: REQ-002',
  '## REQ-002: Item 2',
  '- Acceptance: Yes.',
  '- Depends: REQ-001'
 ].join('\n');
 await p.propose(cycleSource, 'Cycle test');
 const prop = (await p.read()).proposals.at(-1);
 await assert.rejects(p.decide(prop.id, true), /Dependency cycle/);
}));

test('Feature C: change-impact tracking detects modified files and flags affected evidence', () => withFixture(async (p, root) => {
 await p.init('Impact Project');
 const codeFile = join(root, 'app.js');
 await writeFile(codeFile, 'console.log("v1");\n');
 const source = [
  '# Phase P01: Main',
  '## REQ-001: App code',
  '- Acceptance (automated): App works.',
  '- Files: app.js'
 ].join('\n');
 await p.import(source);
 await p.confirm();

 await p.defineCheck({
  id: 'CHK-APP',
  title: 'Check app',
  criteria: ['REQ-001-AC1'],
  command: process.execPath,
  args: ['app.js'],
  cwd: '.'
 });
 await p.approveCheck('CHK-APP');
 await runCheck(p, 'CHK-APP');

 const view1 = await p.view();
 assert.equal(view1.criteria['REQ-001-AC1'].status, 'passed');

 // Modify the linked file app.js
 await writeFile(codeFile, 'console.log("v2 modified");\n');
 const impact = await p.changeImpact();
 assert.equal(impact.impactedCount, 1);
 assert.equal(impact.impacted[0].requirement, 'REQ-001');
 assert.match(impact.impacted[0].explanation, /linked file\(s\) changed/);
 assert.match(impact.notice, /heuristic tracking declared file dependencies/);

 // View also shows criterion as stale due to code fingerprint change
 const view2 = await p.view();
 assert.equal(view2.criteria['REQ-001-AC1'].status, 'stale');
}));

test('Feature D: handoff continuity across CLI, MCP, and shared state', () => withFixture(async (p, root) => {
 await p.init('Handoff Project');
 const source = [
  '# Phase P01: Initial',
  '## REQ-001: First requirement',
  '- Acceptance: Done.'
 ].join('\n');
 await p.import(source);
 await p.confirm();
 await p.update('REQ-001', 'blocked', 'Waiting on API key', 'claude-code');

 // 1. Engine handoff
 const h = await p.handoff('claude-code');
 assert.equal(h.project, 'Handoff Project');
 assert.equal(h.agent, 'claude-code');
 assert.equal(h.blockers.length, 1);
 assert.match(h.markdown, /# ScopeLock Agent Handoff/);
 assert.match(h.markdown, /Waiting on API key/);

 // 2. CLI handoff --export
 const handoffFile = join(root, 'handoff.md');
 const out = await exec(process.execPath, [cli, '--project', root, 'handoff', '--export', handoffFile]);
 const exportedMarkdown = await readFile(handoffFile, 'utf8');
 assert.match(exportedMarkdown, /# ScopeLock Agent Handoff/);
 assert.match(exportedMarkdown, /Waiting on API key/);

 // 3. MCP tool get_handoff
 const client = new Client({ name: 'mcp-test-client', version: '1.0' });
 const transport = new StdioClientTransport({
  command: process.execPath,
  args: [cli, '--project', root, 'mcp', 'codex']
 });
 try {
  await client.connect(transport);
  const mcpRes = await client.callTool({ name: 'get_handoff', arguments: {} });
  assert.equal(mcpRes.isError, undefined);
  const data = JSON.parse(mcpRes.content[0].text);
  assert.equal(data.project, 'Handoff Project');
  assert.equal(data.blockers.length, 1);
  assert.equal(data.blockers[0].id, 'REQ-001');
 } finally {
  await client.close();
 }
}));

test('Feature E: build timeline with multi-dimensional filtering', () => withFixture(async (p) => {
 await p.init('Timeline Project');
 await p.import('# Phase P01: Start\n## REQ-001: Item\n- Acceptance: Ok.\n');
 await p.confirm();
 await p.update('REQ-001', 'in_progress', '', 'claude-code');
 await p.update('REQ-001', 'blocked', 'Blocked by db', 'codex');

 const allEvents = await p.timeline();
 assert.ok(allEvents.totalEvents >= 4);

 // Filter by actor
 const codexEvents = await p.timeline({ actor: 'codex' });
 assert.equal(codexEvents.matchingEventsCount, 1);
 assert.equal(codexEvents.events[0].actor, 'codex');

 // Filter by requirement
 const reqEvents = await p.timeline({ requirement: 'REQ-001' });
 assert.ok(reqEvents.matchingEventsCount >= 2);

 // Filter by query
 const dbEvents = await p.timeline({ query: 'Blocked by db' });
 assert.equal(dbEvents.matchingEventsCount, 1);

 // Empty state
 const emptyEvents = await p.timeline({ actor: 'non-existent-agent' });
 assert.equal(emptyEvents.matchingEventsCount, 0);
 assert.equal(emptyEvents.emptyStateMessage, 'No activity matches the selected filters.');
}));

test('Feature F: checkpoints and differential progress comparison', () => withFixture(async (p) => {
 await p.init('Checkpoint Project');
 await p.import('# Phase P01: Phase 1\n## REQ-001: Initial\n- Acceptance: Valid.\n');
 await p.confirm();
 await p.evidence('REQ-001-AC1', 'passed', 'Verified initial', 'human');

 // Create Checkpoint 1
 await p.createCheckpoint('Milestone 1', 'Baseline before changes', 'human');
 const ckpts = await p.listCheckpoints();
 assert.equal(ckpts.length, 1);
 const ckpt1Id = ckpts[0].id;

 // Now make changes: propose new requirement (scope growth) and simulate regression
 const newSource = '# Phase P01: Phase 1\n## REQ-001: Initial\n- Acceptance: Valid.\n## REQ-002: Added scope\n- Acceptance: Added.\n';
 await p.propose(newSource, 'Add REQ-002', 'human');
 const prop = (await p.read()).proposals[0];
 await p.decide(prop.id, true);
 await p.update('REQ-002', 'blocked', 'Needs design', 'human');

 // Compare Checkpoint 1 against current workspace
 const diff = await p.compareCheckpoints(ckpt1Id, 'current');
 assert.equal(diff.metrics.scopeGrowth.delta, 1); // 1 requirement added
 assert.equal(diff.scopeAdditions.length, 1);
 assert.equal(diff.scopeAdditions[0].id, 'REQ-002');
 assert.equal(diff.newBlockers.length, 1);
 assert.equal(diff.newBlockers[0].id, 'REQ-002');
}));

test('Feature G: scope-drift review highlights unlinked files and allows linking/supporting', () => withFixture(async (p, root) => {
 await p.init('Drift Project');
 await p.import('# Phase P01: Base\n## REQ-001: Code item\n- Acceptance: Done.\n- Files: src/known.ts\n');
 await p.confirm();

 await mkdir(join(root, 'src'), { recursive: true });
 await writeFile(join(root, 'src/known.ts'), '// known\n');
 await writeFile(join(root, 'src/rogue.ts'), '// unlinked code\n');

 // Scope drift detects src/rogue.ts
 const drift1 = await p.scopeDrift();
 assert.ok(drift1.unlinked.some(f => f.path.includes('src/rogue.ts')));
 assert.match(drift1.notice, /Scope-drift review is a heuristic/);

 // Link to requirement
 await p.linkFileToRequirement('REQ-001', 'src/rogue.ts');
 const drift2 = await p.scopeDrift();
 assert.ok(!drift2.unlinked.some(f => f.path.includes('src/rogue.ts')));

 // Add a config file as supporting infrastructure
 await writeFile(join(root, 'tool.config.json'), '{"tool": true}\n');
 const drift3 = await p.scopeDrift();
 assert.ok(drift3.unlinked.some(f => f.path.includes('tool.config.json')));

 await p.addSupportingFile('tool.config.json', 'Build and lint configuration');
 const drift4 = await p.scopeDrift();
 assert.ok(!drift4.unlinked.some(f => f.path.includes('tool.config.json')));
 assert.equal(drift4.supportingFiles.length, 1);
}));

test('Feature H: release-readiness report audits blockers, exit gates, and exports Markdown', () => withFixture(async (p) => {
 await p.init('Readiness Project');
 const source = [
  '# Phase P01: Alpha',
  '## REQ-001: Alpha feature',
  '- Acceptance (automated): Unit tests.',
  '- Acceptance (manual): Manual review.'
 ].join('\n');
 await p.import(source);
 await p.confirm();

 // Initial state: criteria not checked, integrations not configured
 const r1 = await p.releaseReadiness();
 assert.equal(r1.isReady, false);
 assert.ok(r1.blockers.length > 0);
 assert.ok(r1.blockers.some(b => b.type === 'missing_evidence'));
 assert.ok(r1.blockers.some(b => b.type === 'unmet_phase_gate'));
 assert.match(r1.notice, /Release gates require empirical evidence/);

 // Export markdown report
 const md = await p.exportReadinessReport();
 assert.match(md, /# ScopeLock Release-Readiness Report/);
 assert.match(md, /missing verification/i);
 assert.match(md, /Release Gate Summary/);
}));

test('Feature I: saved dashboard filters persist across restarts', () => withFixture(async (p, root) => {
 await p.init('Filters Project');
 await p.import('# Phase P01: Core\n## REQ-001: Item\n- Acceptance: Yes.\n');
 await p.confirm();

 // Save a custom filter
 await p.saveFilter({
  name: 'Custom Unverified',
  target: 'requirements',
  result: 'not_checked',
  phase: 'P01'
 });

 const view1 = await p.view();
 const saved = view1.savedFilters.find(f => f.name === 'Custom Unverified');
 assert.ok(saved);
 assert.equal(saved.isBuiltin, false);
 assert.equal(saved.target, 'requirements');

 // Simulate restart with a new Project instance in the same directory
 const p2 = new Project(root);
 const view2 = await p2.view();
 const reloaded = view2.savedFilters.find(f => f.name === 'Custom Unverified');
 assert.ok(reloaded);
 assert.equal(reloaded.id, saved.id);

 // Rename filter
 await p2.renameFilter(saved.id, 'Renamed Filter');
 const view3 = await p2.view();
 assert.equal(view3.savedFilters.find(f => f.id === saved.id).name, 'Renamed Filter');

 // Delete filter
 await p2.deleteFilter(saved.id);
 const view4 = await p2.view();
 assert.equal(view4.savedFilters.some(f => f.id === saved.id), false);
}));

test('Dashboard Overview renders four summaries with drill-downs and all advanced views', () => withFixture(async (p) => {
 await p.init('Dashboard Adv Project');
 await p.import('# Phase P01: Core\n## REQ-001: Item\n- Acceptance: Yes.\n');
 await p.confirm();
 const d = await dashboard(p, 0);
 try {
  const stateRes = await fetch(d.url + '/api/state');
  const state = (await stateRes.json()).state;
  assert.ok(state.summaries.implementation);
  assert.ok(state.summaries.verification);
  assert.ok(state.summaries.blockers);
  assert.ok(state.summaries.readiness);
  assert.equal(state.summaries.implementation.total, 1);
  assert.equal(state.summaries.verification.total, 1);

  // Test new API endpoints
  const covRes = await fetch(d.url + '/api/coverage');
  assert.equal(covRes.status, 200);

  const depsRes = await fetch(d.url + '/api/dependencies');
  assert.equal(depsRes.status, 200);

  const impactRes = await fetch(d.url + '/api/impact');
  assert.equal(impactRes.status, 200);

  const driftRes = await fetch(d.url + '/api/drift');
  assert.equal(driftRes.status, 200);

  const readinessRes = await fetch(d.url + '/api/readiness');
  assert.equal(readinessRes.status, 200);

  const handoffRes = await fetch(d.url + '/api/handoff');
  assert.equal(handoffRes.status, 200);
 } finally {
  d.server.closeAllConnections();
  await new Promise(r => d.server.close(r));
 }
}));
