export type Flow = 'cart' | 'checkout' | 'auth';

export const FLOWS: readonly Flow[] = ['cart', 'checkout', 'auth'];

/** One exploration charter: a flow plus the APP_SPEC requirements it must respect. */
export type Charter = {
  id: Flow;
  specSection: string;
  requirements: string[];
};

/** One MCP tool call the explorer made, kept so a finding can be replayed. */
export type RecordedStep = {
  tool: string;
  args: Record<string, unknown>;
  note: string;
};

export type FindingSource = 'probe' | 'model';

export type Finding = {
  id: string;
  source: FindingSource;
  charter: Flow;
  /** APP_SPEC section and requirement the finding breaks. */
  specRef: string;
  title: string;
  expected: string;
  actual: string;
  /** Human-readable reproduction steps from the confirming run. */
  steps: string[];
  /** Screenshot path relative to the output directory, when one was taken. */
  screenshot?: string;
};

export type DroppedFinding = {
  id: string;
  source: FindingSource;
  charter: Flow;
  title: string;
  reason: string;
};

export type CharterSummary = {
  charter: Flow;
  checksRun: number;
  checksPassed: number;
  findings: number;
  dropped: number;
  stoppedEarly?: string;
};

export type ExplorationResult = {
  baseUrl: string;
  startedAt: string;
  budget: number;
  stepsUsed: number;
  modelUsed: string | null;
  charters: CharterSummary[];
  findings: Finding[];
  dropped: DroppedFinding[];
};
