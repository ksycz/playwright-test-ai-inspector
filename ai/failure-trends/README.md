# Historical Failure Trends (Phase 7)

Offline CLI that appends Playwright suite summaries to a JSONL history file and renders a Markdown trend report (top failing tests, flaky hotspots, category totals).

No database. No GitHub API. Runtime history stays under gitignored `ai-reports/`.

## One-command demo (fixtures)

```bash
npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl
```

Opens a report with multiple synthetic runs (hard fails + flaky). Written to `ai-reports/trends.md` by default.

## Record a real suite run

After Playwright writes `test-results/playwright-results.json`:

```bash
npm run analyze:trends -- --record
npm run analyze:trends -- --record --suite smoke
npm run analyze:trends -- --record path/to/playwright-results.json --history ai-reports/history/runs.jsonl
```

Then generate the report from local history:

```bash
npm run analyze:trends
npm run analyze:trends -- --out /tmp/trends.md
```

## Commands

```bash
npm run test:ai
npm run analyze:trends -- --help
npm run analyze:trends -- --record ai/flaky-detector/fixtures/hard-fail.json --suite smoke --history /tmp/runs.jsonl
npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl
```

## How it works

1. **Record** reuses the flaky detector’s Playwright JSON walker
2. Hard-fail error text is lightly classified with the failure-analyzer heuristics (timeout/assertion/…)
3. Each run is one JSON line appended to history
4. **Report** aggregates counts across lines: summary, runs table, top failures, flaky hotspots

## Fixtures

- `fixtures/sample-history.jsonl` — multi-run demo history
- `fixtures/malformed-history.jsonl` — ensures bad lines are skipped with warnings

## Defaults

| Setting | Path |
|---|---|
| JSON report input | `test-results/playwright-results.json` |
| History store | `ai-reports/history/runs.jsonl` |
| Trend report output | `ai-reports/trends.md` |
