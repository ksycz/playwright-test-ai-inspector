import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';
import { CartPage, CheckoutPage, LoginPage, ProductsPage } from '../pages';

const validUsername = 'standard_user';
const validPassword = 'secret123';

async function addProductAndOpenCart(page: import('@playwright/test').Page) {
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  await productsPage.goto();
  await productsPage.addToCart(products[0].name);
  await cartPage.goto();
}

test.describe('P1-M6 — Fake Authentication', () => {
  test('P1-M6-01: login with valid credentials succeeds', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(validUsername, validPassword);

    await expect(loginPage.welcomeMessage(validUsername)).toBeVisible();
    await expect(loginPage.logoutButton).toBeVisible();
  });

  test('P1-M6-02: invalid credentials show error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(validUsername, 'wrong-password');

    await expect(loginPage.errorAlert).toHaveText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('P1-M6-03: empty fields show validation errors', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();

    await expect(loginPage.validationError('Username is required')).toBeVisible();
    await expect(loginPage.validationError('Password is required')).toBeVisible();
  });

  test('P1-M6-04: logout clears session and shows Login link', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(validUsername, validPassword);
    await loginPage.logout();

    await expect(loginPage.loginLink).toBeVisible();
    await expect(loginPage.welcomeMessage(validUsername)).toHaveCount(0);
  });

  test('P1-M6-05: session persists after page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(validUsername, validPassword);

    await page.reload();

    await expect(loginPage.welcomeMessage(validUsername)).toBeVisible();
  });

  test('P1-M6-06: guest at /checkout redirects to /login', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const loginPage = new LoginPage(page);
    await checkoutPage.goto();

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');
    await expect(loginPage.heading).toBeVisible();
  });

  test('P1-M6-07: login with redirect returns to intended page', async ({ page }) => {
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);
    await addProductAndOpenCart(page);
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');

    await loginPage.login(validUsername, validPassword);

    await expect(page).toHaveURL('/checkout');
    await expect(checkoutPage.heading).toBeVisible();
  });

  test('P1-M6-08: logged-in user can proceed to checkout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);
    await loginPage.goto();
    await loginPage.login(validUsername, validPassword);

    await addProductAndOpenCart(page);
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL('/checkout');
    await expect(checkoutPage.heading).toBeVisible();
  });
});
