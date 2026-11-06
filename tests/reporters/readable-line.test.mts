import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDuration, formatReadableLine } from './readable-line.mts';

describe('readable Playwright console lines', () => {
  it('prints a passed test as its title and duration', () => {
    assert.equal(
      formatReadableLine({
        title: 'P1-M10-02: full E2E happy path on mobile',
        status: 'passed',
        durationMs: 15900,
      }),
      '  ✓  P1-M10-02: full E2E happy path on mobile (15.9s)',
    );
  });

  it('uses milliseconds under one second', () => {
    assert.equal(formatDuration(850), '850ms');
  });

  it('marks a failure and keeps only the first line of the title', () => {
    assert.equal(
      formatReadableLine({
        title: 'P1-M6-02: invalid credentials show error message\nextra',
        status: 'failed',
        durationMs: 2700,
      }),
      '  ✘  P1-M6-02: invalid credentials show error message (2.7s)',
    );
  });

  it('marks a retry on the same line', () => {
    assert.equal(
      formatReadableLine({
        title: 'P1-M7-01: happy path fills form',
        status: 'passed',
        durationMs: 1000,
        retry: 1,
      }),
      '  ✓  P1-M7-01: happy path fills form retry 1 (1.0s)',
    );
  });

  it('marks a skipped test', () => {
    assert.equal(
      formatReadableLine({
        title: 'P1-M9-01: 404 page for unknown app route',
        status: 'skipped',
        durationMs: 0,
      }),
      '  -  P1-M9-01: 404 page for unknown app route (0ms)',
    );
  });
});
