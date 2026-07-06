import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';

const validUsername = 'standard_user';
const validPassword = 'secret123';
const sampleProduct = products[0];

const validCheckoutDetails = {
  name: 'Jane Tester',
  email: 'jane@example.com',
  address: '123 Test Street',
  city: 'Testville',
  zipCode: '12345',
};

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(validUsername);
  await page.getByLabel('Password').fill(validPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
}

async function addSampleProductToCart(page: import('@playwright/test').Page) {
  await page.goto('/products');
  await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
}

async function loginWithProductInCart(page: import('@playwright/test').Page) {
  await login(page);
  await addSampleProductToCart(page);
}

async function fillCheckoutForm(
  page: import('@playwright/test').Page,
  details = validCheckoutDetails,
) {
  await page.getByLabel('Name').fill(details.name);
  await page.getByLabel('Email').fill(details.email);
  await page.getByLabel('Address').fill(details.address);
  await page.getByLabel('City').fill(details.city);
  await page.getByLabel('ZIP Code').fill(details.zipCode);
}

test.describe('P1-M7 — Checkout Flow', () => {
  test('P1-M7-01: happy path fills form, submits, and shows confirmation with order number', async ({
    page,
  }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    await fillCheckoutForm(page);
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.getByRole('heading', { name: 'Order confirmed', level: 1 })).toBeVisible();
    await expect(page.getByTestId('order-number')).toHaveText(/^ORD-\d+$/);
  });

  test('P1-M7-02: order summary on checkout matches cart contents', async ({ page }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    const summary = page.getByRole('region', { name: 'Order summary' });
    await expect(summary.getByRole('heading', { name: 'Order summary', level: 2 })).toBeVisible();
    await expect(summary.getByText(sampleProduct.name)).toBeVisible();
    await expect(summary.getByRole('listitem').filter({ hasText: sampleProduct.name })).toContainText(
      `$${sampleProduct.price.toFixed(2)}`,
    );
  });

  test('P1-M7-03: empty cart blocks checkout', async ({ page }) => {
    await login(page);
    await page.goto('/checkout');

    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('P1-M7-04: required field validation on empty submit', async ({ page }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Address is required')).toBeVisible();
    await expect(page.getByText('City is required')).toBeVisible();
    await expect(page.getByText('ZIP Code is required')).toBeVisible();
    await expect(page).toHaveURL('/checkout');
  });

  test('P1-M7-05: invalid email format shows validation error', async ({ page }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    await fillCheckoutForm(page, { ...validCheckoutDetails, email: 'not-an-email' });
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL('/checkout');
  });

  test('P1-M7-06: cart cleared after successful order', async ({ page }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    await fillCheckoutForm(page);
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL('/order-confirmation');
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible();
  });

  test('P1-M7-07: full E2E browse, add, login, checkout, confirm', async ({ page }) => {
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
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.getByRole('heading', { name: 'Order confirmed', level: 1 })).toBeVisible();
    await expect(page.getByTestId('order-number')).toHaveText(/^ORD-\d+$/);
    await expect(page.getByText(sampleProduct.name)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
  });

  test('P1-M7-08: direct visit to confirmation without order redirects away', async ({ page }) => {
    await login(page);
    await page.goto('/order-confirmation');

    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });
});
