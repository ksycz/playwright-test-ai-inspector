import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeMarkdown } from '../ai/shared/markdown.mts';
import { readOptionValue } from '../ai/shared/cliArgs.mts';
import { SEEDED_BUGS } from '../app/src/seededBugs.ts';

/**
 * Test audit: run the suites once on the clean shop and once per planted bug, and record which
 * tests fail. A test that fails when a bug is planted is doing a job. A bug that only one test
 * catches is guarded by a single test. A test that catches nothing may be redundant, or may
 * guard something the planted bugs don't touch: the list is a place to look, not a verdict.
 */
export type TestOutcome = { id: string; failed: boolean };

export type BugRun = { bug: string; tests: TestOutcome[] };

export type Audit = {
  total: number;
  /** Tests that failed on the clean shop: the audit is not trustworthy while this is not empty. */
  baselineFailures: string[];
  bugs: Array<{ bug: string; failing: string[] }>;
  /** Bugs that exactly one test catches. */
  singleGuards: Array<{ bug: string; test: string }>;
  /** Bugs that fail many tests at once: one root cause, many red tests. */
  cascades: Array<{ bug: string; count: number }>;
  /** Tests that did not fail for any planted bug. */
  neverFailed: string[];
};

/** Most tests failing at once that still looks like separate guards rather than a cascade. */
export const CASCADE_THRESHOLD = 10;

type JsonSuite = { specs?: Array<{ file?: string; title: string; ok: boolean }>; suites?: JsonSuite[]; file?: string };

/** Reads Playwright's JSON reporter output into one outcome per test. */
export function outcomesFromReport(report: unknown): TestOutcome[] {
  const outcomes: TestOutcome[] = [];
  const visit = (suite: JsonSuite, file: string | undefined): void => {
    const here = suite.file ?? file;
    for (const spec of suite.specs ?? []) {
      outcomes.push({ id: `${spec.file ?? here ?? '?'}::${spec.title}`, failed: !spec.ok });
    }
    for (const child of suite.suites ?? []) visit(child, here);
  };
  const root = report as { suites?: JsonSuite[] };
  for (const suite of root.suites ?? []) visit(suite, suite.file);
  return outcomes;
}

/**
 * Playwright still writes a valid report when it cannot run anything (a port already in use,
 * a missing browser, a bad config), with no tests and the reason under `errors`.
 * Returns that reason, or null when the report holds real results.
 */
export function reportProblem(report: unknown): string | null {
  const root = report as { errors?: Array<{ message?: string }> };
  const first = root.errors?.find((error) => error.message)?.message;
  if (first) {
    const line = first.split('\n').find((text) => text.trim()) ?? first;
    const hint = /already used|EADDRINUSE/.test(first)
      ? ' Stop the running dev server (the audit starts its own on port 5173) and try again.'
      : '';
    return `Playwright could not run the tests: ${line.replace(/\u001b\[[0-9;]*m/g, '').trim()}${hint}`;
  }
  return outcomesFromReport(report).length === 0 ? 'Playwright ran no tests. Check --grep, and that the tests start (npm run test:smoke).' : null;
}

export function buildAudit(baseline: TestOutcome[], runs: BugRun[]): Audit {
  const all = new Set<string>(baseline.map((test) => test.id));
  for (const run of runs) for (const test of run.tests) all.add(test.id);
  const everFailed = new Set<string>();
  const bugs = runs.map((run) => {
    const failing = run.tests.filter((test) => test.failed).map((test) => test.id);
    for (const id of failing) everFailed.add(id);
    return { bug: run.bug, failing };
  });
  return {
    total: all.size,
    baselineFailures: baseline.filter((test) => test.failed).map((test) => test.id),
    bugs,
    singleGuards: bugs.filter((entry) => entry.failing.length === 1).map((entry) => ({ bug: entry.bug, test: entry.failing[0] })),
    cascades: bugs.filter((entry) => entry.failing.length > CASCADE_THRESHOLD).map((entry) => ({ bug: entry.bug, count: entry.failing.length })),
    neverFailed: [...all].filter((id) => !everFailed.has(id)).sort(),
  };
}

function label(id: string): string {
  const [file, title] = id.split('::');
  return `\`${escapeMarkdown(title ?? id)}\` (${escapeMarkdown(file ?? '?')})`;
}

