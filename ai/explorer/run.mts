import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createModelExplorer, type ModelExploration } from './agent.mts';
import { createAnthropicChatModel } from './anthropic.mts';
import { buildCharters } from './charters.mts';
import { explore } from './explore.mts';
import { startPlaywrightMcp } from './mcp.mts';
import { createOpenAiChatModel } from './openai.mts';
import { PROBES, type CatalogueProduct, type Credentials } from './probes.mts';
import { renderMarkdown, toJsonl } from './report.mts';
import { ExplorerSession } from './session.mts';
import type { ExplorationResult, Flow } from './types.mts';

export type RunOptions = {
  baseUrl: string;
  charters: Flow[];
  budget: number;
  outDir: string;
  model: ModelExploration | null;
  executablePath?: string;
  noSandbox?: boolean;
  headed?: boolean;
  log?: (message: string) => void;
};

/** ANTHROPIC_API_KEY first, then OPENAI_API_KEY. No key (or disabled) means probes only. */
export function modelFromEnv(options: {
  disabled: boolean;
  modelSteps: number;
  modelTurns: number;
}): ModelExploration | null {
  if (options.disabled) return null;
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

/** One full exploration of a running shop; writes report.md and findings.jsonl to outDir. */
export async function runExplorer(options: RunOptions): Promise<ExplorationResult> {
  const outDir = path.resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const spec = await readFile('docs/APP_SPEC.md', 'utf8');
  const charters = buildCharters(spec, options.charters);
  const catalogue = JSON.parse(
    await readFile('app/src/data/products.json', 'utf8'),
  ) as CatalogueProduct[];
  const [user] = JSON.parse(await readFile('app/src/data/users.json', 'utf8')) as Credentials[];

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
      model: options.model,
      log: options.log,
    });
    await writeFile(path.join(outDir, 'findings.jsonl'), toJsonl(result.findings), 'utf8');
    await writeFile(path.join(outDir, 'report.md'), renderMarkdown(result), 'utf8');
    return result;
  } finally {
    await mcp.close();
  }
}
