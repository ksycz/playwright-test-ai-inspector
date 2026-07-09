import { test as base, type Page } from '@playwright/test';
import { sampleProduct } from '../data';
import { ProductsPage } from '../pages';

export type CartFixtures = {
  cartWithItem: Page;
};

export async function addSampleProductToCart(page: Page) {
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  await productsPage.addToCart(sampleProduct.name);
}

export const cartTest = base.extend<CartFixtures>({
  cartWithItem: async ({ page }, use) => {
    await addSampleProductToCart(page);
    await use(page);
  },
});