export function renderAudit(audit: Audit, meta: { date: string; grep: string }): string {
  const lines: string[] = [];
  lines.push('# Test audit');
  lines.push('');
  lines.push(`- Date: ${escapeMarkdown(meta.date)}`);
  lines.push(`- Tests run: **${audit.total}** (filter: ${escapeMarkdown(meta.grep)})`);
  lines.push(`- Planted bugs tried: **${audit.bugs.length}**, one at a time`);
  if (audit.baselineFailures.length > 0) {
    lines.push(
      `- ⚠️ **${audit.baselineFailures.length} test(s) failed on the clean shop**, so the results below are not trustworthy until those pass: ${audit.baselineFailures.map(label).join(', ')}`,
    );
  } else {
    lines.push('- Clean shop: all tests passed');
  }
  lines.push('');
  lines.push('| Planted bug | Tests that failed |');
  lines.push('|---|---|');
  for (const entry of audit.bugs) {
    lines.push(`| \`${escapeMarkdown(entry.bug)}\` | ${entry.failing.length} |`);
  }
  lines.push('');
  lines.push('## Bugs guarded by a single test');
  lines.push('');
  if (audit.singleGuards.length === 0) lines.push('None: every bug is caught by at least two tests, or by none.');
  for (const guard of audit.singleGuards) lines.push(`- \`${escapeMarkdown(guard.bug)}\`: ${label(guard.test)}`);
  lines.push('');
  lines.push('## Bugs that fail many tests at once');
  lines.push('');
  if (audit.cascades.length === 0) lines.push('None.');
  for (const cascade of audit.cascades) {
    lines.push(`- \`${escapeMarkdown(cascade.bug)}\`: ${cascade.count} tests. One root cause, many red tests; they are not that many independent guards.`);
  }
  lines.push('');
  const uncaught = audit.bugs.filter((entry) => entry.failing.length === 0).map((entry) => entry.bug);
  if (uncaught.length > 0) {
    lines.push('## Bugs no test caught');
    lines.push('');
    for (const bug of uncaught) lines.push(`- \`${escapeMarkdown(bug)}\``);
    lines.push('');
  }
  lines.push(`## Tests that failed for none of the planted bugs (${audit.neverFailed.length} of ${audit.total})`);
  lines.push('');
  lines.push('A place to look for redundant tests, not a verdict: a test can guard behaviour no planted bug touches.');
  lines.push('');
  for (const id of audit.neverFailed) lines.push(`- ${label(id)}`);
  lines.push('');
  return lines.join('\n');
}

type Options = { grep: string; bugs: string[]; outDir: string; config?: string };

export const BEHAVIOUR_BUGS: string[] = SEEDED_BUGS.filter((bug) => !bug.startsWith('drift-'));

export function parseAuditArgs(args: string[]): Options {
  const options: Options = { grep: '', bugs: BEHAVIOUR_BUGS, outDir: 'ai-reports/test-audit' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg !== '--grep' && arg !== '--bugs' && arg !== '--out-dir' && arg !== '--config') throw new Error(`Unknown option: ${arg}`);
    const parsed = readOptionValue(args, index, arg);
    if (!parsed.ok) throw new Error(parsed.error);
    index = parsed.nextIndex;
    if (arg === '--grep') options.grep = parsed.value;
    else if (arg === '--out-dir') options.outDir = parsed.value;
    else if (arg === '--config') options.config = parsed.value;
    else {
      const names = parsed.value.split(',').map((name) => name.trim()).filter(Boolean);
      const unknown = names.filter((name) => !(SEEDED_BUGS as readonly string[]).includes(name));
      if (names.length === 0 || unknown.length > 0) {
        throw new Error(`Unknown bug: ${unknown.join(', ') || '(none given)'}. Known: ${SEEDED_BUGS.join(', ')}`);
      }
      options.bugs = names;
    }
  }
  return options;
}

function printUsage(): void {
  console.error(`Usage:
  npm run tests:audit -- [--grep "@smoke|@e2e"] [--bugs a,b] [--out-dir ai-reports/test-audit] [--config <playwright config>]

Runs the Playwright suites once on the clean shop and once per planted bug (VITE_SEEDED_BUGS),
then reports which tests fail for which bug. Default: every test, every behaviour bug. Pass
drift-* names in --bugs to include label changes. About a minute per run; needs the Playwright
browsers installed. Writes <out-dir>/audit.md.`);
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }
  let options: Options;
  try {
    options = parseAuditArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 1;
  }

  const outDir = path.resolve(options.outDir);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  async function runWith(bug: string): Promise<TestOutcome[]> {
    const name = bug || 'clean';
    const reportFile = path.join(outDir, `${name}.json`);
    console.error(`\nRunning ${options.grep || 'all tests'} with ${bug ? `bug ${bug}` : 'no planted bug'}…`);
    spawnSync(
      'sh',
      [
        'scripts/playwright.sh', 'test',
        ...(options.grep ? ['--grep', options.grep] : []),
        '--retries=0', '--workers=4', '--timeout=15000',
        '--reporter=json',
        ...(options.config ? ['--config', options.config] : []),
      ],
      {
        stdio: ['ignore', 'ignore', 'inherit'],
        // CI=1 makes Playwright start a fresh dev server instead of reusing a running one.
        env: { ...process.env, CI: '1', VITE_SEEDED_BUGS: bug, PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
      },
    );
    let report: unknown;
    try {
      report = JSON.parse(await readFile(reportFile, 'utf8'));
    } catch {
      throw new Error(`No Playwright report for "${name}". Does the suite start? Try: npm run test:smoke`);
    }
    const problem = reportProblem(report);
    if (problem) throw new Error(`${problem} (run: ${name})`);
    return outcomesFromReport(report);
  }

  try {
    const baseline = await runWith('');
    const runs: BugRun[] = [];
    for (const bug of options.bugs) runs.push({ bug, tests: await runWith(bug) });
    const audit = buildAudit(baseline, runs);
    const markdown = renderAudit(audit, { date: new Date().toISOString(), grep: options.grep || 'all tests' });
    await writeFile(path.join(outDir, 'audit.md'), markdown, 'utf8');
    console.error(`\nWrote ${path.join(outDir, 'audit.md')}`);
    process.stdout.write(markdown);
    return audit.baselineFailures.length > 0 ? 2 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith('tests-audit.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
