/**
 * Prints "true" when a changed path should run the test-convention review.
 * One path per line on stdin.
 */
import { readFileSync } from 'node:fs';

const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const run = files.some(
  (file) => file.startsWith('tests/') || file.startsWith('ai/pr-review/') || file === 'scripts/should-run-review.mjs',
);
process.stdout.write(run ? 'true' : 'false');
