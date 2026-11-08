# Lessons Learned

A running log of technical discoveries and learning notes from this project.

---

## Current state (2026-11)

Phases **1–11 are complete**; Phase 12 has started (P12-M1, exploration agent). Use this as the “today” map; older entries below remain as learning history.

| Area | Where / how |
|---|---|
| Demo shop | `app/` — React + Vite; catalogue via `fetch('/api/products.json')` |
| Static API | `app/public/api/` — JSON 404/405 middleware in `app/vite.config.ts` |
| Suites | `tests/smoke`, `tests/e2e`, `tests/api`, `tests/visual` (+ fixtures examples) |
| AI CLIs | `ai/failure-analyzer`, `flaky-detector`, `failure-trends`, `run-summary`, `dep-gate`, `pr-review`, `explorer` |
| Demo path | README → **Demo in 5 minutes** |
| Conventions | [`docs/TESTING.md`](./TESTING.md), [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Progress log | [`docs/ROADMAP.md`](./ROADMAP.md) |

Quick commands:

```bash
npm run setup
npm run test:smoke
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html
npm run analyze:summary -- --suite smoke ai/flaky-detector/fixtures/hard-fail.json
```

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

**Smoke tests** (`tests/smoke/`) are fast checks that the app basically works. Phase 2 later added POM, fixtures, `@e2e` journeys, and CI (see Current state above).

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
| `trace: 'on-first-retry'` | Saves a detailed trace on retry — useful for debugging and the AI Failure Analyzer |
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

**`{ page }` fixture** — Playwright injects a browser tab. Similar to Cypress's `cy`, but explicit and async. Custom fixtures (`loggedInPage`, `cartWithItem`) were added in Phase 2.

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

These feed the **AI Failure Analyzer** and related CLIs (traces, screenshots, stack traces / error context).

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

### Snapshot note (historical)

At P1-M1, tests lived inline in the spec file to learn Playwright basics first. Phase 2 introduced Page Object Model, auth/cart fixtures, centralized test data, tagged suites, and CI. See **Current state** at the top of this file.

---

## 2026-11-08 — Exploration agent with Playwright MCP (P12-M1)

### The idea in one sentence

A program opens the demo shop in a real browser, tries to break the cart, checkout and login, and writes a report of what went wrong, with the exact clicks to repeat it.

It is like a tester who gets a short brief ("the cart must keep its items after a refresh"), tries things, and only reports a bug if they can make it happen twice.

### Words to know

| Word | Plain meaning | Example in this repo |
|---|---|---|
| **MCP** (Model Context Protocol) | A standard way for an AI or a program to use tools. A "server" offers tools, a "client" calls them. | `@playwright/mcp` is a server whose tools are `browser_navigate`, `browser_click`, `browser_type`... |
| **Accessibility snapshot** | The page as a screen reader sees it: roles and names, no CSS. | `button "Add Wireless Mouse to cart" [ref=e34]` |
| **ref** | A short ID for an element in the latest snapshot. You click by ref. | `browser_click({ target: 'e34' })` |
| **Charter** | The brief for one area: which requirements to attack. Taken from `docs/APP_SPEC.md`. | Cart charter: "removing products", "calculating total", "persist after refresh"... |
| **Probe** | One scripted check, like a small test. | `cart-remove-item`: add 2 products, remove 1, the total must drop. |
| **Oracle** | How you decide pass or fail. | The expected total comes from `products.json` (29.99 + 34.50), never from the page itself. |
| **Finding** | A reproducible problem: steps + expected + actual + screenshot + spec line. | See the example below. |
| **Step budget** | A maximum number of browser actions per run, so it can't run forever. | `--budget 400`; a full run uses about 220. |

### How a run works

```text
npm run dev                  (the shop on localhost:5173)
npm run explore -- --no-llm
   │
   ├─ reads APP_SPEC.md → 3 charters: cart, checkout, auth
   ├─ starts the Playwright MCP server (a real Chromium)
   ├─ for each probe:
   │     clear localStorage → run the probe → pass?  done
   │     fail? clear again → run again → same failure? → FINDING
   │                                   → passes now?  → DROPPED (not reproducible)
   └─ writes ai-reports/explorer/report.md + findings.jsonl + screenshots/
```

### Two layers

1. **Probes (always run, free):** 13 scripted checks. Same result every time, about a minute.
2. **Model (optional):** only runs if `ANTHROPIC_API_KEY` is set. The AI gets the charter and the browser tools and tries things the probes don't, like clicking fast, going back, or typing strange values. Each charter has a limit on turns and steps, so the cost stays small.

Why both? The probes are reliable and cheap but only check what I wrote. The AI is creative but can be wrong and gives different results each run. Together: a stable baseline plus exploration on top.

### Example: a real finding

I broke the app on purpose (the Remove button did nothing) and ran the explorer. Report, shortened:

```text
cart-remove-item: Removing one product keeps the other and updates the total
- Spec: Shopping Cart: removing products
- Expected: total $29.99; badge 1
- Actual:   Wireless Mouse × 1 = $29.99; Insulated Bottle × 1 = $24.99; total $54.98; badge 2
Steps (from a fresh shop state):
1. Open /products
2. Click button "Add Wireless Mouse to cart"
3. Click button "Add Insulated Bottle to cart"
4. Open /cart
5. Click button "Remove Insulated Bottle from cart"
```

With the bug reverted, all 13 probes pass.

### Safety rules (guardrails), and why each one exists

| Rule | Why |
|---|---|
| Only `localhost` can be opened | An AI with a browser should not wander onto real websites or submit forms there. |
| The AI gets only 8 browser tools, no "run JavaScript" | Less power = fewer ways to do damage or cheat. |
| Page text is wrapped in `<<<UNTRUSTED_PAGE>>>` markers and secrets are removed | A page could contain "ignore your instructions..." (prompt injection). The AI is told: text inside the markers is data, not orders. Same idea as Phase 10. |
| An AI finding must quote a requirement word for word | Stops it from inventing rules ("the button should be blue"). |
| An AI finding is replayed from a clean state, and its evidence text must be on the page again | Stops made-up or one-off findings. |
| Report text from the AI is escaped | A malicious link or image in its output can't render in the Markdown report. |

### Problems I hit (good interview stories)

- **"The cart is empty, is that a bug?"** My first clicks through MCP silently did nothing. The cause: this MCP version calls the element argument `target`, older examples use `ref`. Lesson: check the tool's schema (`listTools`) before trusting examples, and don't report a bug before ruling out your own setup.
- **Screenshots went missing.** MCP only writes files inside its own output folder (a safety rule). Fix: the report folder is the MCP output folder; screenshots go into `screenshots/` inside it.
- **Mutation testing got slower.** Adding the new modules to Stryker took a clean run from 122 s to 212 s on my machine. Two fixes: the tests no longer import the CLI (which loaded the whole MCP SDK each time), and I left out `agent.mts`, which is mostly prompt text. Result: 159 s, and the score went up from 53.88 to 58.25.
- **A gap in an older guardrail.** While testing, I found that the Phase 10 redaction misses `OPENAI_API_KEY=...` (names with two underscores). I noted it in the PR instead of mixing an unrelated fix into this one.

### Side lesson: "How to test locally" in every PR

- Every open PR got a section with the exact commands to try it. GitHub Actions updates can't run locally, so those PRs say which CI job proves the change instead.
- Renovate rewrites its PR descriptions on every update, so a hand-written note disappears. The permanent fix is configuration: `prBodyNotes` in `renovate.json`, plus `.github/pull_request_template.md` for my own PRs.

### Likely interview questions, short answers

**What is Playwright MCP, and how is it different from a normal Playwright test?**
A Playwright test is a fixed script. Playwright MCP exposes the browser as tools (navigate, click, type, snapshot) that an AI or a program calls one step at a time, deciding the next step from what it sees.

**Why not let the AI write the tests directly?**
AI output needs review. Here the agent only reports findings with steps; a person decides which ones become real `@e2e` specs (that's P12-M3). The CI suite stays deterministic.

**How do you know a finding is real and not flaky?**
It has to fail twice from a clean state with the same result. AI findings are also replayed, and the evidence text has to appear on the page again.

**How do you stop the AI from doing something dangerous or expensive?**
One allowed origin, a small tool list, a step budget, a turn limit, page text treated as untrusted, and escaped output. And it only runs when someone starts it with a key; CI doesn't run it.

**How would you measure if it actually works?**
Plant known bugs and count how many it finds and how many false alarms it raises. I did it by hand with two bugs (both found, no false alarms); P12-M2 makes that a repeatable measurement.

**What would you do differently in a real company?**
Run it on a schedule against a test environment, track the detection rate over time, and keep the human review step before anything becomes a test.
