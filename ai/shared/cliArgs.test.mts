import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readOptionValue } from './cliArgs.mts';

describe('cliArgs readOptionValue', () => {
  it('reads a normal option value', () => {
    const result = readOptionValue(['--out', 'report.md'], 0, '--out');
    assert.deepEqual(result, { ok: true, value: 'report.md', nextIndex: 1 });
  });

  it('rejects a missing value', () => {
    const result = readOptionValue(['--out'], 0, '--out');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Missing value for --out/);
    }
  });

  it('rejects the next token when it looks like a flag', () => {
    const result = readOptionValue(['--out', '--title', 'x'], 0, '--out');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /got flag "--title"/);
    }
  });
});
