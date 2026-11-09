import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeFlakyReport } from './analyze.mts';
import { defaultFlakyReportPath, generateFlakyHtmlReport, generateFlakyMarkdownReport } from './report.mts';
import { readOptionValue } from '../shared/cliArgs.mts';
import { FORMAT_ERROR, OUT_WITH_BOTH_ERROR, formatsToWrite, parseReportFormat, type ReportFormat } from '../shared/reportFormat.mts';

const DEFAULT_REPORT = 'test-results/playwright-results.json';

function printUsage(): void {
  console.error(`Usage: npm run analyze:flaky -- [playwright-results.json] [--format md|html|both] [--out <file>]

Analyze a Playwright JSON report for flaky tests (failed then passed on retry)
versus hard failures (failed all attempts).

Defaults to ${DEFAULT_REPORT} when no path is given.
--format md (default) writes Markdown and prints it; html writes a styled page;
both writes the two. --out sets the file name (only with a single format).

Examples:
  npm run analyze:flaky
  npm run analyze:flaky -- test-results/playwright-results.json
  npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json --out /tmp/flaky.md
  npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json --format html
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  let sourcePath: string | undefined;
  let outPath: string | undefined;
  let format: ReportFormat = 'md';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
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

    if (sourcePath) {
      console.error('Only one JSON report path is supported.');
      printUsage();
      return 1;
    }

    sourcePath = arg;
  }

  const reportPath = sourcePath ?? DEFAULT_REPORT;

  if (format === 'both' && outPath) {
    console.error(OUT_WITH_BOTH_ERROR);
    return 1;
  }

  try {
    const analysis = await analyzeFlakyReport(reportPath);
    const formats = formatsToWrite(format);

    for (const current of formats) {
      const content = current === 'md' ? generateFlakyMarkdownReport(analysis) : generateFlakyHtmlReport(analysis);
      const absoluteOut = path.resolve(outPath ?? defaultFlakyReportPath(analysis, 'ai-reports', current));
      await mkdir(path.dirname(absoluteOut), { recursive: true });
      await writeFile(absoluteOut, content, 'utf8');
      console.error(`Wrote flaky analysis to ${absoluteOut}`);
    }

    console.error(
      `Summary: flaky=${analysis.stats.flaky}, unexpected=${analysis.stats.unexpected}, expected=${analysis.stats.expected}, skipped=${analysis.stats.skipped}`,
    );
    // Only the Markdown goes to stdout: a page of HTML in the terminal helps nobody.
    if (format === 'md') {
      process.stdout.write(generateFlakyMarkdownReport(analysis));
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze flaky tests: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
