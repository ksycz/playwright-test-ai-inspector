import path from 'node:path';
import { escapeHtml, htmlPage, section, statTiles } from '../shared/html.mts';
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

export function generateFlakyHtmlReport(analysis: FlakyAnalysis): string {
  const { stats } = analysis;
  const body = [
    section(
      'summary',
      'Summary',
      statTiles([
        { label: 'Flaky', value: stats.flaky, tone: stats.flaky > 0 ? 'warn' : 'neutral' },
        { label: 'Hard failures', value: stats.unexpected, tone: stats.unexpected > 0 ? 'bad' : 'neutral' },
        { label: 'Stable passes', value: stats.expected, tone: 'good' },
        { label: 'Skipped', value: stats.skipped },
      ]),
    ),
    section('flaky', 'Flaky tests', htmlSection(analysis.flakyTests, 'No flaky tests detected.')),
    section('hard', 'Hard failures', htmlSection(analysis.unexpectedTests, 'No hard failures detected.')),
    section(
      'notes',
      'Notes',
      `<ul>
        <li>Flaky = failed on an earlier attempt, then passed on retry (<code>status: flaky</code> in Playwright JSON).</li>
        <li>Hard fail = failed on all attempts (<code>status: unexpected</code>).</li>
      </ul>`,
    ),
  ].join('\n\n    ');

  return htmlPage({
    title: `Flaky Test Analysis — ${path.basename(analysis.sourcePath)}`,
    testId: 'flaky-report',
    heading: 'Flaky Test Analysis',
    lede: `Tests that failed and then passed on retry, versus tests that failed every attempt. Source ${analysis.sourcePath}, analyzed ${analysis.analyzedAt}.`,
    body,
  });
}
