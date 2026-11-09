import { test, expect } from '@playwright/test';
import { checkoutFieldErrors } from '../data';
import { loginWithProductInCart } from '../fixtures';
import {
  CartPage,
  CheckoutPage,
  NotFoundPage,
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
});
