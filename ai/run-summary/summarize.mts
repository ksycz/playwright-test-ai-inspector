import { analyzeFlakyReport } from '../flaky-detector/analyze.mts';
import { classifyFailure } from '../failure-analyzer/classify.mts';
import type {
  RunSummaryReport,
  SuiteRunSummary,
  SuiteSummaryInput,
  SummarizedFailure,
} from './types.mts';

function lastErrorMessage(attempts: { errorMessage: string | null }[]): string | null {
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const message = attempts[index]?.errorMessage;
    if (message) {
      return message;
    }
  }
  return null;
}

function classifyError(errorText: string | null): string {
  return classifyFailure({
    errorContextText: errorText,
    artifacts: {
      screenshots: [],
      videos: [],
      traces: [],
      errorContextPath: null,
      otherFiles: [],
    },
  }).category;
}

function deriveSuiteStatus(summary: Pick<SuiteRunSummary, 'stats'>): SuiteRunSummary['status'] {
  if (summary.stats.unexpected > 0) {
    return 'failed';
  }
  if (summary.stats.flaky > 0) {
    return 'flaky';
  }
  if (summary.stats.expected === 0 && summary.stats.skipped === 0) {
    return 'empty';
  }
  return 'passed';
}

export async function summarizeSuite(input: SuiteSummaryInput): Promise<SuiteRunSummary> {
  const analysis = await analyzeFlakyReport(input.reportPath);
  const hardFailures: SummarizedFailure[] = analysis.unexpectedTests.map((test) => {
    const lastError = lastErrorMessage(test.attempts);
    return {
      fullTitle: test.fullTitle,
      file: test.file,
      lastError,
      category: classifyError(lastError),
    };
  });

  const summary: SuiteRunSummary = {
    suite: input.suite,
    sourcePath: analysis.sourcePath,
    analyzedAt: analysis.analyzedAt,
    stats: { ...analysis.stats },
    hardFailures,
    flakyTests: analysis.flakyTests.map((test) => test.fullTitle),
    status: 'passed',
  };
  summary.status = deriveSuiteStatus(summary);
  return summary;
}

export async function summarizeRuns(
  inputs: SuiteSummaryInput[],
  options: { title?: string } = {},
): Promise<RunSummaryReport> {
  const suites: SuiteRunSummary[] = [];
  for (const input of inputs) {
    suites.push(await summarizeSuite(input));
  }

  const totals = {
    expected: 0,
    unexpected: 0,
    flaky: 0,
    skipped: 0,
  };

  for (const suite of suites) {
    totals.expected += suite.stats.expected;
    totals.unexpected += suite.stats.unexpected;
    totals.flaky += suite.stats.flaky;
    totals.skipped += suite.stats.skipped;
  }

  let overallStatus: RunSummaryReport['overallStatus'] = 'empty';
  if (suites.length > 0) {
    if (totals.unexpected > 0) {
      overallStatus = 'failed';
    } else if (totals.flaky > 0) {
      overallStatus = 'flaky';
    } else if (totals.expected > 0 || totals.skipped > 0) {
      overallStatus = 'passed';
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    title: options.title ?? 'Playwright run summary',
    suites,
    totals,
    overallStatus,
  };
}
