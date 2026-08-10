import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateRunSummaryMarkdown, defaultSummaryOutPath } from './report.mts';
import { summarizeRuns } from './summarize.mts';
import type { SuiteSummaryInput } from './types.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run analyze:summary -- --suite <name> <playwright-results.json> [--suite <name> <json>]... [--out <file.md>] [--title <text>]

Build a Markdown run summary (PR-comment friendly) from one or more Playwright JSON reports.
Reuses the flaky detector and failure classifier.

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
      outPath = args[index + 1];
      if (!outPath) {
        console.error('Missing value for --out');
        return 1;
      }
      index += 1;
      continue;
    }

    if (arg === '--title') {
      title = args[index + 1];
      if (!title) {
        console.error('Missing value for --title');
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
    const report = await summarizeRuns(inputs, { title });
    const markdown = generateRunSummaryMarkdown(report);
    const absoluteOut = path.resolve(outPath ?? defaultSummaryOutPath());
    await mkdir(path.dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, markdown, 'utf8');

    console.error(`Wrote run summary to ${absoluteOut}`);
    console.error(
      `Overall=${report.overallStatus} unexpected=${report.totals.unexpected} flaky=${report.totals.flaky}`,
    );
    process.stdout.write(markdown);
    return report.overallStatus === 'failed' ? 2 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to build run summary: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
