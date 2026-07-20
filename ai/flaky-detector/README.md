# Flaky Test Detector (Phase 4)

Offline CLI that reads a Playwright **JSON** report and flags:

- **Flaky** — failed on an earlier attempt, then passed on retry
- **Hard fail (unexpected)** — failed on all attempts

## One-command flow

```bash
# After a suite run (JSON reporter writes test-results/playwright-results.json)
npm run analyze:flaky

# Against a fixture
npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json
```

## Commands

```bash
npm run test:ai
npm run analyze:flaky
npm run analyze:flaky -- test-results/playwright-results.json --out ai-reports/flaky.md
```

## How to produce the JSON report

Configured in `playwright.config.ts` as:

```ts
['json', { outputFile: 'test-results/playwright-results.json' }]
```

On CI, enable retries (`retries: 2` when `CI=true`) so flaky tests can surface in the JSON report.

## Fixtures

- `fixtures/flaky-then-pass.json` — failed then passed
- `fixtures/hard-fail.json` — failed all retries
- `fixtures/all-pass.json` — stable pass
