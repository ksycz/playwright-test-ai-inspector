import products from '../../app/src/data/products.json';
import type { Product } from '../../app/src/types/product';

export const catalogue = products as Product[];

export const sampleProduct = catalogue[0];

export const featuredProducts = catalogue.filter((product) => product.featured);

export function findProductBySlug(slug: string): Product | undefined {
  return catalogue.find((product) => product.slug === slug);
}

