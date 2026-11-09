import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { analyzeFlakyReport } from './analyze.mts';
import { defaultFlakyReportPath, generateFlakyHtmlReport } from './report.mts';
import type { FlakyAnalysis } from './types.mts';

const fixturesDir = path.resolve('ai/flaky-detector/fixtures');

describe('P4-M2 flaky HTML report', () => {
  it('P4-M2-07: flaky test shows each attempt with status and duration', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'flaky-then-pass.json'));
    const html = generateFlakyHtmlReport(analysis);

    assert.match(html, /^<!DOCTYPE html>/);
    assert.match(html, /data-testid="flaky-report"/);
    assert.match(html, /P1-M7-01/);
    assert.match(html, /retry 0[\s\S]*failed[\s\S]*1200 ms/);
    assert.match(html, /retry 1[\s\S]*passed[\s\S]*900 ms/);
    assert.match(html, /No hard failures detected/);
  });

  it('P4-M2-08: all-pass report says nothing is flaky', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'all-pass.json'));
    const html = generateFlakyHtmlReport(analysis);

    assert.match(html, /No flaky tests detected/);
    assert.match(html, /No hard failures detected/);
  });

  it('P4-M2-09: test titles and error text are escaped, not rendered as HTML', () => {
    const analysis: FlakyAnalysis = {
      sourcePath: 'report.json',
      analyzedAt: '2026-11-09T00:00:00.000Z',
      stats: { expected: 0, unexpected: 1, flaky: 0, skipped: 0 },
      flakyTests: [],
      unexpectedTests: [
        {
          title: '<img src=x onerror=alert(1)>',
          fullTitle: 'spec › <img src=x onerror=alert(1)>',
          file: 'tests/x.spec.ts',
          projectName: 'chromium',
          verdict: 'unexpected',
          attempts: [{ retry: 0, status: 'failed', durationMs: 5, errorMessage: '<script>alert(1)</script>' }],
        },
      ],
    };
    const html = generateFlakyHtmlReport(analysis);

    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });

  it('P4-M2-10: default HTML path sits next to the Markdown one', async () => {
    const analysis = await analyzeFlakyReport(path.join(fixturesDir, 'flaky-then-pass.json'));
    assert.equal(defaultFlakyReportPath(analysis, 'ai-reports', 'html'), path.join('ai-reports', 'flaky-then-pass-flaky.html'));
    assert.equal(defaultFlakyReportPath(analysis), path.join('ai-reports', 'flaky-then-pass-flaky.md'));
  });
});
