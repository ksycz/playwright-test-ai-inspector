# Testing Framework Conventions

Playwright framework conventions for this repository (Phases 2–9).

## Folder structure

- `tests/smoke/` — smoke regression suite (`@smoke`)
- `tests/e2e/` — end-to-end journeys (`@e2e`)
- `tests/api/` — Playwright `request` contract suite (`@api`)
- `tests/visual/` — screenshot baselines (`@visual`)
- `tests/pages/` — Page Object Model classes
- `tests/fixtures/` — reusable fixture composition
- `tests/data/` — centralized test data and constants

## Locator strategy

- Prefer semantic locators: `getByRole`, `getByLabelText`, and visible user-facing text
- Use `data-testid` only when semantic roles and names are insufficient
- Keep locator definitions in page objects

### When a locator breaks: suggest, don't self-heal

If a test fails because a locator finds nothing, the failure report (`npm run analyze:report`) has a **Locator suggestions** section with the closest elements from the page snapshot. Treat it as a lead, not a fix:

- Check whether the UI change was intended. A renamed or removed button can be the bug.
- If it was intended, update the page object (not the spec), and keep role + accessible name locators.
- No suggestion usually means the element was removed or renamed to something unrelated ("Place order" → "Complete purchase"). Look at the screenshot.

The repo never rewrites locators automatically. Measured on planted UI changes (`npm run locator:eval`): 38 of 43 failures got the right suggestion, 0 were confident but wrong.

## Artifacts and reporting

Playwright is configured to:

- write per-test artifacts to `test-results/`
- write the HTML report to `playwright-report/`
- capture screenshots only on failure (`screenshot: 'only-on-failure'`)
- retain video only on failure (`video: 'retain-on-failure'`)
- capture traces on the first retry (`trace: 'on-first-retry'`)
- print one console line per test (title and duration) plus `html` and JSON reporters

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

1. Run the suite: `npm test`, `npm run test:smoke`, `npm run test:e2e`, `npm run test:api`, or `npm run test:visual`
2. On failure, inspect the HTML report: `npm run report`
3. For step-by-step replay, open the trace zip from `test-results/`: `npm run trace -- <path-to-trace.zip>`
4. For interactive debugging during development: `npm run test:ui` or `npm run test:headed`
5. Check `error-context.md` inside the failing test's `test-results/` folder for a DOM snapshot summary

These artifact paths are consumed by the AI Failure Analyzer and related CLIs.

Use `npm run report` to open the latest HTML report.

## Visual regression (Phase 6)

Native Playwright screenshot assertions (`toHaveScreenshot`) — no external visual service.

### One-command visual tests

```bash
npm run test:visual
```

Runs specs tagged `@visual` (`tests/visual/`). Fixed viewport `1280x720` (viewport shots, not full-page — avoids OS page-height drift), animations disabled, `maxDiffPixelRatio: 0.1` for font AA.

Baselines live next to the spec:

`tests/visual/pages.spec.ts-snapshots/*.png`

### Updating baselines

Only after an intentional UI change:

```bash
npm run test:visual -- --update-snapshots
```

Review the PNG diffs in git before committing.

**CI note:** Baselines are shared across OS (path omits platform). Prefer regenerating inside the Playwright Docker image that matches CI if Darwin vs Linux antialiasing causes noise:

```bash
docker run --rm -it -v "$PWD":/work -w /work -e CI=true \
  mcr.microsoft.com/playwright:v1.57.0-jammy \
  /bin/bash -c "npm ci && npm install --prefix app && npx playwright test --grep @visual --update-snapshots"
```

Coverage: home, products, product detail, login, empty cart, cart with item, checkout form.

## Static API contract (Phase 5)

Read-only JSON served from `app/public/api/` by Vite (no backend):

| Endpoint | Description |
|---|---|
| `GET /api/products.json` | Full catalogue |
| `GET /api/featured-products.json` | Featured products only |

### One-command API tests

```bash
npm run test:api
```

Runs Playwright specs tagged `@api` (`tests/api/`). The Playwright `webServer` starts the Vite app so `/api` is reachable; assertions use the `request` fixture (no UI).

Coverage includes:

- Status `200` + `application/json` content-type
- Required product fields, non-negative prices, unique slugs
- Featured subset aligned with catalogue `featured: true`
- Missing `/api/*` paths → JSON `404` (not SPA HTML)
- Non-GET methods on `/api/*` → JSON `405` with `Allow: GET, HEAD`

