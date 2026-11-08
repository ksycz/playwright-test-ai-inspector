import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createModelExplorer, type ModelExploration } from './agent.mts';
import { buildCharters } from './charters.mts';
import { explore } from './explore.mts';
import { startPlaywrightMcp } from './mcp.mts';
import { createAnthropicChatModel } from './anthropic.mts';
import { createOpenAiChatModel } from './openai.mts';
import { PROBES, type CatalogueProduct, type Credentials } from './probes.mts';
import { renderMarkdown, toJsonl } from './report.mts';
import { ExplorerSession } from './session.mts';
import { parseArgs, type CliOptions } from './args.mts';

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

/** ANTHROPIC_API_KEY first, then OPENAI_API_KEY. No key (or --no-llm) means probes only. */
function modelFromEnv(options: CliOptions): ModelExploration | null {
  if (options.noLlm) return null;
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const chat = anthropicKey
    ? createAnthropicChatModel({ apiKey: anthropicKey, model: process.env.ANTHROPIC_MODEL })
    : openAiKey
      ? createOpenAiChatModel({ apiKey: openAiKey, model: process.env.OPENAI_MODEL })
      : null;
  if (!chat) return null;
  return createModelExplorer(chat, { stepBudget: options.modelSteps, maxTurns: options.modelTurns });
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

  const outDir = path.resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const spec = await readFile('docs/APP_SPEC.md', 'utf8');
  const charters = buildCharters(spec, options.charters);
  const catalogue = JSON.parse(
    await readFile('app/src/data/products.json', 'utf8'),
  ) as CatalogueProduct[];
  const [user] = JSON.parse(await readFile('app/src/data/users.json', 'utf8')) as Credentials[];
  const model = modelFromEnv(options);

  const mcp = await startPlaywrightMcp({
    origin: options.baseUrl,
    outputDir: outDir,
    executablePath: options.executablePath,
    noSandbox: options.noSandbox,
    headed: options.headed,
  });
  try {
    const session = new ExplorerSession(mcp.caller, {
      budget: options.budget,
      origin: options.baseUrl,
      screenshotDir: path.join(outDir, 'screenshots'),
    });
    const result = await explore({
      session,
      charters,
      probes: PROBES,
      context: { catalogue, user },
      baseUrl: options.baseUrl,
      model,
      log: (message) => console.error(message),
    });

    const markdown = renderMarkdown(result);
    await writeFile(path.join(outDir, 'findings.jsonl'), toJsonl(result.findings), 'utf8');
    await writeFile(path.join(outDir, 'report.md'), markdown, 'utf8');
    console.error(`Wrote ${path.join(outDir, 'report.md')} and findings.jsonl`);
    process.stdout.write(markdown);
    return 0;
  } catch (error) {
    console.error(`Exploration failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  } finally {
    await mcp.close();
  }
}

if (import.meta.main ?? process.argv[1]?.endsWith('cli.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
