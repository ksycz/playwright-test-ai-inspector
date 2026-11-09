import { escapeMarkdown } from '../shared/markdown.mts';
import type { ExplorationResult, Finding } from './types.mts';

/**
 * Seeded bugs the explorer is scored against. Ids match app/src/seededBugs.ts;
 * `requirements` are the APP_SPEC lines (charter form) a finding must cite to count as a catch.
 */
export type SeededBugSpec = {
  id: string;
  description: string;
  requirements: string[];
};

export const SEEDED_BUG_SPECS: SeededBugSpec[] = [
  {
    id: 'cart-remove-noop',
    description: 'Remove on a cart line does nothing',
    requirements: ['Shopping Cart: removing products'],
  },
  {
    id: 'cart-total-ignores-quantity',
    description: 'Cart total adds each product once, ignoring quantity',
    requirements: ['Shopping Cart: calculating total', 'Shopping Cart: increasing quantity'],
  },
  {
    id: 'checkout-email-not-checked',
    description: 'Checkout accepts an email without @ or domain',
    requirements: ['Checkout: display validation errors', 'Checkout: validate required fields'],
  },
  {
    id: 'cart-not-saved',
    description: 'Cart is not written to Local Storage, so a reload empties it',
    requirements: ['Shopping Cart: The cart should persist after page refresh.'],
  },
  {
    id: 'detail-adds-twice',
    description: 'Add to cart on the product detail page adds two items',
    requirements: ['Shopping Cart: adding products'],
  },
];

export type BugScore = {
  id: string;
  description: string;
  detected: boolean;
  /** Findings that cite one of the bug's requirements. */
  caughtBy: string[];
  /** Other findings in the same run (often knock-on effects of the bug). */
  otherFindings: string[];
  stepsUsed: number;
  /** The model layer hit an error (spend limit, bad key…) in this run, so a miss proves nothing. */
  modelFailed: boolean;
};

export type Evaluation = {
  date: string;
  layer: string;
  detected: number;
  total: number;
  /** Findings on the clean shop: every one is a false alarm. */
  falsePositives: string[];
  bugs: BugScore[];
  /** Runs where a model call failed ("baseline" or a bug id). Their misses are not real misses. */
  incomplete: string[];
};

/** True when any charter stopped because a model call failed. */
export function hadModelError(result: ExplorationResult): boolean {
  return result.charters.some((charter) => charter.stoppedEarly?.startsWith('model error') === true);
}

export function catches(finding: Finding, bug: SeededBugSpec): boolean {
  return bug.requirements.includes(finding.specRef);
}

export function scoreEvaluation(options: {
  date: string;
  layer: string;
  baseline: ExplorationResult;
  runs: Array<{ bug: SeededBugSpec; result: ExplorationResult }>;
}): Evaluation {
  const bugs = options.runs.map(({ bug, result }) => {
    const caughtBy = result.findings.filter((finding) => catches(finding, bug)).map((finding) => finding.id);
    return {
      id: bug.id,
      description: bug.description,
      detected: caughtBy.length > 0,
      caughtBy,
      otherFindings: result.findings.filter((finding) => !catches(finding, bug)).map((finding) => finding.id),
      stepsUsed: result.stepsUsed,
      modelFailed: hadModelError(result),
    };
  });
  const incomplete = [
    ...(hadModelError(options.baseline) ? ['baseline'] : []),
    ...bugs.filter((bug) => bug.modelFailed).map((bug) => bug.id),
  ];
  return {
    date: options.date,
    layer: options.layer,
    detected: bugs.filter((bug) => bug.detected).length,
    total: bugs.length,
    falsePositives: options.baseline.findings.map((finding) => finding.id),
    bugs,
    incomplete,
  };
}

