import { z } from 'zod';
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{1,79}$/);
const text = z.string().trim().min(1).max(20000);
export const Criterion = z.object({ id, text, kind: z.enum(['automated', 'manual']), required: z.boolean().default(true) });
export const Requirement = z.object({ id, title: text, phase: id, sourceLine: z.number().int().positive(), criteria: z.array(Criterion).min(1), dependencies: z.array(id).default([]), implementation: z.enum(['not_started', 'in_progress', 'implemented', 'blocked']).default('not_started'), blocker: z.string().default(''), files: z.array(z.string()).default([]) });
export const Phase = z.object({ id, title: text, goal: text, dependencies: z.array(id).default([]) });
export const Check = z.object({ id, title: text, criteria: z.array(id).min(1), command: text, args: z.array(z.string()).default([]), cwd: z.string().default('.'), timeoutMs: z.number().int().min(100).max(300000).default(30000), approved: z.boolean().default(false), files: z.array(z.string()).default([]) });
export const Run = z.object({ id, checkId: id, status: z.enum(['running', 'passed', 'failed', 'error', 'cancelled']), start: z.string(), end: z.string().optional(), exitCode: z.number().nullable().optional(), fingerprint: z.string(), scopeRevision: z.number().int(), output: z.string(), pid: z.number().int(), actor: text, reason: z.string().optional() });
export const Evidence = z.object({ id, criterion: id, origin: z.enum(['human', 'agent']), result: z.enum(['passed', 'failed']), note: text, artifact: z.string().optional(), artifactHash: z.string().optional(), fingerprint: z.string(), scopeRevision: z.number().int(), time: z.string(), actor: text });
export const Proposal = z.object({ id, source: text, reason: text, status: z.enum(['pending', 'accepted', 'rejected']), baseScope: z.number().int(), time: z.string() });
export const Checkpoint = z.object({ id, name: text, time: z.string(), actor: text, note: z.string().default(''), scopeRevision: z.number().int(), projectSnapshot: z.any() });
export const SavedFilter = z.object({ id, name: text, target: z.enum(['requirements', 'checks', 'evidence', 'activity', 'coverage']), query: z.string().default(''), phase: z.string().default(''), result: z.string().default(''), actor: z.string().default(''), date: z.string().default(''), isBuiltin: z.boolean().default(false) });
export const SupportingFile = z.object({ path: z.string(), reason: text, time: z.string() });
export const EventSchema = z.object({ id, revision: z.number().int(), time: z.string(), type: text, actor: text, detail: z.string(), phase: z.string().optional(), requirement: z.string().optional(), checkId: z.string().optional(), runId: z.string().optional(), evidenceId: z.string().optional(), result: z.string().optional() });
export const StateSchema = z.object({ schemaVersion: z.literal(2), id, name: text, revision: z.number().int().nonnegative(), scopeRevision: z.number().int().nonnegative(), confirmed: z.boolean(), source: z.string(), scopeHistory: z.array(z.object({ revision: z.number().int(), source: z.string(), time: z.string() })).default([]), phases: z.array(Phase), requirements: z.array(Requirement), constraints: z.array(text), activePhase: z.string().nullable(), checks: z.array(Check), runs: z.array(Run), evidence: z.array(Evidence), proposals: z.array(Proposal), overrides: z.array(z.object({ phase: id, reason: text, time: z.string(), actor: text })), integrations: z.record(z.string(), z.object({ installed: z.boolean(), time: z.string(), lastCheck: z.string().optional(), lastActivity: z.string().optional() })), events: z.array(EventSchema), retentionDays: z.number().int().min(1).max(365), checkpoints: z.array(Checkpoint).default([]), savedFilters: z.array(SavedFilter).default([]), supportingFiles: z.array(SupportingFile).default([]) });
export function validate(input) {
    const s = StateSchema.parse(input);
    const unique = (ids) => { if (new Set(ids).size !== ids.length)
        throw Error('Duplicate IDs'); };
    const graph = (rows) => { const map = new Map(rows.map(r => [r.id, r.dependencies])); unique(rows.map(r => r.id)); const done = new Set(), stack = new Set(); const visit = (id) => { if (stack.has(id))
        throw Error('Dependency cycle at ' + id); if (done.has(id))
        return; const deps = map.get(id); if (!deps)
        throw Error('Unknown dependency ' + id); stack.add(id); deps.forEach(visit); stack.delete(id); done.add(id); }; rows.forEach(r => visit(r.id)); };
    graph(s.phases);
    graph(s.requirements);
    const phases = new Set(s.phases.map(p => p.id));
    if (s.activePhase && !phases.has(s.activePhase))
        throw Error('Unknown active phase');
    s.requirements.forEach(r => { if (!phases.has(r.phase))
        throw Error('Unknown owning phase ' + r.phase); });
    const criteria = s.requirements.flatMap(r => r.criteria.map(c => c.id));
    unique(criteria);
    const known = new Set(criteria);
    unique(s.checks.map(c => c.id));
    s.checks.forEach(c => { if (c.criteria.some(id => !known.has(id)))
        throw Error('Unknown check criterion'); });
    unique(s.runs.map(r => r.id));
    unique(s.evidence.map(e => e.id));
    unique(s.proposals.map(p => p.id));
    unique(s.checkpoints.map(c => c.id));
    unique(s.savedFilters.map(f => f.id));
    if (s.events.length !== s.revision + 1 || s.events.some((e, i) => e.revision !== i))
        throw Error('Invalid event sequence');
    if (s.confirmed && (!s.requirements.length || !s.phases.length))
        throw Error('Confirmed scope must contain requirements and phases');
    return s;
}
export function parse(source) {
    const phases = [], requirements = [], constraints = [], supportingFiles = [];
    let current = 'P01';
    source.split(/\r?\n/).forEach((line, i) => {
        let m = line.match(/^# Phase ([\w-]+): (.+)$/);
        if (m) {
            current = m[1];
            phases.push({ id: current, title: m[2], goal: m[2], dependencies: [] });
            return;
        }
        m = line.match(/^## (REQ-[\w-]+): (.+)$/);
        if (m) {
            requirements.push({ id: m[1], title: m[2], phase: current, sourceLine: i + 1, criteria: [], dependencies: [], implementation: 'not_started', blocker: '', files: [] });
            return;
        }
        m = line.match(/^- Acceptance(?: \((manual|automated)\))?: (.+)$/);
        if (m) {
            const r = requirements.at(-1);
            if (!r)
                throw Error('Acceptance criterion without requirement');
            r.criteria.push({ id: r.id + '-AC' + (r.criteria.length + 1), text: m[2], kind: m[1] === 'manual' ? 'manual' : 'automated', required: true });
            return;
        }
        m = line.match(/^- Depends: (.+)$/);
        if (m) {
            const r = requirements.at(-1);
            if (!r)
                throw Error('Dependency without requirement');
            r.dependencies = m[1].split(',').map(s => s.trim());
            return;
        }
        m = line.match(/^- Phase depends: (.+)$/);
        if (m) {
            const p = phases.at(-1);
            if (!p)
                throw Error('Phase dependency without phase');
            p.dependencies = m[1].split(',').map(s => s.trim());
            return;
        }
        m = line.match(/^- Files?: (.+)$/);
        if (m) {
            const r = requirements.at(-1);
            if (!r)
                throw Error('Files declaration without requirement');
            r.files = m[1].split(',').map(s => s.trim()).filter(Boolean);
            return;
        }
        m = line.match(/^- Supporting: ([^\s-]+(?:\s+[^\s-]+)*)\s*-\s*(.+)$/);
        if (m) {
            supportingFiles.push({ path: m[1].trim(), reason: m[2].trim(), time: new Date().toISOString() });
            return;
        }
        m = line.match(/^- Constraint: (.+)$/);
        if (m)
            constraints.push(m[1]);
    });
    if (!phases.length)
        phases.push({ id: 'P01', title: 'Implementation', goal: 'Complete requirements', dependencies: [] });
    if (!requirements.length)
        throw Error('No requirements: use ## REQ-001: Title and - Acceptance: ...');
    return { phases, requirements, constraints, supportingFiles };
}
