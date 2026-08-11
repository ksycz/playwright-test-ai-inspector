import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAllowedProductImagePath } from './productImage.ts';

describe('isAllowedProductImagePath', () => {
  it('accepts catalogue image paths', () => {
    assert.equal(isAllowedProductImagePath('/images/products/wireless-mouse.svg'), true);
    assert.equal(isAllowedProductImagePath('/images/products/desk-lamp.PNG'), true);
  });

  it('rejects external and traversal paths', () => {
    assert.equal(isAllowedProductImagePath('https://evil.com/x.png'), false);
    assert.equal(isAllowedProductImagePath('/images/../etc/passwd'), false);
    assert.equal(isAllowedProductImagePath('/images/products/../logo.svg'), false);
    assert.equal(isAllowedProductImagePath('/images/products/nested/x.svg'), false);
    assert.equal(isAllowedProductImagePath('/images/products/x.svg?x=1'), false);
    assert.equal(isAllowedProductImagePath(''), false);
  });
});
