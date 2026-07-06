import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';
import type { Product } from '../../app/src/types/product';

const catalogue = products as Product[];
const featuredProducts = catalogue.filter((product) => product.featured);
const sampleFeaturedProduct = featuredProducts[0];

test.describe('P1-M8 — Home Page and Featured Products', () => {
  test('P1-M8-01: home page shows intro heading and description', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome to Demo Shop', level: 1 })).toBeVisible();
    await expect(
      page.getByText('A simple demo e-commerce app for learning Playwright and test automation.'),
    ).toBeVisible();
  });

  test('P1-M8-02: featured products section renders product cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Featured products', level: 2 })).toBeVisible();

    for (const product of featuredProducts) {
      await expect(page.getByRole('article', { name: product.name })).toBeVisible();
    }
  });

  test('P1-M8-03: clicking featured product navigates to detail page', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('article', { name: sampleFeaturedProduct.name })
      .getByRole('link', { name: sampleFeaturedProduct.name })
      .click();

    await expect(page).toHaveURL(`/products/${sampleFeaturedProduct.slug}`);
    await expect(
      page.getByRole('heading', { name: sampleFeaturedProduct.name, level: 1 }),
    ).toBeVisible();
  });

  test('P1-M8-04: no featured products shows fallback message', async ({ page }) => {
    await page.goto('/?featured=none');

    await expect(page.getByRole('heading', { name: 'Featured products', level: 2 })).toBeVisible();
    await expect(page.getByText('No featured products at the moment.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  });
});
