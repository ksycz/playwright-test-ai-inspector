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
}
