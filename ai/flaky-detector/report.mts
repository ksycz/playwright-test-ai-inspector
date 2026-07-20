import path from 'node:path';
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

export function defaultFlakyReportPath(analysis: FlakyAnalysis, reportsDir = 'ai-reports'): string {
  const base = path.basename(analysis.sourcePath, path.extname(analysis.sourcePath));
  return path.join(reportsDir, `${base}-flaky.md`);
}
