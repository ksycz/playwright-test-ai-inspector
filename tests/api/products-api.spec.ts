import { expect, test } from '@playwright/test';

interface ApiProduct {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  image: string;
  featured?: boolean;
}

function isHtmlBody(body: string): boolean {
  const trimmed = body.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

test.describe('@api Product catalogue API', () => {
  test('P5-M3-01: GET /api/products.json returns 200 and JSON content-type', async ({
    request,
  }) => {
    const response = await request.get('/api/products.json');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/);

    const products = (await response.json()) as ApiProduct[];
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThanOrEqual(1);
  });

  test('P5-M3-02: each product has required fields and unique slugs', async ({ request }) => {
    const response = await request.get('/api/products.json');
    expect(response.status()).toBe(200);

    const products = (await response.json()) as ApiProduct[];
    const slugs = products.map((product) => product.slug);

    for (const product of products) {
      expect(product.slug.length).toBeGreaterThan(0);
      expect(product.name.length).toBeGreaterThan(0);
      expect(product.category.length).toBeGreaterThan(0);
      expect(product.shortDescription.length).toBeGreaterThan(0);
      expect(product.fullDescription.length).toBeGreaterThan(0);
      expect(product.image.length).toBeGreaterThan(0);
      expect(product.image.startsWith('/')).toBeTruthy();
      expect(typeof product.price).toBe('number');
      expect(Number.isNaN(product.price)).toBeFalsy();
      expect(product.price).toBeGreaterThanOrEqual(0);
    }

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('P5-M3-03: featured products endpoint returns a featured subset', async ({ request }) => {
    const [allResponse, featuredResponse] = await Promise.all([
      request.get('/api/products.json'),
      request.get('/api/featured-products.json'),
    ]);

    expect(allResponse.status()).toBe(200);
    expect(featuredResponse.status()).toBe(200);
    expect(featuredResponse.headers()['content-type'] ?? '').toMatch(/application\/json/);

    const products = (await allResponse.json()) as ApiProduct[];
    const featured = (await featuredResponse.json()) as ApiProduct[];

    expect(featured.length).toBeGreaterThanOrEqual(1);
    expect(featured.every((product) => product.featured === true)).toBeTruthy();

    const catalogueSlugs = new Set(products.map((product) => product.slug));
    for (const product of featured) {
      expect(catalogueSlugs.has(product.slug)).toBeTruthy();
    }

    const featuredFromCatalogue = products.filter((product) => product.featured === true);
    expect(featured.map((product) => product.slug).sort()).toEqual(
      featuredFromCatalogue.map((product) => product.slug).sort(),
    );
  });

  test('P5-M3-04: missing API resource returns JSON 404', async ({ request }) => {
    const response = await request.get('/api/missing.json');

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/);

    const body = (await response.json()) as { error?: string; path?: string };
    expect(body.error).toBe('Not found');
    expect(body.path).toBe('/api/missing.json');
  });

  test('P5-M4-01: nested missing API path returns JSON 404 with path', async ({ request }) => {
    const response = await request.get('/api/catalog/missing.json');

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/);

    const body = (await response.json()) as { error?: string; path?: string };
    expect(body.error).toBe('Not found');
    expect(body.path).toBe('/api/catalog/missing.json');
  });

  test('P5-M4-02: API 404 body is JSON, not SPA HTML', async ({ request }) => {
    const response = await request.get('/api/does-not-exist.json');
    const text = await response.text();

    expect(response.status()).toBe(404);
    expect(isHtmlBody(text)).toBeFalsy();
    expect(JSON.parse(text)).toEqual({
      error: 'Not found',
      path: '/api/does-not-exist.json',
    });
  });

  test('P5-M4-03: POST to products API returns JSON 405', async ({ request }) => {
    const response = await request.post('/api/products.json', {
      data: { slug: 'injected' },
    });

    expect(response.status()).toBe(405);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/);
    expect(response.headers().allow ?? '').toMatch(/GET/);

    const body = (await response.json()) as {
      error?: string;
      path?: string;
      method?: string;
    };
    expect(body.error).toBe('Method not allowed');
    expect(body.path).toBe('/api/products.json');
    expect(body.method).toBe('POST');
  });
});
