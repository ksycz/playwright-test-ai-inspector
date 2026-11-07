import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

function decide(files: string[]): string {
  return execFileSync('node', ['scripts/should-run-review.mjs'], {
    input: files.join('\n'),
    encoding: 'utf8',
  }).trim();
}

test('docs and analyzer changes do not run the test review', () => {
  assert.equal(decide(['docs/TESTING.md']), 'false');
  assert.equal(decide(['ai/shared/redact.mts']), 'false');
  assert.equal(decide([]), 'false');
});

test('a spec or review-script change runs the test review', () => {
  assert.equal(decide(['tests/e2e/checkout.spec.ts']), 'true');
  assert.equal(decide(['ai/pr-review/heuristics.mts']), 'true');
  assert.equal(decide(['scripts/should-run-review.mjs']), 'true');
});
