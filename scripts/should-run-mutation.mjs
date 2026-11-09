import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Read a newline-separated list of changed files on stdin and print "true" when mutation
 * testing should run on this pull request, otherwise "false".
 *
 * It runs when a change can alter a mutant's result:
 * - a file in stryker.config.json "mutate", or a local file those files import (transitively);
 * - any test file (Stryker runs every test against every mutant);
 * - the Stryker config or this script.
 * Other ai/ code (report layout, CLIs) is not mutated, so changing it can't move the score.
 * The nightly run tests everything with --force.
 */
const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const config = JSON.parse(readFileSync('stryker.config.json', 'utf8'));
const mutated = new Set(config.mutate);

// Local imports of the mutated files, followed to the end.
const importPattern = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const reachable = new Set();
const queue = [...mutated];
while (queue.length > 0) {
  const file = queue.pop();
  if (reachable.has(file) || !existsSync(file)) continue;
  reachable.add(file);
  for (const match of readFileSync(file, 'utf8').matchAll(importPattern)) {
    queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
  }
}

const isTest = (file) => /\.test\.m?[jt]s$/.test(file) || file.endsWith('.check.mts');

const run = files.some(
  (file) =>
    file === 'stryker.config.json' ||
    file === 'scripts/should-run-mutation.mjs' ||
    reachable.has(file) ||
    isTest(file),
);
process.stdout.write(run ? 'true' : 'false');
