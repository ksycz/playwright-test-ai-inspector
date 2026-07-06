import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';

const sampleProduct = products[0];

test.describe('P1-M4 — Product Details', () => {
  test('P1-M4-01: navigating to /products/{slug} shows product details', async ({ page }) => {
    await page.goto(`/products/${sampleProduct.slug}`);

    await expect(page).toHaveURL(`/products/${sampleProduct.slug}`);
    await expect(
      page.getByRole('heading', { name: sampleProduct.name, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: sampleProduct.name })).toBeVisible();
  });

  test('P1-M4-02: detail page displays full description, category, and price', async ({ page }) => {
    await page.goto(`/products/${sampleProduct.slug}`);

    await expect(page.getByText(sampleProduct.category)).toBeVisible();
    await expect(page.getByText(sampleProduct.fullDescription)).toBeVisible();
    await expect(page.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M4-03: add to cart from detail page updates cart badge', async ({ page }) => {
    await page.goto(`/products/${sampleProduct.slug}`);

    await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();

    await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();
  });

  test('P1-M4-04: clicking product in catalogue navigates to detail page', async ({ page }) => {
    await page.goto('/products');

    const card = page.getByRole('article', { name: sampleProduct.name });
    await card.getByRole('link', { name: sampleProduct.name }).click();

    await expect(page).toHaveURL(`/products/${sampleProduct.slug}`);
    await expect(
      page.getByRole('heading', { name: sampleProduct.name, level: 1 }),
    ).toBeVisible();
  });

  test('P1-M4-05: unknown slug shows product-not-found state', async ({ page }) => {
    await page.goto('/products/unknown-product');

    await expect(page.getByRole('heading', { name: 'Product not found', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to products' })).toBeVisible();
  });

  test('P1-M4-06: back to products link returns to catalogue', async ({ page }) => {
    await page.goto(`/products/${sampleProduct.slug}`);

    await page.getByRole('link', { name: 'Back to products' }).click();

    await expect(page).toHaveURL('/products');
    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
  });
});
