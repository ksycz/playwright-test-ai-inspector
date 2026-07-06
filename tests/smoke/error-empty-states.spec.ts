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

const checkoutFieldErrors = [
  { label: 'Name', message: 'Name is required', data: { ...validCheckoutDetails, name: '' } },
  { label: 'Email', message: 'Email is required', data: { ...validCheckoutDetails, email: '' } },
  {
    label: 'Address',
    message: 'Address is required',
    data: { ...validCheckoutDetails, address: '' },
  },
  { label: 'City', message: 'City is required', data: { ...validCheckoutDetails, city: '' } },
  {
    label: 'ZIP Code',
    message: 'ZIP Code is required',
    data: { ...validCheckoutDetails, zipCode: '' },
  },
] as const;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(validUsername);
  await page.getByLabel('Password').fill(validPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
}

async function loginWithProductInCart(page: import('@playwright/test').Page) {
  await login(page);
  await page.goto('/products');
  await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
}

test.describe('M9 — Error and Empty States', () => {
  test('M9-01: 404 page for unknown app route', async ({ page }) => {
    await page.goto('/unknown-route');

    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
    await expect(page.getByText('The page you are looking for does not exist.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  });

  test('M9-02: product not found for invalid slug', async ({ page }) => {
    await page.goto('/products/does-not-exist');

    await expect(page.getByRole('heading', { name: 'Product not found', level: 1 })).toBeVisible();
    await expect(page.getByText('We could not find a product matching that link.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to products' })).toBeVisible();
  });

  test('M9-03: empty cart state with link to Products', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(page.getByText('Add products from the catalogue to get started.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse products' })).toBeVisible();
  });

  test('M9-04: invalid login error message', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('M9-05: checkout validation errors for each required field', async ({ page }) => {
    await loginWithProductInCart(page);
    await page.goto('/checkout');

    for (const field of checkoutFieldErrors) {
      await page.getByLabel('Name').fill(field.data.name);
      await page.getByLabel('Email').fill(field.data.email);
      await page.getByLabel('Address').fill(field.data.address);
      await page.getByLabel('City').fill(field.data.city);
      await page.getByLabel('ZIP Code').fill(field.data.zipCode);
      await page.getByRole('button', { name: 'Place order' }).click();

      await expect(page.getByText(field.message)).toBeVisible();
      await expect(page).toHaveURL('/checkout');
    }
  });

  test('M9-06: corrupt cart Local Storage falls back to empty cart', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cart', '{invalid-json');
    });

    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible();
  });

  test('M9-07: direct confirmation URL without order redirects away', async ({ page }) => {
    await login(page);
    await page.goto('/order-confirmation');

    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });
});
