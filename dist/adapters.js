import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { now } from './storage.js';
export const agents = ['claude-code', 'codex', 'antigravity'];
const start = '<!-- ScopeLock managed start -->', end = '<!-- ScopeLock managed end -->';
async function read(path) { try {
    return await readFile(path, 'utf8');
}
catch (e) {
    if (e.code === 'ENOENT')
        return '';
    throw e;
} }
export async function connect(p, agent, remove = false) {
    if (!agents.includes(agent))
        throw Error('Choose claude-code, codex or antigravity');
    const config = agent === 'codex' ? '.codex/config.toml' : agent === 'claude-code' ? '.mcp.json' : '.agents/mcp_config.json';
    const instruction = agent === 'claude-code' ? 'CLAUDE.md' : agent === 'codex' ? 'AGENTS.md' : '.agents/rules/scopelock.md';
    const entry = { command: process.execPath, args: [fileURLToPath(new URL('./cli.js', import.meta.url)), '--project', p.root, 'mcp', agent] };
    const block = `${start}\n# ScopeLock\nUse ScopeLock tools to read the active phase, requirements, constraints and handoff before editing. Link work to requirement IDs. Record implementation separately from verification; submit evidence honestly. Run only approved checks. Propose scope changes; let the user decide them in ScopeLock. Never claim completion from an agent note alone. Report blockers and the next action when stopping.\n${end}`;
    await p.mutate(remove ? 'adapter_removed' : 'adapter_installed', 'human', agent, async (s) => {
        if (!s)
            throw Error('Initialize first');
        const cp = join(p.root, config), ip = join(p.root, instruction), manifestPath = join(p.dir, 'adapter-' + agent + '.json');
        const oldConfig = await read(cp), oldInstructions = await read(ip);
        let manifest = null;
        try {
            manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        }
        catch (e) {
            if (e.code !== 'ENOENT')
                throw e;
        }
        if (remove && !manifest)
            return s;
        let nextConfig = oldConfig, nextInstructions = oldInstructions;
        if (agent === 'codex') {
            const a = '# ScopeLock managed start', b = '# ScopeLock managed end';
            const managed = `${a}\n[mcp_servers.scopelock]\ncommand = ${JSON.stringify(entry.command)}\nargs = ${JSON.stringify(entry.args)}\n${b}`;
            if (manifest) {
                if (!oldConfig.includes(manifest.configBlock))
                    throw Error('Managed Codex settings were edited; refusing to overwrite');
                nextConfig = oldConfig.replace(manifest.configBlock, remove ? '' : managed);
            }
            else {
                if (oldConfig.includes('mcp_servers.scopelock'))
                    throw Error('Existing ScopeLock configuration; inspect before installing');
                nextConfig = oldConfig + (oldConfig.endsWith('\n') || !oldConfig ? '' : '\n') + managed + '\n';
            }
            manifest = { ...manifest, configBlock: managed };
        }
        else {
            const json = oldConfig ? JSON.parse(oldConfig) : {};
            if (json.mcpServers !== undefined && (typeof json.mcpServers !== 'object' || Array.isArray(json.mcpServers) || json.mcpServers === null))
                throw Error('Invalid mcpServers configuration');
            json.mcpServers ??= {};
            if (json.mcpServers.scopelock && (!manifest || JSON.stringify(json.mcpServers.scopelock) !== JSON.stringify(manifest.entry)))
                throw Error('ScopeLock server entry was edited or belongs to another installation');
            if (remove)
                delete json.mcpServers.scopelock;
            else
                json.mcpServers.scopelock = entry;
            nextConfig = JSON.stringify(json, null, 2) + '\n';
        }
        if (manifest?.block) {
            if (!oldInstructions.includes(manifest.block))
                throw Error('Managed instructions were edited; refusing to overwrite');
            nextInstructions = oldInstructions.replace(manifest.block, remove ? '' : block);
        }
        else if (!remove) {
            if (oldInstructions.includes(start))
                throw Error('Unrecognized ScopeLock instructions');
            nextInstructions = oldInstructions + (oldInstructions.endsWith('\n') || !oldInstructions ? '' : '\n') + block + '\n';
        }
        const originalConfig = manifest?.originalConfig ?? oldConfig, originalInstructions = manifest?.originalInstructions ?? oldInstructions;
        // Exact originals restore byte-for-byte if no external changes occurred.
        if (remove) {
            if (oldConfig === manifest.installedConfig)
                nextConfig = originalConfig;
            if (oldInstructions === manifest.installedInstructions)
                nextInstructions = originalInstructions;
        }
        await mkdir(dirname(cp), { recursive: true });
        await mkdir(dirname(ip), { recursive: true });
        const backup = join(p.dir, 'adapter-backups');
        await mkdir(backup, { recursive: true });
        await writeFile(join(backup, agent + '-config.txt'), oldConfig, { mode: 0o600 });
        await writeFile(join(backup, agent + '-instructions.txt'), oldInstructions, { mode: 0o600 });
        try {
            await writeFile(cp, nextConfig);
            await writeFile(ip, nextInstructions);
            if (remove)
                await rm(manifestPath, { force: true });
            else
                await writeFile(manifestPath, JSON.stringify({ ...manifest, entry, block, originalConfig, originalInstructions, installedConfig: nextConfig, installedInstructions: nextInstructions }, null, 2), { mode: 0o600 });
        }
        catch (e) {
            await writeFile(cp, oldConfig);
            await writeFile(ip, oldInstructions);
            throw e;
        }
        s.integrations[agent] = { ...s.integrations[agent], installed: !remove, time: now() };
        return s;
    });
    return { agent, installed: !remove, config, instruction, next: remove ? 'Removed managed additions' : 'Restart the agent, trust the project, and approve the local MCP server if prompted.' };
}
export async function probe(p, agent) {
    if (!agents.includes(agent))
        throw Error('Unknown agent');
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const client = new Client({ name: 'scopelock-diagnostic', version: '0.1.0' });
    const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./cli.js', import.meta.url)), '--project', p.root, 'mcp', agent] });
    try {
        await client.connect(transport);
        const tools = await client.listTools();
        await p.mutate('connection_checked', 'human', agent, s => { if (!s)
            throw Error('Missing project'); s.integrations[agent] = { ...s.integrations[agent], installed: s.integrations[agent]?.installed ?? false, time: s.integrations[agent]?.time ?? now(), lastCheck: now() }; return s; });
        return { ok: true, tools: tools.tools.length, note: 'Local MCP handshake passed. Actual agent session remains unverified.' };
    }
    finally {
        await client.close();
    }
}
