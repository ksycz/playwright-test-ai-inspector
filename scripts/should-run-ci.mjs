import { readFileSync } from 'node:fs';

/**
 * Read a newline-separated file list on stdin.
 * Print "false" when every path is documentation, otherwise "true".
 * An empty list still runs CI.
 */
const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const docsOnly =
  files.length > 0 && files.every((file) => file.startsWith('docs/') || file.endsWith('.md'));

process.stdout.write(docsOnly ? 'false' : 'true');
