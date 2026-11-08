import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activeFromEnv, isSeeded, parseSeededBugs, SEEDED_BUGS } from './seededBugs.ts';

describe('seeded bugs (P12-M2)', () => {
  it('P12-M2-01: only the dev server can turn bugs on', () => {
    assert.deepEqual([...activeFromEnv({ DEV: true, VITE_SEEDED_BUGS: 'cart-remove-noop' })], ['cart-remove-noop']);
    assert.equal(activeFromEnv({ DEV: false, VITE_SEEDED_BUGS: 'all' }).size, 0, 'production build');
    assert.equal(activeFromEnv(undefined).size, 0, 'outside Vite');
    assert.equal(activeFromEnv({ DEV: true }).size, 0, 'flag not set');
    assert.equal(isSeeded('cart-remove-noop'), false, 'off in unit tests');
  });

  it('P12-M2-02: parses names, ignores unknown ones, and supports all', () => {
    assert.deepEqual(
      [...parseSeededBugs(' cart-not-saved , nope,detail-adds-twice ')].sort(),
      ['cart-not-saved', 'detail-adds-twice'],
    );
    assert.equal(parseSeededBugs('all').size, SEEDED_BUGS.length);
    assert.equal(parseSeededBugs('').size, 0);
  });
});
