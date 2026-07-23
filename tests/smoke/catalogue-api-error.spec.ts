import { expect, test } from '@playwright/test';
import { sampleProduct } from '../data';

test.describe('@smoke P5-M4 — Catalogue API error UI', () => {
  test('P5-M4-04: products page shows alert when catalogue fetch fails', async ({ page }) => {
    await page.route('**/api/products.json', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/products');

    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Failed to load products (500)');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  });

  test('P5-M4-05: Try again reloads catalogue after a failed fetch', async ({ page }) => {
    let shouldFail = true;

    await page.route('**/api/products.json', async (route) => {
      if (shouldFail) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unavailable' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/products');
    await expect(page.getByRole('alert')).toBeVisible();

    shouldFail = false;
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('article', { name: sampleProduct.name })).toBeVisible();
  });
});
