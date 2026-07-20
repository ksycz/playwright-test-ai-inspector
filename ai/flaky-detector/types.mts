export type FlakyVerdict = 'flaky' | 'unexpected' | 'expected' | 'skipped';

export interface AttemptSummary {
  retry: number;
  status: string;
  durationMs: number;
  errorMessage: string | null;
}

export interface TestOutcome {
  title: string;
  fullTitle: string;
  file: string;
  projectName: string;
  verdict: FlakyVerdict;
  attempts: AttemptSummary[];
}

export interface FlakyAnalysis {
  sourcePath: string;
  analyzedAt: string;
  stats: {
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
  flakyTests: TestOutcome[];
  unexpectedTests: TestOutcome[];
}
