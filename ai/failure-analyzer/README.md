# Failure Analyzer (Phase 3)

Local CLI that collects Playwright failure artifacts, classifies them heuristically, and writes Markdown or HTML investigation reports. Optional LLM root-cause suggestions when an API key is configured.

## One-command analyze flow

After a local or CI failure:

```bash
# Point at a Playwright test-results failure folder
npm run analyze:report -- test-results/<failed-test-folder> --format both
```

That single command:

1. Collects screenshots, video, trace, and `error-context.md`
2. Classifies the failure (`assertion`, `timeout`, `locator`, `network`, `auth`, or `unknown`)
3. Writes Markdown + HTML investigation reports under `ai-reports/` (gitignored)

Try the golden fixture without running Playwright:

```bash
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html
open ai-reports/sample-failure.html
```

Sanitized sample Markdown: [`docs/samples/failure-investigation-report.md`](../../docs/samples/failure-investigation-report.md).

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

# Optional LLM suggestions (requires OPENAI_API_KEY or ANTHROPIC_API_KEY)
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --llm
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --no-llm
```

`--format` accepts `md` (default), `html`, or `both`. With `both`, `--out` is treated as a directory.

If `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set, suggestions are attempted automatically unless `--no-llm` is passed. Without keys, reports stay fully offline.

## Analyze CI failure artifacts

When GitHub Actions uploads `test-results/` on failure:

1. Open the failed workflow → **Artifacts** → download `test-results-smoke` or `test-results-e2e`
2. Unzip locally (folders mirror Playwright's `test-results/<test>-chromium/` layout)
3. Run:

```bash
npm run analyze:report -- ./path/to/unzipped/<failed-test-folder> --format both
```

Optional LLM on CI artifacts (local only — do not commit keys):

```bash
export OPENAI_API_KEY=...   # or ANTHROPIC_API_KEY
npm run analyze:report -- ./path/to/unzipped/<failed-test-folder> --llm --format html
```

CI already runs `npm run test:ai` so analyzer unit tests stay green on every push/PR.

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
