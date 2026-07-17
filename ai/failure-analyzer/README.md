# Failure Analyzer (Phase 3)

Local CLI that collects Playwright failure artifacts, classifies them heuristically, and writes Markdown or HTML investigation reports.

## Commands

```bash
# Unit tests for the analyzer
npm run test:ai

# Collect artifacts + classification as JSON
npm run analyze:failure -- test-results/<failed-test-folder>

# Generate investigation report (default: Markdown → ai-reports/<folder>.md)
npm run analyze:report -- test-results/<failed-test-folder>
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format both
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --out /tmp/report.md
```

`--format` accepts `md` (default), `html`, or `both`. With `both`, `--out` is treated as a directory.
## Output shape

```json
{
  "sourcePath": "/absolute/path/to/failure-folder",
  "collectedAt": "2026-07-17T18:00:00.000Z",
  "artifacts": {
    "screenshots": ["test-failed-1.png"],
    "videos": ["video.webm"],
    "traces": ["trace.zip"],
    "errorContextPath": "error-context.md",
    "otherFiles": []
  },
  "errorContextText": "...",
  "classification": {
    "category": "assertion",
    "confidence": 0.88,
    "matchedSignals": ["assertion:expect assertion mismatch"],
    "summary": "Failure looks like an assertion mismatch (expected vs received)."
  }
}
```

Categories: `assertion`, `timeout`, `locator`, `network`, `auth`, `unknown`.

## Fixtures

- `fixtures/sample-failure/` — golden folder with screenshot, video, trace, and error context
- `fixtures/empty-failure/` — empty folder for edge-case coverage
