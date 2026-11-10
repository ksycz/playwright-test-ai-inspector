import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readOptionValue } from '../shared/cliArgs.mts';
import { LOCATOR_HINTS_FILE, collectLocatorHints } from './locators.mts';

function printUsage(): void {
  console.error(`Usage: npm run analyze:locators -- [playwright-results.json] [--out <file.json>]

For each hard failure, suggests the closest element to the locator that found nothing, from the
page snapshot in its error-context.md. Writes ${LOCATOR_HINTS_FILE} next to the report by default;
the run summary (PR comment) shows the suggestions. Suggestions only: no test is changed.
Run it where test-results/ still holds the failed tests' folders (right after the test run).
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  let reportPath = 'test-results/playwright-results.json';
  let outPath: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
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
    if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      return 1;
    }
    reportPath = arg;
  }

  try {
    const hints = await collectLocatorHints(reportPath);
    const out = path.resolve(outPath ?? path.join(path.dirname(reportPath), LOCATOR_HINTS_FILE));
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(hints, null, 2)}\n`, 'utf8');
    console.error(`Wrote ${hints.length} locator suggestion(s) to ${out}`);
    return 0;
  } catch (error) {
    console.error(`Failed to collect locator suggestions: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exit(await main(process.argv));
