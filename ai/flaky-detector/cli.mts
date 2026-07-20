import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeFlakyReport } from './analyze.mts';
import { defaultFlakyReportPath, generateFlakyMarkdownReport } from './report.mts';

const DEFAULT_REPORT = 'test-results/playwright-results.json';

function printUsage(): void {
  console.error(`Usage: npm run analyze:flaky -- [playwright-results.json] [--out <file.md>]

Analyze a Playwright JSON report for flaky tests (failed then passed on retry)
versus hard failures (failed all attempts).

Defaults to ${DEFAULT_REPORT} when no path is given.

Examples:
  npm run analyze:flaky
  npm run analyze:flaky -- test-results/playwright-results.json
  npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json --out /tmp/flaky.md
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

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--out') {
      outPath = args[index + 1];
      if (!outPath) {
        console.error('Missing value for --out');
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

    if (sourcePath) {
      console.error('Only one JSON report path is supported.');
      printUsage();
      return 1;
    }

    sourcePath = arg;
  }

  const reportPath = sourcePath ?? DEFAULT_REPORT;

  try {
    const analysis = await analyzeFlakyReport(reportPath);
    const markdown = generateFlakyMarkdownReport(analysis);
    const absoluteOut = path.resolve(outPath ?? defaultFlakyReportPath(analysis));

    await mkdir(path.dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, markdown, 'utf8');

    console.error(`Wrote flaky analysis to ${absoluteOut}`);
    console.error(
      `Summary: flaky=${analysis.stats.flaky}, unexpected=${analysis.stats.unexpected}, expected=${analysis.stats.expected}, skipped=${analysis.stats.skipped}`,
    );
    process.stdout.write(markdown);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze flaky tests: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
