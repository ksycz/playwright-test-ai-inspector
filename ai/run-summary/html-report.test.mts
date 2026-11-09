import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { generateRunSummaryHtml } from './report.mts';
import { summarizeRuns } from './summarize.mts';
import type { RunSummaryReport } from './types.mts';

const fixtures = path.resolve('ai/flaky-detector/fixtures');

describe('P8 run summary HTML report', () => {
  it('P8-HTML-01: two suites show overall status, a hard failure and a flaky test', async () => {
    const report = await summarizeRuns([
      { suite: 'smoke', reportPath: path.join(fixtures, 'hard-fail.json') },
      { suite: 'e2e', reportPath: path.join(fixtures, 'flaky-then-pass.json') },
    ]);
    const html = generateRunSummaryHtml(report);

    assert.match(html, /data-testid="run-summary-report"/);
    assert.match(html, /class="overall status-failed"/);
    assert.match(html, /smoke/);
    assert.match(html, /P1-M7-04: required field validation/);
    assert.match(html, /P1-M7-01: happy path fills form/);
    assert.match(html, /Timeout 5000ms exceeded/);
  });

  it('P8-HTML-02: suite names, titles and errors are escaped', () => {
    const report: RunSummaryReport = {
      generatedAt: '2026-11-09T00:00:00.000Z',
      title: '<b>t</b>',
      totals: { expected: 0, unexpected: 1, flaky: 0, skipped: 0 },
      overallStatus: 'failed',
      suites: [
        {
          suite: '<img src=x>',
          sourcePath: 's.json',
          analyzedAt: '2026-11-09T00:00:00.000Z',
          stats: { expected: 0, unexpected: 1, flaky: 0, skipped: 0 },
          hardFailures: [{ fullTitle: '<script>a</script>', file: 'f', lastError: '<i>e</i>', category: 'unknown' }],
          flakyTests: [],
          status: 'failed',
        },
      ],
    };
    const html = generateRunSummaryHtml(report);
    assert.doesNotMatch(html, /<img src=x>|<script>a|<i>e<\/i>|<b>t<\/b>/);
  });
});
