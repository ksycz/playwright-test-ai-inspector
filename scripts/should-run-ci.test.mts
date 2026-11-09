import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

function decide(files: string[]): string {
  const result = spawnSync('node', ['scripts/should-run-ci.mjs'], {
    input: `${files.join('\n')}\n`,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

describe('P9-M4 docs-only CI skip', () => {
  it('P9-M4-03: a docs-only change does not run CI', () => {
    assert.equal(decide(['docs/ROADMAP.md', 'README.md']), 'false');
  });

  it('a code change still runs CI', () => {
    assert.equal(decide(['docs/ROADMAP.md', 'package.json']), 'true');
  });

  it('a .gitignore or LICENSE change alone does not run CI', () => {
    assert.equal(decide(['.gitignore', 'LICENSE', 'docs/ROADMAP.md']), 'false');
  });

  it('an empty change list still runs CI', () => {
    assert.equal(decide([]), 'true');
  });
});
