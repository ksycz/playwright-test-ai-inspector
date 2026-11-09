import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { analyzeTrends } from './history.mts';
import { generateTrendsHtml } from './report.mts';
import type { TrendSummary } from './types.mts';
import { EMPTY_CATEGORY_COUNTS } from './types.mts';

describe('P7 trends HTML report', () => {
  it('P7-HTML-01: sample history shows totals, runs, top failing tests and hotspots', async () => {
    const summary = await analyzeTrends(path.resolve('ai/failure-trends/fixtures/sample-history.jsonl'));
    const html = generateTrendsHtml(summary);

    assert.match(html, /data-testid="trends-report"/);
    assert.match(html, /Runs over time/);
    assert.match(html, /P1-M7-04: required field validation/);
    assert.match(html, /P1-M7-01: happy path fills form/);
    assert.match(html, /timeout/);
    assert.equal((html.match(/class="run-row"/g) ?? []).length, 5);
  });

  it('P7-HTML-02: empty history explains how to record a run', () => {
    const summary: TrendSummary = {
      historyPath: 'none.jsonl',
      generatedAt: '2026-11-09T00:00:00.000Z',
      runCount: 0,
      totals: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
      categoryTotals: EMPTY_CATEGORY_COUNTS(),
      topFailingTests: [],
      flakyHotspots: [],
      runs: [],
      warnings: [],
    };
    const html = generateTrendsHtml(summary);
    assert.match(html, /No run records found/);
    assert.match(html, /analyze:trends -- --record/);
  });

  it('P7-HTML-03: test titles and warnings are escaped', () => {
    const summary: TrendSummary = {
      historyPath: 'h.jsonl',
      generatedAt: '2026-11-09T00:00:00.000Z',
      runCount: 1,
      totals: { expected: 0, unexpected: 1, flaky: 0, skipped: 0 },
      categoryTotals: { ...EMPTY_CATEGORY_COUNTS(), unknown: 1 },
      topFailingTests: [{ fullTitle: '<img src=x onerror=alert(1)>', file: 'x.spec.ts', count: 1 }],
      flakyHotspots: [],
      runs: [],
      warnings: ['<script>alert(1)</script>'],
    };
    const html = generateTrendsHtml(summary);
    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /<script>alert/);
  });
});
