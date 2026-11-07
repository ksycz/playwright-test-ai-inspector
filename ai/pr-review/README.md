# Test convention review

Reads a unified diff and comments on added lines in `tests/**/*.spec.ts`.

```bash
git diff origin/main -- tests > /tmp/tests.diff
npm run analyze:review -- --diff /tmp/tests.diff
```

The command always exits 0 when it can read the diff. Findings are comments, not a failed check.

It flags `waitForTimeout`, CSS or XPath `locator()` calls, `test.only`, a `test.describe` with no `@smoke` / `@e2e` / `@api` / `@visual` tag, and a spec that logs in through `LoginPage` instead of `loggedInPage` from `tests/fixtures/auth.fixture`. The authentication spec itself is not flagged for login.

If `OPENAI_API_KEY` is set, a model note is appended and labeled unverified. `--no-llm` skips that call. A reply that is not the expected JSON is dropped. Model text is escaped before it is written.
