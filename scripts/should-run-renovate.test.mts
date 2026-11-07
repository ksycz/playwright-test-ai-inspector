import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

function decide(files: string[]): string {
  return execFileSync('node', ['scripts/should-run-renovate.mjs'], {
    input: files.join('\n'),
    encoding: 'utf8',
  }).trim();
}

test('P9-M4-04 a pull request that does not change renovate.json skips the validator', () => {
  assert.equal(decide(['app/src/App.tsx', 'docs/TESTING.md']), 'false');
  assert.equal(decide([]), 'false');
  assert.equal(decide(['docs/renovate.md']), 'false');
});

test('P9-M4-04 a change to renovate.json runs the validator', () => {
  assert.equal(decide(['renovate.json']), 'true');
  assert.equal(decide(['docs/TESTING.md', 'renovate.json']), 'true');
});
