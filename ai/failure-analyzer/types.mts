export type FailureCategory =
  | 'assertion'
  | 'timeout'
  | 'locator'
  | 'network'
  | 'auth'
  | 'unknown';

export interface FailureClassification {
  category: FailureCategory;
  confidence: number;
  matchedSignals: string[];
  summary: string;
}

export interface FailureArtifacts {
  screenshots: string[];
  videos: string[];
  traces: string[];
  errorContextPath: string | null;
  otherFiles: string[];
}

export interface FailureContext {
  sourcePath: string;
  collectedAt: string;
  artifacts: FailureArtifacts;
  errorContextText: string | null;
  classification: FailureClassification;
}
