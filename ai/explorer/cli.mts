import path from 'node:path';
import { parseArgs, type CliOptions } from './args.mts';
import { renderMarkdown } from './report.mts';
import { modelFromEnv, runExplorer } from './run.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run explore -- [--charters cart,checkout,auth] [--budget 400] [--out-dir ai-reports/explorer]
                     [--base-url http://localhost:5173] [--no-llm] [--model-steps 30] [--model-turns 40]
                     [--executable-path <chrome>] [--no-sandbox] [--headed]

Explores the running demo shop through Playwright MCP (start it first with npm run dev).
Deterministic probes always run. If ANTHROPIC_API_KEY (or OPENAI_API_KEY) is set, a model also\nexplores each charter, capped by --model-turns and --model-steps;
--no-llm skips it. Writes findings.jsonl and report.md. Exits 0 when the run completes.
`);
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  let options: CliOptions;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 1;
  }

  try {
    await fetch(options.baseUrl);
  } catch {
    console.error(`The shop is not reachable at ${options.baseUrl}. Start it with npm run dev.`);
    return 1;
  }

  try {
    const result = await runExplorer({
      baseUrl: options.baseUrl,
      charters: options.charters,
      budget: options.budget,
      outDir: options.outDir,
      model: modelFromEnv({
        disabled: options.noLlm,
        modelSteps: options.modelSteps,
        modelTurns: options.modelTurns,
      }),
      executablePath: options.executablePath,
      noSandbox: options.noSandbox,
      headed: options.headed,
      log: (message) => console.error(message),
    });
    const markdown = renderMarkdown(result);
    console.error(`Wrote ${path.join(path.resolve(options.outDir), 'report.md')} and findings.jsonl`);
    process.stdout.write(markdown);
    return 0;
  } catch (error) {
    console.error(`Exploration failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (import.meta.main ?? process.argv[1]?.endsWith('cli.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
