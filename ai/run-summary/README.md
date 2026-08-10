# AI Run / PR Summary (Phase 8)

Offline CLI that turns one or more Playwright JSON reports into a **PR-comment-friendly Markdown summary**.

Reuses:

- Flaky detector (expected / unexpected / flaky counts + test titles)
- Failure classifier (category tags on hard-fail error text)

## One-command demo

```bash
npm run analyze:summary -- \
  --suite smoke ai/flaky-detector/fixtures/hard-fail.json \
  --suite e2e ai/flaky-detector/fixtures/flaky-then-pass.json
```

Writes `ai-reports/run-summary.md` and prints Markdown to stdout.

## Local usage after a suite run

```bash
npm run test:smoke
npm run analyze:summary -- --suite smoke test-results/playwright-results.json

# Multiple suites (paths from separate CI artifacts / local runs)
npm run analyze:summary -- \
  --suite smoke path/to/smoke/playwright-results.json \
  --suite e2e path/to/e2e/playwright-results.json \
  --suite api path/to/api/playwright-results.json \
  --title "PR Playwright summary" \
  --out ai-reports/run-summary.md
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | Summary written; overall not `failed` |
| `1` | CLI / IO error |
| `2` | Summary written; overall `failed` (hard failures present) |

## CI / PR comments

On `pull_request`, the Playwright workflow:

1. Uploads `playwright-results.json` per matrix suite (always)
2. Runs a `run-summary` job that builds Markdown from available suite JSONs
3. Posts (or updates) a PR comment via `gh`

See `.github/workflows/playwright.yml`.

## Commands

```bash
npm run test:ai
npm run analyze:summary -- --help
```
