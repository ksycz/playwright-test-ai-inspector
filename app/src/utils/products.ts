import products from '@/data/products.json';
import type { Product } from '@/types/product';

const catalogue = products as Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return catalogue.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}
