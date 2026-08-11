import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeRedirectPath } from './redirectPath.ts';

describe('sanitizeRedirectPath', () => {
  it('allows known app routes', () => {
    assert.equal(sanitizeRedirectPath('/checkout'), '/checkout');
    assert.equal(sanitizeRedirectPath('/cart'), '/cart');
    assert.equal(sanitizeRedirectPath('/products'), '/products');
    assert.equal(sanitizeRedirectPath('/products/wireless-mouse'), '/products/wireless-mouse');
    assert.equal(sanitizeRedirectPath('/order-confirmation'), '/order-confirmation');
    assert.equal(sanitizeRedirectPath('/'), '/');
  });

  it('falls back for open-redirect and protocol tricks', () => {
    assert.equal(sanitizeRedirectPath('//evil.com'), '/products');
    assert.equal(sanitizeRedirectPath('/\\evil.com'), '/products');
    assert.equal(sanitizeRedirectPath('/\\\\evil.com'), '/products');
    assert.equal(sanitizeRedirectPath('https://evil.com'), '/products');
    assert.equal(sanitizeRedirectPath('javascript:alert(1)'), '/products');
    assert.equal(sanitizeRedirectPath('/\tevil'), '/products');
    assert.equal(sanitizeRedirectPath('/%09/evil.com'), '/products');
  });

  it('rejects unknown paths and strips query/hash', () => {
    assert.equal(sanitizeRedirectPath('/admin'), '/products');
    assert.equal(sanitizeRedirectPath('/checkout/../admin'), '/products');
    assert.equal(sanitizeRedirectPath('/checkout?x=1'), '/checkout');
    assert.equal(sanitizeRedirectPath('/products/Not Valid'), '/products');
    assert.equal(sanitizeRedirectPath(null), '/products');
    assert.equal(sanitizeRedirectPath(''), '/products');
  });
});
