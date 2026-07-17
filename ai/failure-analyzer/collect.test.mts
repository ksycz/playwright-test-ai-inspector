import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { collectFailureContext } from './collect.mts';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, 'fixtures');

describe('P3-M1 failure artifact collector', () => {
  it('P3-M1-01: collects screenshot, video, error-context, and trace paths', async () => {
    const context = await collectFailureContext(path.join(fixturesDir, 'sample-failure'));

    assert.equal(context.artifacts.errorContextPath, 'error-context.md');
    assert.deepEqual(context.artifacts.screenshots, ['test-failed-1.png']);
    assert.deepEqual(context.artifacts.videos, ['video.webm']);
    assert.deepEqual(context.artifacts.traces, ['trace.zip']);
    assert.match(context.errorContextText ?? '', /order-confirmation/);
    assert.ok(context.sourcePath.endsWith(`${path.sep}sample-failure`));
    assert.ok(Date.parse(context.collectedAt));
  });

  it('P3-M1-02: returns empty artifact lists for a folder with no artifacts', async () => {
    const context = await collectFailureContext(path.join(fixturesDir, 'empty-failure'));

    assert.equal(context.artifacts.errorContextPath, null);
    assert.deepEqual(context.artifacts.screenshots, []);
    assert.deepEqual(context.artifacts.videos, []);
    assert.deepEqual(context.artifacts.traces, []);
    assert.equal(context.errorContextText, null);
  });

  it('P3-M1-03: rejects a missing failure path', async () => {
    await assert.rejects(
      () => collectFailureContext(path.join(fixturesDir, 'does-not-exist')),
      /ENOENT|no such file/i,
    );
  });
});
