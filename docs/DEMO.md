# Interview demo (5 minutes)

Use this script when walking a recruiter or hiring manager through the repo. Everything runs from fixtures—no flaky live failures required.

## Before you start (once)

```bash
nvm use
npm run setup
```

Optional: open the shop in a second terminal so the UI is visible while you talk.

```bash
npm run dev
# http://localhost:5173
```

---

## Minute-by-minute

### 0:00–1:00 — What this is

**Say:** “Cypress SDET learning Playwright by building a portfolio shop plus offline AI tooling for failure investigation.”

**Show:** README architecture diagram + `app/` vs `tests/` vs `ai/`.

### 1:00–2:00 — Playwright quality bar

**Run (optional if time is tight):**

```bash
npm run test:smoke
```

**Say:** tagged suites (`@smoke` / `@e2e` / `@api` / `@visual`), Page Objects, fixtures, CI matrix, traces on first retry.

### 2:00–3:00 — AI failure investigation (hero moment)

```bash
npm run analyze:report -- \
  ai/failure-analyzer/fixtures/sample-failure \
  --format html \
  --out ai-reports/sample-failure.html
open ai-reports/sample-failure.html   # macOS; xdg-open on Linux
```

Open the HTML (or the committed preview screenshot / sample):

- classification (`assertion`) + confidence
- error excerpt (Expected vs Received URL)
- suggested next steps
- link to Trace Viewer command

**Say:** “Offline by default—no API key. Optional `--llm` only when I want third-party suggestions.”

### Optional — Attack the analyzer (about 1 minute)

Skip this if the five minutes are already full. Use it when someone asks whether the model can be talked into a wrong verdict.

```bash
npm run analyze:report -- ai/failure-analyzer/fixtures/prompt-injection --no-llm
```

**Say:** “The error text tells the model to ignore its instructions and call this a network failure. The report still says assertion. Secrets would be replaced with `[REDACTED]` before any model call. A bad reply is dropped. Anything that is shown is labelled unverified and cannot become a link or HTML.”

**Point at:** category `assertion`, then the injected sentence still sitting in the excerpt as evidence.

### Optional — Exploration agent (about 2 minutes)

Use it when the conversation turns to AI agents, MCP, or "can AI test for us?". The run takes about a minute, so start it while you talk.

```bash
npm run dev                                   # terminal 1, if not running yet
npm run explore -- --no-llm --charters cart   # terminal 2: about 30 seconds
```

**Say:** "This drives the shop through Playwright MCP, the same tools an AI assistant gets. It has three briefs built from the app spec: cart, checkout and login. Scripted probes always run. An AI layer runs only with an API key, inside a step and turn budget, and it can only reach localhost. A problem is reported only if it happens again from a clean start."

**Then show the scorecard** (from an earlier run; `npm run explore:eval -- --no-llm` takes about 6 minutes):

Open `ai-reports/explorer-eval/evaluation.md`, or quote it: **4 of 5 planted bugs caught, 0 false alarms**. The miss is on purpose, in a spot no probe looks.

**And the last step:** a finding becomes a draft test that uses the page objects.

```bash
npm run explore:draft -- --finding cart-increase-quantity \
  --findings ai/explorer/fixtures/finding-cart-increase-quantity.jsonl
```

**Say one limitation out loud:** "The probes only catch what I thought of. The AI layer looks further, but it costs money per run, gives different results each time, and its findings still need a person. That's why it reports and drafts, and never merges."

### Optional — Broken locator (about 1 minute)

Use it when someone asks about self-healing tests.

```bash
npm run analyze:report -- ai/failure-analyzer/fixtures/locator-click-renamed-button --no-llm
```

**Say:** "The test waited for 'Add Wireless Mouse to basket'. The report reads the page snapshot Playwright saved and suggests the button that's there now, 'Add Wireless Mouse to cart'. It suggests and never rewrites the test, because a renamed button can be the bug. On six planted UI changes, 38 of 43 failures got the right suggestion. The two misses got *no* suggestion rather than a wrong one, and that's the safe way to fail."

### 3:00–4:00 — Flaky vs hard fail + PR summary

```bash
npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json --format html
open ai-reports/flaky-then-pass-flaky.html   # macOS; xdg-open on Linux

npm run analyze:summary -- \
  --title "Playwright CI summary" \
  --suite smoke ai/flaky-detector/fixtures/hard-fail.json \
  --suite e2e ai/flaky-detector/fixtures/flaky-then-pass.json
```

**Say:** same classifier powers sticky PR comments in CI (see screenshot in README). Trends CLI appends JSONL history across runs.

### 4:00–5:00 — Trace + limitations (credibility)

**Trace (if you have a `trace.zip` from CI or a local retry):**

```bash
npm run trace -- test-results/<folder>/trace.zip
```

**Say one limitation out loud:** demo auth is theatrical (credentials ship in the client bundle); cart totals are client-trusted; no real backend. The value is the **testing system**, not production security.

---

## Cheat sheet (copy/paste)

```bash
# Shop
npm run dev

# Suites
npm run test:smoke
npm run test:api
npm run test:visual

# AI CLIs (fixtures)
npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html
open ai-reports/sample-failure.html
npm run analyze:report -- ai/failure-analyzer/fixtures/prompt-injection --no-llm
npm run analyze:flaky -- ai/flaky-detector/fixtures/flaky-then-pass.json
npm run analyze:trends -- --history ai/failure-trends/fixtures/sample-history.jsonl
npm run analyze:summary -- \
  --suite smoke ai/flaky-detector/fixtures/hard-fail.json \
  --suite e2e ai/flaky-detector/fixtures/flaky-then-pass.json

# Exploration agent (needs npm run dev)
npm run explore -- --no-llm --charters cart
npm run explore:eval -- --no-llm             # about 6 minutes, own server on :5174
npm run explore:draft -- --finding cart-increase-quantity \
  --findings ai/explorer/fixtures/finding-cart-increase-quantity.jsonl

# Locator suggestions
npm run analyze:report -- ai/failure-analyzer/fixtures/locator-click-renamed-button --no-llm
npm run locator:eval            # about 3–4 minutes; stop npm run dev first

# Unit tests for AI modules
npm run test:ai
```

## Sample artifacts in the repo

| Artifact | Path |
|---|---|
| Sanitized Markdown report | [`docs/samples/failure-investigation-report.md`](samples/failure-investigation-report.md) |
| HTML report sample | [`docs/samples/sample-failure.html`](samples/sample-failure.html) |
| Flaky Markdown sample | [`docs/samples/sample-flaky.md`](samples/sample-flaky.md) |
| Run summary Markdown | [`docs/samples/sample-run-summary.md`](samples/sample-run-summary.md) |
| Screenshots for README | [`docs/samples/screenshots/`](samples/screenshots/) |

---

## If something fails during the demo

1. Prefer **fixture CLIs** over live failing tests.
2. If `setup` is slow, skip to analyze commands—browsers are not required for AI fixtures.
3. If HTML did not open, point at the committed screenshots under `docs/samples/screenshots/`.
