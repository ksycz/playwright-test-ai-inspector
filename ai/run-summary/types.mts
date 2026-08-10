export interface SuiteSummaryInput {
  suite: string;
  reportPath: string;
}

export interface SummarizedFailure {
  fullTitle: string;
  file: string;
  lastError: string | null;
  category: string;
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
  status: 'passed' | 'failed' | 'flaky' | 'empty';
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
  overallStatus: 'passed' | 'failed' | 'flaky' | 'empty';
}

export const DEFAULT_SUMMARY_OUT = 'ai-reports/run-summary.md';
