/**
 * Prints "true" when the changed-file list includes renovate.json.
 * Prints "false" for an empty list or any other set of paths.
 * One path per line on stdin.
 */
import { readFileSync } from 'node:fs';

const files = readFileSync(0, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const touchesRenovate = files.some((file) => file === 'renovate.json');
process.stdout.write(touchesRenovate ? 'true' : 'false');
