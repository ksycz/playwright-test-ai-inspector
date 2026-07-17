import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectFailureContext } from './collect.mts';

function printUsage(): void {
  console.error(`Usage: npm run analyze:failure -- <test-results-folder> [--out <file.json>]

Collect Playwright failure artifacts into normalized JSON (includes heuristic classification).

Examples:
  npm run analyze:failure -- test-results/smoke-checkout-flow-...-chromium
  npm run analyze:failure -- ai/failure-analyzer/fixtures/sample-failure --out /tmp/context.json
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return args.length === 0 ? 1 : 0;
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
      console.error('Only one failure folder path is supported.');
      printUsage();
      return 1;
    }

    sourcePath = arg;
  }

  if (!sourcePath) {
    printUsage();
    return 1;
  }

  try {
    const context = await collectFailureContext(sourcePath);
    const json = `${JSON.stringify(context, null, 2)}\n`;

    if (outPath) {
      const absoluteOut = path.resolve(outPath);
      await writeFile(absoluteOut, json, 'utf8');
      console.error(`Wrote failure context to ${absoluteOut}`);
    }

    process.stdout.write(json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to collect failure artifacts: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
