import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateRunSummaryHtml, generateRunSummaryMarkdown, defaultSummaryOutPath } from './report.mts';
import { summarizeRuns } from './summarize.mts';
import type { SuiteSummaryInput } from './types.mts';
import { readOptionValue } from '../shared/cliArgs.mts';
import { FORMAT_ERROR, OUT_WITH_BOTH_ERROR, formatsToWrite, parseReportFormat, type ReportFormat } from '../shared/reportFormat.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run analyze:summary -- --suite <name> <playwright-results.json> [--suite <name> <json>]... [--format md|html|both] [--out <file>] [--title <text>]

Build a Markdown run summary (PR-comment friendly) from one or more Playwright JSON reports.
Reuses the flaky detector and failure classifier.
--format md (default) writes Markdown and prints it; html writes a styled page; both writes the two.
Exits with code 2 when a suite has hard failures, so CI can fail the job.

Examples:
  npm run analyze:summary -- --suite smoke ai/flaky-detector/fixtures/hard-fail.json
  npm run analyze:summary -- \\
    --suite smoke ai/flaky-detector/fixtures/hard-fail.json \\
    --suite e2e ai/flaky-detector/fixtures/flaky-then-pass.json \\
    --out ai-reports/run-summary.md
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printUsage();
    return args.length === 0 ? 1 : 0;
  }

  const inputs: SuiteSummaryInput[] = [];
  let outPath: string | undefined;
  let title: string | undefined;
  let format: ReportFormat = 'md';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--suite') {
      const suite = args[index + 1];
      const reportPath = args[index + 2];
      if (!suite || !reportPath || suite.startsWith('-') || reportPath.startsWith('-')) {
        console.error('Expected: --suite <name> <playwright-results.json>');
        return 1;
      }
      inputs.push({ suite, reportPath });
      index += 2;
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

    if (arg === '--title') {
      const parsed = readOptionValue(args, index, '--title');
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      title = parsed.value;
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

    console.error(`Unexpected argument: ${arg} (suite reports must use --suite <name> <json>)`);
    printUsage();
    return 1;
  }

  if (inputs.length === 0) {
    console.error('Provide at least one --suite <name> <json> pair.');
    printUsage();
    return 1;
  }

  try {
    if (format === 'both' && outPath) {
      console.error(OUT_WITH_BOTH_ERROR);
      return 1;
    }

    const report = await summarizeRuns(inputs, { title });
    for (const current of formatsToWrite(format)) {
      const content = current === 'md' ? generateRunSummaryMarkdown(report) : generateRunSummaryHtml(report);
      const absoluteOut = path.resolve(outPath ?? defaultSummaryOutPath(current));
      await mkdir(path.dirname(absoluteOut), { recursive: true });
      await writeFile(absoluteOut, content, 'utf8');
      console.error(`Wrote run summary to ${absoluteOut}`);
    }

    console.error(
      `Overall=${report.overallStatus} unexpected=${report.totals.unexpected} flaky=${report.totals.flaky}`,
    );
    if (format === 'md') {
      process.stdout.write(generateRunSummaryMarkdown(report));
    }
    return report.overallStatus === 'failed' ? 2 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to build run summary: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
