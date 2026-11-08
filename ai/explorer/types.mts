export type Flow = 'cart' | 'checkout' | 'auth';

export const FLOWS: readonly Flow[] = ['cart', 'checkout', 'auth'];

/** One exploration charter: a flow plus the APP_SPEC requirements it must respect. */
export type Charter = {
  id: Flow;
  specSection: string;
  requirements: string[];
};

/** A step in terms a test can repeat: page path, role + accessible name, field label. */
export type Action =
  | { kind: 'goto'; path: string }
  | { kind: 'click'; role: string; name: string }
  | { kind: 'type'; label: string; text: string };

/** The state a probe expected; becomes an `expect` in a draft spec (P12-M3). */
export type Check =
  | { kind: 'cartTotal'; amount: string }
  | { kind: 'cartBadge'; count: number }
  | { kind: 'rowVisible'; name: string }
  | { kind: 'rowAbsent'; name: string }
  | { kind: 'url'; pattern: string }
  | { kind: 'fieldInvalid'; label: string }
  | { kind: 'textVisible'; text: string }
  | { kind: 'buttonVisible'; name: string }
  | { kind: 'linkVisible'; name: string };

/** One MCP tool call the explorer made, kept so a finding can be replayed. */
export type RecordedStep = {
  tool: string;
  args: Record<string, unknown>;
  note: string;
  /** Present when the step maps to a role/label action; model clicks by ref alone do not. */
  action?: Action;
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
  /** Structured steps (null where a step could not be expressed as an action). */
  actions?: Array<Action | null>;
  /** Expected state, from the probe's oracle. Model findings have none. */
  checks?: Check[];
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
