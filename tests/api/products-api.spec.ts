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
      expect(typeof product.price).toBe('number');
      expect(Number.isNaN(product.price)).toBeFalsy();
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

    const products = (await allResponse.json()) as ApiProduct[];
    const featured = (await featuredResponse.json()) as ApiProduct[];

    expect(featured.length).toBeGreaterThanOrEqual(1);
    expect(featured.every((product) => product.featured === true)).toBeTruthy();

    const catalogueSlugs = new Set(products.map((product) => product.slug));
    for (const product of featured) {
      expect(catalogueSlugs.has(product.slug)).toBeTruthy();
    }
  });

  test('P5-M3-04: missing API resource returns JSON 404', async ({ request }) => {
    const response = await request.get('/api/missing.json');

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/);

    const body = (await response.json()) as { error?: string; path?: string };
    expect(body.error).toBe('Not found');
    expect(body.path).toBe('/api/missing.json');
  });
});
