import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { resolvePathInsideRoot } from './pathContainment.mts';

describe('resolvePathInsideRoot', () => {
  const root = path.resolve('/tmp/failure-folder');

  it('resolves nested files under the root', () => {
    assert.equal(
      resolvePathInsideRoot(root, 'shots/test-failed-1.png'),
      path.join(root, 'shots', 'test-failed-1.png'),
    );
  });

  it('rejects traversal and absolute paths', () => {
    assert.equal(resolvePathInsideRoot(root, '../secrets.txt'), null);
    assert.equal(resolvePathInsideRoot(root, 'a/../../etc/passwd'), null);
    assert.equal(resolvePathInsideRoot(root, '/etc/passwd'), null);
    assert.equal(resolvePathInsideRoot(root, ''), null);
  });
});
