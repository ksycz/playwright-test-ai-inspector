import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readOptionValue } from '../shared/cliArgs.mts';
import { suggestLocators } from './locator.mts';
import { LABEL_DRIFTS, renderLocatorEvaluation, scoreFailure, scoreLocatorEvaluation, type FailureScore } from './locator-eval.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run locator:eval -- [--grep "@smoke|@e2e"] [--out-dir ai-reports/locator-eval] [--config <playwright config>]

Runs the Playwright suites with every label drift switched on (VITE_SEEDED_BUGS=drift-all),
then re-runs any drift that broke no test on its own (another drift can stop tests first),
and scores the locator suggestion for each failed test.
Starts its own dev server: stop npm run dev first.
`);
}

type Options = { grep: string; outDir: string; config?: string };

export function parseLocatorEvalArgs(args: string[]): Options {
  const options: Options = { grep: '@smoke|@e2e', outDir: 'ai-reports/locator-eval' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg !== '--grep' && arg !== '--out-dir' && arg !== '--config') throw new Error(`Unknown option: ${arg}`);
    const parsed = readOptionValue(args, index, arg);
    if (!parsed.ok) throw new Error(parsed.error);
    index = parsed.nextIndex;
    if (arg === '--grep') options.grep = parsed.value;
    else if (arg === '--out-dir') options.outDir = parsed.value;
    else options.config = parsed.value;
  }
  return options;
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }
  let options: Options;
  try {
    options = parseLocatorEvalArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 1;
  }

  const outDir = path.resolve(options.outDir);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  async function runWith(drifts: string, label: string): Promise<FailureScore[]> {
    const resultsDir = path.join(outDir, 'test-results', label);
    console.error(`\nRunning the suites with ${drifts} (failures are expected)…`);
    spawnSync(
      'sh',
      [
        'scripts/playwright.sh', 'test',
        '--grep', options.grep,
        '--retries=0', '--workers=4', '--timeout=10000',
        '--output', resultsDir,
        '--reporter=dot',
        ...(options.config ? ['--config', options.config] : []),
      ],
      {
        stdio: ['ignore', 'inherit', 'inherit'],
        // CI=1 makes Playwright start a fresh dev server instead of reusing a running one.
        env: { ...process.env, CI: '1', VITE_SEEDED_BUGS: drifts },
      },
    );
    const scores: FailureScore[] = [];
    if (!existsSync(resultsDir)) return scores;
    for (const entry of (await readdir(resultsDir, { withFileTypes: true })).filter((item) => item.isDirectory())) {
      const file = path.join(resultsDir, entry.name, 'error-context.md');
      if (!existsSync(file)) continue;
      scores.push(scoreFailure(`${label}/${entry.name}`, suggestLocators(await readFile(file, 'utf8'))));
    }
    return scores;
  }

  // Pass 1: every drift at once. Pass 2: drifts that broke nothing (an earlier drift stopped
  // the tests before they got there) run alone, so they are measured too.
  const scores = await runWith('drift-all', 'all');
  const masked = LABEL_DRIFTS.filter((drift) => !scores.some((score) => score.drift === drift.id));
  for (const drift of masked) {
    const alone = await runWith(drift.id, drift.id);
    scores.push(...alone.filter((score) => score.drift === drift.id));
  }

  const evaluation = scoreLocatorEvaluation(new Date().toISOString(), scores);
  const markdown = renderLocatorEvaluation(evaluation);
  await writeFile(path.join(outDir, 'evaluation.md'), markdown, 'utf8');
  await writeFile(path.join(outDir, 'failures.json'), `${JSON.stringify(scores, null, 2)}\n`, 'utf8');
  console.error(`\nWrote ${path.join(outDir, 'evaluation.md')}`);
  process.stdout.write(markdown);
  return 0;
}

if (process.argv[1]?.endsWith('locator-eval-cli.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
