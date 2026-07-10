import { test, expect } from '@playwright/test';
import { BasePage, HomePage, NotFoundPage, ProductsPage } from '../pages';

test.describe('@smoke P1-M2 — Application Layout and Routing', () => {
  test('P1-M2-01: app loads at / with layout visible', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.banner).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
    await expect(homePage.main).toBeVisible();
    await expect(homePage.heading).toBeVisible();
  });

  test('P1-M2-02: navigation links are present', async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.gotoHome();

    await expect(basePage.homeLink).toBeVisible();
    await expect(basePage.productsLink).toBeVisible();
    await expect(basePage.cartLink(0)).toBeVisible();
    await expect(basePage.loginLink).toBeVisible();
  });

  test('P1-M2-03: clicking Products navigates to /products', async ({ page }) => {
    const basePage = new BasePage(page);
    const productsPage = new ProductsPage(page);
    await basePage.gotoHome();
    await basePage.navigateToProducts();

    await expect(page).toHaveURL('/products');
    await expect(productsPage.heading).toBeVisible();
  });

  test('P1-M2-04: active nav link is indicated on the current page', async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.gotoHome();

    await expect(basePage.homeLink).toHaveAttribute('aria-current', 'page');

    await basePage.navigateToProducts();

    await expect(basePage.productsLink).toHaveAttribute('aria-current', 'page');
    await expect(basePage.homeLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('P1-M2-05: unknown route shows 404 with link to Home', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('/does-not-exist');

    await expect(notFoundPage.heading).toBeVisible();
    await expect(notFoundPage.backToHomeLink).toBeVisible();
  });

  test('P1-M2-06: cart badge displays 0 initially', async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.gotoHome();

    await expect(basePage.cartLink(0)).toBeVisible();
  });
});
