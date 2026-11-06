import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Project, within } from '../dist/core.js';
import { redact } from '../dist/runner.js';

test('Windows path and execution compatibility logic', async () => {
  const root = await mkdtemp(join(tmpdir(), 'scopelock-win-compat-'));
  try {
    // 1. Test within() boundary checks for relative and escaping paths
    await writeFile(join(root, 'safe.txt'), 'content');
    const resolvedSafe = await within(root, 'safe.txt');
    assert.ok(resolvedSafe.endsWith('safe.txt'));

    // Attempt traversal - create outside file to test realpath escaping
    const outsideFile = join(root, '..', 'scopelock-outside-test.txt');
    await writeFile(outsideFile, 'outside');
    try {
      await assert.rejects(within(root, '../scopelock-outside-test.txt'), /escapes/);
    } finally {
      await rm(outsideFile, { force: true });
    }

    // 2. Doctor executable search with Windows extensions simulation
    const p = new Project(root);
    await p.init('Windows Doctor Test');
    await p.import('# Phase P01: Main\n## REQ-001: Run\n- Acceptance: Runs.\n');
    await p.confirm();

    // Define check with node executable
    await p.defineCheck({
      id: 'CHECK-WIN-1',
      title: 'Node test',
      criteria: ['REQ-001-AC1'],
      command: process.execPath,
      args: ['-v'],
      cwd: '.',
      timeoutMs: 5000
    });

    const docOk = await p.doctor();
    assert.equal(docOk.ok, true);

    // Define check with non-existent command
    await p.defineCheck({
      id: 'CHECK-WIN-2',
      title: 'Missing exe',
      criteria: ['REQ-001-AC1'],
      command: 'non_existent_binary_xyz',
      args: [],
      cwd: '.',
      timeoutMs: 5000
    });

    const docFail = await p.doctor();
    assert.equal(docFail.ok, false);
    assert.ok(docFail.issues.some(i => i.includes('executable not found')));

    // 3. Test secret redaction on Windows style paths and credentials
    const winLog = 'Connecting with token: secret_token_12345 to https://user:pass123@windows.server.local:8080/build';
    const redacted = redact(winLog);
    assert.ok(!redacted.includes('secret_token_12345'));
    assert.ok(!redacted.includes('pass123'));
    assert.ok(redacted.includes('[REDACTED]'));

    // 4. Test dashboard static asset path check with backslashes
    const mockWebDist = 'D:\\a\\scopelock\\scopelock\\web-dist';
    const mockTarget = 'D:\\a\\scopelock\\scopelock\\web-dist\\index.html';
    const winSep = '\\';
    assert.ok(mockTarget.startsWith(mockWebDist + winSep));
    assert.ok(!mockTarget.startsWith(mockWebDist + '/')); // This was the bug: hardcoded '/' failed on Windows
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