Contract notes: `app/public/api/README.md`.  
Demo auth credentials are **not** exposed under `/api`.  
The React app loads the catalogue via `fetch('/api/products.json')` (`ProductsProvider`).  
CI matrix includes the `api` and `visual` suites alongside smoke and e2e.

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
- `npm run test:api` - tests tagged with `@api`
- `npm run test:visual` - screenshot baselines tagged with `@visual`
- `npm run report` - open HTML report from `playwright-report/`
- `npm run trace` - open a trace zip (`npm run trace -- <path>`)
- `npm run analyze:failure -- <folder>` - collect Playwright failure artifacts into JSON
- `npm run analyze:report -- <folder>` - write Markdown and/or HTML investigation reports (`--format md|html|both`, default `ai-reports/`)
- `npm run analyze:flaky -- [results.json]` - flag flaky vs hard-fail tests from Playwright JSON report
- `npm run analyze:trends -- --record [results.json]` - append suite summary to JSONL history
- `npm run analyze:trends -- [--history <file>]` - Markdown failure trend report
- `npm run analyze:summary -- --suite <name> <json> [...]` - multi-suite PR/run Markdown summary
- `npm run test:ai` - unit tests for AI modules, the dependency gate, and the docs-only CI rule
- `npm run analyze:deps -- --base <git-ref>` - check newly added npm packages against the registry
- `npm run tests:audit -- [--grep "@smoke|@e2e"] [--bugs a,b]` - run the suites once on the clean shop and once per planted bug, and list which tests catch which (see below)

### Test audit: are all these tests useful?

`npm run tests:audit` is a way to look at the suite, not a CI gate. It starts the shop with each planted bug from `app/src/seededBugs.ts` switched on (one at a time, plus one clean run), runs the tests, and writes `ai-reports/test-audit/audit.md`:

