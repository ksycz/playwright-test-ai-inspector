import { code, dataTable, displayPath, escapeHtml, htmlPage, muted, section, statTiles } from '../shared/html.mts';
import type { TrendSummary } from './types.mts';

function formatCategoryRow(summary: TrendSummary): string {
  const c = summary.categoryTotals;
  return [
    `| assertion | ${c.assertion} |`,
    `| timeout | ${c.timeout} |`,
    `| locator | ${c.locator} |`,
    `| network | ${c.network} |`,
    `| auth | ${c.auth} |`,
    `| unknown | ${c.unknown} |`,
  ].join('\n');
}

export function generateTrendsMarkdown(summary: TrendSummary): string {
  const lines: string[] = [
    '# Historical Failure Trends',
    '',
    `Generated: ${summary.generatedAt}`,
    `History: \`${summary.historyPath}\``,
    `Runs analyzed: **${summary.runCount}**`,
    '',
  ];

  if (summary.warnings.length > 0) {
    lines.push('## Warnings', '');
    for (const warning of summary.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  if (summary.runCount === 0) {
    lines.push(
      '## Empty history',
      '',
      'No run records found. Record a suite first:',
      '',
      '```bash',
      'npm run analyze:trends -- --record',
      '```',
      '',
      'Or point at a fixture history file:',
      '',
      '```bash',
      'npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl',
      '```',
      '',
    );
    return `${lines.join('\n')}\n`;
  }

  lines.push(
    '## Summary totals',
    '',
    '| Metric | Count |',
    '|---|---|',
    `| expected (passes) | ${summary.totals.expected} |`,
    `| unexpected (hard fails) | ${summary.totals.unexpected} |`,
    `| flaky | ${summary.totals.flaky} |`,
    `| skipped | ${summary.totals.skipped} |`,
    '',
    '## Failure categories (from hard-fail error text)',
    '',
    '| Category | Count |',
    '|---|---|',
    formatCategoryRow(summary),
    '',
    '## Runs over time',
    '',
    '| When | Suite | Expected | Unexpected | Flaky | Skipped |',
    '|---|---|---|---|---|---|',
  );

  for (const run of summary.runs) {
    lines.push(
      `| ${run.recordedAt} | ${run.suite ?? '—'} | ${run.stats.expected} | ${run.stats.unexpected} | ${run.stats.flaky} | ${run.stats.skipped} |`,
    );
  }

  lines.push('', '## Top failing tests', '');
  if (summary.topFailingTests.length === 0) {
    lines.push('_No hard failures recorded across these runs._', '');
  } else {
    lines.push('| Test | File | Appearances |', '|---|---|---|');
    for (const entry of summary.topFailingTests) {
      lines.push(`| ${entry.fullTitle} | \`${entry.file}\` | ${entry.count} |`);
    }
    lines.push('');
  }

  lines.push('## Flaky hotspots', '');
  if (summary.flakyHotspots.length === 0) {
    lines.push('_No flaky outcomes recorded across these runs._', '');
  } else {
    lines.push('| Test | Appearances |', '|---|---|');
    for (const entry of summary.flakyHotspots) {
      lines.push(`| ${entry.fullTitle} | ${entry.count} |`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

export function defaultTrendsOutPath(format: 'md' | 'html' = 'md'): string {
  return `ai-reports/trends.${format}`;
}

function bar(count: number, max: number, tone: 'bad' | 'warn' | 'accent'): string {
  if (count === 0 || max === 0) return '';
  const width = Math.max(4, Math.round((count / max) * 160));
  return `<span class="bar ${tone}" style="width:${width}px"></span>`;
}

export function generateTrendsHtml(summary: TrendSummary): string {
  const parts: string[] = [];

  if (summary.warnings.length > 0) {
    parts.push(
      section('warnings', 'Warnings', `<ul>${summary.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>`),
    );
  }

  if (summary.runCount === 0) {
    parts.push(
      section(
        'empty',
        'Empty history',
        `${muted('No run records found. Record a suite first, or point at the fixture history:')}
      <pre><code>npm run analyze:trends -- --record
npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl</code></pre>`,
      ),
    );
  } else {
    const { totals, categoryTotals } = summary;
    parts.push(
      section(
        'summary',
        'Summary',
        statTiles([
          { label: 'Runs', value: summary.runCount },
          { label: 'Hard failures', value: totals.unexpected, tone: totals.unexpected > 0 ? 'bad' : 'neutral' },
          { label: 'Flaky', value: totals.flaky, tone: totals.flaky > 0 ? 'warn' : 'neutral' },
          { label: 'Passes', value: totals.expected, tone: 'good' },
        ]),
      ),
    );

    const categories = Object.entries(categoryTotals) as Array<[string, number]>;
    const maxCategory = Math.max(...categories.map(([, count]) => count));
    parts.push(
      section(
        'categories',
        'Hard failures by cause',
        dataTable(
          ['Cause', 'Count', ''],
          categories.map(([name, count]) => [name, count, { html: bar(count, maxCategory, 'accent') }]),
        ),
      ),
    );

    const maxProblems = Math.max(...summary.runs.map((run) => run.stats.unexpected + run.stats.flaky));
    parts.push(
      section(
        'runs',
        'Runs over time',
        `${muted('Red: hard failures. Orange: flaky. One red run is noise; the same test failing again is a pattern.')}
      ${dataTable(
        ['When', 'Suite', 'Passed', 'Hard fail', 'Flaky', 'Skipped', ''],
        summary.runs.map((run) => [
          run.recordedAt,
          run.suite ?? '—',
          run.stats.expected,
          { html: run.stats.unexpected > 0 ? `<span class="bad">${run.stats.unexpected}</span>` : '0' },
          { html: run.stats.flaky > 0 ? `<span class="warn">${run.stats.flaky}</span>` : '0' },
          run.stats.skipped,
          { html: bar(run.stats.unexpected, maxProblems, 'bad') + bar(run.stats.flaky, maxProblems, 'warn') },
        ]),
        'run-row',
      )}`,
      ),
    );

    parts.push(
      section(
        'top-failing',
        'Top failing tests',
        summary.topFailingTests.length === 0
          ? muted('No hard failures recorded across these runs.')
          : dataTable(
              ['Test', 'File', 'Runs failed'],
              summary.topFailingTests.map((entry) => [entry.fullTitle, { html: code(entry.file) }, entry.count]),
            ),
      ),
    );

    parts.push(
      section(
        'hotspots',
        'Flaky hotspots',
        summary.flakyHotspots.length === 0
          ? muted('No flaky outcomes recorded across these runs.')
          : dataTable(
              ['Test', 'Runs flaky'],
              summary.flakyHotspots.map((entry) => [entry.fullTitle, entry.count]),
            ),
      ),
    );
  }

  return htmlPage({
    title: 'Historical Failure Trends',
    testId: 'trends-report',
    heading: 'Historical Failure Trends',
    lede: `${summary.runCount} run(s) from ${displayPath(summary.historyPath)}, generated ${summary.generatedAt}.`,
    body: parts.join('\n\n    '),
  });
}
