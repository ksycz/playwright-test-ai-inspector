import type { Product } from '@/types/product';

function assertProductShape(value: unknown, index: number): asserts value is Product {
  if (!value || typeof value !== 'object') {
    throw new Error(`Product at index ${index} is not an object`);
  }

  const product = value as Record<string, unknown>;
  const requiredStrings = ['slug', 'name', 'category', 'shortDescription', 'fullDescription', 'image'] as const;

  for (const key of requiredStrings) {
    if (typeof product[key] !== 'string' || (product[key] as string).trim().length === 0) {
      throw new Error(`Product at index ${index} has invalid "${key}"`);
    }
  }

  if (typeof product.price !== 'number' || Number.isNaN(product.price)) {
    throw new Error(`Product at index ${index} has invalid "price"`);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products.json');

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Products API did not return an array');
  }

  payload.forEach((item, index) => assertProductShape(item, index));
  return payload;
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const response = await fetch('/api/featured-products.json');

  if (!response.ok) {
    throw new Error(`Failed to load featured products (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Featured products API did not return an array');
  }

  payload.forEach((item, index) => assertProductShape(item, index));
  return payload;
}
