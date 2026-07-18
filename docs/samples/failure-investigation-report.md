# Failure Investigation Report

> Sanitized sample from `ai/failure-analyzer/fixtures/sample-failure`.  
> Regenerate locally with:
>
> ```bash
> npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --out docs/samples/failure-investigation-report.md
> ```
>
> Then replace absolute paths with the placeholders below if needed.

## Summary

- **Failure folder:** `sample-failure`
- **Source path:** `ai/failure-analyzer/fixtures/sample-failure`
- **Collected at:** 2026-07-18T00:00:00.000Z
- **Category:** `assertion`
- **Confidence:** 88%
- **Classification summary:** Failure looks like an assertion mismatch (expected vs received).

## Classification

- `assertion:expect assertion mismatch`

## Artifacts

### Screenshots

- `test-failed-1.png`

### Videos

- `video.webm`

### Traces

- `trace.zip`

### Error context

- `error-context.md`

## Error excerpt

```text
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:5173/order-confirmation"
Received: "http://localhost:5173/checkout"
Timeout: 5000ms
```

## Suggested next steps

1. Compare Expected vs Received values in the error context.
2. Open the failure screenshot and confirm the UI state matches the assertion target.
3. If the assertion is timing-sensitive, wait for a specific UI signal before asserting.

## Debugging commands

```bash
npm run report
npm run trace -- ai/failure-analyzer/fixtures/sample-failure/trace.zip
npm run analyze:failure -- ai/failure-analyzer/fixtures/sample-failure
```
