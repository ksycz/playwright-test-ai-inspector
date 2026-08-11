import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(here, 'cli.mts');
const fixture = path.join(here, 'fixtures/sample-failure');

function runCli(args: string[]): Promise<{ code: number | null; stderr: string; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--experimental-strip-types', cliPath, ...args], {
      cwd: path.resolve(here, '../..'),
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stderr, stdout }));
  });
}

describe('analyze:failure CLI', () => {
  it('rejects --out when the next token is another flag', async () => {
    const result = await runCli([fixture, '--out', '--title']);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /got flag "--title"/);
  });

  it('creates parent directories for --out', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'failure-cli-'));
    const outPath = path.join(tempDir, 'nested', 'dir', 'context.json');

    try {
      const result = await runCli([fixture, '--out', outPath]);
      assert.equal(result.code, 0);
      await access(outPath);
      assert.match(result.stderr, /Wrote failure context/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
