import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';
import { ProductsPage } from '../pages';

const sampleProduct = products[0];

test.describe('P1-M3 — Product Catalogue', () => {
  test.beforeEach(async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
  });

  test('P1-M3-01: catalogue displays all products from JSON', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await expect(productsPage.heading).toBeVisible();
    await expect(productsPage.productCards).toHaveCount(products.length);
  });

  test('P1-M3-02: product card shows name, category, price, and description', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const card = productsPage.productCard(sampleProduct.name);

    await expect(card.getByRole('heading', { name: sampleProduct.name, level: 2 })).toBeVisible();
    await expect(card.getByText(sampleProduct.category)).toBeVisible();
    await expect(card.getByText(sampleProduct.shortDescription)).toBeVisible();
    await expect(card.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M3-03: add to cart from catalogue updates badge to 1', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.addToCart(sampleProduct.name);

    await expect(productsPage.cartLink(1)).toBeVisible();
  });

  test('P1-M3-04: adding same product twice updates badge to 2', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const addButton = productsPage.addToCartButton(sampleProduct.name);

    await addButton.click();
    await addButton.click();

    await expect(productsPage.cartLink(2)).toBeVisible();
  });

  test('P1-M3-05: product images have alt text matching product name', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    for (const product of products) {
      await expect(productsPage.productImage(product.name)).toBeVisible();
    }
  });
});
