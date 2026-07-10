import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';

test.describe('@smoke P1-M1 — Project Foundation', () => {
  test('P1-M1-01: app dev server serves the root page', async ({ page }) => {
    const homePage = new HomePage(page);
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(homePage.heading).toBeVisible();
  });

  test('P1-M1-02: page has document title and main landmark', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(page).toHaveTitle('Demo Shop');
    await expect(homePage.main).toBeVisible();
  });
});
