import { test, expect } from '@playwright/test';

test.describe('M1 — Project Foundation', () => {
  test('M1-01: app dev server serves the root page', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Demo Shop' })).toBeVisible();
  });

  test('M1-02: page has document title and main landmark', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Demo Shop');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
