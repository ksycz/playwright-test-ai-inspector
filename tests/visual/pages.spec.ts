import { expect, test, type Page } from '@playwright/test';
import { sampleProduct } from '../data';
import {
  addSampleProductToCart,
  loginViaUi,
} from '../fixtures';
import {
  CartPage,
  CheckoutPage,
  HomePage,
  LoginPage,
  ProductDetailPage,
  ProductsPage,
} from '../pages';

/**
 * Viewport-only shots (not fullPage) keep dimensions identical across OS,
 * so CI Linux can compare against committed baselines without height drift.
 */
test.use({
  viewport: { width: 1280, height: 720 },
});

async function settleForScreenshot(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  });
}

async function assertPageScreenshot(page: Page, name: string) {
  await settleForScreenshot(page);
  await expect(page).toHaveScreenshot(name, {
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
  });
}

test.describe('@visual Demo Shop pages', () => {
  test('P6-M1-01: home page matches baseline', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
    await expect(homePage.featuredProductsHeading).toBeVisible();
    await expect(homePage.productCards.first()).toBeVisible();
    await assertPageScreenshot(page, 'home.png');
  });

  test('P6-M1-02: products catalogue matches baseline', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await expect(productsPage.heading).toBeVisible();
    await expect(productsPage.productCards.first()).toBeVisible();
    await assertPageScreenshot(page, 'products.png');
  });

  test('P6-M2-01: product detail matches baseline', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto(sampleProduct.slug);
    await expect(productDetailPage.heading(sampleProduct.name)).toBeVisible();
    await assertPageScreenshot(page, 'product-detail.png');
  });

  test('P6-M2-02: login page matches baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
    await assertPageScreenshot(page, 'login.png');
  });

  test('P6-M2-03: empty cart matches baseline', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.emptyHeading).toBeVisible();
    await assertPageScreenshot(page, 'cart-empty.png');
  });

  test('P6-M3-01: cart with sample product matches baseline', async ({ page }) => {
    await addSampleProductToCart(page);
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
    await assertPageScreenshot(page, 'cart-with-item.png');
  });

  test('P6-M3-02: checkout form matches baseline', async ({ page }) => {
    await loginViaUi(page);
    await addSampleProductToCart(page);
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.nameInput).toBeVisible();
    await assertPageScreenshot(page, 'checkout.png');
  });
});