- **Bugs guarded by a single test:** if that test is removed or breaks, nothing else notices the bug.
- **Bugs that fail many tests at once:** one root cause, many red tests (for example, a cart that isn't saved). Those are not that many independent guards.
- **Tests that failed for none of the planted bugs:** a place to look for redundant tests. It is not a verdict; a test can guard behaviour no planted bug touches. Read the test before removing it.
- **Clean-shop failures:** if any test fails with no bug planted, the results are not trustworthy until it is fixed (the command exits with code 2).

Besides the five bugs the exploration agent is scored on, the shop has 13 `audit-*` bugs in areas those don't touch (login and session, navigation, home page, catalogue, product page, 404 page, images, redirects, cart badge, the API 404, and the header colour for the visual tests). They are kept out of the agent's score and out of `all`; `audit-all` switches them on together. Defaults to every test and every behaviour bug, about a minute per run. `--grep` limits the suites, `--bugs` picks bugs (add `drift-*` names to include label changes). It needs the Playwright browsers installed, so it is run locally, not in CI. Stop `npm run dev` first: the audit starts its own dev server on port 5173 for every run, and stops with a clear message if the port is taken.

## Continuous Integration

GitHub Actions workflow: `.github/workflows/playwright.yml`

- Triggers on `push` to `main` and on `pull_request`
- Matrix jobs run `test:smoke`, `test:e2e`, `test:api`, and `test:visual` in parallel with `CI=true` and 2 workers
- Uses Node 22 from `.nvmrc`. The suite jobs run in the Playwright container image that matches the installed `@playwright/test` version, so Chromium is already there. Local runs still use `.playwright-browsers`.
- Always uploads `playwright-json-<suite>` (`playwright-results.json`) for AI run summaries
- On failure, also uploads `playwright-report/` and full `test-results/` (14-day retention)
- PR job posts/updates a sticky AI run summary comment
- A separate job runs `npm run test:ai` (AI module unit tests; no browsers required)
- JSON reporter writes `test-results/playwright-results.json` for `analyze:flaky` / `analyze:trends` / `analyze:summary`
- A pull request that only changes `docs/` or Markdown files skips the test jobs. A push to `main` still runs them.

### CI gates

Thresholds below are the ones enforced today. The convention review comments and does not fail the job.

| Gate | When it runs | Threshold | How to fix a failure |
|---|---|---|---|
| `npm ci` | Every job that installs dependencies | `package-lock.json` matches `package.json` for the root and for `app/` | Run `npm install` in the directory you changed and commit the lockfile |
| `npm audit --audit-level=high` | `ai-unit` | No high-severity advisory in the root or app lockfile | Upgrade the affected package, or run `npm audit fix` when the fix stays inside the existing version range |
| New dependency gate | Pull requests | A **new** package name must exist on npm, be at least 7 days old, and have at least 1000 weekly downloads | Depend on a package that already clears those bars. A version bump of a package already in the base is not checked here |
| Renovate config | Pull requests and pushes that change `renovate.json` | `renovate.json` passes `renovate-config-validator` | Fix the JSON. Locally: `npx --yes --package renovate@44.221.5 renovate-config-validator` |
| Mutation score | Pull requests that change `ai/` (not Markdown) or `stryker.config.json`, and a nightly run | Score on the logic modules at least 47. Baseline on 2026-11-07 was 52.51 (657 mutants, 45 seconds) | A surviving mutant means a test still passed after the code changed. Strengthen the assertion that covers that line. Report: `reports/mutation/index.html` |
| Test convention review | Pull requests that change `tests/`, `ai/pr-review/`, or `scripts/should-run-review.mjs` | The job exits 0. Findings are comments, not a failing score | The sticky comment names the file and line. Replace `waitForTimeout`, prefer `getByRole`, add `@smoke`, `@e2e`, `@api`, or `@visual`, remove `test.only`, or log in with `loggedInPage` from `auth.fixture` |
| AI provenance | Every pull request | Policy in `.github/ai-provenance.yml` (read from the base branch): AI-touched files that mutation testing covers must score at least 47; no mutation report → gate skipped | The PR comment lists the AI-tagged commits and files and the gate result. Strengthen the tests for the AI-touched files listed, as for the mutation gate. Report: artifact `ai-provenance-<pr>-<attempt>` |

The mutation gate covers `redact.mts`, `markdown.mts`, `pathContainment.mts`, `cliArgs.mts`, `gate.mts`, `classify.mts`, `suggest.mts`, and `analyze.mts`. It uses the TAP runner so a mutant runs the test file that covers it. Report templates and CLI entrypoints are outside this gate. Locally: `npm run test:mutation`.

The convention review is appended to the sticky run-summary comment. A model note is added only when `OPENAI_API_KEY` is set, and that note is labeled unverified. Locally: `npm run analyze:review -- --diff <tests.diff> --no-llm`. In CI the reviewer runs from the base branch's code and rules (a second checkout), not the pull request's, because that step holds the API key. A PR that changes the reviewer is judged by the old one until it merges.

The new-dependency gate names the package and the rule in the log. See the README section **Dependency gate** for a local pass and a local failure.

### Dependency updates

Version updates and vulnerability alerts are split on purpose. Two bots should not open pull requests for the same package.

| Job | Tool | What you see |
|---|---|---|
| Version updates | **Renovate** | Pull requests for npm, GitHub Actions, and `.nvmrc`. npm releases wait 3 days. `@playwright/test`, `playwright`, and `playwright-core` share one pull request. Other non-major devDependency updates are grouped into one Monday pull request and can automerge after CI passes. Major updates stay for review. |
| Vulnerability alerts | **Dependabot alerts** | Entries on the repository Security tab. Dependabot does not open version-update or security-update pull requests. |
| Dependabot version updates | Off | There is no `.github/dependabot.yml`. |

Renovate's rules live in `renovate.json`. The Dependency Dashboard issue lists what is pending, including an npm release that is still inside the 3-day wait.

### Analyze downloaded CI artifacts

1. Download the `test-results-<suite>` artifact from the failed workflow
2. Unzip and locate the failed test folder (contains `error-context.md`, screenshots, etc.)
3. Run: `npm run analyze:report -- <folder> --format both`
4. Optionally run: `npm run analyze:flaky -- <unzipped>/playwright-results.json`
5. Optionally record + report trends: `npm run analyze:trends -- --record <unzipped>/playwright-results.json` then `npm run analyze:trends`
6. Open `ai-reports/<folder>.html` locally

Details: [`ai/failure-analyzer/README.md`](../ai/failure-analyzer/README.md), [`ai/flaky-detector/README.md`](../ai/flaky-detector/README.md), [`ai/failure-trends/README.md`](../ai/failure-trends/README.md), [`ai/run-summary/README.md`](../ai/run-summary/README.md). Sample report: [`docs/samples/failure-investigation-report.md`](./samples/failure-investigation-report.md).

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

## Historical Failure Trends

- Code lives in `ai/failure-trends/`
- Appends run summaries to `ai-reports/history/runs.jsonl` (`--record`)
- Report mode aggregates top failing tests, flaky hotspots, and category totals
- Demo: `npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl`
- Details: [`ai/failure-trends/README.md`](../ai/failure-trends/README.md)

## AI Run / PR Summaries

- Code lives in `ai/run-summary/`
- Multi-suite Markdown via `npm run analyze:summary -- --suite <name> <json>`
- CI uploads `playwright-json-<suite>` always and posts a sticky PR comment on `pull_request`
- Details: [`ai/run-summary/README.md`](../ai/run-summary/README.md)

## Naming

- Spec files: `kebab-case.spec.ts`
- Milestone IDs in smoke tests: `P1-Mx-yy`
- Page object classes: `PascalCase` with `Page` suffix