/** One JSONL line per evaluation, same idea as the Phase 7 run history. */
export function toHistoryLine(evaluation: Evaluation): string {
  return `${JSON.stringify({
    date: evaluation.date,
    layer: evaluation.layer,
    detected: evaluation.detected,
    total: evaluation.total,
    falsePositives: evaluation.falsePositives.length,
    missed: evaluation.bugs.filter((bug) => !bug.detected && !bug.modelFailed).map((bug) => bug.id),
    ...(evaluation.incomplete.length > 0 ? { incomplete: true } : {}),
  })}\n`;
}

export type HistoryEntry = {
  date: string;
  layer: string;
  detected: number;
  total: number;
  falsePositives: number;
  missed: string[];
  /** The run had model errors, so it is not a measurement of the model layer. */
  incomplete?: boolean;
};

/** Reads history lines; malformed lines are skipped, not fatal. */
export function parseHistory(text: string): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line) as Partial<HistoryEntry>;
      if (
        typeof value.date === 'string' &&
        typeof value.layer === 'string' &&
        Number.isInteger(value.detected) &&
        Number.isInteger(value.total) &&
        Number.isInteger(value.falsePositives) &&
        Array.isArray(value.missed) &&
        (value.incomplete === undefined || typeof value.incomplete === 'boolean')
      ) {
        entries.push(value as HistoryEntry);
      }
    } catch {
      // skip
    }
  }
  return entries;
}

function percent(detected: number, total: number): string {
  return total === 0 ? 'n/a' : `${Math.round((detected / total) * 100)}%`;
}

export function renderEvaluation(evaluation: Evaluation, history: HistoryEntry[]): string {
  const lines: string[] = [];
  lines.push('# Seeded-bug evaluation');
  lines.push('');
  lines.push(`- Date: ${evaluation.date}`);
  lines.push(`- Layer: ${escapeMarkdown(evaluation.layer)}`);
  if (evaluation.incomplete.length > 0) {
    lines.push(
      `- ⚠️ **Incomplete run:** a model call failed in ${evaluation.incomplete.map(escapeMarkdown).join(', ')}. The numbers below do not measure the model layer; fix the cause (see the report) and run again.`,
    );
  }
  lines.push(
    `- Detection rate: **${evaluation.detected} of ${evaluation.total}** (${percent(evaluation.detected, evaluation.total)})`,
  );
  lines.push(
    `- False positives on the clean shop: **${evaluation.falsePositives.length}**${
      evaluation.falsePositives.length ? ` (${evaluation.falsePositives.map(escapeMarkdown).join(', ')})` : ''
    }`,
  );
  lines.push('');
  lines.push('| Seeded bug | What it breaks | Caught | Caught by | Other findings | Steps |');
  lines.push('|---|---|---|---|---|---|');
  for (const bug of evaluation.bugs) {
    lines.push(
      `| \`${bug.id}\` | ${escapeMarkdown(bug.description)} | ${bug.detected ? '✅' : bug.modelFailed ? '⚠️ model error' : '❌ missed'} | ${
        bug.caughtBy.map(escapeMarkdown).join(', ') || '—'
      } | ${bug.otherFindings.map(escapeMarkdown).join(', ') || '—'} | ${bug.stepsUsed} |`,
    );
  }
  lines.push('');
  lines.push('A bug counts as caught when a finding cites one of the spec requirements it breaks.');
  lines.push('"Other findings" are usually knock-on effects of the same bug, not false alarms.');
  lines.push('');

  if (history.length > 0) {
    lines.push('## History');
    lines.push('');
    lines.push('| Date | Layer | Caught | False positives | Missed |');
    lines.push('|---|---|---|---|---|');
    for (const entry of history.slice(-10)) {
      lines.push(
        `| ${escapeMarkdown(entry.date)} | ${escapeMarkdown(entry.layer)} | ${entry.incomplete ? '⚠️ incomplete' : `${entry.detected}/${entry.total}`} | ${entry.falsePositives} | ${
          entry.missed.map(escapeMarkdown).join(', ') || '—'
        } |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
