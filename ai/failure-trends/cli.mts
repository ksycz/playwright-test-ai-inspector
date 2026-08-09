import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeTrends } from './history.mts';
import { recordRunFromReport } from './record.mts';
import { generateTrendsMarkdown, defaultTrendsOutPath } from './report.mts';
import {
  DEFAULT_HISTORY_PATH,
  DEFAULT_JSON_REPORT,
  DEFAULT_TRENDS_OUT,
} from './types.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run analyze:trends -- --record [playwright-results.json] [--history <runs.jsonl>] [--suite <label>]
  npm run analyze:trends -- [--history <runs.jsonl>] [--out <trends.md>]

Record a Playwright JSON suite run into append-only JSONL history, or generate a Markdown trend report.

Defaults:
  JSON report: ${DEFAULT_JSON_REPORT}
  History:     ${DEFAULT_HISTORY_PATH}
  Report out:  ${DEFAULT_TRENDS_OUT}

Examples:
  npm run analyze:trends -- --record
  npm run analyze:trends -- --record ai/flaky-detector/fixtures/hard-fail.json --suite smoke
  npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl
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

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--record') {
      recordMode = true;
      continue;
    }

    if (arg === '--history') {
      historyPath = args[index + 1] ?? '';
      if (!historyPath) {
        console.error('Missing value for --history');
        return 1;
      }
      index += 1;
      continue;
    }

    if (arg === '--out') {
      outPath = args[index + 1];
      if (!outPath) {
        console.error('Missing value for --out');
        return 1;
      }
      index += 1;
      continue;
    }

    if (arg === '--suite') {
      suite = args[index + 1];
      if (!suite) {
        console.error('Missing value for --suite');
        return 1;
      }
      index += 1;
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

    const summary = await analyzeTrends(historyPath);
    const markdown = generateTrendsMarkdown(summary);
    const absoluteOut = path.resolve(outPath ?? defaultTrendsOutPath());
    await mkdir(path.dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, markdown, 'utf8');

    console.error(`Wrote trend report to ${absoluteOut}`);
    console.error(`Runs=${summary.runCount}, unexpected=${summary.totals.unexpected}, flaky=${summary.totals.flaky}`);
    process.stdout.write(markdown);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze trends: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
