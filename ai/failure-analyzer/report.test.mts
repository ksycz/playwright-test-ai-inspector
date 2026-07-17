import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  escapeHtml,
  generateHtmlReport,
  generateMarkdownReport,
} from './report.mts';
import type { FailureContext } from './types.mts';

function buildContext(overrides: Partial<FailureContext> = {}): FailureContext {
  return {
    sourcePath: '/tmp/test-results/smoke-checkout-flow-chromium',
    collectedAt: '2026-07-17T18:00:00.000Z',
    artifacts: {
      screenshots: ['test-failed-1.png'],
      videos: ['video.webm'],
      traces: ['trace.zip'],
      errorContextPath: 'error-context.md',
      otherFiles: [],
    },
    errorContextText: `Error: expect(page).toHaveURL(expected) failed
Expected: "/order-confirmation"
Received: "/checkout"`,
    classification: {
      category: 'assertion',
      confidence: 0.88,
      matchedSignals: ['assertion:expect assertion mismatch'],
      summary: 'Failure looks like an assertion mismatch (expected vs received).',
    },
    ...overrides,
  };
}

describe('P3-M3 markdown investigation report', () => {
  it('P3-M3-01: includes summary, classification, artifacts, and next steps sections', () => {
    const report = generateMarkdownReport(buildContext());

    assert.match(report, /^# Failure Investigation Report/m);
    assert.match(report, /## Summary/);
    assert.match(report, /## Classification/);
    assert.match(report, /## Artifacts/);
    assert.match(report, /## Suggested next steps/);
    assert.match(report, /`assertion`/);
    assert.match(report, /88%/);
    assert.match(report, /`test-failed-1\.png`/);
    assert.match(report, /`video\.webm`/);
    assert.match(report, /`trace\.zip`/);
    assert.match(report, /Compare Expected vs Received/);
  });

  it('P3-M3-02: suggested steps vary by category', () => {
    const assertionReport = generateMarkdownReport(buildContext());
    const networkReport = generateMarkdownReport(
      buildContext({
        classification: {
          category: 'network',
          confidence: 0.95,
          matchedSignals: ['network:browser connection error'],
          summary: 'Failure looks network-related (connection refused, DNS, or fetch error).',
        },
        errorContextText: 'net::ERR_CONNECTION_REFUSED',
      }),
    );

    assert.match(assertionReport, /Compare Expected vs Received/);
    assert.doesNotMatch(assertionReport, /ECONNREFUSED/);
    assert.match(networkReport, /ECONNREFUSED|baseURL|webServer/);
    assert.doesNotMatch(networkReport, /Compare Expected vs Received/);
  });

  it('P3-M3-03: handles missing artifacts and error text gracefully', () => {
    const report = generateMarkdownReport(
      buildContext({
        artifacts: {
          screenshots: [],
          videos: [],
          traces: [],
          errorContextPath: null,
          otherFiles: [],
        },
        errorContextText: null,
        classification: {
          category: 'unknown',
          confidence: 0.1,
          matchedSignals: [],
          summary: 'Failure category could not be determined from available error text.',
        },
      }),
    );

    assert.match(report, /No error context text available/);
    assert.match(report, /### Screenshots\n\n- None/);
    assert.match(report, /`unknown`/);
  });
});

describe('P3-M3b html investigation report', () => {
  it('P3-M3b-01: includes semantic sections and key summary fields', async () => {
    const report = await generateHtmlReport(buildContext());

    assert.match(report, /<main[^>]*data-testid="failure-report"/);
    assert.match(report, /<h1>Failure Investigation Report<\/h1>/);
    assert.match(report, /id="summary-heading">Summary</);
    assert.match(report, /id="classification-heading">Classification</);
    assert.match(report, /id="artifacts-heading">Artifacts</);
    assert.match(report, /id="steps-heading">Suggested next steps</);
    assert.match(report, /class="badge">assertion</);
    assert.match(report, /88%/);
    assert.match(report, /Compare Expected vs Received/);
  });

  it('P3-M3b-02: suggested steps vary by category', async () => {
    const assertionReport = await generateHtmlReport(buildContext());
    const networkReport = await generateHtmlReport(
      buildContext({
        classification: {
          category: 'network',
          confidence: 0.95,
          matchedSignals: ['network:browser connection error'],
          summary: 'Failure looks network-related (connection refused, DNS, or fetch error).',
        },
        errorContextText: 'net::ERR_CONNECTION_REFUSED',
      }),
    );

    assert.match(assertionReport, /Compare Expected vs Received/);
    assert.doesNotMatch(assertionReport, /ECONNREFUSED/);
    assert.match(networkReport, /ECONNREFUSED|baseURL|webServer/);
    assert.doesNotMatch(networkReport, /Compare Expected vs Received/);
  });

  it('P3-M3b-03: handles missing artifacts and error text gracefully', async () => {
    const report = await generateHtmlReport(
      buildContext({
        artifacts: {
          screenshots: [],
          videos: [],
          traces: [],
          errorContextPath: null,
          otherFiles: [],
        },
        errorContextText: null,
        classification: {
          category: 'unknown',
          confidence: 0.1,
          matchedSignals: [],
          summary: 'Failure category could not be determined from available error text.',
        },
      }),
    );

    assert.match(report, /No error context text available/);
    assert.match(report, /Screenshots[\s\S]*None/);
    assert.match(report, /class="badge">unknown</);
  });

  it('P3-M3b-04: escapes HTML special characters in error excerpts', async () => {
    const report = await generateHtmlReport(
      buildContext({
        errorContextText: 'Expected <button> & got <div class="x">',
        classification: {
          category: 'assertion',
          confidence: 0.9,
          matchedSignals: ['assertion:expect'],
          summary: 'Summary with <script>alert(1)</script>',
        },
      }),
    );

    assert.match(report, /&lt;button&gt;/);
    assert.match(report, /&amp; got/);
    assert.match(report, /&lt;div class=&quot;x&quot;&gt;/);
    assert.doesNotMatch(report, /<script>alert\(1\)<\/script>/);
    assert.match(report, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.equal(escapeHtml('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;');
  });

  it('P3-M3b-05: prefers Error section and strips markdown heading markers', async () => {
    const report = await generateHtmlReport(
      buildContext({
        errorContextText: `# Sample Playwright error context

## Page snapshot

- heading "Checkout"

## Error

Error: expect(page).toHaveURL(expected) failed
Expected: "/order-confirmation"
Received: "/checkout"
`,
      }),
    );

    assert.match(report, /Error: expect\(page\)\.toHaveURL/);
    assert.doesNotMatch(report, /# Sample Playwright/);
    assert.doesNotMatch(report, /## Error/);
    assert.doesNotMatch(report, /Page snapshot/);
  });

  it('P3-M3b-06: embeds screenshots as inline images when files exist', async () => {
    const fixtureRoot = path.resolve('ai/failure-analyzer/fixtures/sample-failure');
    const report = await generateHtmlReport(
      buildContext({
        sourcePath: fixtureRoot,
        artifacts: {
          screenshots: ['test-failed-1.png'],
          videos: [],
          traces: [],
          errorContextPath: 'error-context.md',
          otherFiles: [],
        },
      }),
    );

    assert.match(report, /<figure class="screenshot">/);
    assert.match(report, /<img src="data:image\/png;base64,/);
    assert.match(report, /alt="Failure screenshot: test-failed-1\.png"/);
  });

  it('P3-M3b-07: notes missing screenshot files without breaking the report', async () => {
    const report = await generateHtmlReport(
      buildContext({
        sourcePath: '/tmp/does-not-exist-failure',
        artifacts: {
          screenshots: ['missing.png'],
          videos: [],
          traces: [],
          errorContextPath: null,
          otherFiles: [],
        },
      }),
    );

    assert.match(report, /figure class="screenshot missing"/);
    assert.match(report, /could not be read/);
    assert.doesNotMatch(report, /data:image\/png;base64,/);
  });
});
