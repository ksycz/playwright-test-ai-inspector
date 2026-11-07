/**
 * Prints "true" when a changed path should run the fast mutation job.
 * One path per line on stdin.
 */
import { readFileSync } from 'node:fs';

const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const run = files.some(
  (file) => file === 'stryker.config.json' || (file.startsWith('ai/') && !file.endsWith('.md')),
);
process.stdout.write(run ? 'true' : 'false');
