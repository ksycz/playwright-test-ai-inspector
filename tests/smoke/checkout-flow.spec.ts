import { test, expect } from '@playwright/test';
import { invalidEmailDetails, sampleProduct, validCheckoutDetails, validUser } from '../data';
import { loginViaUi, loginWithProductInCart } from '../fixtures';
import {
  CartPage,
  CheckoutPage,
  LoginPage,
  OrderConfirmationPage,
  ProductsPage,
} from '../pages';

test.describe('@smoke P1-M7 — Checkout Flow', () => {
  test('P1-M7-01: happy path fills form, submits, and shows confirmation with order number', async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page);
    const orderConfirmationPage = new OrderConfirmationPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await checkoutPage.fillForm(validCheckoutDetails);
    await checkoutPage.placeOrder();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(orderConfirmationPage.heading).toBeVisible();
    await expect(orderConfirmationPage.orderNumber).toHaveText(/^ORD-\d+$/);
  });

  test('P1-M7-02: order summary on checkout matches cart contents', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await expect(checkoutPage.orderSummary.getByRole('heading', { name: 'Order summary', level: 2 })).toBeVisible();
    await expect(checkoutPage.orderSummary).toContainText(sampleProduct.name);
    await expect(checkoutPage.orderSummaryItem(sampleProduct.name)).toContainText(
      `$${sampleProduct.price.toFixed(2)}`,
    );
  });

  test('P1-M7-03: empty cart blocks checkout', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);
    await loginViaUi(page);
    await checkoutPage.goto();

    await expect(page).toHaveURL('/cart');
    await expect(cartPage.emptyHeading).toBeVisible();
  });

  test('P1-M7-04: required field validation on empty submit', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await checkoutPage.placeOrder();

    await expect(checkoutPage.validationError('Name is required')).toBeVisible();
    await expect(checkoutPage.validationError('Email is required')).toBeVisible();
    await expect(checkoutPage.validationError('Address is required')).toBeVisible();
    await expect(checkoutPage.validationError('City is required')).toBeVisible();
    await expect(checkoutPage.validationError('ZIP Code is required')).toBeVisible();
    await expect(page).toHaveURL('/checkout');
  });

  test('P1-M7-05: invalid email format shows validation error', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await checkoutPage.fillForm(invalidEmailDetails);
    await checkoutPage.placeOrder();

    await expect(checkoutPage.validationError('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL('/checkout');
  });

  test('P1-M7-06: cart cleared after successful order', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);
    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await checkoutPage.fillForm(validCheckoutDetails);
    await checkoutPage.placeOrder();

    await expect(page).toHaveURL('/order-confirmation');
    await cartPage.goto();

    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.cartLink(0)).toBeVisible();
  });

  test('P1-M7-07: full E2E browse, add, login, checkout, confirm', async ({ page }) => {
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
    await checkoutPage.placeOrder();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(orderConfirmationPage.heading).toBeVisible();
    await expect(orderConfirmationPage.orderNumber).toHaveText(/^ORD-\d+$/);
    await expect(page.getByText(sampleProduct.name)).toBeVisible();
    await expect(orderConfirmationPage.continueShoppingLink).toBeVisible();
  });

  test('P1-M7-08: direct visit to confirmation without order redirects away', async ({ page }) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);
    const cartPage = new CartPage(page);
    await loginViaUi(page);
    await orderConfirmationPage.goto();

    await expect(page).toHaveURL('/cart');
    await expect(cartPage.emptyHeading).toBeVisible();
  });
});
