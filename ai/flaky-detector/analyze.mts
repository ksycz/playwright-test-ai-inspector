import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { AttemptSummary, FlakyAnalysis, FlakyVerdict, TestOutcome } from './types.mts';

interface JsonReportLike {
  stats?: {
    expected?: number;
    unexpected?: number;
    flaky?: number;
    skipped?: number;
  };
  suites?: JsonSuiteLike[];
}

interface JsonSuiteLike {
  title?: string;
  file?: string;
  specs?: JsonSpecLike[];
  suites?: JsonSuiteLike[];
}

interface JsonSpecLike {
  title?: string;
  file?: string;
  ok?: boolean;
  tests?: JsonTestLike[];
}

interface JsonTestLike {
  projectName?: string;
  status?: string;
  expectedStatus?: string;
  results?: JsonResultLike[];
}

interface JsonResultLike {
  retry?: number;
  status?: string;
  duration?: number;
  error?: { message?: string };
  errors?: Array<{ message?: string }>;
}

function walkSuites(suites: JsonSuiteLike[] | undefined, ancestors: string[] = []): TestOutcome[] {
  if (!suites) {
    return [];
  }

  const outcomes: TestOutcome[] = [];

  for (const suite of suites) {
    const suiteTitle = suite.title?.trim() ?? '';
    const nextAncestors = suiteTitle ? [...ancestors, suiteTitle] : ancestors;

    for (const spec of suite.specs ?? []) {
      const file = spec.file ?? suite.file ?? '';
      const title = spec.title ?? 'Untitled test';

      for (const test of spec.tests ?? []) {
        outcomes.push(toOutcome(spec, test, nextAncestors, file, title));
      }
    }

    outcomes.push(...walkSuites(suite.suites, nextAncestors));
  }

  return outcomes;
}

function inferVerdict(test: JsonTestLike): FlakyVerdict {
  const declared = test.status;
  if (declared === 'flaky' || declared === 'unexpected' || declared === 'expected' || declared === 'skipped') {
    return declared;
  }

  const results = test.results ?? [];
  if (results.length === 0) {
    return 'skipped';
  }

  const statuses = results.map((result) => result.status ?? 'unknown');
  const hasFailure = statuses.some((status) => status === 'failed' || status === 'timedOut' || status === 'interrupted');
  const last = statuses[statuses.length - 1];

  if (hasFailure && last === 'passed') {
    return 'flaky';
  }

  if (last === 'passed' || last === 'skipped') {
    return last === 'skipped' ? 'skipped' : 'expected';
  }

  return 'unexpected';
}

function toOutcome(
  spec: JsonSpecLike,
  test: JsonTestLike,
  ancestors: string[],
  file: string,
  title: string,
): TestOutcome {
  const projectName = test.projectName ?? 'unknown';
  const verdict = inferVerdict(test);
  const attempts: AttemptSummary[] = (test.results ?? []).map((result) => {
    const errorMessage =
      result.error?.message ??
      result.errors?.find((entry) => typeof entry.message === 'string')?.message ??
      null;

    return {
      retry: result.retry ?? 0,
      status: result.status ?? 'unknown',
      durationMs: result.duration ?? 0,
      errorMessage: errorMessage ? errorMessage.split('\n')[0]!.slice(0, 240) : null,
    };
  });

  const fullTitle = [...ancestors, title].filter(Boolean).join(' › ');

  return {
    title,
    fullTitle,
    file,
    projectName,
    verdict,
    attempts,
  };
}

export async function analyzeFlakyReport(reportPath: string): Promise<FlakyAnalysis> {
  const absolutePath = path.resolve(reportPath);
  const reportStats = await stat(absolutePath);

  if (!reportStats.isFile()) {
    throw new Error(`Flaky analysis expects a JSON report file: ${absolutePath}`);
  }

  let parsed: JsonReportLike;
  try {
    const raw = await readFile(absolutePath, 'utf8');
    parsed = JSON.parse(raw) as JsonReportLike;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse Playwright JSON report at ${absolutePath}: ${message}`);
  }

  const outcomes = walkSuites(parsed.suites);
  const flakyTests = outcomes.filter((outcome) => outcome.verdict === 'flaky');
  const unexpectedTests = outcomes.filter((outcome) => outcome.verdict === 'unexpected');

  const stats = {
    expected: parsed.stats?.expected ?? outcomes.filter((o) => o.verdict === 'expected').length,
    unexpected: parsed.stats?.unexpected ?? unexpectedTests.length,
    flaky: parsed.stats?.flaky ?? flakyTests.length,
    skipped: parsed.stats?.skipped ?? outcomes.filter((o) => o.verdict === 'skipped').length,
  };

  return {
    sourcePath: absolutePath,
    analyzedAt: new Date().toISOString(),
    stats,
    flakyTests,
    unexpectedTests,
  };
}
