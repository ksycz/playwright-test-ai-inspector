import path from 'node:path';
import { escapeHtml } from '../failure-analyzer/report.mts';
import type { FlakyAnalysis, TestOutcome } from './types.mts';

function formatAttempts(test: TestOutcome): string {
  if (test.attempts.length === 0) {
    return '- No attempts recorded';
  }

  return test.attempts
    .map((attempt) => {
      const error = attempt.errorMessage ? ` — ${attempt.errorMessage}` : '';
      return `- retry ${attempt.retry}: \`${attempt.status}\` (${attempt.durationMs}ms)${error}`;
    })
    .join('\n');
}

function formatTestBlock(test: TestOutcome): string {
  return `### ${test.fullTitle}

- **File:** \`${test.file}\`
- **Project:** \`${test.projectName}\`
- **Verdict:** \`${test.verdict}\`

${formatAttempts(test)}
`;
}

export function generateFlakyMarkdownReport(analysis: FlakyAnalysis): string {
  const flakySection =
    analysis.flakyTests.length > 0
      ? analysis.flakyTests.map(formatTestBlock).join('\n')
      : '_No flaky tests detected._\n';

  const unexpectedSection =
    analysis.unexpectedTests.length > 0
      ? analysis.unexpectedTests.map(formatTestBlock).join('\n')
      : '_No hard failures detected._\n';

  return `# Flaky Test Analysis

## Summary

- **Source report:** \`${analysis.sourcePath}\`
- **Analyzed at:** ${analysis.analyzedAt}
- **Expected (stable pass):** ${analysis.stats.expected}
- **Flaky (failed then passed):** ${analysis.stats.flaky}
- **Unexpected (hard fail):** ${analysis.stats.unexpected}
- **Skipped:** ${analysis.stats.skipped}

## Flaky tests

${flakySection}
## Hard failures

${unexpectedSection}
## Notes

- Flaky = failed on an earlier attempt, then passed on retry (\`status: flaky\` in Playwright JSON).
- Hard fail = failed on all attempts (\`status: unexpected\`).
- Generate a report with the JSON reporter, then re-run: \`npm run analyze:flaky\`.
`;
}

export function defaultFlakyReportPath(
  analysis: FlakyAnalysis,
  reportsDir = 'ai-reports',
  format: 'md' | 'html' = 'md',
): string {
  const base = path.basename(analysis.sourcePath, path.extname(analysis.sourcePath));
  return path.join(reportsDir, `${base}-flaky.${format}`);
}

function htmlAttempts(test: TestOutcome): string {
  if (test.attempts.length === 0) {
    return '<p class="muted">No attempts recorded.</p>';
  }
  const rows = test.attempts
    .map(
      (attempt) => `<tr>
          <td>retry ${attempt.retry}</td>
          <td><span class="status status-${attempt.status === 'passed' ? 'pass' : 'fail'}">${escapeHtml(attempt.status)}</span></td>
          <td>${attempt.durationMs} ms</td>
          <td>${attempt.errorMessage ? `<code>${escapeHtml(attempt.errorMessage)}</code>` : ''}</td>
        </tr>`,
    )
    .join('\n        ');
  return `<table>
        <thead><tr><th>Attempt</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
        <tbody>
        ${rows}
        </tbody>
      </table>`;
}

function htmlTestBlock(test: TestOutcome): string {
  return `<article class="panel test">
      <h3>${escapeHtml(test.fullTitle)}</h3>
      <p class="meta"><code>${escapeHtml(test.file)}</code> · project <code>${escapeHtml(test.projectName)}</code> · verdict <span class="badge">${escapeHtml(test.verdict)}</span></p>
      ${htmlAttempts(test)}
    </article>`;
}

function htmlSection(tests: TestOutcome[], emptyText: string): string {
  return tests.length > 0 ? tests.map(htmlTestBlock).join('\n    ') : `<p class="muted">${emptyText}</p>`;
}

const STYLES = `
    :root { --bg: #eef3f5; --ink: #15202b; --muted: #4d5d68; --line: #b8c5ce; --panel: #f7fafb;
      --accent: #0b6e63; --accent-soft: #cfe8e3; --code-bg: #e3ebf0; --pass: #1d7a3e; --fail: #b3261e; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: var(--bg); line-height: 1.55;
      font-family: "Source Sans 3", "Avenir Next", "Segoe UI", sans-serif; }
    main { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem 3.5rem; }
    h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    .lede { color: var(--muted); margin: 0 0 1.75rem; }
    h2 { font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent);
      margin: 2rem 0 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--line); }
    h3 { font-size: 1rem; margin: 0 0 0.35rem; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 2px; padding: 1rem 1.1rem; margin: 0 0 0.9rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; }
    .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 2px; padding: 0.75rem 0.9rem; }
    .stat .n { font-size: 1.6rem; font-weight: 700; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .stat.flaky .n { color: #a15c00; } .stat.unexpected .n { color: var(--fail); } .stat.expected .n { color: var(--pass); }
    .meta { color: var(--muted); margin: 0 0 0.6rem; }
    .muted { color: var(--muted); }
    .badge { display: inline-block; padding: 0.05rem 0.5rem; background: var(--accent-soft); color: var(--accent); font-weight: 600; border-radius: 2px; }
    .status { font-weight: 700; } .status-pass { color: var(--pass); } .status-fail { color: var(--fail); }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 0.35rem 0.5rem; border-top: 1px solid var(--line); vertical-align: top; }
    th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); border-top: 0; }
    code { font-family: "IBM Plex Mono", "SF Mono", ui-monospace, monospace; font-size: 0.85rem;
      background: var(--code-bg); padding: 0.1rem 0.3rem; border-radius: 2px; word-break: break-word; }
    ul { padding-left: 1.25rem; }
`;

export function generateFlakyHtmlReport(analysis: FlakyAnalysis): string {
  const { stats } = analysis;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Flaky Test Analysis — ${escapeHtml(path.basename(analysis.sourcePath))}</title>
  <style>${STYLES}</style>
</head>
<body>
  <main data-testid="flaky-report">
    <h1>Flaky Test Analysis</h1>
    <p class="lede">Tests that failed and then passed on retry, versus tests that failed every attempt.
      Source <code>${escapeHtml(analysis.sourcePath)}</code>, analyzed ${escapeHtml(analysis.analyzedAt)}.</p>

    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary</h2>
      <div class="stats">
        <div class="stat flaky"><div class="n">${stats.flaky}</div><div class="label">Flaky</div></div>
        <div class="stat unexpected"><div class="n">${stats.unexpected}</div><div class="label">Hard failures</div></div>
        <div class="stat expected"><div class="n">${stats.expected}</div><div class="label">Stable passes</div></div>
        <div class="stat"><div class="n">${stats.skipped}</div><div class="label">Skipped</div></div>
      </div>
    </section>

    <section aria-labelledby="flaky-heading">
      <h2 id="flaky-heading">Flaky tests</h2>
    ${htmlSection(analysis.flakyTests, 'No flaky tests detected.')}
    </section>

    <section aria-labelledby="hard-heading">
      <h2 id="hard-heading">Hard failures</h2>
    ${htmlSection(analysis.unexpectedTests, 'No hard failures detected.')}
    </section>

    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading">Notes</h2>
      <ul>
        <li>Flaky = failed on an earlier attempt, then passed on retry (<code>status: flaky</code> in Playwright JSON).</li>
        <li>Hard fail = failed on all attempts (<code>status: unexpected</code>).</li>
      </ul>
    </section>
  </main>
</body>
</html>
`;
}
