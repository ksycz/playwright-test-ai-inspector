# Agent guide

Playwright test framework and AI testing tools around a React demo shop. Written for Claude Code, Codex, Cursor and any agent that reads `AGENTS.md`; `CLAUDE.md` imports this file.

Commands live in `package.json` scripts and `docs/TESTING.md`. This file holds what those do not say.

## Work test-first

Before building a feature, write down the user scenarios, the future Playwright tests, the accessibility needs and the locator strategy. Start implementing once the testing strategy is clear. After each milestone, summarise what changed and why, propose a Conventional Commit message, and wait for approval.

## Tests

- Locate with `getByRole`, then label or text. Add `data-testid` only when no semantic locator fits.
- Wait on a locator, a response or a web-first assertion. `no-wait-for-timeout` fails lint.
- Put page interactions in `tests/pages` and setup in `tests/fixtures`. Specs read as scenarios.
- Put every `await expect(...)` assertion in the test or in a helper named `expectSomething`. The lint gate counts only those as assertions.
- Tag each test `@smoke`, `@e2e`, `@api` or `@visual`; CI selects suites by tag.
- Keep one command per README demo block so each can be copied alone.

## Spec is the ground truth

`docs/APP_SPEC.md` defines the app's behaviour. Quote the exact spec line before reporting a defect or drafting a test; the explorer rejects a finding whose `requirement` is not copied verbatim from its charter. Add or change a spec section before changing behaviour.

## AI code

- Treat model output as untrusted: validate it against a strict hand-written schema, escape it before it reaches HTML or a PR comment, and fall back to the rule-based result when validation fails.
- Suggest fixes in reports and comments; a human applies them.
- Keep temperature at 0.2 or lower where the API accepts one.
- Read keys from the environment only; keep them out of logs and fixtures.
- Test code under `ai/` with `node --test` files next to it. Code in `stryker.config.json`'s mutation scope must keep a mutation score of 47 or higher, and the AI provenance gate enforces the same bar on files an AI touched.
- Prove a new check works by seeding a bug with `VITE_SEEDED_BUGS` and watching the check go red.

## Dependencies

The dependency gate (`npm run analyze:deps`) runs before any install and requires a package that is at least 7 days old with at least 1,000 weekly downloads. Install with `--ignore-scripts` (`.npmrc` sets it). Pin Playwright and Playwright MCP to one version each.

## Checks before you push

Run `npm run lint:tests`, `npm run test:ai` and `npm run build`. `main` requires the single `CI result` check; the jobs behind it are listed in `docs/TESTING.md`.

## Pull requests

Every description has four headings: **What changed**, **What problem it solves**, **How to test locally**, **Risk**. Write them for a reader who has not seen the code.
