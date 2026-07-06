# Lessons Learned

A running log of technical discoveries and learning notes from this project.

---

## 2026-07-06 — Playwright setup in this repository

### Repository layout

This project keeps the **application** and **tests** separate:

| Location | Purpose |
|---|---|
| `app/` | React demo shop (Vite dev server on port 5173) |
| Root + `tests/` | Playwright test runner |

Playwright lives at the **repo root**, not inside `app/`. When `npm test` runs, Playwright:

1. Starts the Vite dev server (unless one is already running)
2. Opens Chromium
3. Runs specs from `tests/`
4. Shuts down and writes a report

```text
playwright-test-ai-inspector/
├── playwright.config.ts      # central test configuration
├── package.json              # Playwright scripts + dependencies
├── .playwright-browsers/     # Chromium downloaded here (gitignored)
├── tests/
│   └── smoke/
│       └── app-foundation.spec.ts
├── test-results/             # artifacts from last run (gitignored)
└── playwright-report/        # HTML report (gitignored)
```

**Smoke tests** (`tests/smoke/`) are fast checks that the app basically works. Later suites (`e2e/`, `auth/`, `cart/`) will be added in Phase 2.

---

### `playwright.config.ts` — key options

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix app',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

| Option | What it does |
|---|---|
| `testDir` | Only runs files under `tests/` (Cypress equivalent: `e2e` folder) |
| `fullyParallel` | Tests in different files can run at the same time |
| `forbidOnly` | Blocks `.only` tests in CI |
| `retries` / `workers` | Local: 0 retries, multiple workers. CI: 2 retries, 1 worker |
| `reporter: 'html'` | Open with `npm run report` after a run |
| `baseURL` | `page.goto('/')` resolves to `http://localhost:5173/` (like Cypress `baseUrl`) |
| `trace: 'on-first-retry'` | Saves a detailed trace on retry — useful for debugging and future AI Failure Analyzer |
| `projects` | One browser/viewport combo per project; add firefox, mobile, etc. later |
| `webServer` | Starts the app before tests; `reuseExistingServer` reuses a running dev server locally |

**`webServer` behaviour:**

| Situation | What happens |
|---|---|
| Before tests | Runs `npm run dev --prefix app` |
| Waits until | `http://localhost:5173` responds |
| Local dev | Reuses server if `npm run dev` is already running |
| CI | Always starts a fresh server |

No need to start the app manually for `npm test`, but you can — Playwright will detect it.

---

### Writing tests — Cypress vs Playwright

Current smoke spec (`tests/smoke/app-foundation.spec.ts`):

```ts
import { test, expect } from '@playwright/test';

test.describe('P1-M1 — Project Foundation', () => {
  test('P1-M1-01: app dev server serves the root page', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Demo Shop' })).toBeVisible();
  });

  test('P1-M1-02: page has document title and main landmark', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Demo Shop');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
```

| Cypress | Playwright |
|---|---|
| `describe` / `it` | `test.describe` / `test` |
| `cy.visit('/')` | `await page.goto('/')` |
| `cy.contains('Demo Shop')` | `page.getByRole('heading', { name: 'Demo Shop' })` |
| `cy.title().should('eq', ...)` | `await expect(page).toHaveTitle('Demo Shop')` |
| `cy.get('[data-testid]')` | `page.getByTestId(...)` — only when roles are not enough |

**`{ page }` fixture** — Playwright injects a browser tab. Similar to Cypress's `cy`, but explicit and async. More fixtures (`context`, custom `loggedInPage`) come in Phase 2.

**`getByRole`** — maps to accessibility roles. Stable and aligned with project rules. Prefer over CSS selectors.

**Auto-waiting** — `await expect(locator).toBeVisible()` retries until visible or timeout. No arbitrary waits.

---

### npm scripts

| Script | Purpose |
|---|---|
| `npm run setup` | One-time: install deps + Chromium |
| `npm test` | Headless run of all tests |
| `npm run test:ui` | Interactive UI mode — great for learning/debugging |
| `npm run test:headed` | See the real browser while tests run |
| `npm run report` | Open last HTML report |
| `npm run playwright:install` | Download Chromium to `.playwright-browsers/` |

**`PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers`** — browsers install into the project folder instead of `~/Library/Caches/ms-playwright`. This avoids permission issues when the global cache is owned by root. Always use the npm scripts so this env var is set for both install and test runs.

---

### What happens when you run `npm test`

```text
1. Playwright reads playwright.config.ts
2. webServer starts: npm run dev --prefix app
3. Polls http://localhost:5173 until ready
4. Launches Chromium (from .playwright-browsers/)
5. Runs tests/smoke/app-foundation.spec.ts (2 tests, parallel)
6. Writes playwright-report/ and test-results/
7. Stops webServer (if it started it)
8. Prints pass/fail summary
```

---

### Artifacts (gitignored)

| Folder | Contents |
|---|---|
| `test-results/` | Screenshots, traces, error context per failed test |
| `playwright-report/` | HTML report from `reporter: 'html'` |
| `.playwright-browsers/` | Downloaded Chromium (~265 MB) |

These will feed the future **AI Failure Analyzer** (traces, screenshots, stack traces).

---

### Environment setup notes

- **Node.js 22.12+** required (see `.nvmrc`). Vite 7 needs `^20.19.0 || >=22.12.0`.
- **`nvm`** must be loaded in `~/.zshrc` — otherwise the shell falls back to an older system Node.
- **`playwright install` can look stuck** — it downloads ~265 MB of browsers. If the global cache has permission issues, use `npm run playwright:install` (project-local path).
- **Root `npm install`** installs Playwright; **`npm install --prefix app`** installs the React app. Both are needed.

---

### Useful commands

```bash
# Run only smoke tests
npm test -- tests/smoke

# Run one test by name
npm test -- -g "P1-M1-01"

# Debug mode (step through)
npx playwright test --debug tests/smoke/app-foundation.spec.ts

# UI mode (best for learning)
npm run test:ui
```

---

### Not built yet (by design)

Phase 2 will add Page Object Model, auth fixtures, centralized test data, more suites, and CI. P1-M1 keeps tests inline in the spec file to learn Playwright basics first.
