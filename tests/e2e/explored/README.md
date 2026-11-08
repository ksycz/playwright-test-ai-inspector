# Explored specs

Draft `@e2e` specs generated from exploration findings by `npm run explore:draft` (P12-M3). They run with the rest of the `@e2e` suite.

```bash
npm run explore -- --no-llm                       # or explore:eval
npm run explore:draft -- --finding <id>           # writes tests/e2e/explored/<id>.spec.ts
npm run explore:draft -- --finding <id> --pr      # also opens a draft PR for review
```

A generated spec asserts the **correct** behaviour from `docs/APP_SPEC.md`: it fails while the bug is there and passes once it's fixed. Before merging, check:

- the steps still make sense as a user journey (the generator maps them to `tests/pages` objects and `loginViaUi` where it can),
- the assertions test what the spec says, not what the explorer happened to see,
- it doesn't duplicate an existing test. Probe findings often match tests that already exist; the drafts worth keeping cover something the suite doesn't.

Specs marked `test.fixme` are incomplete: a step or the assertion couldn't be generated (common for model findings) and has to be written by hand.

Example output: [`docs/samples/explored-draft.spec.ts.txt`](../../../docs/samples/explored-draft.spec.ts.txt).
