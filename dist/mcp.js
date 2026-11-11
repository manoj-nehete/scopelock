import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runCheck } from './runner.js';
import { now } from './storage.js';
export async function serveMcp(p, agent = 'agent') {
    const server = new McpServer({ name: 'scopelock', version: '0.1.0' });
    function tool(name, description, schema, fn) { server.registerTool(name, { description, inputSchema: schema }, async (args) => { try {
        const result = await fn(args);
        let output = JSON.stringify(result);
        if (output.length > 30000)
            output = JSON.stringify({ notice: 'Response too large. Use requirement detail or the dashboard.', summary: output.slice(0, 20000) });
        return { content: [{ type: 'text', text: output }] };
    }
    catch (e) {
        return { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }] };
    } }); }
    tool('get_handoff', 'Read active phase, constraints, blockers and next eligible requirement.', {}, () => p.handoff());
    tool('get_requirements', 'Read requirement summaries and verification status.', { phase: z.string().optional() }, async ({ phase }) => { const s = await p.view(); return s.requirements.filter(r => !phase || r.phase === phase); });
    tool('get_requirement', 'Read one requirement, criteria and evidence.', { id: z.string() }, async ({ id }) => { const s = await p.view(), r = s.requirements.find(r => r.id === id); if (!r)
        throw Error('Unknown requirement'); return { requirement: r, criteria: r.criteria.map(c => ({ ...c, ...s.criteria[c.id] })), evidence: s.evidence.filter(e => r.criteria.some(c => c.id === e.criterion)) }; });
    tool('get_phases', 'Read project phase roadmap.', {}, async () => { const s = await p.view(); return { activePhase: s.activePhase, phases: s.phases }; });
    tool('record_implementation', 'Record work status. This never marks a requirement verified.', { id: z.string(), status: z.enum(['not_started', 'in_progress', 'implemented', 'blocked']), blocker: z.string().optional() }, async (a) => { await p.update(a.id, a.status, a.blocker ?? '', agent); return { recorded: true }; });
    tool('record_evidence', 'Record agent-reported evidence. It does not count as human verification.', { criterion: z.string(), result: z.enum(['passed', 'failed']), note: z.string(), artifact: z.string().optional() }, async (a) => { await p.evidence(a.criterion, a.result, a.note, 'agent', a.artifact, agent); return { recorded: true, origin: 'agent' }; });
    tool('propose_scope_change', 'Propose replacement requirements Markdown for human review.', { source: z.string(), reason: z.string() }, async (a) => { const s = await p.propose(a.source, a.reason, agent); return s.proposals.at(-1); });
    tool('list_checks', 'Read check definitions and approval status.', {}, async () => (await p.read()).checks);
    tool('get_coverage', 'Read requirement coverage map linking requirements, files, checks, and evidence.', {}, () => p.coverage());
    tool('get_dependencies', 'Read dependency graph, blockers, and eligible-to-start work.', {}, () => p.dependencyGraph());
    tool('get_impact', 'Read change-impact analysis for modified files.', {}, () => p.changeImpact());
    tool('get_drift', 'Read scope-drift review for unlinked files.', {}, () => p.scopeDrift());
    tool('get_readiness', 'Read release-readiness assessment and blockers.', {}, () => p.releaseReadiness());
    tool('list_checkpoints', 'Read persistent project checkpoints.', {}, () => p.listCheckpoints());
    tool('compare_checkpoints', 'Compare two checkpoints or checkpoint vs current.', { fromId: z.string(), toId: z.string().optional() }, async (a) => p.compareCheckpoints(a.fromId, a.toId ?? 'current'));
    tool('get_timeline', 'Read filtered build timeline activity events.', { phase: z.string().optional(), requirement: z.string().optional(), actor: z.string().optional(), type: z.string().optional(), result: z.string().optional(), date: z.string().optional(), query: z.string().optional() }, async (a) => p.timeline(a));
    tool('run_check', 'Run a previously human-approved check. May take up to its configured timeout.', { id: z.string() }, async (a) => { const s = await runCheck(p, a.id, agent); const r = s.runs.filter(r => r.checkId === a.id).at(-1); return r ? { ...r, output: r.output.slice(-12000) } : null; });
    tool('get_run', 'Read bounded check output.', { id: z.string() }, async (a) => { const r = (await p.read()).runs.find(r => r.id === a.id); if (!r)
        throw Error('Unknown run'); return { ...r, output: r.output.slice(-12000) }; });
    await p.mutate('agent_connected', agent, 'MCP session initialized', s => { if (!s)
        throw Error('Initialize first'); if (s.integrations[agent])
        s.integrations[agent].lastActivity = now(); return s; });
    await server.connect(new StdioServerTransport());
}
