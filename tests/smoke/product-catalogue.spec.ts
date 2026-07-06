import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';

const sampleProduct = products[0];

test.describe('P1-M3 — Product Catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('P1-M3-01: catalogue displays all products from JSON', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(products.length);
  });

  test('P1-M3-02: product card shows name, category, price, and description', async ({ page }) => {
    const card = page.getByRole('article', { name: sampleProduct.name });

    await expect(card.getByRole('heading', { name: sampleProduct.name, level: 2 })).toBeVisible();
    await expect(card.getByText(sampleProduct.category)).toBeVisible();
    await expect(card.getByText(sampleProduct.shortDescription)).toBeVisible();
    await expect(card.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M3-03: add to cart from catalogue updates badge to 1', async ({ page }) => {
    await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();

    await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();
  });

  test('P1-M3-04: adding same product twice updates badge to 2', async ({ page }) => {
    const addButton = page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` });

    await addButton.click();
    await addButton.click();

    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
  });

  test('P1-M3-05: product images have alt text matching product name', async ({ page }) => {
    for (const product of products) {
      await expect(page.getByRole('img', { name: product.name })).toBeVisible();
    }
  });
});
