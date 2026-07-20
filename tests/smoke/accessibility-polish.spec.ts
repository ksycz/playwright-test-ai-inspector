import { test, expect, type Page } from '@playwright/test';
import { sampleProduct, validCheckoutDetails, validUser } from '../data';
import { addSampleProductToCart } from '../fixtures';
import {
  CartPage,
  CheckoutPage,
  LoginPage,
  OrderConfirmationPage,
  ProductsPage,
} from '../pages';

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasHorizontalScroll).toBe(false);
}

async function runPurchaseHappyPath(page: Page) {
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const loginPage = new LoginPage(page);
  const checkoutPage = new CheckoutPage(page);
  const orderConfirmationPage = new OrderConfirmationPage(page);

  await productsPage.goto();
  await productsPage.addToCart(sampleProduct.name);
  await expect(productsPage.cartLink(1)).toBeVisible();

  await cartPage.goto();
  await cartPage.proceedToCheckout();
  await expect(page).toHaveURL('/login?redirect=%2Fcheckout');

  await loginPage.login(validUser.username, validUser.password);

  await expect(page).toHaveURL('/checkout');
  await checkoutPage.fillForm(validCheckoutDetails);
  await checkoutPage.placeOrder({ waitForConfirmation: true });

  await expect(page).toHaveURL('/order-confirmation');
  await expect(orderConfirmationPage.heading).toBeVisible();
}

test.describe('@smoke P1-M10 — Accessibility and Testability Polish', () => {
  test('P1-M10-01: full E2E happy path on desktop', async ({ page }) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await runPurchaseHappyPath(page);
    await expect(orderConfirmationPage.orderNumber).toHaveText(/^ORD-\d+$/);
  });

  test('P1-M10-02: full E2E happy path on mobile', async ({ page }) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await runPurchaseHappyPath(page);
    await expect(orderConfirmationPage.continueShoppingLink).toBeVisible();
  });

  test('P1-M10-03: all pages have exactly one h1', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);
    const publicPaths = [
      '/',
      '/products',
      `/products/${sampleProduct.slug}`,
      '/products/invalid-slug',
      '/cart',
      '/login',
      '/does-not-exist',
    ];

    for (const path of publicPaths) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    }

    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);

    await addSampleProductToCart(page);
    await checkoutPage.goto();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    await checkoutPage.fillForm(validCheckoutDetails);
    await checkoutPage.placeOrder({ waitForConfirmation: true });

    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('P1-M10-04: form fields reachable and submittable via keyboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();

    await loginPage.usernameInput.focus();
    await page.keyboard.type(validUser.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validUser.password);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(loginPage.welcomeMessage(validUser.username)).toBeVisible();

    await addSampleProductToCart(page);
    await checkoutPage.goto();

    await checkoutPage.nameInput.focus();
    await page.keyboard.type(validCheckoutDetails.name);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validCheckoutDetails.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validCheckoutDetails.address);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validCheckoutDetails.city);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validCheckoutDetails.zipCode);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/order-confirmation');
  });

  test('P1-M10-05: no horizontal scroll on mobile viewports', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    await page.setViewportSize({ width: 375, height: 667 });

    const mobilePaths = ['/', '/products', '/cart', '/login'];

    for (const path of mobilePaths) {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    }

    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);

    await addSampleProductToCart(page);
    await cartPage.goto();
    await expectNoHorizontalScroll(page);

    await checkoutPage.goto();
    await expectNoHorizontalScroll(page);
  });
});
