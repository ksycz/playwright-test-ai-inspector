# Sample portfolio artifacts

Regenerate from fixtures (paths are sanitized afterward if needed):

```bash
npm run analyze:report -- \
  ai/failure-analyzer/fixtures/sample-failure \
  --format html \
  --out docs/samples/sample-failure.html

npm run analyze:flaky -- \
  ai/flaky-detector/fixtures/flaky-then-pass.json \
  --out docs/samples/sample-flaky.md

npm run analyze:summary -- \
  --title "Playwright CI summary" \
  --suite smoke ai/flaky-detector/fixtures/hard-fail.json \
  --suite e2e ai/flaky-detector/fixtures/flaky-then-pass.json \
  --out docs/samples/sample-run-summary.md
```

`flaky-preview.html` and `pr-comment-preview.html` are lightweight visual previews used for README screenshots (not produced by the CLIs).

Screenshots live in [`screenshots/`](screenshots/).
