import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { within } from './core.js';
import { runCheck, cancelRun, clearLogs } from './runner.js';
import { connect, probe } from './adapters.js';
export async function dashboard(p, port = 4317) {
    const token = randomBytes(32).toString('hex'), clients = new Set();
    let snapshot = '', refreshing = false;
    const refresh = async () => { if (refreshing)
        return; refreshing = true; try {
        const next = JSON.stringify(await p.view());
        if (next !== snapshot) {
            snapshot = next;
            for (const c of clients)
                c.write('data: ' + next + '\n\n');
        }
    }
    catch { }
    finally {
        refreshing = false;
    } };
    const server = createServer(async (req, res) => {
        try {
            const host = req.headers.host;
            if (host !== `127.0.0.1:${actualPort}` && host !== `localhost:${actualPort}`) {
                res.writeHead(403).end();
                return;
            }
            const origin = req.headers.origin;
            if (origin && origin !== `http://${host}`) {
                res.writeHead(403).end();
                return;
            }
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'");
            res.setHeader('Cache-Control', 'no-store');
            const url = new URL(req.url ?? '/', `http://${host}`);
            const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
            if (req.method === 'GET' && url.pathname === '/api/state') {
                json({ state: await p.view(), token });
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/events') {
                res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive' });
                res.write('data: ' + JSON.stringify(await p.view()) + '\n\n');
                clients.add(res);
                req.on('close', () => clients.delete(res));
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/artifact') {
                const e = (await p.read()).evidence.find(e => e.id === url.searchParams.get('id'));
                if (!e?.artifact)
                    throw Error('Artifact not found');
                const bytes = await readFile(await within(p.root, e.artifact));
                res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="' + e.id + '"' });
                res.end(bytes);
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/report') {
                res.writeHead(200, { 'Content-Type': 'text/markdown', 'Content-Disposition': 'attachment; filename="scopelock-report.md"' });
                res.end(await p.report());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/coverage') {
                json(await p.coverage());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/dependencies') {
                json(await p.dependencyGraph());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/impact') {
                json(await p.changeImpact());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/drift') {
                json(await p.scopeDrift());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/readiness') {
                json(await p.releaseReadiness());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/readiness/report') {
                res.writeHead(200, { 'Content-Type': 'text/markdown', 'Content-Disposition': 'attachment; filename="release-readiness-report.md"' });
                res.end(await p.exportReadinessReport());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/handoff') {
                json(await p.handoff());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/checkpoints') {
                json(await p.listCheckpoints());
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/checkpoints/compare') {
                const from = url.searchParams.get('from') ?? '', to = url.searchParams.get('to') ?? 'current';
                json(await p.compareCheckpoints(from, to));
                return;
            }
            if (req.method === 'GET' && url.pathname === '/api/timeline') {
                const q = (name) => url.searchParams.get(name) ?? undefined;
                json(await p.timeline({ phase: q('phase'), requirement: q('requirement'), actor: q('actor'), type: q('type'), result: q('result'), date: q('date'), query: q('query') }));
                return;
            }
            if (req.method === 'POST' && url.pathname === '/api/action') {
                if (req.headers['x-scopelock-token'] !== token || req.headers['content-type'] !== 'application/json') {
                    json({ error: 'Invalid local session' }, 403);
                    return;
                }
                let body = '';
                for await (const b of req) {
                    body += b;
                    if (body.length > 2 * 1024 * 1024)
                        throw Error('Request too large');
                }
                const a = JSON.parse(body);
                let result;
                switch (a.action) {
                    case 'update':
                        result = await p.update(a.id, a.status, a.blocker);
                        break;
                    case 'activate':
                        result = await p.activate(a.id, a.reason);
                        break;
                    case 'import':
                        result = await p.import(a.source);
                        break;
                    case 'confirm':
                        result = await p.confirm();
                        break;
                    case 'propose':
                        result = await p.propose(a.source, a.reason, 'human');
                        break;
                    case 'decide':
                        result = await p.decide(a.id, a.accept === true);
                        break;
                    case 'defineCheck':
                        result = await p.defineCheck(a.check);
                        break;
                    case 'approveCheck':
                        result = await p.approveCheck(a.id);
                        break;
                    case 'run':
                        void runCheck(p, a.id).catch(e => { for (const c of clients)
                            c.write('event: error-message\ndata: ' + JSON.stringify({ error: String(e) }) + '\n\n'); });
                        result = { started: true };
                        break;
                    case 'cancel':
                        result = cancelRun(a.id);
                        break;
                    case 'evidence':
                        result = await p.evidence(a.criterion, a.result, a.note, 'human', a.artifact);
                        break;
                    case 'connect':
                        result = await connect(p, a.agent, a.remove);
                        break;
                    case 'probe':
                        result = await probe(p, a.agent);
                        break;
                    case 'clearLogs':
                        result = await clearLogs(p, a.days);
                        break;
                    case 'doctor':
                        result = await p.doctor();
                        break;
                    case 'checkpoint':
                        result = await p.createCheckpoint(a.name, a.note);
                        break;
                    case 'compareCheckpoints':
                        result = await p.compareCheckpoints(a.fromId, a.toId);
                        break;
                    case 'saveFilter':
                        result = await p.saveFilter(a.filter);
                        break;
                    case 'deleteFilter':
                        result = await p.deleteFilter(a.id);
                        break;
                    case 'renameFilter':
                        result = await p.renameFilter(a.id, a.name);
                        break;
                    case 'linkFile':
                        result = await p.linkFileToRequirement(a.requirement, a.file);
                        break;
                    case 'addSupportingFile':
                        result = await p.addSupportingFile(a.file, a.reason);
                        break;
                    default: throw Error('Unknown action');
                }
                await refresh();
                json({ ok: true, result });
                return;
            }
            if (req.method !== 'GET') {
                res.writeHead(405).end();
                return;
            }
            const dir = fileURLToPath(new URL('../web-dist/', import.meta.url));
            const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
            const target = resolve(dir, path);
            if (!target.startsWith(resolve(dir) + sep)) {
                res.writeHead(403).end();
                return;
            }
            const bytes = await readFile(target);
            res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(target)] ?? 'application/octet-stream' });
            res.end(bytes);
        }
        catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
        }
    });
    let actualPort = port;
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => { actualPort = server.address().port; resolve(); }); });
    const interval = setInterval(refresh, 1000);
    server.on('close', () => { clearInterval(interval); for (const c of clients)
        c.end(); });
    return { server, url: `http://127.0.0.1:${actualPort}` };
}
