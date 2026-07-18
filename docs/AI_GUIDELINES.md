# Prompt Library

## React

Create production-quality React components using TypeScript and Tailwind.

Explain important architectural decisions.

Prefer composition over inheritance.

---

## Playwright

Always use Playwright best practices.

Prefer getByRole() over CSS selectors whenever possible.

Avoid arbitrary waits.

Use fixtures where appropriate.

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

## Refactoring

Do not change behavior.

Improve:

- readability

- naming

- reuse

- testability

Explain every important refactoring.