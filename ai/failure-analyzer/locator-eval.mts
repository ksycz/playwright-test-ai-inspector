import { escapeMarkdown } from '../shared/markdown.mts';
import type { FailedLocator, LocatorSuggestion } from './locator.mts';

/**
 * Planted label drift (P13-M3): what each drift renames, and what the suggester should say.
 * Ids match the drift-* switches in app/src/seededBugs.ts.
 */
type ElementRef = { kind: 'role' | 'label'; role?: string; name: string };

export type DriftSpec = {
  id: string;
  description: string;
  original: ElementRef;
  /** The right top suggestion, or null when the element was removed (then no suggestion is right). */
  expected: ElementRef | null;
};

export const LABEL_DRIFTS: DriftSpec[] = [
  {
    id: 'drift-clear-cart',
    description: 'Button text "Clear cart" → "Empty cart"',
    original: { kind: 'role', role: 'button', name: 'Clear cart' },
    expected: { kind: 'role', role: 'button', name: 'Empty cart' },
  },
  {
    id: 'drift-place-order',
    description: 'Button text "Place order" → "Complete purchase" (no words in common)',
    original: { kind: 'role', role: 'button', name: 'Place order' },
    expected: { kind: 'role', role: 'button', name: 'Complete purchase' },
  },
  {
    id: 'drift-login-heading',
    description: 'Heading "Log in" → "Sign in"',
    original: { kind: 'role', role: 'heading', name: 'Log in' },
    expected: { kind: 'role', role: 'heading', name: 'Sign in' },
  },
  {
    id: 'drift-username-label',
    description: 'Field label "Username" → "User name"',
    original: { kind: 'label', name: 'Username' },
    expected: { kind: 'label', name: 'User name' },
  },
  {
    id: 'drift-browse-role',
    description: '"Browse products" changes from a link to a button',
    original: { kind: 'role', role: 'link', name: 'Browse products' },
    expected: { kind: 'role', role: 'button', name: 'Browse products' },
  },
  {
    id: 'drift-proceed-removed',
    description: '"Proceed to checkout" button removed',
    original: { kind: 'role', role: 'button', name: 'Proceed to checkout' },
    expected: null,
  },
];

export function matchDrift(failed: FailedLocator, drifts: DriftSpec[] = LABEL_DRIFTS): DriftSpec | undefined {
  return drifts.find(
    (drift) =>
      drift.original.kind === failed.kind &&
      drift.original.name === failed.name &&
      (drift.original.kind !== 'role' || drift.original.role === failed.role),
  );
}

export type FailureScore = {
  folder: string;
  drift: string | null;
  failed: string | null;
  top: string | null;
  confidence: LocatorSuggestion['confidence'] | null;
  /** null when the failure is not caused by a planted drift. */
  correct: boolean | null;
  confidentWrong: boolean;
};

export function scoreFailure(folder: string, suggestion: LocatorSuggestion | null): FailureScore {
  const drift = suggestion ? matchDrift(suggestion.failed) : undefined;
  const top = suggestion?.candidates[0];
  const base = {
    folder,
    failed: suggestion?.failed.source ?? null,
    top: top?.code ?? null,
    confidence: suggestion?.confidence ?? null,
  };
  if (!drift || !suggestion) return { ...base, drift: null, correct: null, confidentWrong: false };

  let correct: boolean;
  if (drift.expected === null) {
    correct = suggestion.candidates.length === 0;
  } else {
    const expected = drift.expected;
    correct = Boolean(
      top && top.name === expected.name && (expected.kind === 'label' || top.role === expected.role),
    );
  }
  const confidentWrong = !correct && (suggestion.confidence === 'high' || suggestion.confidence === 'medium');
  return { ...base, drift: drift.id, correct, confidentWrong };
}

export type DriftResult = {
  id: string;
  description: string;
  failures: number;
  correct: number;
  confidentWrong: number;
  examples: string[];
};

export type LocatorEvaluation = {
  date: string;
  drifts: DriftResult[];
  failures: number;
  attributed: number;
  correct: number;
  confidentWrong: number;
  /** Failures not caused by a planted drift (e.g. a test that fails for another reason). */
  other: string[];
};

export function scoreLocatorEvaluation(date: string, scores: FailureScore[], drifts: DriftSpec[] = LABEL_DRIFTS): LocatorEvaluation {
  const results = drifts.map((drift): DriftResult => {
    const mine = scores.filter((score) => score.drift === drift.id);
    return {
      id: drift.id,
      description: drift.description,
      failures: mine.length,
      correct: mine.filter((score) => score.correct).length,
      confidentWrong: mine.filter((score) => score.confidentWrong).length,
      examples: [...new Set(mine.map((score) => score.top ?? 'no suggestion'))].slice(0, 2),
    };
  });
  const attributed = scores.filter((score) => score.drift !== null);
  return {
    date,
    drifts: results,
    failures: scores.length,
    attributed: attributed.length,
    correct: attributed.filter((score) => score.correct).length,
    confidentWrong: attributed.filter((score) => score.confidentWrong).length,
    other: scores.filter((score) => score.drift === null).map((score) => score.folder),
  };
}

function percent(part: number, whole: number): string {
  return whole === 0 ? 'n/a' : `${Math.round((part / whole) * 100)}%`;
}

export function renderLocatorEvaluation(evaluation: LocatorEvaluation): string {
  const reached = evaluation.drifts.filter((drift) => drift.failures > 0);
  const right = reached.filter((drift) => drift.correct === drift.failures);
  const lines = [
    '# Locator suggestion evaluation',
    '',
    `- Date: ${evaluation.date}`,
    `- Drifts that broke at least one test: ${reached.length} of ${evaluation.drifts.length}`,
    `- Drifts where every suggestion was right: **${right.length} of ${reached.length}**`,
    `- Failures caused by a drift: ${evaluation.attributed}; right suggestion: **${evaluation.correct}** (${percent(evaluation.correct, evaluation.attributed)})`,
    `- Confident but wrong (medium/high): **${evaluation.confidentWrong}**`,
    `- Other failures (not caused by a drift): ${evaluation.other.length}`,
    '',
    '| Drift | What changed | Failed tests | Right | Confident but wrong | Top suggestion |',
    '|---|---|---|---|---|---|',
  ];
  for (const drift of evaluation.drifts) {
    lines.push(
      `| \`${drift.id}\` | ${escapeMarkdown(drift.description)} | ${drift.failures} | ${drift.correct} | ${drift.confidentWrong} | ${
        drift.examples.map((example) => escapeMarkdown(example)).join('<br>') || '—'
      } |`,
    );
  }
  lines.push(
    '',
    '"Right" means the top suggestion names the new element; for the removed button it means no suggestion at all.',
    'A drift with 0 failed tests broke no test, so it could not be scored.',
    '',
  );
  return lines.join('\n');
}
