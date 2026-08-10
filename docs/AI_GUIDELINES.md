# Prompt Library & AI Guidelines

Guidelines for AI-assisted work on this repository.

---

## React

Create production-quality React components using TypeScript and Tailwind.

Explain important architectural decisions.

Prefer composition over inheritance.

Keep the demo shop simple: Context API, Local Storage, no real backend.

---

## Playwright

Always use Playwright best practices.

Prefer `getByRole()` over CSS selectors whenever possible.

Avoid arbitrary waits.

Use fixtures and page objects where appropriate.

Respect suite tags: `@smoke`, `@e2e`, `@api`, `@visual`.

---

## Code Review

Review the implementation as a Senior SDET.

Identify:

- maintainability issues
- flaky test risks
- unnecessary complexity
- Playwright anti-patterns

Suggest improvements.

---

## Failure Analyzer (Phase 3)

When generating optional LLM root-cause suggestions for Playwright failures:

- Use only the provided failure context (classification, error excerpt, artifact inventory).
- Do not invent stack traces, network logs, or UI states that were not supplied.
- Prefer Playwright best practices: `getByRole`, fixtures, no arbitrary waits.
- Propose 2–4 concrete debugging hypotheses and 1–3 caveats.
- Never request, log, or repeat API keys or secrets.
- Respond with structured JSON only when asked by the analyzer prompt.

---

## Flaky / Trends / Run Summaries (Phases 4, 7, 8)

When extending offline AI CLIs:

- Prefer reusing `analyzeFlakyReport` and `classifyFailure` over re-parsing Playwright JSON.
- Keep outputs deterministic and fixture-demoable without network calls.
- Do not commit runtime files under `ai-reports/` (gitignored).
- PR summary Markdown should stay compact and comment-friendly.

---

## Visual regression (Phase 6)

- Prefer viewport screenshots over full-page when OS height drift is a risk.
- Update baselines intentionally (`--update-snapshots`); review PNG diffs in git.
- Prefer regenerating on Linux/CI OS when local Darwin diffs are noisy.

---

## Refactoring

Do not change behavior.

Improve:

- readability
- naming
- reuse
- testability

Explain every important refactoring.
