# Flaky Test Analysis

## Summary

- **Source report:** `ai/flaky-detector/fixtures/flaky-then-pass.json`
- **Analyzed at:** 2026-08-12T12:00:00.000Z
- **Expected (stable pass):** 0
- **Flaky (failed then passed):** 1
- **Unexpected (hard fail):** 0
- **Skipped:** 0

## Flaky tests

### checkout-flow.spec.ts › P1-M7-01: happy path fills form

- **File:** `tests/smoke/checkout-flow.spec.ts`
- **Project:** `chromium`
- **Verdict:** `flaky`

- retry 0: `failed` (1200ms) — expect(page).toHaveURL(expected) failed
- retry 1: `passed` (900ms)

## Hard failures

_No hard failures detected._

## Notes

- Flaky = failed on an earlier attempt, then passed on retry (`status: flaky` in Playwright JSON).
- Hard fail = failed on all attempts (`status: unexpected`).
- Generate a report with the JSON reporter, then re-run: `npm run analyze:flaky`.
