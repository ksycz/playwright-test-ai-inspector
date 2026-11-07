import assert from 'node:assert/strict';
import { test } from 'node:test';
import { label } from './label.mts';

test('the label is truthy', () => {
  assert.ok(label(true));
});
