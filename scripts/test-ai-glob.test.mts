import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

// npm runs scripts through sh, which treats ** like * (one folder level). Unquoted patterns in
// test:ai once skipped 10 of 38 test files. Quoted, Node expands them itself.
test('test:ai quotes every ** pattern so Node, not the shell, expands it', () => {
  const script: string = JSON.parse(readFileSync('package.json', 'utf8')).scripts['test:ai'];
  const unquoted = script.split(' ').filter((part) => part.includes('**') && !part.startsWith("'"));
  assert.deepEqual(unquoted, []);
});

test('every unit test file is matched by a test:ai pattern', () => {
  const script: string = JSON.parse(readFileSync('package.json', 'utf8')).scripts['test:ai'];
  const patterns = script.split(' ').filter((part) => part.startsWith("'")).map((part) => part.slice(1, -1));
  const matched = new Set(patterns.flatMap((pattern) => globSync(pattern)));
  const all = ['ai', 'app/src', 'tests/reporters', 'scripts'].flatMap((dir) => globSync(`${dir}/**/*.test.mts`));
  assert.deepEqual(all.filter((file) => !matched.has(file)), []);
});
