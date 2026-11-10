import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { suggestLocators } from '../failure-analyzer/locator.mts';
import { analyzeFlakyReport } from '../flaky-detector/analyze.mts';
import type { LocatorHint } from './types.mts';

/**
 * Locator suggestions for the PR comment (P13-M1 in CI).
 *
 * Runs in the test job, where test-results/ still holds each failed test's error-context.md.
 * For every hard failure whose last attempt has one, it keeps the closest element in the page
 * snapshot. The summary job reads the result (locator-hints.json) next to the JSON report.
 * A hint is a suggestion for a person; nothing changes the test.
 */
export const LOCATOR_HINTS_FILE = 'locator-hints.json';

export async function collectLocatorHints(reportPath: string): Promise<LocatorHint[]> {
  const analysis = await analyzeFlakyReport(reportPath);
  const hints: LocatorHint[] = [];

  for (const test of analysis.unexpectedTests) {
    const attempt = [...test.attempts].reverse().find((entry) => entry.errorContextPath);
    if (!attempt?.errorContextPath) continue;

    let errorContext: string;
    try {
      errorContext = await readFile(path.resolve(attempt.errorContextPath), 'utf8');
    } catch {
      continue;
    }

    const suggestion = suggestLocators(errorContext);
    const top = suggestion?.candidates[0];
    if (!suggestion || !top || suggestion.confidence === 'none') continue;

    hints.push({
      fullTitle: test.fullTitle,
      file: test.file,
      failed: suggestion.failed.source,
      suggested: top.code,
      score: Math.round(top.score * 100) / 100,
      confidence: suggestion.confidence,
    });
  }

  return hints;
}

export function hintKey(hint: { file: string; fullTitle: string }): string {
  return `${hint.file}\u0000${hint.fullTitle}`;
}

/** Reads locator-hints.json next to a suite's JSON report; missing or broken files give no hints. */
export async function readLocatorHints(reportPath: string): Promise<Map<string, LocatorHint>> {
  const hints = new Map<string, LocatorHint>();
  try {
    const raw: unknown = JSON.parse(await readFile(path.join(path.dirname(reportPath), LOCATOR_HINTS_FILE), 'utf8'));
    if (!Array.isArray(raw)) return hints;
    for (const item of raw) {
      if (
        item &&
        typeof item.fullTitle === 'string' &&
        typeof item.file === 'string' &&
        typeof item.failed === 'string' &&
        typeof item.suggested === 'string' &&
        typeof item.score === 'number' &&
        ['high', 'medium', 'low'].includes(item.confidence)
      ) {
        hints.set(hintKey(item), item as LocatorHint);
      }
    }
  } catch {
    // No hints file: the suite passed, or the test job didn't write one.
  }
  return hints;
}
