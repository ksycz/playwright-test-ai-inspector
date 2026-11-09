import { readFileSync } from 'node:fs';

/**
 * Read a newline-separated list of changed files on stdin and print "false" when the browser
 * suites (smoke, e2e, api, visual) can be skipped, otherwise "true".
 *
 * They are skipped only when every change is documentation or AI tooling under ai/:
 * that code runs outside the browser and has its own unit and mutation tests.
 * An empty list still runs them.
 */
const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const outsideBrowser = (file) => file.startsWith('ai/') || file.startsWith('docs/') || file.endsWith('.md');

process.stdout.write(files.length > 0 && files.every(outsideBrowser) ? 'false' : 'true');
