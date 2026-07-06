import { test, expect } from '@playwright/test';

test.describe('P1-M2 — Application Layout and Routing', () => {
  test('P1-M2-01: app loads at / with layout visible', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to Demo Shop', level: 1 })).toBeVisible();
  });

  test('P1-M2-02: navigation links are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cart/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('P1-M2-03: clicking Products navigates to /products', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Products' }).click();

    await expect(page).toHaveURL('/products');
    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
  });

  test('P1-M2-04: active nav link is indicated on the current page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.getByRole('link', { name: 'Products' }).click();

    await expect(page.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('P1-M2-05: unknown route shows 404 with link to Home', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  });

  test('P1-M2-06: cart badge displays 0 initially', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible();
  });
});
