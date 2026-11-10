export interface SuiteSummaryInput {
  suite: string;
  reportPath: string;
}

export interface LocatorHint {
  fullTitle: string;
  file: string;
  /** The locator the test waited for, as Playwright printed it. */
  failed: string;
  /** The closest element in the page snapshot, as a locator. */
  suggested: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SummarizedFailure {
  fullTitle: string;
  file: string;
  lastError: string | null;
  category: string;
  /** Top locator suggestion, when the test job wrote locator-hints.json. Never applied automatically. */
  locator?: LocatorHint;
}

export interface SuiteRunSummary {
  suite: string;
  sourcePath: string;
  analyzedAt: string;
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
  hardFailures: SummarizedFailure[];
  flakyTests: string[];
  status: 'passed' | 'failed' | 'flaky' | 'empty' | 'skipped';
}

export interface RunSummaryReport {
  generatedAt: string;
  title: string;
  suites: SuiteRunSummary[];
  totals: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
  overallStatus: 'passed' | 'failed' | 'flaky' | 'empty' | 'skipped';
}

export const DEFAULT_SUMMARY_OUT = 'ai-reports/run-summary.md';
