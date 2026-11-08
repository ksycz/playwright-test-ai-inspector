import { spawn, type ChildProcess } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseEvalArgs, type EvalOptions } from './args.mts';
import {
  parseHistory,
  renderEvaluation,
  scoreEvaluation,
  SEEDED_BUG_SPECS,
  toHistoryLine,
} from './evaluate.mts';
import { modelFromEnv, runExplorer } from './run.mts';
import { FLOWS, type ExplorationResult } from './types.mts';

const KNOWN = SEEDED_BUG_SPECS.map((bug) => bug.id);

function printUsage(): void {
  console.error(`Usage:
  npm run explore:eval -- [--bugs ${KNOWN.slice(0, 2).join(',')},...] [--port 5174] [--budget 400]
                          [--out-dir ai-reports/explorer-eval] [--history <file.jsonl>]
                          [--no-llm] [--model-steps 30] [--model-turns 40]
                          [--executable-path <chrome>] [--no-sandbox]

Runs the explorer once on the clean shop (false positives) and once per seeded bug
(VITE_SEEDED_BUGS=<bug>), each on its own dev server. Writes evaluation.md and appends
one line to the history file. Stop any server already on --port first.
`);
}

async function startShop(port: number, bug: string | null): Promise<ChildProcess> {
  const child = spawn(
    'npm',
    ['run', 'dev', '--prefix', 'app', '--', '--port', String(port), '--strictPort'],
    {
      env: { ...process.env, VITE_SEEDED_BUGS: bug ?? '' },
      stdio: 'ignore',
      detached: true,
    },
  );
  const url = `http://localhost:${port}/`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Dev server exited (is port ${port} already in use?)`);
    try {
      const response = await fetch(url);
      if (response.ok) return child;
    } catch {
      // not up yet
    }
    await delay(500);
  }
  stopShop(child);
  throw new Error(`Dev server did not start on ${url}`);
}

function stopShop(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, 'SIGTERM'); // the whole npm → vite process group
  } catch {
    child.kill('SIGTERM');
  }
}

async function scenario(options: EvalOptions, bug: string | null): Promise<ExplorationResult> {
  const name = bug ?? 'baseline';
  console.error(`\n=== ${name} ===`);
  const shop = await startShop(options.port, bug);
  try {
    return await runExplorer({
      baseUrl: `http://localhost:${options.port}`,
      charters: [...FLOWS],
      budget: options.budget,
      outDir: path.join(options.outDir, name),
      model: modelFromEnv({
        disabled: options.noLlm,
        modelSteps: options.modelSteps,
        modelTurns: options.modelTurns,
      }),
      executablePath: options.executablePath,
      noSandbox: options.noSandbox,
      log: (message) => console.error(message),
    });
  } finally {
    stopShop(shop);
    await delay(500);
  }
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }
  let options: EvalOptions;
  try {
    options = parseEvalArgs(args, KNOWN);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 1;
  }

  try {
    const model = modelFromEnv({ disabled: options.noLlm, modelSteps: options.modelSteps, modelTurns: options.modelTurns });
    const layer = model ? `probes + ${model.name}` : 'probes';
    const baseline = await scenario(options, null);
    const runs = [];
    for (const id of options.bugs) {
      const bug = SEEDED_BUG_SPECS.find((spec) => spec.id === id)!;
      runs.push({ bug, result: await scenario(options, id) });
    }

    const evaluation = scoreEvaluation({ date: new Date().toISOString(), layer, baseline, runs });
    await mkdir(path.dirname(path.resolve(options.history)), { recursive: true });
    await appendFile(options.history, toHistoryLine(evaluation), 'utf8');
    const history = parseHistory(await readFile(options.history, 'utf8'));
    const markdown = renderEvaluation(evaluation, history);
    const reportPath = path.join(path.resolve(options.outDir), 'evaluation.md');
    await writeFile(reportPath, markdown, 'utf8');
    console.error(`\nWrote ${reportPath}`);
    process.stdout.write(markdown);
    return 0;
  } catch (error) {
    console.error(`Evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (process.argv[1]?.endsWith('eval-cli.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
