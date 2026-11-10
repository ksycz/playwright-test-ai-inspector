import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { analyzeFlakyReport } from './analyze.mts';

// Edge cases of reading Playwright's JSON report: missing fields, status derived from the
// attempts, nested suites. Each test names the rule it pins down.
async function analyze(report: unknown) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'flaky-edge-'));
  const file = path.join(dir, 'report.json');
  await writeFile(file, JSON.stringify(report));
  return analyzeFlakyReport(file);
}

const result = (status: string, extra: Record<string, unknown> = {}) => ({ status, retry: 0, duration: 1, ...extra });
const spec = (title: string, test: Record<string, unknown>, file = 'a.spec.ts') => ({ title, file, tests: [test] });
const report = (specs: unknown[]) => ({ suites: [{ title: 'a.spec.ts', file: 'a.spec.ts', specs }] });

describe('P4-M2 flaky detector: reading the report', () => {
  it('EDGE-01: without a declared status, the verdict comes from the attempts', async () => {
    const analysis = await analyze(
      report([
        spec('failed then passed', { results: [result('failed'), result('passed')] }),
        spec('timed out then passed', { results: [result('timedOut'), result('passed')] }),
        spec('interrupted then passed', { results: [result('interrupted'), result('passed')] }),
        spec('failed every time', { results: [result('failed'), result('failed')] }),
        spec('passed', { results: [result('passed')] }),
        spec('skipped', { results: [result('skipped')] }),
        spec('never ran', { results: [] }),
        spec('no results field', {}),
      ]),
    );
    const verdicts = Object.fromEntries(
      [...analysis.flakyTests, ...analysis.unexpectedTests].map((test) => [test.title, test.verdict]),
    );
    assert.deepEqual(verdicts, {
      'failed then passed': 'flaky',
      'timed out then passed': 'flaky',
      'interrupted then passed': 'flaky',
      'failed every time': 'unexpected',
    });
    assert.deepEqual(analysis.stats, { expected: 1, unexpected: 1, flaky: 3, skipped: 3 });
  });

  it('EDGE-02: a declared status wins over the attempts', async () => {
    const analysis = await analyze(
      report([
        spec('declared flaky', { status: 'flaky', results: [result('passed')] }),
        spec('declared unexpected', { status: 'unexpected', results: [result('passed')] }),
        spec('declared expected', { status: 'expected', results: [result('failed')] }),
        spec('declared skipped', { status: 'skipped', results: [result('failed')] }),
        spec('unknown status', { status: 'weird', results: [result('failed')] }),
      ]),
    );
    assert.deepEqual(analysis.flakyTests.map((test) => test.title), ['declared flaky']);
    assert.deepEqual(analysis.unexpectedTests.map((test) => test.title), ['declared unexpected', 'unknown status']);
    assert.deepEqual(analysis.stats, { expected: 1, unexpected: 2, flaky: 1, skipped: 1 });
  });

  it('EDGE-03: missing fields get defaults; the error comes from error, else errors[], first line only', async () => {
    const analysis = await analyze(
      report([
        spec('defaults', { status: 'unexpected', results: [{}] }),
        spec('errors list', {
          status: 'unexpected',
          projectName: 'mobile',
          results: [result('failed', { errors: [{ value: 'x' }, { message: 'second\nmore lines' }] })],
        }),
        spec('error wins', {
          status: 'unexpected',
          results: [result('failed', { error: { message: 'first' }, errors: [{ message: 'other' }] })],
        }),
      ]),
    );
    const [defaults, list, wins] = analysis.unexpectedTests;
    assert.equal(defaults!.projectName, 'unknown');
    assert.deepEqual(defaults!.attempts, [
      { retry: 0, status: 'unknown', durationMs: 0, errorMessage: null, errorContextPath: null },
    ]);
    assert.equal(list!.projectName, 'mobile');
    assert.equal(list!.attempts[0]!.errorMessage, 'second');
    assert.equal(wins!.attempts[0]!.errorMessage, 'first');
  });

  it('EDGE-04: long error lines are cut to 240 characters', async () => {
    const analysis = await analyze(
      report([spec('long', { status: 'unexpected', results: [result('failed', { error: { message: 'x'.repeat(500) } })] })]),
    );
    assert.equal(analysis.unexpectedTests[0]!.attempts[0]!.errorMessage!.length, 240);
  });

  it('EDGE-05: only the error-context attachment is kept as errorContextPath', async () => {
    const analysis = await analyze(
      report([
        spec('attachments', {
          status: 'unexpected',
          results: [
            result('failed', {
              attachments: [
                { name: 'screenshot', path: '/r/shot.png' },
                { name: 'error-context', path: '/r/error-context.md' },
              ],
            }),
          ],
        }),
        spec('none', { status: 'unexpected', results: [result('failed', { attachments: [{ name: 'video', path: '/r/v.webm' }] })] }),
      ]),
    );
    assert.equal(analysis.unexpectedTests[0]!.attempts[0]!.errorContextPath, '/r/error-context.md');
    assert.equal(analysis.unexpectedTests[1]!.attempts[0]!.errorContextPath, null);
  });

  it('EDGE-06: full titles join non-empty suite titles; the file falls back to the suite file', async () => {
    const analysis = await analyze({
      suites: [
        {
          title: '  outer.spec.ts  ',
          file: 'outer.spec.ts',
          specs: [{ title: 'top level', tests: [{ status: 'unexpected', results: [result('failed')] }] }],
          suites: [
            {
              title: '',
              specs: [{ title: 'under untitled', file: 'own.spec.ts', tests: [{ status: 'unexpected', results: [result('failed')] }] }],
            },
            { title: '@smoke Group', specs: [{ tests: [{ status: 'unexpected', results: [result('failed')] }] }] },
          ],
        },
      ],
    });
    assert.deepEqual(
      analysis.unexpectedTests.map((test) => [test.fullTitle, test.file]),
      [
        ['outer.spec.ts › top level', 'outer.spec.ts'],
        ['outer.spec.ts › under untitled', 'own.spec.ts'],
        ['outer.spec.ts › @smoke Group › Untitled test', ''],
      ],
    );
  });

  it('EDGE-07: a report with no suites gives empty results', async () => {
    const analysis = await analyze({ stats: { expected: 9 } });
    assert.deepEqual(analysis.stats, { expected: 0, unexpected: 0, flaky: 0, skipped: 0 });
    assert.deepEqual(analysis.flakyTests, []);
  });

  it('EDGE-08: a folder or broken JSON fails with a message naming the path', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'flaky-edge-'));
    await assert.rejects(() => analyzeFlakyReport(dir), /expects a JSON report file: .*flaky-edge-/);
    const broken = path.join(dir, 'broken.json');
    await writeFile(broken, '{ not json');
    await assert.rejects(() => analyzeFlakyReport(broken), /Failed to parse Playwright JSON report at .*broken\.json: /);
  });

  it('EDGE-09: analyzedAt is an ISO timestamp from now, sourcePath is absolute', async () => {
    const before = Date.now();
    const analysis = await analyze(report([]));
    assert.ok(Date.parse(analysis.analyzedAt) >= before - 1000);
    assert.ok(path.isAbsolute(analysis.sourcePath));
  });
});
