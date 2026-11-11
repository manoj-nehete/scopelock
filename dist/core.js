import { readFile, readdir, lstat, realpath, access, copyFile, mkdir } from 'node:fs/promises';
import { join, relative, resolve, isAbsolute, delimiter } from 'node:path';
import { createHash } from 'node:crypto';
import { Store, now, uid } from './storage.js';
import { parse, validate, Check } from './model.js';
export { validate, parse };
const required = (s) => { if (!s)
    throw Error('Initialize project first'); return s; };
export async function within(root, path) { const base = await realpath(root), target = await realpath(resolve(root, path)); const rel = relative(base, target); if (rel === '..' || rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) || isAbsolute(rel))
    throw Error('Path escapes project'); return target; }
export async function fingerprint(root) { const hash = createHash('sha256'); const excluded = new Set(['.git', '.scopelock', 'node_modules', 'dist', 'coverage', '.DS_Store']); let files = 0; async function walk(dir) { for (const name of (await readdir(dir)).sort()) {
    if (excluded.has(name))
        continue;
    const p = join(dir, name), s = await lstat(p);
    if (s.isSymbolicLink())
        continue;
    if (s.isDirectory())
        await walk(p);
    else if (s.isFile()) {
        if (++files > 50000 || s.size > 50 * 1024 * 1024)
            throw Error('Project too large for fingerprint; narrow project root');
        hash.update(relative(root, p));
        hash.update('\0');
        hash.update(await readFile(p));
        hash.update('\0');
    }
} } await walk(root); return hash.digest('hex'); }
export async function getFileFingerprints(root) {
    const excluded = new Set(['.git', '.scopelock', 'node_modules', 'dist', 'coverage', '.DS_Store']);
    const map = {};
    let files = 0;
    async function walk(dir) {
        for (const name of (await readdir(dir)).sort()) {
            if (excluded.has(name))
                continue;
            const p = join(dir, name), s = await lstat(p);
            if (s.isSymbolicLink())
                continue;
            if (s.isDirectory())
                await walk(p);
            else if (s.isFile()) {
                if (++files > 50000 || s.size > 50 * 1024 * 1024)
                    throw Error('Project too large for fingerprint; narrow project root');
                const rel = relative(root, p).replaceAll('\\', '/');
                map[rel] = createHash('sha256').update(await readFile(p)).digest('hex');
            }
        }
    }
    await walk(root);
    return map;
}
const BUILTIN_FILTERS = [
    { id: 'filter-blocked', name: 'Blocked work', target: 'requirements', query: '', phase: '', result: '', actor: '', date: '', isBuiltin: true },
    { id: 'filter-failed', name: 'Failed checks', target: 'checks', query: '', phase: '', result: 'failed', actor: '', date: '', isBuiltin: true },
    { id: 'filter-stale', name: 'Stale evidence', target: 'evidence', query: '', phase: '', result: 'stale', actor: '', date: '', isBuiltin: true },
    { id: 'filter-unverified', name: 'Implemented unverified', target: 'requirements', query: '', phase: '', result: 'not_checked', actor: '', date: '', isBuiltin: true }
];
export class Project extends Store {
    async migrate() {
        const { open, rm, copyFile } = await import('node:fs/promises');
        const lock = await open(join(this.dir, 'write.lock'), 'wx', 0o600);
        try {
            const old = JSON.parse(await readFile(join(this.dir, 'state.json'), 'utf8'));
            if (old.schemaVersion === 2)
                return validate(old);
            if (old.schemaVersion !== 1 || typeof old.name !== 'string' || typeof old.source !== 'string' || !Array.isArray(old.events) || !Array.isArray(old.requirements) || !Number.isInteger(old.revision) || old.events.length !== old.revision + 1)
                throw Error('Unsupported or malformed legacy state');
            const parsed = old.source ? parse(old.source) : { phases: [], requirements: [], constraints: [], supportingFiles: [] };
            for (const r of parsed.requirements) {
                const previous = old.requirements.find((x) => x.id === r.id);
                if (previous)
                    r.implementation = previous.implementation;
            }
            const migrated = { schemaVersion: 2, id: uid('PROJECT'), name: old.name, revision: old.revision, scopeRevision: old.confirmed ? 1 : 0, confirmed: old.confirmed, source: old.source, scopeHistory: old.confirmed ? [{ revision: 1, source: old.source, time: now() }] : [], ...parsed, activePhase: old.confirmed ? parsed.phases[0]?.id ?? null : null, checks: [], runs: [], evidence: [], proposals: [], overrides: [], integrations: {}, retentionDays: 30, events: old.events.map((e) => ({ id: uid('EV'), revision: e.revision, type: e.type, time: e.time, actor: 'legacy', detail: 'Imported from schema v1' })), checkpoints: [], savedFilters: [], supportingFiles: parsed.supportingFiles ?? [] };
            migrated.revision++;
            migrated.events.push({ id: uid('EV'), revision: migrated.revision, type: 'schema_migrated', time: now(), actor: 'human', detail: 'Schema 1 → 2; original saved' });
            validate(migrated);
            await copyFile(join(this.dir, 'state.json'), join(this.dir, 'legacy-v1-backup.json'));
            await this.writeAtomic(join(this.dir, 'state.json'), migrated);
            return migrated;
        }
        finally {
            await lock.close();
            await rm(join(this.dir, 'write.lock'), { force: true });
        }
    }
    init(name) { return this.mutate('initialized', 'human', name, s => { if (s)
        throw Error('Project exists'); return { schemaVersion: 2, id: uid('PROJECT'), name, revision: 0, scopeRevision: 0, confirmed: false, source: '', scopeHistory: [], phases: [], requirements: [], constraints: [], activePhase: null, checks: [], runs: [], evidence: [], proposals: [], overrides: [], integrations: {}, events: [], retentionDays: 30, checkpoints: [], savedFilters: [], supportingFiles: [] }; }); }
    import(source) { return this.mutate('imported', 'human', 'Requirements imported', s => { s = required(s); if (s.confirmed)
        throw Error('Use a scope-change proposal for confirmed scope'); const p = parse(source); Object.assign(s, p, { source, supportingFiles: [...s.supportingFiles, ...(p.supportingFiles ?? [])] }); return s; }); }
    confirm() { return this.mutate('scope_confirmed', 'human', 'Reviewed baseline confirmed', s => { s = required(s); if (s.confirmed)
        throw Error('Already confirmed'); if (!s.requirements.length)
        throw Error('Import first'); s.confirmed = true; s.scopeRevision++; s.scopeHistory.push({ revision: s.scopeRevision, source: s.source, time: now() }); s.activePhase = s.phases[0].id; return s; }); }
    update(id, status, blocker = '', actor = 'human') { return this.mutate('implementation_updated', actor, blocker ? `${id} → ${status} (${blocker})` : `${id} → ${status}`, s => { s = required(s); if (!s.confirmed)
        throw Error('Confirm scope first'); const r = s.requirements.find(r => r.id === id); if (!r)
        throw Error('Unknown requirement'); if (status === 'blocked' && !blocker.trim())
        throw Error('Provide a blocker reason'); r.implementation = status; r.blocker = blocker; return s; }, undefined, { requirement: id }); }
    async view() {
        const s = await this.read(), fp = await fingerprint(this.root);
        const criteria = {};
        for (const r of s.requirements)
            for (const c of r.criteria) {
                const candidates = [];
                if (c.kind === 'automated')
                    for (const run of s.runs) {
                        const check = s.checks.find(d => d.id === run.checkId);
                        if (check?.criteria.includes(c.id) && run.status !== 'running')
                            candidates.push({ time: run.end ?? run.start, status: run.reason?.includes('evidence is stale') ? 'stale' : run.status === 'passed' ? 'passed' : 'failed', origin: 'runner', reference: run.id, fp: run.fingerprint, scope: run.scopeRevision });
                    }
                if (c.kind === 'manual')
                    for (const e of s.evidence) {
                        if (e.criterion === c.id && e.origin === 'human') {
                            let artifactExists = true;
                            if (e.artifact)
                                try {
                                    const file = await within(this.root, e.artifact);
                                    artifactExists = !!e.artifactHash && createHash('sha256').update(await readFile(file)).digest('hex') === e.artifactHash;
                                }
                                catch {
                                    artifactExists = false;
                                }
                            candidates.push({ time: e.time, status: artifactExists ? e.result : 'stale', origin: e.origin, reference: e.id, fp: e.fingerprint, scope: e.scopeRevision });
                        }
                    }
                candidates.sort((a, b) => a.time.localeCompare(b.time));
                const last = candidates.at(-1);
                criteria[c.id] = last ? { status: last.fp !== fp || last.scope !== s.scopeRevision ? 'stale' : last.status, origin: last.origin, reference: last.reference } : { status: 'not_checked' };
            }
        const verification = (ids) => { const states = ids.map(id => criteria[id]?.status ?? 'not_checked'); return !states.length ? 'not_checked' : states.includes('failed') ? 'failed' : states.includes('stale') ? 'stale' : states.every(s => s === 'passed') ? 'passed' : 'not_checked'; };
        const requirements = s.requirements.map(r => ({ ...r, files: r.files ?? [], verification: verification(r.criteria.filter(c => c.required).map(c => c.id)) }));
        const phases = s.phases.map(p => { const reqs = requirements.filter(r => r.phase === p.id); return { ...p, implementation: reqs.length && reqs.every(r => r.implementation === 'implemented') ? 'implemented' : reqs.some(r => r.implementation === 'blocked') ? 'blocked' : s.activePhase === p.id ? 'active' : 'planned', verification: verification(reqs.flatMap(r => r.criteria.filter(c => c.required).map(c => c.id))), requirements: reqs.map(r => r.id) }; });
        const summaries = {
            implementation: {
                total: s.requirements.length,
                implemented: requirements.filter(r => r.implementation === 'implemented').length,
                in_progress: requirements.filter(r => r.implementation === 'in_progress').length,
                blocked: requirements.filter(r => r.implementation === 'blocked').length,
                not_started: requirements.filter(r => r.implementation === 'not_started').length,
                calculation: 'Count of requirements by recorded implementation status field.'
            },
            verification: {
                total: s.requirements.length,
                passed: requirements.filter(r => r.verification === 'passed').length,
                stale: requirements.filter(r => r.verification === 'stale').length,
                failed: requirements.filter(r => r.verification === 'failed').length,
                not_checked: requirements.filter(r => r.verification === 'not_checked').length,
                calculation: 'Derived from criteria evidence freshness matching current code fingerprint and scope revision.'
            },
            blockers: {
                total: requirements.filter(r => r.implementation === 'blocked').length + phases.filter(p => p.dependencies.some(depId => phases.find(x => x.id === depId)?.verification !== 'passed')).length + s.runs.filter(r => r.status === 'failed').length,
                blockedRequirements: requirements.filter(r => r.implementation === 'blocked').map(r => ({ id: r.id, title: r.title, reason: r.blocker })),
                blockedPhases: phases.filter(p => p.dependencies.some(depId => phases.find(x => x.id === depId)?.verification !== 'passed')).map(p => ({ id: p.id, title: p.title, unmet: p.dependencies.filter(depId => phases.find(x => x.id === depId)?.verification !== 'passed') })),
                failedChecks: s.runs.filter(r => r.status === 'failed').map(r => ({ id: r.id, checkId: r.checkId })),
                calculation: 'Active requirement blockers, phases with unmet prerequisite exit gates, and failed check executions.'
            },
            readiness: {
                status: (requirements.length > 0 && requirements.every(r => r.verification === 'passed') && requirements.every(r => r.implementation === 'implemented') && phases.every(p => p.verification === 'passed')) ? 'ready' : requirements.some(r => r.verification === 'failed') || s.runs.some(r => r.status === 'failed') ? 'failed' : 'in_progress',
                gatesPassed: phases.filter(p => p.verification === 'passed').length,
                totalGates: phases.length,
                unmetGates: phases.filter(p => p.verification !== 'passed').map(p => ({ id: p.id, title: p.title, verification: p.verification })),
                calculation: 'Audited exit criteria across all defined phases, requiring passing evidence on all mandatory items.'
            }
        };
        const savedFilters = [...BUILTIN_FILTERS, ...(s.savedFilters ?? [])];
        return { ...s, requirements, phases, criteria, fingerprint: fp, summaries, savedFilters };
    }
    async activate(id, reason) { const view = await this.view(); const p = view.phases.find(p => p.id === id); if (!p)
        throw Error('Unknown phase'); const unmet = p.dependencies.filter(id => view.phases.find(p => p.id === id)?.verification !== 'passed'); if (unmet.length && !reason?.trim())
        throw Error('Unverified dependencies: ' + unmet.join(', ')); return this.mutate('phase_activated', 'human', id, s => { s = required(s); if (!s.confirmed)
        throw Error('Confirm first'); s.activePhase = id; if (unmet.length)
        s.overrides.push({ phase: id, reason: reason, actor: 'human', time: now() }); return s; }, view.revision, { phase: id }); }
    async handoff(agent = 'agent') {
        const s = await this.view();
        const deps = await this.dependencyGraph();
        const phase = s.phases.find(p => p.id === s.activePhase) ?? null;
        const requirements = s.requirements.filter(r => r.phase === s.activePhase);
        const eligible = deps.eligibleToStart.map(id => s.requirements.find(r => r.id === id)).filter(Boolean);
        const next = eligible[0] ?? null;
        const currentTask = next ? `${next.id}: ${next.title}` : (phase && phase.verification !== 'passed' ? `Verify phase exit criteria for ${phase.id}` : 'All active phase requirements completed and verified.');
        const blockers = s.requirements.filter(r => r.implementation === 'blocked');
        const latestRuns = s.runs.slice(-5).reverse();
        const implementationCounts = s.summaries.implementation;
        const nextAction = next ? `Work on requirement ${next.id} (${next.title}). Complete implementation and run verification.` : (blockers.length > 0 ? `Resolve blockers on: ${blockers.map(b => b.id).join(', ')}.` : (phase && phase.verification !== 'passed' ? `Run phase ${phase.id} verification checks to complete exit gate.` : 'Advance to next planned phase.'));
        const timestamp = now();
        const markdown = [
            `# ScopeLock Agent Handoff`,
            `Generated: ${timestamp} · Active Agent Identity: ${agent}`,
            ``,
            `## 1. Active Phase`,
            phase ? `**${phase.id}: ${phase.title}** (Implementation: ${phase.implementation}, Verification: ${phase.verification})\nGoal: ${phase.goal}` : `None active (draft scope)`,
            ``,
            `## 2. Current Task`,
            currentTask,
            ``,
            `## 3. Recorded Implementation State`,
            `- Total Requirements: ${implementationCounts.total}`,
            `- Implemented: ${implementationCounts.implemented}`,
            `- In Progress: ${implementationCounts.in_progress}`,
            `- Blocked: ${implementationCounts.blocked}`,
            `- Not Started: ${implementationCounts.not_started}`,
            ``,
            `## 4. Latest Check Results`,
            latestRuns.length ? latestRuns.map(r => `- ${r.checkId} (${r.status}) by ${r.actor} at ${r.start}`).join('\n') : `No check runs recorded.`,
            ``,
            `## 5. Unresolved Blockers`,
            blockers.length ? blockers.map(b => `- **${b.id}**: ${b.blocker}`).join('\n') : `No active blockers recorded.`,
            ``,
            `## 6. Recommended Next Action`,
            nextAction,
            ``,
            `> Note: Agent claims and notes do not satisfy verification. All verifications require human attestation or approved check runs.`
        ].join('\n');
        return { project: s.name, scopeRevision: s.scopeRevision, timestamp, agent, phase, currentTask, implementationCounts, latestCheckResults: latestRuns, constraints: s.constraints, requirements, blockers, next, nextAction, markdown, recentEvents: s.events.slice(-10) };
    }
    propose(source, reason, actor = 'agent') { parse(source); return this.mutate('scope_proposed', actor, reason, s => { s = required(s); s.proposals.push({ id: uid('PROP'), source, reason, status: 'pending', baseScope: s.scopeRevision, time: now() }); return s; }); }
    decide(id, accept) { return this.mutate(accept ? 'scope_accepted' : 'scope_rejected', 'human', id, s => { s = required(s); const p = s.proposals.find(p => p.id === id); if (!p || p.status !== 'pending')
        throw Error('Unknown pending proposal'); if (accept) {
        if (p.baseScope !== s.scopeRevision)
            throw Error('Proposal is based on an older scope; submit a fresh proposal');
        const parsed = parse(p.source);
        for (const r of parsed.requirements) {
            const old = s.requirements.find(q => q.id === r.id);
            if (old && JSON.stringify(old.criteria) === JSON.stringify(r.criteria)) {
                r.implementation = old.implementation;
                r.blocker = old.blocker;
                r.files = old.files ?? [];
            }
        }
        Object.assign(s, parsed, { source: p.source, supportingFiles: [...s.supportingFiles, ...(parsed.supportingFiles ?? [])] });
        s.scopeRevision++;
        s.scopeHistory.push({ revision: s.scopeRevision, source: s.source, time: now() });
        s.checks = s.checks.filter(c => c.criteria.every(id => s.requirements.some(r => r.criteria.some(a => a.id === id))));
        s.checks.forEach(c => c.approved = false);
        if (!s.phases.some(p => p.id === s.activePhase))
            s.activePhase = s.phases[0]?.id ?? null;
    } p.status = accept ? 'accepted' : 'rejected'; return s; }); }
    defineCheck(input) { const c = Check.parse(input); c.approved = false; return this.mutate('check_defined', 'human', c.id, s => { s = required(s); if (s.runs.some(r => r.checkId === c.id))
        throw Error('Used check definitions are immutable; create a new check ID'); s.checks = s.checks.filter(x => x.id !== c.id); s.checks.push(c); return s; }, undefined, { checkId: c.id }); }
    approveCheck(id) { return this.mutate('check_approved', 'human', id, s => { s = required(s); const c = s.checks.find(c => c.id === id); if (!c)
        throw Error('Unknown check'); c.approved = true; return s; }, undefined, { checkId: id }); }
    async evidence(criterion, result, note, origin, artifact, actor = 'human') {
        const fp = await fingerprint(this.root);
        let stored, artifactHash;
        if (artifact) {
            const path = await within(this.root, artifact);
            const info = await lstat(path);
            if (!info.isFile() || info.size > 10 * 1024 * 1024)
                throw Error('Artifact must be a file smaller than 10 MiB');
            const target = join(this.dir, 'artifacts');
            await mkdir(target, { recursive: true });
            stored = relative(this.root, join(target, uid('ART')));
            await copyFile(path, join(this.root, stored));
            artifactHash = createHash('sha256').update(await readFile(join(this.root, stored))).digest('hex');
        }
        const sRead = await this.read();
        const req = sRead.requirements.find(r => r.criteria.some(c => c.id === criterion));
        const eid = uid('EVID');
        return this.mutate('evidence_recorded', actor, criterion, s => { s = required(s); if (!s.requirements.some(r => r.criteria.some(c => c.id === criterion)))
            throw Error('Unknown criterion'); s.evidence.push({ id: eid, criterion, result, note, origin, artifact: stored, artifactHash, fingerprint: fp, scopeRevision: s.scopeRevision, time: now(), actor }); return s; }, undefined, { evidenceId: eid, requirement: req?.id, phase: req?.phase, result });
    }
    async doctor() { const s = await this.read(), issues = []; for (const c of s.checks) {
        try {
            await within(this.root, c.cwd);
        }
        catch {
            issues.push(c.id + ': invalid working directory');
        }
        const paths = c.command.includes('/') || c.command.includes('\\') ? [resolve(this.root, c.command)] : (process.env.PATH ?? '').split(delimiter).flatMap(p => (process.platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : ['']).map(ext => join(p, c.command + ext)));
        let exists = false;
        for (const p of paths)
            try {
                await access(p);
                exists = true;
                break;
            }
            catch { }
        if (!exists)
            issues.push(c.id + ': executable not found');
    } for (const e of s.evidence)
        if (e.artifact)
            try {
                await within(this.root, e.artifact);
            }
            catch {
                issues.push(e.id + ': missing evidence');
            } for (const r of s.runs)
        if (r.status === 'running')
            try {
                process.kill(r.pid, 0);
            }
            catch {
                issues.push(r.id + ': interrupted runner; recover needed');
            } return { ok: !issues.length, issues, revision: s.revision }; }
    async backup() { const state = await this.read(), artifacts = {}; for (const e of state.evidence)
        if (e.artifact)
            artifacts[e.artifact] = (await readFile(await within(this.root, e.artifact))).toString('base64'); return { format: 'scopelock-backup-v1', state, artifacts }; }
    async restore(input) {
        if (input?.format !== 'scopelock-backup-v1')
            throw Error('Invalid backup');
        const restored = validate(input.state);
        const { open, rm, writeFile } = await import('node:fs/promises');
        await mkdir(this.dir, { recursive: true });
        const lock = await open(join(this.dir, 'write.lock'), 'wx', 0o600);
        try {
            let old = null;
            try {
                old = await this.read();
            }
            catch (e) {
                if (e.code !== 'ENOENT')
                    throw e;
            }
            if (old?.requirements.length)
                throw Error('Restore into a new or empty project');
            for (const [path, data] of Object.entries(input.artifacts ?? {})) {
                if (!/^\.scopelock[\\/]artifacts[\\/]ART-[a-f0-9-]+$/.test(path) || typeof data !== 'string')
                    throw Error('Unsafe artifact path');
            }
            await mkdir(join(this.dir, 'artifacts'), { recursive: true });
            for (const [path, data] of Object.entries(input.artifacts ?? {}))
                await writeFile(join(this.root, path), Buffer.from(data, 'base64'));
            restored.revision++;
            restored.events.push({ id: uid('EV'), revision: restored.revision, time: now(), type: 'backup_restored', actor: 'human', detail: 'Original history preserved' });
            validate(restored);
            if (old)
                await this.writeAtomic(join(this.dir, 'previous.json'), old);
            await this.writeAtomic(join(this.dir, 'state.json'), restored);
            return restored;
        }
        finally {
            await lock.close();
            await rm(join(this.dir, 'write.lock'), { force: true });
        }
    }
    async report() { const s = await this.view(); return '# ' + s.name + ' — ScopeLock report\n\nScope revision ' + s.scopeRevision + ' · ' + now() + '\n\n| Phase | Implementation | Verification |\n| --- | --- | --- |\n' + s.phases.map(p => `| ${p.id}: ${p.title.replaceAll('|', '/')} | ${p.implementation} | ${p.verification} |`).join('\n') + '\n\n| Requirement | Implementation | Verification |\n| --- | --- | --- |\n' + s.requirements.map(r => `| ${r.id}: ${r.title.replaceAll('|', '/')} | ${r.implementation} | ${r.verification} |`).join('\n') + '\n'; }
    // --- FEATURE A: REQUIREMENT COVERAGE MAP ---
    async coverage() {
        const s = await this.view();
        const items = s.requirements.map(r => {
            const linkedFiles = r.files ?? [];
            const checks = s.checks.filter(c => c.criteria.some(id => r.criteria.some(crit => crit.id === id)));
            const evidence = s.evidence.filter(e => r.criteria.some(crit => crit.id === e.criterion));
            const missingFiles = linkedFiles.length === 0;
            const missingChecks = r.criteria.some(c => c.kind === 'automated') && checks.length === 0;
            const missingEvidence = r.criteria.filter(c => c.required).some(c => s.criteria[c.id]?.status === 'not_checked');
            const implementedUnverified = r.implementation === 'implemented' && r.verification !== 'passed';
            const fullyCovered = !missingFiles && !missingChecks && r.verification === 'passed';
            return {
                requirement: r.id, title: r.title, phase: r.phase, files: linkedFiles, checks: checks.map(c => c.id), evidenceCount: evidence.length,
                implementation: r.implementation, verification: r.verification, missingFiles, missingChecks, missingEvidence, implementedUnverified, fullyCovered
            };
        });
        const summary = {
            totalRequirements: s.requirements.length,
            missingFilesCount: items.filter(i => i.missingFiles).length,
            missingChecksCount: items.filter(i => i.missingChecks).length,
            missingEvidenceCount: items.filter(i => i.missingEvidence).length,
            implementedUnverifiedCount: items.filter(i => i.implementedUnverified).length,
            fullyCoveredCount: items.filter(i => i.fullyCovered).length,
            notice: 'Linked files, passing checks, and recorded evidence indicate tracking coverage; they do not automatically prove semantic correctness.'
        };
        return { summary, items };
    }
    // --- FEATURE B: DEPENDENCY GRAPH ---
    async dependencyGraph() {
        const s = await this.view();
        const phaseMap = new Map(s.phases.map(p => [p.id, p])), reqMap = new Map(s.requirements.map(r => [r.id, r]));
        const reqItems = s.requirements.map(r => {
            const unmetPrereqs = r.dependencies.filter(depId => { const dep = reqMap.get(depId); return !dep || dep.verification !== 'passed'; });
            const blockerReasons = [];
            if (r.implementation === 'blocked')
                blockerReasons.push(r.blocker || 'Marked as blocked');
            if (unmetPrereqs.length > 0)
                blockerReasons.push('Unverified prerequisite dependencies: ' + unmetPrereqs.join(', '));
            const owningPhase = phaseMap.get(r.phase);
            const phaseUnmet = owningPhase ? owningPhase.dependencies.filter(pid => phaseMap.get(pid)?.verification !== 'passed') : [];
            if (phaseUnmet.length > 0)
                blockerReasons.push('Owning phase has unverified dependencies: ' + phaseUnmet.join(', '));
            const isBlocked = r.implementation === 'blocked' || unmetPrereqs.length > 0 || phaseUnmet.length > 0;
            const isEligible = r.implementation !== 'implemented' && !isBlocked && phaseUnmet.length === 0;
            return {
                id: r.id, title: r.title, phase: r.phase, dependencies: r.dependencies,
                dependents: s.requirements.filter(q => q.dependencies.includes(r.id)).map(q => q.id),
                implementation: r.implementation, verification: r.verification, isBlocked, blockerReasons, isEligible
            };
        });
        const phaseItems = s.phases.map(p => {
            const unmet = p.dependencies.filter(pid => phaseMap.get(pid)?.verification !== 'passed');
            return {
                id: p.id, title: p.title, dependencies: p.dependencies,
                dependents: s.phases.filter(q => q.dependencies.includes(p.id)).map(q => q.id),
                implementation: p.implementation, verification: p.verification,
                isBlocked: unmet.length > 0, unmetDependencies: unmet,
                isEligible: unmet.length === 0 && p.implementation !== 'implemented'
            };
        });
        const accessibleList = {
            phases: phaseItems.map(p => `${p.id} (${p.title}): ${p.isBlocked ? 'BLOCKED by ' + p.unmetDependencies.join(', ') : p.isEligible ? 'ELIGIBLE' : p.verification === 'passed' ? 'VERIFIED' : 'ACTIVE'}`),
            requirements: reqItems.map(r => `${r.id} [${r.phase}] (${r.title}): ${r.isBlocked ? 'BLOCKED (' + r.blockerReasons.join('; ') + ')' : r.isEligible ? 'ELIGIBLE TO START' : r.implementation}`)
        };
        return {
            phases: phaseItems, requirements: reqItems, accessibleList,
            eligibleToStart: reqItems.filter(r => r.isEligible).map(r => r.id),
            blockedWork: reqItems.filter(r => r.isBlocked).map(r => ({ id: r.id, reasons: r.blockerReasons }))
        };
    }
    // --- FEATURE C: CHANGE-IMPACT TRACKING ---
    async changeImpact() {
        const s = await this.view(), currentFps = await getFileFingerprints(this.root);
        const impacted = [], explanations = [];
        for (const r of s.requirements) {
            if (!r.files || !r.files.length)
                continue;
            const changedFiles = [];
            for (const file of r.files) {
                const norm = file.replaceAll('\\', '/');
                if (!currentFps[norm]) {
                    changedFiles.push(`${norm} (deleted or missing)`);
                }
                else {
                    const lastRun = s.runs.filter(run => s.checks.some(c => c.id === run.checkId && c.criteria.some(crit => r.criteria.some(ac => ac.id === crit))) && run.status === 'passed').at(-1);
                    const lastEvid = s.evidence.filter(e => r.criteria.some(crit => crit.id === e.criterion) && e.result === 'passed').at(-1);
                    const expectedFp = lastRun?.fingerprint ?? lastEvid?.fingerprint;
                    if (expectedFp && expectedFp !== s.fingerprint) {
                        changedFiles.push(norm);
                    }
                }
            }
            if (changedFiles.length > 0) {
                const exp = `Requirement ${r.id} (${r.title}) linked file(s) changed: ${changedFiles.join(', ')}. Verification is potentially stale; re-run checks.`;
                impacted.push({ requirement: r.id, title: r.title, changedFiles, currentVerification: r.verification, stale: r.verification === 'stale' || r.verification === 'passed', explanation: exp });
                explanations.push(exp);
            }
        }
        return {
            workingTreeFingerprint: s.fingerprint, impactedCount: impacted.length, impacted, explanations,
            notice: 'File-based impact detection is a heuristic tracking declared file dependencies; it is not complete semantic analysis.'
        };
    }
    // --- FEATURE G: SCOPE-DRIFT REVIEW ---
    async scopeDrift() {
        const s = await this.view(), currentFps = await getFileFingerprints(this.root);
        const declaredFiles = new Set();
        for (const r of s.requirements)
            for (const f of r.files ?? [])
                declaredFiles.add(f.replaceAll('\\', '/'));
        const supporting = new Set(s.supportingFiles.map(sf => sf.path.replaceAll('\\', '/')));
        const unlinked = [];
        for (const path of Object.keys(currentFps)) {
            if (!declaredFiles.has(path) && !supporting.has(path))
                unlinked.push({ path, status: 'unlinked' });
        }
        return {
            totalWorkspaceFiles: Object.keys(currentFps).length, declaredFilesCount: declaredFiles.size, supportingFilesCount: supporting.size, unlinkedCount: unlinked.length,
            unlinked, supportingFiles: s.supportingFiles,
            notice: 'Scope-drift review is a heuristic comparing changed files to requirement references. It does not automatically prove out-of-scope work, nor does ScopeLock automatically reject changes or alter scope.'
        };
    }
    async linkFileToRequirement(reqId, filePath) {
        return this.mutate('file_linked_to_requirement', 'human', `${filePath} → ${reqId}`, s => {
            s = required(s);
            const r = s.requirements.find(r => r.id === reqId);
            if (!r)
                throw Error('Unknown requirement ' + reqId);
            const norm = filePath.replaceAll('\\', '/');
            r.files = r.files ?? [];
            if (!r.files.includes(norm))
                r.files.push(norm);
            return s;
        }, undefined, { requirement: reqId });
    }
    async addSupportingFile(filePath, reason) {
        return this.mutate('supporting_file_added', 'human', `${filePath}: ${reason}`, s => {
            s = required(s);
            const norm = filePath.replaceAll('\\', '/');
            s.supportingFiles = s.supportingFiles.filter(sf => sf.path !== norm);
            s.supportingFiles.push({ path: norm, reason, time: now() });
            return s;
        });
    }
    // --- FEATURE F: PROGRESS COMPARISON & CHECKPOINTS ---
    async createCheckpoint(name, note = '', actor = 'human') {
        const view = await this.view(), cid = uid('CKPT');
        const projectSnapshot = {
            scopeRevision: view.scopeRevision,
            requirements: view.requirements.map(r => ({ id: r.id, title: r.title, phase: r.phase, implementation: r.implementation, verification: r.verification, blocker: r.blocker, files: r.files ?? [] })),
            criteria: view.criteria,
            phases: view.phases.map(p => ({ id: p.id, title: p.title, implementation: p.implementation, verification: p.verification })),
            fingerprint: view.fingerprint, time: now()
        };
        return this.mutate('checkpoint_created', actor, `${cid}: ${name}`, s => {
            s = required(s);
            s.checkpoints.push({ id: cid, name, time: now(), actor, note, scopeRevision: view.scopeRevision, projectSnapshot });
            return s;
        });
    }
    async listCheckpoints() { const s = await this.read(); return s.checkpoints; }
    async compareCheckpoints(fromId, toId = 'current') {
        const s = await this.read(), from = s.checkpoints.find(c => c.id === fromId);
        if (!from)
            throw Error('Unknown from-checkpoint ' + fromId);
        let toSnapshot;
        if (toId === 'current' || !toId) {
            const view = await this.view();
            toSnapshot = { scopeRevision: view.scopeRevision, requirements: view.requirements.map(r => ({ id: r.id, title: r.title, phase: r.phase, implementation: r.implementation, verification: r.verification, blocker: r.blocker, files: r.files ?? [] })), criteria: view.criteria, phases: view.phases.map(p => ({ id: p.id, title: p.title, implementation: p.implementation, verification: p.verification })), fingerprint: view.fingerprint, time: now() };
        }
        else {
            const to = s.checkpoints.find(c => c.id === toId);
            if (!to)
                throw Error('Unknown to-checkpoint ' + toId);
            toSnapshot = to.projectSnapshot;
        }
        const fromSnap = from.projectSnapshot;
        const fromReqs = fromSnap.requirements ?? [], toReqs = toSnapshot.requirements ?? [];
        const scopeAdditions = toReqs.filter(r => !fromReqs.some(f => f.id === r.id));
        const scopeRemovals = fromReqs.filter(r => !toReqs.some(t => t.id === r.id));
        const implementationChanges = [], verificationChanges = [], newBlockers = [], regressions = [];
        for (const toR of toReqs) {
            const fromR = fromReqs.find(f => f.id === toR.id);
            if (fromR) {
                if (fromR.implementation !== toR.implementation)
                    implementationChanges.push({ id: toR.id, from: fromR.implementation, to: toR.implementation });
                if (fromR.verification !== toR.verification)
                    verificationChanges.push({ id: toR.id, from: fromR.verification, to: toR.verification });
                if (fromR.verification === 'passed' && toR.verification !== 'passed')
                    regressions.push({ id: toR.id, title: toR.title, from: fromR.verification, to: toR.verification });
            }
            if (toR.implementation === 'blocked' && (!fromR || fromR.implementation !== 'blocked'))
                newBlockers.push({ id: toR.id, blocker: toR.blocker });
        }
        return {
            fromCheckpoint: { id: from.id, name: from.name, time: from.time, scopeRevision: from.scopeRevision },
            toCheckpoint: toId === 'current' ? { id: 'current', name: 'Current workspace state', time: toSnapshot.time, scopeRevision: toSnapshot.scopeRevision } : { id: toId, name: s.checkpoints.find(c => c.id === toId)?.name, time: toSnapshot.time, scopeRevision: toSnapshot.scopeRevision },
            metrics: {
                scopeGrowth: { before: fromReqs.length, after: toReqs.length, delta: toReqs.length - fromReqs.length },
                implementationProgress: { before: fromReqs.filter(r => r.implementation === 'implemented').length, after: toReqs.filter(r => r.implementation === 'implemented').length, delta: toReqs.filter(r => r.implementation === 'implemented').length - fromReqs.filter(r => r.implementation === 'implemented').length },
                verificationProgress: { before: fromReqs.filter(r => r.verification === 'passed').length, after: toReqs.filter(r => r.verification === 'passed').length, delta: toReqs.filter(r => r.verification === 'passed').length - fromReqs.filter(r => r.verification === 'passed').length },
                regressionsCount: regressions.length,
                newBlockersCount: newBlockers.length
            },
            scopeAdditions, scopeRemovals, implementationChanges, verificationChanges, newBlockers, regressions
        };
    }
    // --- FEATURE H: RELEASE-READINESS REPORT ---
    async releaseReadiness() {
        const s = await this.view(), blockers = [];
        for (const run of s.runs)
            if (run.status === 'failed')
                blockers.push({ id: uid('FIND'), type: 'failed_check', description: `Check run ${run.id} for ${run.checkId} failed with exit code ${run.exitCode}`, reference: run.id });
        for (const r of s.requirements) {
            for (const c of r.criteria.filter(crit => crit.required)) {
                const critStatus = s.criteria[c.id]?.status ?? 'not_checked';
                if (critStatus === 'stale')
                    blockers.push({ id: uid('FIND'), type: 'stale_evidence', description: `Requirement ${r.id} criterion ${c.id} has stale evidence`, reference: r.id });
                else if (critStatus === 'not_checked')
                    blockers.push({ id: uid('FIND'), type: 'missing_evidence', description: `Requirement ${r.id} criterion ${c.id} is missing verification`, reference: r.id });
                else if (critStatus === 'failed')
                    blockers.push({ id: uid('FIND'), type: 'failed_criterion', description: `Requirement ${r.id} criterion ${c.id} verification failed`, reference: r.id });
            }
            if (r.implementation === 'blocked')
                blockers.push({ id: uid('FIND'), type: 'unresolved_blocker', description: `Requirement ${r.id} is blocked: ${r.blocker}`, reference: r.id });
        }
        for (const p of s.phases)
            if (p.verification !== 'passed')
                blockers.push({ id: uid('FIND'), type: 'unmet_phase_gate', description: `Phase ${p.id} (${p.title}) verification is ${p.verification}`, reference: p.id });
        const compatIssues = [];
        for (const agent of ['claude-code', 'codex', 'antigravity']) {
            const integ = s.integrations[agent];
            if (!integ?.installed)
                compatIssues.push(`Integration for ${agent} is not configured`);
        }
        const isReady = blockers.length === 0;
        return {
            isReady,
            status: isReady ? 'ready' : blockers.some(b => b.type === 'failed_check' || b.type === 'failed_criterion') ? 'failed' : 'blocked',
            summary: {
                totalRequirements: s.requirements.length,
                implementedRequirements: s.requirements.filter(r => r.implementation === 'implemented').length,
                verifiedRequirements: s.requirements.filter(r => r.verification === 'passed').length,
                totalPhases: s.phases.length,
                verifiedPhases: s.phases.filter(p => p.verification === 'passed').length,
                blockerCount: blockers.length,
                compatibilityIssueCount: compatIssues.length
            },
            blockers, compatibilityIssues: compatIssues,
            notice: 'Release gates require empirical evidence. Never mark real-agent, OS matrix, browser layout, or remote publication gates complete without actual recorded runs.'
        };
    }
    async exportReadinessReport() {
        const r = await this.releaseReadiness(), s = await this.view();
        return [
            `# ScopeLock Release-Readiness Report`,
            `Project: ${s.name} · Scope Revision: ${s.scopeRevision} · Generated: ${now()}`,
            `Overall Status: **${r.status.toUpperCase()}** (Ready: ${r.isReady})`,
            ``,
            `## 1. Release Gate Summary`,
            `| Metric | Count | Ratio / Status |`,
            `| --- | --- | --- |`,
            `| Implemented Requirements | ${r.summary.implementedRequirements} / ${r.summary.totalRequirements} | ${r.summary.totalRequirements ? Math.round(r.summary.implementedRequirements / r.summary.totalRequirements * 100) : 0}% |`,
            `| Verified Requirements | ${r.summary.verifiedRequirements} / ${r.summary.totalRequirements} | ${r.summary.totalRequirements ? Math.round(r.summary.verifiedRequirements / r.summary.totalRequirements * 100) : 0}% |`,
            `| Verified Phase Gates | ${r.summary.verifiedPhases} / ${r.summary.totalPhases} | ${r.summary.totalPhases ? Math.round(r.summary.verifiedPhases / r.summary.totalPhases * 100) : 0}% |`,
            `| Active Release Blockers | ${r.summary.blockerCount} | ${r.summary.blockerCount === 0 ? 'Passed' : 'Action required'} |`,
            ``,
            `## 2. Actionable Findings & Blockers`,
            r.blockers.length ? r.blockers.map((b, i) => `${i + 1}. [${b.type.toUpperCase()}] ${b.description} (Source: ${b.reference})`).join('\n') : `No blockers recorded. All evaluated exit criteria pass.`,
            ``,
            `## 3. Agent Compatibility Findings`,
            r.compatibilityIssues.length ? r.compatibilityIssues.map(c => `- ${c}`).join('\n') : `All target agent adapters installed.`,
            ``,
            `> **Notice:** ${r.notice}`
        ].join('\n');
    }
    // --- FEATURE E: BUILD TIMELINE & EVENT FILTERING ---
    async timeline(filters = {}) {
        const s = await this.read();
        let events = [...s.events];
        if (filters.phase)
            events = events.filter(e => e.phase === filters.phase || e.detail.includes(filters.phase));
        if (filters.requirement)
            events = events.filter(e => e.requirement === filters.requirement || e.detail.includes(filters.requirement));
        if (filters.actor)
            events = events.filter(e => e.actor === filters.actor);
        if (filters.type)
            events = events.filter(e => e.type === filters.type);
        if (filters.result)
            events = events.filter(e => e.result === filters.result);
        if (filters.date)
            events = events.filter(e => e.time.slice(0, 10) === filters.date);
        if (filters.query) {
            const q = filters.query.toLowerCase();
            events = events.filter(e => (e.type + ' ' + e.detail + ' ' + (e.requirement ?? '') + ' ' + (e.phase ?? '')).toLowerCase().includes(q));
        }
        return { totalEvents: s.events.length, matchingEventsCount: events.length, events: events.reverse(), emptyStateMessage: events.length === 0 ? 'No activity matches the selected filters.' : undefined };
    }
    // --- FEATURE I: SAVED DASHBOARD FILTERS ---
    async saveFilter(filter) {
        const fid = filter.id ?? uid('FLTR');
        return this.mutate('filter_saved', 'human', `Saved filter ${filter.name}`, s => {
            s = required(s);
            s.savedFilters = s.savedFilters.filter(f => f.id !== fid);
            s.savedFilters.push({ id: fid, name: filter.name, target: filter.target, query: filter.query ?? '', phase: filter.phase ?? '', result: filter.result ?? '', actor: filter.actor ?? '', date: filter.date ?? '', isBuiltin: false });
            return s;
        });
    }
    async deleteFilter(id) {
        return this.mutate('filter_deleted', 'human', `Deleted filter ${id}`, s => {
            s = required(s);
            s.savedFilters = s.savedFilters.filter(f => f.id !== id);
            return s;
        });
    }
    async renameFilter(id, name) {
        return this.mutate('filter_renamed', 'human', `Renamed filter ${id} → ${name}`, s => {
            s = required(s);
            const f = s.savedFilters.find(f => f.id === id);
            if (!f)
                throw Error('Unknown filter ' + id);
            f.name = name;
            return s;
        });
    }
}
