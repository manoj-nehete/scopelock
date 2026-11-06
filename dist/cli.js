#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Project } from './core.js';
const args = process.argv.slice(2);
let root = process.cwd();
if (args[0] === '--project') {
    args.shift();
    root = resolve(args.shift() ?? '.');
}
const command = args.shift();
const p = new Project(root);
const file = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
try {
    let result;
    switch (command) {
        case 'init':
            result = await p.init(args.join(' ') || 'My project');
            break;
        case 'import':
            result = await p.import(await readFile(resolve(root, args[0]), 'utf8'));
            break;
        case 'confirm':
            result = await p.confirm();
            break;
        case 'status':
        case 'requirements':
            result = await p.view();
            break;
        case 'update':
            result = await p.update(args[0], args[1], args.slice(2).join(' '));
            break;
        case 'phase':
            result = args[0] === 'activate' ? await p.activate(args[1], args.slice(2).join(' ') || undefined) : (await p.view()).phases;
            break;
        case 'handoff':
            result = await p.handoff();
            break;
        case 'scope':
            if (args[0] === 'propose')
                result = await p.propose(await readFile(resolve(root, args[1]), 'utf8'), args.slice(2).join(' '), 'human');
            else if (args[0] === 'accept' || args[0] === 'reject')
                result = await p.decide(args[1], args[0] === 'accept');
            else
                result = (await p.read()).proposals;
            break;
        case 'check':
            if (args[0] === 'define')
                result = await p.defineCheck(await file(args[1]));
            else if (args[0] === 'approve')
                result = await p.approveCheck(args[1]);
            else if (args[0] === 'run') {
                const { runCheck } = await import('./runner.js');
                const s = await runCheck(p, args[1]);
                result = s.runs.at(-1);
                if (result?.status !== 'passed')
                    process.exitCode = 1;
            }
            else
                result = (await p.read()).checks;
            break;
        case 'evidence': {
            const a = await file(args[0]);
            result = await p.evidence(a.criterion, a.result, a.note, 'human', a.artifact);
            break;
        }
        case 'doctor':
            result = await p.doctor();
            if (!result.ok)
                process.exitCode = 1;
            break;
        case 'migrate':
            result = await p.migrate();
            break;
        case 'recover':
            result = await p.recover();
            break;
        case 'backup':
            await writeFile(resolve(root, args[0]), JSON.stringify(await p.backup(), null, 2));
            result = { saved: args[0] };
            break;
        case 'restore':
            result = await p.restore(await file(args[0]));
            break;
        case 'report': {
            const report = await p.report();
            if (args[0])
                await writeFile(resolve(root, args[0]), report);
            else
                process.stdout.write(report);
            break;
        }
        case 'logs': {
            const { clearLogs } = await import('./runner.js');
            result = args[0] === 'clear' ? await clearLogs(p, args[1] ? Number(args[1]) : undefined) : (await p.read()).runs;
            break;
        }
        case 'connect':
        case 'disconnect': {
            const { connect } = await import('./adapters.js');
            result = await connect(p, args[0], command === 'disconnect');
            break;
        }
        case 'probe': {
            const { probe } = await import('./adapters.js');
            result = await probe(p, args[0]);
            break;
        }
        case 'mcp': {
            const { serveMcp } = await import('./mcp.js');
            await serveMcp(p, args[0]);
            break;
        }
        case 'dashboard': {
            const { dashboard } = await import('./server.js');
            const d = await dashboard(p, args[0] ? Number(args[0]) : 4317);
            console.log('ScopeLock dashboard: ' + d.url);
            break;
        }
        case '--help':
        case 'help':
        default:
            console.log('ScopeLock 0.1.0\nUsage: scopelock [--project PATH] COMMAND\ninit | import FILE | confirm | status | requirements | update ID STATUS [REASON]\nphase [activate ID [OVERRIDE_REASON]] | handoff\nscope [propose FILE REASON | accept ID | reject ID]\ncheck [define FILE.json | approve ID | run ID] | evidence FILE.json\ndoctor | recover | migrate | backup FILE | restore FILE | report [FILE] | logs [clear [DAYS]]\nconnect AGENT | disconnect AGENT | probe AGENT | mcp [AGENT] | dashboard [PORT]');
            if (command && command !== '--help' && command !== 'help')
                process.exitCode = 1;
    }
    if (result !== undefined)
        console.log(JSON.stringify(result, null, 2));
}
catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
}
