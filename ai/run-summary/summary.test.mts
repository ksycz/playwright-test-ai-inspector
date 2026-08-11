import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateRunSummaryMarkdown } from './report.mts';
import { summarizeRuns } from './summarize.mts';

const here = path.dirname(fileURLToPath(import.meta.url));
const hardFail = path.join(here, '../flaky-detector/fixtures/hard-fail.json');
const flaky = path.join(here, '../flaky-detector/fixtures/flaky-then-pass.json');
const allPass = path.join(here, '../flaky-detector/fixtures/all-pass.json');

describe('run-summary', () => {
  it('P8-M1-01: summarizes hard failures with classifier categories', async () => {
    const report = await summarizeRuns([{ suite: 'smoke', reportPath: hardFail }]);
    assert.equal(report.overallStatus, 'failed');
    assert.equal(report.suites[0]?.status, 'failed');
    assert.equal(report.suites[0]?.hardFailures[0]?.category, 'timeout');
    assert.match(generateRunSummaryMarkdown(report), /Hard failures/);
    assert.match(generateRunSummaryMarkdown(report), /timeout/);
  });

  it('P8-M1-02: merges multiple suites and surfaces flaky status', async () => {
    const report = await summarizeRuns([
      { suite: 'api', reportPath: allPass },
      { suite: 'e2e', reportPath: flaky },
    ]);
    assert.equal(report.suites.length, 2);
    assert.equal(report.overallStatus, 'flaky');
    assert.equal(report.totals.flaky, 1);
    assert.equal(report.totals.unexpected, 0);

    const markdown = generateRunSummaryMarkdown(report);
    assert.match(markdown, /`api`/);
    assert.match(markdown, /`e2e`/);
    assert.match(markdown, /Flaky tests/);
  });

  it('P8-M1-03: all-pass suite reports passed overall', async () => {
    const report = await summarizeRuns([{ suite: 'smoke', reportPath: allPass }], {
      title: 'CI summary',
    });
    assert.equal(report.overallStatus, 'passed');
    assert.equal(report.title, 'CI summary');
    assert.match(generateRunSummaryMarkdown(report), /\*\*Overall:\*\* `passed`/);
  });

  it('P8-M1-04: empty input list yields empty overall status', async () => {
    const report = await summarizeRuns([]);
    assert.equal(report.overallStatus, 'empty');
    assert.match(generateRunSummaryMarkdown(report), /No suite reports/);
  });

  it('P8-M1-05: desynced Playwright stats still mark suite failed', async () => {
    const desync = path.join(here, '../flaky-detector/fixtures/stats-desync.json');
    const report = await summarizeRuns([{ suite: 'smoke', reportPath: desync }]);
    assert.equal(report.overallStatus, 'failed');
    assert.equal(report.suites[0]?.status, 'failed');
    assert.equal(report.suites[0]?.hardFailures.length, 1);
    assert.equal(report.totals.unexpected, 1);
  });
});
