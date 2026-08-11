import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { analyzeTrends, loadHistory } from './history.mts';
import { appendRunRecord, buildRunRecord, recordRunFromReport } from './record.mts';
import { generateTrendsMarkdown } from './report.mts';

const here = path.dirname(fileURLToPath(import.meta.url));
const hardFailFixture = path.join(here, '../flaky-detector/fixtures/hard-fail.json');
const flakyFixture = path.join(here, '../flaky-detector/fixtures/flaky-then-pass.json');
const sampleHistory = path.join(here, 'fixtures/sample-history.jsonl');
const malformedHistory = path.join(here, 'fixtures/malformed-history.jsonl');

describe('failure-trends record', () => {
  it('P7-M1-01: builds a run record from Playwright JSON and appends JSONL', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'failure-trends-'));
    const historyPath = path.join(tempDir, 'runs.jsonl');

    try {
      const record = await buildRunRecord(hardFailFixture, {
        suite: 'smoke',
        recordedAt: '2026-08-09T12:00:00.000Z',
      });

      assert.equal(record.stats.unexpected, 1);
      assert.equal(record.failures.length, 1);
      assert.equal(record.failures[0]?.category, 'timeout');
      assert.equal(record.suite, 'smoke');

      const written = await appendRunRecord(historyPath, record);
      const raw = await readFile(written, 'utf8');
      const lines = raw.trim().split('\n');
      assert.equal(lines.length, 1);
      assert.deepEqual(JSON.parse(lines[0]!), record);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('P7-M1-02: record appends additional lines without corrupting prior entries', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'failure-trends-'));
    const historyPath = path.join(tempDir, 'runs.jsonl');

    try {
      await recordRunFromReport(hardFailFixture, historyPath, { suite: 'smoke' });
      await recordRunFromReport(flakyFixture, historyPath, { suite: 'smoke' });

      const raw = await readFile(historyPath, 'utf8');
      const lines = raw.trim().split('\n');
      assert.equal(lines.length, 2);

      const first = JSON.parse(lines[0]!);
      const second = JSON.parse(lines[1]!);
      assert.equal(first.stats.unexpected, 1);
      assert.equal(second.stats.flaky, 1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('failure-trends report', () => {
  it('P7-M2-01: ranks recurring unexpected tests across runs', async () => {
    const summary = await analyzeTrends(sampleHistory);
    assert.equal(summary.runCount, 5);
    assert.ok(summary.topFailingTests.length >= 1);
    assert.equal(
      summary.topFailingTests[0]?.fullTitle,
      'checkout-flow.spec.ts › P1-M7-04: required field validation',
    );
    assert.equal(summary.topFailingTests[0]?.count, 3);
  });

  it('P7-M2-02: reports flaky hotspots and category totals', async () => {
    const summary = await analyzeTrends(sampleHistory);
    assert.equal(summary.totals.flaky, 2);
    assert.equal(summary.flakyHotspots[0]?.count, 2);
    assert.equal(summary.categoryTotals.timeout, 2);
    assert.equal(summary.categoryTotals.assertion, 1);

    const markdown = generateTrendsMarkdown(summary);
    assert.match(markdown, /Top failing tests/);
    assert.match(markdown, /Flaky hotspots/);
    assert.match(markdown, /P1-M7-01: happy path fills form/);
  });

  it('P7-M2-03: empty history yields a clear empty report', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'failure-trends-'));
    const missingHistory = path.join(tempDir, 'missing.jsonl');

    try {
      const summary = await analyzeTrends(missingHistory);
      assert.equal(summary.runCount, 0);
      const markdown = generateTrendsMarkdown(summary);
      assert.match(markdown, /Empty history/);
      assert.match(markdown, /analyze:trends -- --record/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips malformed JSONL lines with warnings', async () => {
    const { runs, warnings } = await loadHistory(malformedHistory);
    assert.equal(runs.length, 2);
    assert.ok(warnings.some((warning) => warning.includes('malformed')));
    assert.ok(warnings.length >= 2);
  });

  it('skips records with non-numeric stats or categories', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'failure-trends-'));
    const historyPath = path.join(tempDir, 'bad-shapes.jsonl');

    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(
        historyPath,
        `${JSON.stringify({
          recordedAt: '2026-08-01T10:00:00.000Z',
          sourcePath: '/x',
          suite: null,
          stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0 },
          failures: [],
          flaky: [],
          categories: { assertion: 'x', timeout: 0, locator: 0, network: 0, auth: 0, unknown: 0 },
        })}\n`,
        'utf8',
      );

      const { runs, warnings } = await loadHistory(historyPath);
      assert.equal(runs.length, 0);
      assert.ok(warnings.some((warning) => /missing required fields/.test(warning)));

      const summary = await analyzeTrends(historyPath);
      assert.equal(summary.totals.expected, 0);
      assert.ok(!Number.isNaN(summary.totals.expected));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
