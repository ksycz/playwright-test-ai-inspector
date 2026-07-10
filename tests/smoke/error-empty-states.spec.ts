import { test, expect } from '@playwright/test';
import { checkoutFieldErrors, invalidUser } from '../data';
import { loginViaUi, loginWithProductInCart } from '../fixtures';
import {
  CartPage,
  CheckoutPage,
  LoginPage,
  NotFoundPage,
  OrderConfirmationPage,
  ProductDetailPage,
} from '../pages';

test.describe('@smoke P1-M9 — Error and Empty States', () => {
  test('P1-M9-01: 404 page for unknown app route', async ({ page }) => {
    const notFoundPage = new NotFoundPage(page);
    await notFoundPage.goto('/unknown-route');

    await expect(notFoundPage.heading).toBeVisible();
    await expect(notFoundPage.message).toBeVisible();
    await expect(notFoundPage.backToHomeLink).toBeVisible();
  });

  test('P1-M9-02: product not found for invalid slug', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto('does-not-exist');

    await expect(productDetailPage.productNotFoundHeading).toBeVisible();
    await expect(productDetailPage.productNotFoundMessage).toBeVisible();
    await expect(productDetailPage.backToProductsLink).toBeVisible();
  });

  test('P1-M9-03: empty cart state with link to Products', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.browseProductsLink).toBeVisible();
  });

  test('P1-M9-04: invalid login error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(invalidUser.username, invalidUser.password);

    await expect(loginPage.errorAlert).toHaveText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('P1-M9-05: checkout validation errors for each required field', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    for (const field of checkoutFieldErrors) {
      await checkoutPage.fillForm(field.data);
      await checkoutPage.placeOrder();

      await expect(checkoutPage.validationError(field.message)).toBeVisible();
      await expect(page).toHaveURL('/checkout');
    }
  });

  test('P1-M9-06: corrupt cart Local Storage falls back to empty cart', async ({ page }) => {
    const cartPage = new CartPage(page);
    await page.addInitScript(() => {
      localStorage.setItem('cart', '{invalid-json');
    });

    await cartPage.goto();

    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.cartLink(0)).toBeVisible();
  });

  test('P1-M9-07: direct confirmation URL without order redirects away', async ({ page }) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);
    const cartPage = new CartPage(page);
    await loginViaUi(page);
    await orderConfirmationPage.goto();

    await expect(page).toHaveURL('/cart');
    await expect(cartPage.emptyHeading).toBeVisible();
  });
});
