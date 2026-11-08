import { str } from '../explorer/draft.mts';
import { parseSnapshot, type SnapshotNode } from '../explorer/snapshot.mts';

/**
 * Locator-change suggestions (P13-M1).
 *
 * When a test fails because a locator finds nothing, compare it with the page snapshot
 * Playwright saved in error-context.md and suggest the closest elements. It only suggests;
 * a person decides whether the change was intended or is a bug.
 */
export type FailedLocator = {
  kind: 'role' | 'label' | 'text' | 'placeholder' | 'testid';
  role?: string;
  name: string;
  exact: boolean;
  /** The locator as Playwright printed it. */
  source: string;
};

export type LocatorCandidate = {
  code: string;
  role: string;
  name: string;
  score: number;
  note?: string;
};

/** Optional model opinion on a tie (P13-M2). `choice` is a 1-based candidate number, or null for none. */
export type ModelPick = {
  provider: string;
  choice: number | null;
  reason: string;
};

export type LocatorSuggestion = {
  failed: FailedLocator;
  confidence: 'high' | 'medium' | 'low' | 'none';
  candidates: LocatorCandidate[];
  /** Why there are no candidates, or why the locator probably isn't the problem. */
  reason?: string;
  modelPick?: ModelPick;
};

const FORM_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'spinbutton', 'slider', 'switch']);
const CLICKABLE_ROLES = new Set(['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'switch']);
const MIN_SCORE = 0.45;

const QUOTED = String.raw`'((?:[^'\\]|\\.)*)'`;
const LOCATOR_PATTERNS: Array<{ kind: FailedLocator['kind']; pattern: RegExp }> = [
  { kind: 'role', pattern: new RegExp(String.raw`getByRole\(${QUOTED}(?:,\s*\{\s*name:\s*${QUOTED}(?:,\s*exact:\s*(true|false))?\s*\})?\)`, 'g') },
  { kind: 'label', pattern: new RegExp(String.raw`getByLabel\(${QUOTED}(?:,\s*\{\s*exact:\s*(true|false)\s*\})?\)`, 'g') },
  { kind: 'text', pattern: new RegExp(String.raw`getByText\(${QUOTED}(?:,\s*\{\s*exact:\s*(true|false)\s*\})?\)`, 'g') },
  { kind: 'placeholder', pattern: new RegExp(String.raw`getByPlaceholder\(${QUOTED}(?:,\s*\{\s*exact:\s*(true|false)\s*\})?\)`, 'g') },
  { kind: 'testid', pattern: new RegExp(String.raw`getByTestId\(${QUOTED}\)`, 'g') },
];

function unescape(value: string): string {
  return value.replace(/\\(.)/g, '$1');
}

/** The locator Playwright was waiting for: last `getBy…` on a "waiting for" or "Locator:" line. */
export function parseFailedLocator(errorText: string): FailedLocator | null {
  const lines = errorText
    .split('\n')
    .filter((line) => /waiting for |^\s*Locator: /.test(line));
  for (const line of lines.reverse()) {
    let best: { index: number; locator: FailedLocator } | null = null;
    for (const { kind, pattern } of LOCATOR_PATTERNS) {
      for (const match of line.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (best && index < best.index) continue;
        const locator: FailedLocator =
          kind === 'role'
            ? {
                kind,
                role: match[1],
                name: unescape(match[2] ?? ''),
                exact: match[3] === 'true',
                source: match[0],
              }
            : { kind, name: unescape(match[1]), exact: match[2] === 'true', source: match[0] };
        best = { index, locator };
      }
    }
    if (best) return best.locator;
  }
  return null;
}

/** First YAML block in error-context.md (Playwright's page snapshot). */
export function extractPageSnapshot(errorContext: string): string | null {
  // The closing fence must start a line: page text inside the snapshot can contain ```.
  const match = errorContext.match(/```yaml\n([\s\S]*?)\n```[ \t]*(?:\n|$)/);
  return match ? match[1] : null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function bigrams(value: string): string[] {
  const text = ` ${value} `;
  const pairs: string[] = [];
  for (let index = 0; index < text.length - 1; index += 1) pairs.push(text.slice(index, index + 2));
  return pairs;
}

/** 0..1 similarity: the better of character-bigram overlap (Dice) and word overlap (Jaccard). */
export function similarity(a: string, b: string): number {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  const counts = new Map<string, number>();
  for (const pair of leftPairs) counts.set(pair, (counts.get(pair) ?? 0) + 1);
  let shared = 0;
  for (const pair of rightPairs) {
    const count = counts.get(pair) ?? 0;
    if (count > 0) {
      shared += 1;
      counts.set(pair, count - 1);
    }
  }
  const dice = (2 * shared) / (leftPairs.length + rightPairs.length);

  const leftWords = new Set(left.split(' '));
  const rightWords = new Set(right.split(' '));
  const common = [...leftWords].filter((word) => rightWords.has(word)).length;
  const jaccard = common / new Set([...leftWords, ...rightWords]).size;

  return Math.max(dice, jaccard);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roleCode(role: string, name: string, exact: boolean): string {
  return `getByRole(${str(role)}, { name: ${str(name)}${exact ? ', exact: true' : ''} })`;
}

function candidatesFor(failed: FailedLocator, nodes: SnapshotNode[]): LocatorCandidate[] {
  const named = nodes.filter((node) => node.name);
  const scored: LocatorCandidate[] = [];

  if (failed.kind === 'role' && failed.role) {
    for (const node of named) {
      const score = similarity(failed.name, node.name);
      if (node.role === failed.role) {
        scored.push({ code: roleCode(node.role, node.name, failed.exact), role: node.role, name: node.name, score });
      } else if (CLICKABLE_ROLES.has(failed.role) && CLICKABLE_ROLES.has(node.role) && score >= 0.9) {
        scored.push({
          code: roleCode(node.role, node.name, failed.exact),
          role: node.role,
          name: node.name,
          score: score * 0.8,
          note: `role changed from ${failed.role} to ${node.role}`,
        });
      }
    }
  } else if (failed.kind === 'label') {
    for (const node of named.filter((item) => FORM_ROLES.has(item.role))) {
      scored.push({
        code: `getByLabel(${str(node.name)}${failed.exact ? ', { exact: true }' : ''})`,
        role: node.role,
        name: node.name,
        score: similarity(failed.name, node.name),
      });
    }
  } else if (failed.kind === 'text') {
    for (const node of nodes) {
      for (const value of [node.name, node.text]) {
        if (!value) continue;
        scored.push({
          code: `getByText(${str(value)}${failed.exact ? ', { exact: true }' : ''})`,
          role: node.role,
          name: value,
          score: similarity(failed.name, value),
        });
      }
    }
  }

  const seen = new Set<string>();
  return scored
    .filter((candidate) => candidate.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => (seen.has(candidate.code) ? false : (seen.add(candidate.code), true)))
    .slice(0, 3)
    .map((candidate) => ({ ...candidate, score: round(candidate.score) }));
}

function isPresent(failed: FailedLocator, nodes: SnapshotNode[]): boolean {
  const same = (value: string) => (failed.exact ? value === failed.name : normalize(value) === normalize(failed.name));
  if (failed.kind === 'role') return nodes.some((node) => node.role === failed.role && same(node.name));
  if (failed.kind === 'label') return nodes.some((node) => FORM_ROLES.has(node.role) && same(node.name));
  if (failed.kind === 'text') return nodes.some((node) => same(node.name) || same(node.text));
  return false;
}

export function suggestLocators(errorContext: string | null): LocatorSuggestion | null {
  if (!errorContext) return null;
  const failed = parseFailedLocator(errorContext);
  if (!failed) return null;

  if (failed.kind === 'testid' || failed.kind === 'placeholder') {
    return {
      failed,
      confidence: 'none',
      candidates: [],
      reason: `${failed.kind === 'testid' ? 'Test ids' : 'Placeholders'} are not part of the accessibility snapshot, so there is nothing to compare against.`,
    };
  }

  const yaml = extractPageSnapshot(errorContext);
  if (!yaml) {
    return { failed, confidence: 'none', candidates: [], reason: 'No page snapshot in error-context.md.' };
  }
  const nodes = parseSnapshot(yaml);

  if (isPresent(failed, nodes)) {
    return {
      failed,
      confidence: 'none',
      candidates: [],
      reason:
        'An element matching this locator is in the snapshot, so it probably was not renamed. Check whether it was hidden, disabled, covered, or not ready yet.',
    };
  }

  const candidates = candidatesFor(failed, nodes);
  if (candidates.length === 0) {
    return {
      failed,
      confidence: 'none',
      candidates,
      reason: 'No similar element on the page. It may have been removed, or the test is on the wrong page.',
    };
  }
  const [top, second] = candidates;
  const gap = second ? top.score - second.score : 1;
  const confidence = top.score >= 0.75 && gap >= 0.15 ? 'high' : top.score >= 0.6 ? 'medium' : 'low';
  return { failed, confidence, candidates };
}
