# Testing Framework Conventions

This document captures the baseline Playwright framework structure introduced in Phase 2.

## Folder structure

- `tests/smoke/` - current smoke regression suite from Phase 1
- `tests/pages/` - Page Object Model classes (Phase 2+)
- `tests/fixtures/` - reusable fixture composition (Phase 2+)
- `tests/data/` - centralized test data and constants (Phase 2+)

## Locator strategy

- Prefer semantic locators: `getByRole`, `getByLabelText`, and visible user-facing text
- Use `data-testid` only when semantic roles and names are insufficient
- Keep locator definitions in page objects once POM migration begins

## Artifacts and reporting

Playwright is configured to:

- write per-test artifacts to `test-results/`
- write the HTML report to `playwright-report/`
- capture screenshots only on failure (`screenshot: 'only-on-failure'`)
- retain video only on failure (`video: 'retain-on-failure'`)
- capture traces on the first retry (`trace: 'on-first-retry'`)
- produce both `list` (CI-friendly console output) and `html` reporters

### Output locations

| Path | Contents |
|---|---|
| `test-results/` | Screenshots, videos, traces (`.zip`), and `error-context.md` per failed/retried test |
| `playwright-report/` | Interactive HTML report from the latest run |

Both directories are gitignored.

### Trace strategy

- **CI (`CI=true`):** tests retry up to 2 times; traces are captured on the first retry so flaky failures include a replayable timeline.
- **Local:** retries are disabled by default; run with `CI=true npm test` to match CI retry/trace behaviour.
- Open a trace file after a failed run:

```bash
npm run trace -- test-results/<test-folder>/trace.zip
```

Playwright prints the exact trace path in the terminal when a retry captures one.

### Debugging workflow

1. Run the suite: `npm test`, `npm run test:smoke`, or `npm run test:e2e`
2. On failure, inspect the HTML report: `npm run report`
3. For step-by-step replay, open the trace zip from `test-results/`: `npm run trace -- <path-to-trace.zip>`
4. For interactive debugging during development: `npm run test:ui` or `npm run test:headed`
5. Check `error-context.md` inside the failing test's `test-results/` folder for a DOM snapshot summary

These artifact paths are stable for future Phase 3 AI Failure Analyzer integration.

Use `npm run report` to open the latest HTML report.

## Page Object Model

- Page objects live in `tests/pages/` and export from `tests/pages/index.ts`
- Specs import page objects and express user journeys through page methods
- Locators are defined as getters or methods on page object classes
- Reference refactors: `app-layout.spec.ts`, `product-catalogue.spec.ts`, `authentication.spec.ts`

## Centralized test data

- Test data modules live in `tests/data/` and export from `tests/data/index.ts`
- `users.ts` provides demo credentials (`validUser`, `invalidUser`, `demoUsers`)
- `products.ts` mirrors the app catalogue (`catalogue`, `sampleProduct`, `featuredProducts`)
- `checkout.ts` contains `validCheckoutDetails`, `invalidEmailDetails`, and `checkoutFieldErrors`
- Existing smoke specs import shared data from `tests/data/` and setup helpers from `tests/fixtures/`
- Smoke tests are tagged with `@smoke` in describe titles; `npm run test:smoke` filters by tag

## Fixtures

- Custom fixtures live in `tests/fixtures/` and export from `tests/fixtures/index.ts`
- Import `test` and `expect` from `../fixtures` (not `@playwright/test`) when using fixtures
- `loggedInPage` — authenticated session via UI login
- `cartWithItem` — catalogue page with the shared sample product in cart
- Helpers `loginViaUi(page)` and `addSampleProductToCart(page)` are available for gradual adoption
- Example scenarios: `tests/fixtures/fixtures.spec.ts`

## E2E journey suites

- E2E specs live in `tests/e2e/` and are tagged with `@e2e` in describe titles
- Run with `npm run test:e2e` (filters by `@e2e` tag)
- Journeys cover guest purchase (desktop/mobile), checkout auth guard, cart persistence, and returning customer checkout

## Scripts

- `npm test` - full Playwright suite
- `npm run test:smoke` - tests tagged with `@smoke`
- `npm run test:e2e` - tests tagged with `@e2e`
- `npm run report` - open HTML report from `playwright-report/`
- `npm run trace` - open a trace zip (`npm run trace -- <path>`)
- `npm run analyze:failure -- <folder>` - collect Playwright failure artifacts into JSON
- `npm run analyze:report -- <folder>` - write Markdown and/or HTML investigation reports (`--format md|html|both`, default `ai-reports/`)
- `npm run analyze:flaky -- [results.json]` - flag flaky vs hard-fail tests from Playwright JSON report
- `npm run test:ai` - unit tests for AI modules (failure analyzer + flaky detector)

## Continuous Integration

GitHub Actions workflow: `.github/workflows/playwright.yml`

- Triggers on `push` to `main` and on `pull_request`
- Matrix jobs run `test:smoke` and `test:e2e` in parallel with `CI=true`
- Uses Node 22 from `.nvmrc` and project-local browsers via `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers`
- On failure, uploads `playwright-report/` and `test-results/` as artifacts (14-day retention)
- A separate job runs `npm run test:ai` (analyzer unit tests; no browsers required)
- JSON reporter writes `test-results/playwright-results.json` (included in failure artifacts) for `npm run analyze:flaky`

### Analyze downloaded CI artifacts

1. Download the `test-results-<suite>` artifact from the failed workflow
2. Unzip and locate the failed test folder (contains `error-context.md`, screenshots, etc.)
3. Run: `npm run analyze:report -- <folder> --format both`
4. Optionally run: `npm run analyze:flaky -- <unzipped>/playwright-results.json`
5. Open `ai-reports/<folder>.html` locally

Details: [`ai/failure-analyzer/README.md`](../ai/failure-analyzer/README.md), [`ai/flaky-detector/README.md`](../ai/flaky-detector/README.md). Sample report: [`docs/samples/failure-investigation-report.md`](./samples/failure-investigation-report.md).

## AI Failure Analyzer

- Code lives in `ai/failure-analyzer/` (`.mts` ESM modules, no root `"type": "module"` so Playwright JSON imports stay intact)
- `collectFailureContext(path)` normalizes screenshots, videos, traces, and `error-context.md`
- `classifyFailure(context)` adds heuristic category + confidence (`assertion`, `timeout`, `locator`, `network`, `auth`, `unknown`)
- `generateMarkdownReport(context)` / `generateHtmlReport(context)` build investigation reports with category-specific next steps
- Optional LLM root-cause suggestions via `suggestRootCause` + `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (offline without keys)
- Golden fixtures under `ai/failure-analyzer/fixtures/` drive `npm run test:ai`
- One-command flow: `npm run analyze:report -- <failure-folder> --format both`

## Flaky Test Detector

- Code lives in `ai/flaky-detector/`
- Reads Playwright JSON (`status: flaky | unexpected | expected | skipped`)
- `npm run analyze:flaky` defaults to `test-results/playwright-results.json`

## Naming

- Spec files: `kebab-case.spec.ts`
- Milestone IDs in smoke tests: `P1-Mx-yy`
- Page object classes: `PascalCase` with `Page` suffix
