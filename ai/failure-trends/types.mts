export type FailureCategoryCount = {
  assertion: number;
  timeout: number;
  locator: number;
  network: number;
  auth: number;
  unknown: number;
};

export interface RunFailureEntry {
  fullTitle: string;
  file: string;
  lastError: string | null;
  category: keyof FailureCategoryCount;
}

export interface RunRecord {
  recordedAt: string;
  sourcePath: string;
  suite: string | null;
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
  failures: RunFailureEntry[];
  flaky: string[];
  categories: FailureCategoryCount;
}

export interface TrendSummary {
  historyPath: string;
  generatedAt: string;
  runCount: number;
  totals: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
  categoryTotals: FailureCategoryCount;
  topFailingTests: Array<{ fullTitle: string; file: string; count: number }>;
  flakyHotspots: Array<{ fullTitle: string; count: number }>;
  runs: RunRecord[];
  warnings: string[];
}

export const EMPTY_CATEGORY_COUNTS = (): FailureCategoryCount => ({
  assertion: 0,
  timeout: 0,
  locator: 0,
  network: 0,
  auth: 0,
  unknown: 0,
});

export const DEFAULT_HISTORY_PATH = 'ai-reports/history/runs.jsonl';
export const DEFAULT_JSON_REPORT = 'test-results/playwright-results.json';
export const DEFAULT_TRENDS_OUT = 'ai-reports/trends.md';
