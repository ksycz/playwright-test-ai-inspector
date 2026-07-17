# Failure Analyzer (Phase 3)

Local CLI that collects Playwright failure artifacts into normalized JSON for later classification and reporting.

## Commands

```bash
# Unit tests for the collector
npm run test:ai

# Collect artifacts from a failed test folder
npm run analyze:failure -- test-results/<failed-test-folder>

# Write JSON to a file as well as stdout
npm run analyze:failure -- ai/failure-analyzer/fixtures/sample-failure --out /tmp/failure-context.json
```

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
