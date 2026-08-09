import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { mergeCategoryCounts } from './record.mts';
import {
  EMPTY_CATEGORY_COUNTS,
  type RunRecord,
  type TrendSummary,
} from './types.mts';

function isRunRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.recordedAt === 'string' &&
    typeof record.sourcePath === 'string' &&
    typeof record.stats === 'object' &&
    record.stats !== null &&
    Array.isArray(record.failures) &&
    Array.isArray(record.flaky) &&
    typeof record.categories === 'object' &&
    record.categories !== null
  );
}

export async function loadHistory(historyPath: string): Promise<{
  runs: RunRecord[];
  warnings: string[];
  absolutePath: string;
}> {
  const absolutePath = path.resolve(historyPath);
  const warnings: string[] = [];

  try {
    const fileStats = await stat(absolutePath);
    if (!fileStats.isFile()) {
      return { runs: [], warnings: [`History path is not a file: ${absolutePath}`], absolutePath };
    }
  } catch {
    return { runs: [], warnings: [], absolutePath };
  }

  const raw = await readFile(absolutePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const runs: RunRecord[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(line);
      if (!isRunRecord(parsed)) {
        warnings.push(`Skipped malformed history line ${index + 1}: missing required fields`);
        continue;
      }
      runs.push(parsed);
    } catch {
      warnings.push(`Skipped malformed history line ${index + 1}: invalid JSON`);
    }
  }

  return { runs, warnings, absolutePath };
}

export function summarizeTrends(historyPath: string, runs: RunRecord[], warnings: string[]): TrendSummary {
  const totals = {
    expected: 0,
    unexpected: 0,
    flaky: 0,
    skipped: 0,
  };
  let categoryTotals = EMPTY_CATEGORY_COUNTS();
  const failureCounts = new Map<string, { fullTitle: string; file: string; count: number }>();
  const flakyCounts = new Map<string, number>();

  for (const run of runs) {
    totals.expected += run.stats.expected;
    totals.unexpected += run.stats.unexpected;
    totals.flaky += run.stats.flaky;
    totals.skipped += run.stats.skipped;
    categoryTotals = mergeCategoryCounts(categoryTotals, run.categories);

    for (const failure of run.failures) {
      const key = failure.fullTitle;
      const existing = failureCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        failureCounts.set(key, {
          fullTitle: failure.fullTitle,
          file: failure.file,
          count: 1,
        });
      }
    }

    for (const title of run.flaky) {
      flakyCounts.set(title, (flakyCounts.get(title) ?? 0) + 1);
    }
  }

  const topFailingTests = [...failureCounts.values()]
    .sort((a, b) => b.count - a.count || a.fullTitle.localeCompare(b.fullTitle))
    .slice(0, 10);

  const flakyHotspots = [...flakyCounts.entries()]
    .map(([fullTitle, count]) => ({ fullTitle, count }))
    .sort((a, b) => b.count - a.count || a.fullTitle.localeCompare(b.fullTitle))
    .slice(0, 10);

  return {
    historyPath,
    generatedAt: new Date().toISOString(),
    runCount: runs.length,
    totals,
    categoryTotals,
    topFailingTests,
    flakyHotspots,
    runs,
    warnings,
  };
}

export async function analyzeTrends(historyPath: string): Promise<TrendSummary> {
  const { runs, warnings, absolutePath } = await loadHistory(historyPath);
  return summarizeTrends(absolutePath, runs, warnings);
}
