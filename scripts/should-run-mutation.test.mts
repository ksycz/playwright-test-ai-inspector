import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

function decide(files: string[]): string {
  return execFileSync('node', ['scripts/should-run-mutation.mjs'], {
    input: files.join('\n'),
    encoding: 'utf8',
  }).trim();
}

test('docs and Markdown do not run mutation testing', () => {
  assert.equal(decide(['docs/TESTING.md']), 'false');
  assert.equal(decide(['ai/failure-analyzer/README.md']), 'false');
  assert.equal(decide([]), 'false');
});

test('a mutated file, a test next to mutated code, or the Stryker config runs mutation testing', () => {
  assert.equal(decide(['ai/shared/redact.mts']), 'true');
  assert.equal(decide(['ai/failure-analyzer/guardrails.test.mts']), 'true');
  assert.equal(decide(['stryker.config.json']), 'true');
  assert.equal(decide(['scripts/should-run-mutation.mjs']), 'true');
});

test('any test file runs mutation testing: Stryker runs every test against every mutant', () => {
  assert.equal(decide(['ai/run-summary/summary.test.mts']), 'true');
  assert.equal(decide(['scripts/tests-audit.test.mts']), 'true');
});

test('a file that mutated code imports runs mutation testing', () => {
  // ai/flaky-detector/analyze.mts (mutated) imports ./types.mts.
  assert.equal(decide(['ai/flaky-detector/types.mts']), 'true');
});

test('ai code that is not in the mutation scope does not run mutation testing', () => {
  // Not listed in stryker.config.json "mutate", and its folder has no mutated file.
  assert.equal(decide(['ai/run-summary/report.mts']), 'false');
  assert.equal(decide(['ai/failure-trends/history.mts']), 'false');
  assert.equal(decide(['ai/failure-trends/cli.mts']), 'false');
});
