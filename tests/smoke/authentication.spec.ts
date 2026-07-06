import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';

const validUsername = 'standard_user';
const validPassword = 'secret123';

async function addProductAndOpenCart(page: import('@playwright/test').Page) {
  const sampleProduct = products[0];
  await page.goto('/products');
  await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
  await page.goto('/cart');
}

test.describe('M6 — Fake Authentication', () => {
  test('M6-01: login with valid credentials succeeds', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText(`Welcome, ${validUsername}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('M6-02: invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('M6-03: empty fields show validation errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('M6-04: logout clears session and shows Login link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByText(`Welcome, ${validUsername}`)).toHaveCount(0);
  });

  test('M6-05: session persists after page reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.reload();

    await expect(page.getByText(`Welcome, ${validUsername}`)).toBeVisible();
  });

  test('M6-06: guest at /checkout redirects to /login', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');
    await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible();
  });

  test('M6-07: login with redirect returns to intended page', async ({ page }) => {
    await addProductAndOpenCart(page);
    await page.getByRole('button', { name: 'Proceed to checkout' }).click();

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');

    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible();
  });

  test('M6-08: logged-in user can proceed to checkout', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(validUsername);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Log in' }).click();

    await addProductAndOpenCart(page);
    await page.getByRole('button', { name: 'Proceed to checkout' }).click();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible();
  });
});
