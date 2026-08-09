import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { analyzeFlakyReport } from '../flaky-detector/analyze.mts';
import { classifyFailure } from '../failure-analyzer/classify.mts';
import type { FailureCategory } from '../failure-analyzer/types.mts';
import {
  EMPTY_CATEGORY_COUNTS,
  type FailureCategoryCount,
  type RunFailureEntry,
  type RunRecord,
} from './types.mts';

function lastErrorMessage(attempts: { errorMessage: string | null }[]): string | null {
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const message = attempts[index]?.errorMessage;
    if (message) {
      return message;
    }
  }
  return null;
}

function categorizeError(errorText: string | null): FailureCategory {
  const classification = classifyFailure({
    errorContextText: errorText,
    artifacts: {
      screenshots: [],
      videos: [],
      traces: [],
      errorContextPath: null,
      otherFiles: [],
    },
  });
  return classification.category;
}

export async function buildRunRecord(
  reportPath: string,
  options: { suite?: string | null; recordedAt?: string } = {},
): Promise<RunRecord> {
  const analysis = await analyzeFlakyReport(reportPath);
  const categories = EMPTY_CATEGORY_COUNTS();
  const failures: RunFailureEntry[] = analysis.unexpectedTests.map((test) => {
    const lastError = lastErrorMessage(test.attempts);
    const category = categorizeError(lastError);
    categories[category] += 1;
    return {
      fullTitle: test.fullTitle,
      file: test.file,
      lastError,
      category,
    };
  });

  return {
    recordedAt: options.recordedAt ?? new Date().toISOString(),
    sourcePath: analysis.sourcePath,
    suite: options.suite ?? null,
    stats: { ...analysis.stats },
    failures,
    flaky: analysis.flakyTests.map((test) => test.fullTitle),
    categories,
  };
}

export async function appendRunRecord(historyPath: string, record: RunRecord): Promise<string> {
  const absolutePath = path.resolve(historyPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const line = `${JSON.stringify(record)}\n`;
  await appendFile(absolutePath, line, 'utf8');
  return absolutePath;
}

export async function recordRunFromReport(
  reportPath: string,
  historyPath: string,
  options: { suite?: string | null } = {},
): Promise<{ historyPath: string; record: RunRecord }> {
  const record = await buildRunRecord(reportPath, { suite: options.suite ?? null });
  const absoluteHistory = await appendRunRecord(historyPath, record);
  return { historyPath: absoluteHistory, record };
}

export function mergeCategoryCounts(
  target: FailureCategoryCount,
  source: FailureCategoryCount,
): FailureCategoryCount {
  return {
    assertion: target.assertion + source.assertion,
    timeout: target.timeout + source.timeout,
    locator: target.locator + source.locator,
    network: target.network + source.network,
    auth: target.auth + source.auth,
    unknown: target.unknown + source.unknown,
  };
}
