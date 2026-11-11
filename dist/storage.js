import { mkdir, readFile, open, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { validate } from './model.js';
export const now = () => new Date().toISOString();
export const uid = (p) => p + '-' + randomUUID();
export class Store {
    root;
    dir;
    constructor(root) { this.root = resolve(root); this.dir = join(this.root, '.scopelock'); }
    async read() { return validate(JSON.parse(await readFile(join(this.dir, 'state.json'), 'utf8'))); }
    async writeAtomic(path, value) { const tmp = path + '.' + randomUUID() + '.tmp'; const f = await open(tmp, 'wx', 0o600); try {
        await f.writeFile(JSON.stringify(value, null, 2) + '\n');
        await f.sync();
    }
    finally {
        await f.close();
    } try {
        await rename(tmp, path);
    }
    finally {
        await rm(tmp, { force: true });
    } }
    async mutate(type, actor, detail, fn, expected, extra) {
        await mkdir(this.dir, { recursive: true });
        const lockPath = join(this.dir, 'write.lock');
        let lock;
        for (let i = 0; i < 40; i++) {
            try {
                lock = await open(lockPath, 'wx', 0o600);
                break;
            }
            catch (e) {
                if (e.code !== 'EEXIST')
                    throw e;
                if (i === 39)
                    throw Error('Project is locked. Run doctor; recover only after the owner has stopped.');
                await new Promise(r => setTimeout(r, 50));
            }
        }
        if (!lock)
            throw Error('Could not lock project');
        await lock.writeFile(JSON.stringify({ pid: process.pid, host: hostname(), time: now() }));
        try {
            let before = null;
            try {
                before = await this.read();
            }
            catch (e) {
                if (e.code !== 'ENOENT')
                    throw e;
            }
            if (expected !== undefined && before?.revision !== expected)
                throw Error('Revision conflict: reload before editing');
            const next = await fn(before ? structuredClone(before) : null);
            next.revision = (before?.revision ?? -1) + 1;
            next.events.push({ id: uid('EV'), revision: next.revision, time: now(), type, actor, detail, ...(extra ?? {}) });
            validate(next);
            // A previous valid snapshot makes interrupted/corrupt-state recovery explicit.
            if (before)
                await this.writeAtomic(join(this.dir, 'previous.json'), before);
            await this.writeAtomic(join(this.dir, 'state.json'), next);
            return next;
        }
        finally {
            await lock.close();
            await rm(lockPath, { force: true });
        }
    }
    async recover() {
        const path = join(this.dir, 'write.lock');
        let lock;
        try {
            lock = JSON.parse(await readFile(path, 'utf8'));
        }
        catch (e) {
            if (e.code !== 'ENOENT')
                throw Error('Lock metadata is unreadable; inspect manually');
        }
        if (lock) {
            if (lock.host !== hostname())
                throw Error('Lock belongs to another host; inspect manually');
            try {
                process.kill(lock.pid, 0);
                throw Error('Lock owner is still alive');
            }
            catch (e) {
                if (e.code !== 'ESRCH')
                    throw e;
            }
            await rm(path);
        }
        let good = true;
        try {
            await this.read();
        }
        catch {
            good = false;
        }
        if (!good) {
            const previous = validate(JSON.parse(await readFile(join(this.dir, 'previous.json'), 'utf8')));
            await this.mutateRecovery(previous);
        }
        const s = await this.mutate('recovered', 'human', 'Recovered interrupted local state', s => { if (!s)
            throw Error('No project'); for (const r of s.runs) {
            if (r.status === 'running') {
                try {
                    process.kill(r.pid, 0);
                }
                catch (e) {
                    if (e.code === 'ESRCH') {
                        r.status = 'error';
                        r.end = now();
                        r.reason = 'Runner interrupted';
                    }
                }
            }
        } return s; });
        return s;
    }
    async mutateRecovery(s) { const lock = await open(join(this.dir, 'write.lock'), 'wx', 0o600); try {
        await this.writeAtomic(join(this.dir, 'state.json'), s);
    }
    finally {
        await lock.close();
        await rm(join(this.dir, 'write.lock'), { force: true });
    } }
}
