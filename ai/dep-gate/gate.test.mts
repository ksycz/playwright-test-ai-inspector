import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gateNewDependencies, type RegistryLookup } from './gate.mts';

const now = new Date('2026-11-06T12:00:00.000Z');
const empty = {};

function lookupThatShouldNotBeCalled(): RegistryLookup {
  return async () => {
    throw new Error('registry lookup should not run when there are no new dependencies');
  };
}

describe('P9-M1 new-dependency gate', () => {
  it('P9-M1-01: no new dependencies passes without contacting the registry', async () => {
    const manifest = {
      dependencies: { react: '^19.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    };

    const result = await gateNewDependencies({
      pairs: [
        { label: 'package.json', base: manifest, head: manifest },
        { label: 'app/package.json', base: empty, head: empty },
      ],
      lookup: lookupThatShouldNotBeCalled(),
      now,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.violations, []);
  });

  it('P9-M1-02: unknown package fails and names the package', async () => {
    const result = await gateNewDependencies({
      pairs: [
        {
          label: 'package.json',
          base: empty,
          head: { dependencies: { 'not-a-real-package-xyz': '1.0.0' } },
        },
      ],
      lookup: async (name) => {
        assert.equal(name, 'not-a-real-package-xyz');
        return { ok: false, status: 404 };
      },
      now,
    });

    assert.equal(result.ok, false);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0]!.rule, 'not-found');
    assert.match(result.violations[0]!.message, /not-a-real-package-xyz/);
  });

  it('P9-M1-03: package younger than the age threshold fails', async () => {
    const created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const result = await gateNewDependencies({
      pairs: [
        {
          label: 'app/package.json',
          base: empty,
          head: { dependencies: { 'brand-new-pkg': '1.0.0' } },
        },
      ],
      lookup: async () => ({
        ok: true,
        info: { created, weeklyDownloads: 50_000 },
      }),
      now,
      minAgeDays: 7,
    });

    assert.equal(result.ok, false);
    assert.ok(result.violations.some((violation) => violation.rule === 'too-young'));
    assert.match(result.violations.map((violation) => violation.message).join('\n'), /brand-new-pkg/);
  });

  it('P9-M1-04: version bump of an existing dependency is not treated as new', async () => {
    const result = await gateNewDependencies({
      pairs: [
        {
          label: 'package.json',
          base: { dependencies: { lodash: '4.17.20' } },
          head: { dependencies: { lodash: '4.17.21' } },
        },
      ],
      lookup: lookupThatShouldNotBeCalled(),
      now,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.violations, []);
  });

  it('P9-M1-05: package below the weekly download threshold fails', async () => {
    const created = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await gateNewDependencies({
      pairs: [
        {
          label: 'package.json',
          base: empty,
          head: { devDependencies: { 'obscure-helper': '0.1.0' } },
        },
      ],
      lookup: async () => ({
        ok: true,
        info: { created, weeklyDownloads: 12 },
      }),
      now,
      minAgeDays: 7,
      minWeeklyDownloads: 1000,
    });

    assert.equal(result.ok, false);
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0]!.rule, 'low-downloads');
    assert.match(result.violations[0]!.message, /obscure-helper/);
  });
});
