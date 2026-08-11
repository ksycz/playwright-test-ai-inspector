import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { isApiRequestPath, resolveApiPublicFile } from './apiPublicPath.ts';

const publicRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

describe('apiPublicPath', () => {
  it('recognizes /api and /api/* request paths', () => {
    assert.equal(isApiRequestPath('/api'), true);
    assert.equal(isApiRequestPath('/api/products.json'), true);
    assert.equal(isApiRequestPath('/api?x=1'), true);
    assert.equal(isApiRequestPath('/products'), false);
    assert.equal(isApiRequestPath('/apiary'), false);
  });

  it('resolves catalogue files under public/', () => {
    const resolved = resolveApiPublicFile(publicRoot, '/api/products.json');
    assert.equal(resolved, path.join(publicRoot, 'api', 'products.json'));
  });

  it('rejects path traversal outside public/api/', () => {
    assert.equal(resolveApiPublicFile(publicRoot, '/api/../../package.json'), null);
    assert.equal(resolveApiPublicFile(publicRoot, '/api/../vite.config.ts'), null);
    assert.equal(resolveApiPublicFile(publicRoot, '/api/%2e%2e/%2e%2e/package.json'), null);
    assert.equal(resolveApiPublicFile(publicRoot, '/api/%2e%2e/vite.config.ts'), null);
  });

  it('resolves bare /api to the api directory path (not a file)', () => {
    const resolved = resolveApiPublicFile(publicRoot, '/api');
    assert.equal(resolved, path.join(publicRoot, 'api'));
  });
});
