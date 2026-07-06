import { test, expect, type Page } from '@playwright/test';
import products from '../../app/src/data/products.json';

const validUsername = 'standard_user';
const validPassword = 'secret123';
const sampleProduct = products[0];

const checkoutDetails = {
  name: 'Jane Tester',
  email: 'jane@example.com',
  address: '123 Test Street',
  city: 'Testville',
  zipCode: '12345',
};

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasHorizontalScroll).toBe(false);
}

async function runPurchaseHappyPath(page: Page) {
  await page.goto('/products');
  await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();

  await page.goto('/cart');
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  await expect(page).toHaveURL('/login?redirect=%2Fcheckout');

  await page.getByLabel('Username').fill(validUsername);
  await page.getByLabel('Password').fill(validPassword);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL('/checkout');
  await page.getByLabel('Name').fill(checkoutDetails.name);
  await page.getByLabel('Email').fill(checkoutDetails.email);
  await page.getByLabel('Address').fill(checkoutDetails.address);
  await page.getByLabel('City').fill(checkoutDetails.city);
  await page.getByLabel('ZIP Code').fill(checkoutDetails.zipCode);
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL('/order-confirmation');
  await expect(page.getByRole('heading', { name: 'Order confirmed', level: 1 })).toBeVisible();
}

test.describe('M10 — Accessibility and Testability Polish', () => {
  test('M10-01: full E2E happy path on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await runPurchaseHappyPath(page);
    await expect(page.getByTestId('order-number')).toHaveText(/^ORD-\d+$/);
  });

  test('M10-02: full E2E happy path on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await runPurchaseHappyPath(page);
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
  });

  test('M10-03: all pages have exactly one h1', async ({ page }) => {
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

    await page.goto('/login');
    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.goto('/products');
    await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    await page.getByLabel('Name').fill(checkoutDetails.name);
    await page.getByLabel('Email').fill(checkoutDetails.email);
    await page.getByLabel('Address').fill(checkoutDetails.address);
    await page.getByLabel('City').fill(checkoutDetails.city);
    await page.getByLabel('ZIP Code').fill(checkoutDetails.zipCode);
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('M10-04: form fields reachable and submittable via keyboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').focus();
    await page.keyboard.type(validUsername);
    await page.keyboard.press('Tab');
    await page.keyboard.type(validPassword);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.getByText(`Welcome, ${validUsername}`)).toBeVisible();

    await page.goto('/products');
    await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
    await page.goto('/checkout');

    await page.getByLabel('Name').focus();
    await page.keyboard.type(checkoutDetails.name);
    await page.keyboard.press('Tab');
    await page.keyboard.type(checkoutDetails.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(checkoutDetails.address);
    await page.keyboard.press('Tab');
    await page.keyboard.type(checkoutDetails.city);
    await page.keyboard.press('Tab');
    await page.keyboard.type(checkoutDetails.zipCode);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/order-confirmation');
  });

  test('M10-05: no horizontal scroll on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobilePaths = ['/', '/products', '/cart', '/login'];

    for (const path of mobilePaths) {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    }

    await page.goto('/login');
    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.goto('/products');
    await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
    await page.goto('/cart');
    await expectNoHorizontalScroll(page);

    await page.goto('/checkout');
    await expectNoHorizontalScroll(page);
  });
});
