import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeTrends } from './history.mts';
import { recordRunFromReport } from './record.mts';
import { generateTrendsHtml, generateTrendsMarkdown, defaultTrendsOutPath } from './report.mts';
import { readOptionValue } from '../shared/cliArgs.mts';
import { FORMAT_ERROR, OUT_WITH_BOTH_ERROR, formatsToWrite, parseReportFormat, type ReportFormat } from '../shared/reportFormat.mts';
import {
  DEFAULT_HISTORY_PATH,
  DEFAULT_JSON_REPORT,
  DEFAULT_TRENDS_OUT,
} from './types.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run analyze:trends -- --record [playwright-results.json] [--history <runs.jsonl>] [--suite <label>]
  npm run analyze:trends -- [--history <runs.jsonl>] [--format md|html|both] [--out <file>]

Record a Playwright JSON suite run into append-only JSONL history, or generate a trend report.
--format md (default) writes Markdown and prints it; html writes a styled page; both writes the two.

Defaults:
  JSON report: ${DEFAULT_JSON_REPORT}
  History:     ${DEFAULT_HISTORY_PATH}
  Report out:  ${DEFAULT_TRENDS_OUT}

Examples:
  npm run analyze:trends -- --record
  npm run analyze:trends -- --record ai/flaky-detector/fixtures/hard-fail.json --suite smoke
  npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl
  npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl --format html
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  let recordMode = false;
  let reportPath: string | undefined;
  let historyPath = DEFAULT_HISTORY_PATH;
  let outPath: string | undefined;
  let suite: string | undefined;
  let format: ReportFormat = 'md';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--record') {
      recordMode = true;
      continue;
    }

    if (arg === '--history') {
      const parsed = readOptionValue(args, index, '--history');
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      historyPath = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === '--out') {
      const parsed = readOptionValue(args, index, '--out');
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      outPath = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === '--suite') {
      const parsed = readOptionValue(args, index, '--suite');
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      suite = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === '--format') {
      const parsed = readOptionValue(args, index, '--format');
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      const value = parseReportFormat(parsed.value);
      if (!value) {
        console.error(FORMAT_ERROR(parsed.value));
        return 1;
      }
      format = value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      return 1;
    }

    if (reportPath) {
      console.error('Only one JSON report path is supported.');
      printUsage();
      return 1;
    }

    reportPath = arg;
  }

  try {
    if (recordMode) {
      const jsonPath = reportPath ?? DEFAULT_JSON_REPORT;
      const { historyPath: writtenHistory, record } = await recordRunFromReport(jsonPath, historyPath, {
        suite: suite ?? null,
      });
      console.error(`Appended run to ${writtenHistory}`);
      console.error(
        `Recorded: unexpected=${record.stats.unexpected}, flaky=${record.stats.flaky}, expected=${record.stats.expected}`,
      );
      process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
      return 0;
    }

    if (reportPath) {
      console.error('JSON report path is only valid with --record. Use --history for reports.');
      printUsage();
      return 1;
    }

    if (format === 'both' && outPath) {
      console.error(OUT_WITH_BOTH_ERROR);
      return 1;
    }

    const summary = await analyzeTrends(historyPath);
    for (const current of formatsToWrite(format)) {
      const content = current === 'md' ? generateTrendsMarkdown(summary) : generateTrendsHtml(summary);
      const absoluteOut = path.resolve(outPath ?? defaultTrendsOutPath(current));
      await mkdir(path.dirname(absoluteOut), { recursive: true });
      await writeFile(absoluteOut, content, 'utf8');
      console.error(`Wrote trend report to ${absoluteOut}`);
    }

    console.error(`Runs=${summary.runCount}, unexpected=${summary.totals.unexpected}, flaky=${summary.totals.flaky}`);
    if (format === 'md') {
      process.stdout.write(generateTrendsMarkdown(summary));
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze trends: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
