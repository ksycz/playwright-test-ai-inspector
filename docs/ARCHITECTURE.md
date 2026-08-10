# Architecture Decisions

Portfolio architecture for a **demo shop + Playwright framework + offline AI QA CLIs**.  
No production backend, database, or external auth provider.

---

## Application layer

### Why React Context?

Simple application state (auth, cart, products). Redux would be unnecessary.

### Why Tailwind?

Fast, consistent UI for a testable demo — not a CSS showcase.

### Why static `/api` JSON (Vite `public/api`)?

Enables Playwright `request` API tests and a real `fetch` client without a backend.  
Missing `/api/*` paths return JSON 404 (not SPA HTML); non-GET methods return JSON 405.

Auth stays Local Storage–only — credentials are **not** exposed under `/api`.

### Why `ProductsProvider` + fetch?

UI and `@api` tests share one HTTP contract. Loading/error UI is accessible (`role="status"` / `role="alert"`).

---

## Testing layer

### Why Page Object Model?

Maintainability and separation of concerns across smoke/e2e journeys.

### Why tagged suites (`@smoke`, `@e2e`, `@api`, `@visual`)?

Fast feedback locally and parallel CI matrix jobs with clear intent.

### Why viewport-only visual snapshots?

Full-page heights drifted between macOS and Linux CI. Fixed `1280×720` shots keep dimensions stable.

### Why project-local browsers (`.playwright-browsers`)?

Avoids global Playwright cache permission issues; all scripts set `PLAYWRIGHT_BROWSERS_PATH`.

---

## AI / QA tooling layer

All CLIs live under `ai/`, run offline with Node (`--experimental-strip-types`), and write under gitignored `ai-reports/` by default.

| Module | Role |
|---|---|
| Failure Analyzer | Collect artifacts → classify → Markdown/HTML reports (optional LLM) |
| Flaky Detector | Parse Playwright JSON for flaky vs hard-fail |
| Failure Trends | Append JSONL history → trend Markdown |
| Run / PR Summary | Multi-suite Markdown + sticky PR comments |

### Why AI Failure Analyzer?

Reduce investigation time, improve debugging, demonstrate practical AI usage without replacing engineering judgment.

### Why reuse flaky detector + classifier in later modules?

Keeps one source of truth for suite outcomes and failure categories (trends + PR summaries).

---

## CI

- Matrix: `smoke`, `e2e`, `api`, `visual`
- Always upload `playwright-json-<suite>` for summaries
- On failure: HTML report + full `test-results/`
- `ai-unit` job: `npm run test:ai`
- PR-only job: sticky AI run summary comment

See README architecture diagram and [`docs/TESTING.md`](./TESTING.md).
