import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { analyzeFlakyReport } from './analyze.mts';
import { generateFlakyMarkdownReport } from './report.mts';

const fixturesDir = path.resolve('ai/flaky-detector/fixtures');

describe('P4-M2 flaky test detection', () => {
  it('P4-M2-01: fixture with retry-then-pass is reported as flaky', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'flaky-then-pass.json'));

    assert.equal(analysis.stats.flaky, 1);
    assert.equal(analysis.flakyTests.length, 1);
    assert.equal(analysis.unexpectedTests.length, 0);
    assert.match(analysis.flakyTests[0]!.fullTitle, /P1-M7-01/);
    assert.equal(analysis.flakyTests[0]!.attempts[0]!.status, 'failed');
    assert.equal(analysis.flakyTests[0]!.attempts[1]!.status, 'passed');

    const markdown = generateFlakyMarkdownReport(analysis);
    assert.match(markdown, /## Flaky tests/);
    assert.match(markdown, /P1-M7-01/);
    assert.doesNotMatch(markdown, /No flaky tests detected/);
  });

  it('P4-M2-02: always-failing test is not classified as flaky', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'hard-fail.json'));

    assert.equal(analysis.stats.flaky, 0);
    assert.equal(analysis.flakyTests.length, 0);
    assert.equal(analysis.unexpectedTests.length, 1);
    assert.equal(analysis.unexpectedTests[0]!.verdict, 'unexpected');

    const markdown = generateFlakyMarkdownReport(analysis);
    assert.match(markdown, /## Hard failures/);
    assert.match(markdown, /P1-M7-04/);
  });

  it('P4-M2-03: missing report path exits with a clear error', async () => {
    await assert.rejects(
      () => analyzeFlakyReport(path.join(fixturesDir, 'does-not-exist.json')),
      /ENOENT|no such file|Failed to parse|expects a JSON report/i,
    );
  });

  it('P4-M2-04: all-pass report has empty flaky and unexpected lists', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'all-pass.json'));

    assert.equal(analysis.stats.expected, 1);
    assert.equal(analysis.flakyTests.length, 0);
    assert.equal(analysis.unexpectedTests.length, 0);

    const markdown = generateFlakyMarkdownReport(analysis);
    assert.match(markdown, /No flaky tests detected/);
    assert.match(markdown, /No hard failures detected/);
  });
});
