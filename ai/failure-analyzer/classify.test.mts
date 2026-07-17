import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyFailure } from './classify.mts';
import type { FailureArtifacts } from './types.mts';

const emptyArtifacts: FailureArtifacts = {
  screenshots: [],
  videos: [],
  traces: [],
  errorContextPath: null,
  otherFiles: [],
};

describe('P3-M2 heuristic failure classification', () => {
  it('P3-M2-01: classifies expect URL mismatch as assertion', () => {
    const result = classifyFailure({
      errorContextText: `Error: expect(page).toHaveURL(expected) failed
Expected: "http://localhost:5173/order-confirmation"
Received: "http://localhost:5173/checkout"
Timeout: 5000ms`,
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'assertion');
    assert.ok(result.confidence >= 0.8);
    assert.ok(result.matchedSignals.some((signal) => signal.startsWith('assertion:')));
  });

  it('P3-M2-02: classifies connection refused as network', () => {
    const result = classifyFailure({
      errorContextText: 'page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/',
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'network');
    assert.ok(result.confidence >= 0.9);
  });

  it('P3-M2-03: classifies strict mode violation as locator', () => {
    const result = classifyFailure({
      errorContextText:
        "Error: strict mode violation: getByRole('button', { name: 'Submit' }) resolved to 2 elements",
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'locator');
    assert.ok(result.confidence >= 0.85);
  });

  it('P3-M2-04: classifies login redirect / invalid credentials as auth', () => {
    const result = classifyFailure({
      errorContextText: 'Invalid username or password\nNavigated to /login?redirect=%2Fcheckout',
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'auth');
    assert.ok(result.confidence >= 0.85);
  });

  it('P3-M2-05: classifies test timeout as timeout', () => {
    const result = classifyFailure({
      errorContextText: 'Test timeout of 30000ms exceeded.',
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'timeout');
    assert.ok(result.confidence >= 0.8);
  });

  it('P3-M2-06: falls back to unknown for unrelated text', () => {
    const result = classifyFailure({
      errorContextText: 'Something unexpected happened in the pipeline.',
      artifacts: emptyArtifacts,
    });

    assert.equal(result.category, 'unknown');
    assert.ok(result.confidence <= 0.3);
  });

  it('P3-M2-07: unknown when error text is missing', () => {
    const result = classifyFailure({
      errorContextText: null,
      artifacts: { ...emptyArtifacts, screenshots: ['test-failed-1.png'] },
    });

    assert.equal(result.category, 'unknown');
    assert.deepEqual(result.matchedSignals, ['artifacts-present-without-error-text']);
  });
});
