# Exploratory testing agent (P12-M1)

Drives the running demo shop through [Playwright MCP](https://github.com/microsoft/playwright-mcp) and tries to break the flows described in `docs/APP_SPEC.md`. It reports findings as reproducible steps. It does not write tests; a person decides which findings become specs.

```bash
npm run dev            # in one terminal
npm run explore        # in another
npm run explore -- --charters cart --no-llm --budget 150
```

Output goes to `ai-reports/explorer/` (git-ignored):

- `report.md`: charter table, then one section per finding with expected, actual, spec reference, steps and screenshot
- `findings.jsonl`: one finding per line, for later milestones (seeded-bug metrics, finding → draft spec)
- `screenshots/`: one PNG per finding, taken after the confirming run
- `console-*.log`: browser console per page, written by Playwright MCP

## Two layers

| Layer | Runs | What it does |
|---|---|---|
| Probes | Always | 13 scripted checks across three charters (cart, checkout, auth). Each one maps to a requirement in `APP_SPEC.md`. Expected values come from `app/src/data/products.json`, not from the page. |
| Model | Only with `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) and without `--no-llm` | A tool-calling loop that gets the charter's requirements and the MCP browser tools, and tries unusual input, repeated clicks, back navigation and reloads. |

Anthropic is used when its key is set (`ANTHROPIC_MODEL` overrides the model, same variable as the failure analyzer); otherwise OpenAI (`OPENAI_MODEL`).

## Guardrails

- **Bounded:** one shared tool-call budget (`--budget`, default 400). The model also gets per-charter limits: `--model-steps` (browser calls, default 30) and `--model-turns` (model requests, default 40). A full probe run uses about 220 calls.
- **One origin:** `--base-url` must be localhost. The session refuses navigation elsewhere, and MCP starts with `--allowed-origins` set to the shop, so the browser blocks other origins too.
- **Small tool set for the model:** navigate, back, snapshot, click, type, press key, select option, wait. No `evaluate`, no `run_code`, no uploads, no tabs.
- **Untrusted page text:** what the model sees is redacted and wrapped in `<<<UNTRUSTED_PAGE>>>` delimiters that page content cannot close (same approach as Phase 10).
- **Reproducible or dropped:** a failing probe is run a second time from a fresh state (storage cleared); it is reported only if it fails the same way. A model finding must cite a requirement from the charter word for word, and its steps are replayed from a fresh state; it is kept only if the evidence text is on the page after replay. Everything else is listed under "Dropped".
- **Escaped report:** model-written fields are escaped before they go into Markdown.

## Browser

By default MCP uses the Chromium this repo installs for Playwright (`.playwright-browsers/`). Override with `--executable-path` or `EXPLORER_EXECUTABLE_PATH`. In containers that run as root, add `--no-sandbox` (or `EXPLORER_NO_SANDBOX=1`).

## Limits

Honest list; each one is a reason the agent reports and drafts but never decides.

| Limit | What it means in practice | What keeps it in check |
|---|---|---|
| **Coverage** | The 13 probes find only what they were written to check. Seeded-bug score: 4 of 5; the miss (`detail-adds-twice`) is outside every probe. | The model layer is meant to look further; `explore:eval` measures both layers the same way. |
| **Same author, same blind spots** | The probes and the seeded bugs come from the same spec, and the drafted tests largely duplicate the existing smoke suite. | One seeded bug is deliberately uncovered; drafts are reviewed for duplication before merging. |
| **Cost** | Each model run calls a paid API, roughly once per turn, and pays for every page snapshot it reads. | Opt-in only (needs a key), never in CI, capped by `--model-turns` (40) and `--model-steps` (30) per charter, page text truncated to 8,000 characters. Set a spend limit in the provider console. |
| **Nondeterminism** | Two model runs on the same shop can explore differently and report different things. | Findings must reproduce from a clean state, cite a spec line word for word, and show their evidence again after replay. Probes stay deterministic. |
| **Budget cuts runs short** | When the step budget runs out, the remaining charters are skipped. | The report marks them `not run: step budget used up`. A full probe run uses about 220 of the default 400. |
| **Runtime** | One explore run is about a minute; `explore:eval` is about 6 (one dev server per bug). | Not in CI; run it when detection logic changes. |
| **Evidence is a text match** | A replayed model finding is confirmed when its evidence text is on the page, which says the page shows something, not that it's wrong. | Still labelled "needs human review"; drafts from model findings are `test.fixme` until a person writes the assertion. |
| **Spec as the oracle** | Charters come from `docs/APP_SPEC.md`. A rule that isn't written there can't be broken. | Tests check that every probe and seeded bug cites a real charter line. |
| **Tool version** | `@playwright/mcp` is pinned (0.0.84); tool names and arguments change between versions (`ref` became `target`). | Pinned in `package.json` and `.mcp.json`; Renovate proposes updates for review. |

## Seeded-bug evaluation (P12-M2)

How do you know the explorer works? Plant known bugs and count how many it catches.

```bash
npm run explore:eval -- --no-llm          # about 6 minutes, probes only
npm run explore:eval -- --bugs cart-remove-noop,cart-not-saved --no-llm
```

The command starts its own dev server on port 5174 for each scenario. It runs once on the clean shop and once per bug, with `VITE_SEEDED_BUGS=<bug>`. It writes `ai-reports/explorer-eval/evaluation.md`, one report folder per scenario, and appends one line to `history.jsonl`.

| Seeded bug | What it breaks | Probe that should catch it |
|---|---|---|
| `cart-remove-noop` | Remove does nothing | `cart-remove-item` |
| `cart-total-ignores-quantity` | Total ignores quantity | `cart-increase-quantity` |
| `checkout-email-not-checked` | `not-an-email` is accepted | `checkout-invalid-email` |
| `cart-not-saved` | A reload empties the cart | `cart-persists-after-refresh` |
| `detail-adds-twice` | Add on the product page adds 2 | none, on purpose |

`detail-adds-twice` sits where no probe looks, so the score shows a real blind spot rather than a flattering 100%. It's the case the model layer has to earn its cost on.

Scoring:

- **Caught** = a finding in that bug's run cites one of the spec requirements the bug breaks (`SEEDED_BUG_SPECS` in `evaluate.mts`).
- **False positive** = any finding on the clean shop.
- **Other findings** = findings in a bug run that cite something else. Usually knock-on effects: `cart-not-saved` also breaks every probe that reloads the cart page.

First measured run (2026-11-08, probes only): **4 of 5 caught, 0 false positives**, 6 minutes.

The bugs live in the app behind `isSeeded()` (`app/src/seededBugs.ts`). They only switch on in the Vite dev server with `VITE_SEEDED_BUGS` set; `npm run build` never includes them, and they're off in every normal test run.

## Finding → draft spec (P12-M3)

```bash
npm run explore:draft -- --finding cart-increase-quantity
npm run explore:draft -- --finding cart-increase-quantity --findings ai-reports/explorer-eval/cart-total-ignores-quantity/findings.jsonl
npm run explore:draft -- --finding cart-increase-quantity --pr --dry-run   # print the git/gh commands
npm run explore:draft -- --finding cart-increase-quantity --pr             # branch, commit, push, draft PR
```

The explorer now records each step as an action (open a path, click a role + name, type into a label), and each probe records the checks it expected (cart total, badge, row shown or gone, URL, invalid field, visible text). `draft.mts` turns those into a spec:

- steps map to page objects: `productsPage.addToCart(...)`, `cartPage.increaseQuantityButton(...)`, `checkoutPage.fillForm({...})`; a login with the demo user becomes `loginViaUi(page)`; anything else falls back to `getByRole` / `getByLabel` with `exact: true`;
- checks become `expect` lines on the same objects;
- every value from a finding goes into the file as an escaped string literal or a one-line comment, never as code, so model text can't inject code;
- if a step was a model click by ref, or there are no checks (model findings), the spec is written with `test.fixme` and a TODO.

`--pr` fetches `origin/main`, creates `explored/<id>` from it, commits only the spec, pushes, and opens a **draft** PR (via `gh api`) whose description has the four sections: what changed, the problem, how to test, risk.

Verified on the seeded bugs from P12-M2: drafts for `cart-remove-item`, `cart-increase-quantity` and `checkout-invalid-email` pass on the clean shop and each fails only with its own bug switched on (5 repeats, no flakes). All three duplicate existing smoke tests, so none were committed; one is kept as a sample in `docs/samples/`.
