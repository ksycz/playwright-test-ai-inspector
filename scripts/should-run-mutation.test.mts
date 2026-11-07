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

test('an ai logic or test change runs mutation testing', () => {
  assert.equal(decide(['ai/shared/redact.mts']), 'true');
  assert.equal(decide(['ai/failure-analyzer/guardrails.test.mts']), 'true');
  assert.equal(decide(['stryker.config.json']), 'true');
});
