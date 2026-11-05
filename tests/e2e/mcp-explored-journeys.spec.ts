import { test, expect, type Page } from '@playwright/test';
import { findProductBySlug, sampleProduct, validCheckoutDetails, validUser } from '../data';
import { CartPage, CheckoutPage, LoginPage, OrderConfirmationPage, ProductsPage } from '../pages';

/**
 * Scenarios found by exploring the running shop with Playwright MCP, then
 * rewritten to use this repo's page objects and test data.
 * See "AI-assisted test generation with Playwright MCP" in the README.
 */
const secondProduct = findProductBySlug('desk-lamp')!;
// Fixed on purpose: $29.99 + $34.50, so the app's total is checked against an independent value.
const expectedTotalAmount = '$64.49';
const expectedTotal = `Total: ${expectedTotalAmount}`;

async function addTwoProducts(page: Page) {
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  await productsPage.addToCart(sampleProduct.name);
  await productsPage.addToCart(secondProduct.name);
  await expect(productsPage.cartLink(2)).toBeVisible();
}

async function placeTwoProductOrder(page: Page) {
  const cartPage = new CartPage(page);
  const loginPage = new LoginPage(page);
  const checkoutPage = new CheckoutPage(page);

  await addTwoProducts(page);
  await cartPage.goto();
  await cartPage.proceedToCheckout();
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout$/);
  await loginPage.login(validUser.username, validUser.password);
  await expect(page).toHaveURL('/checkout');
  await checkoutPage.fillForm(validCheckoutDetails);
  await checkoutPage.placeOrder({ waitForConfirmation: true });
}

test.describe('@e2e MCP-explored journeys', () => {
  test('two-product total stays the same from cart through confirmation', async ({ page }) => {
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);
    const orderConfirmationPage = new OrderConfirmationPage(page);

    await addTwoProducts(page);
    await cartPage.goto();
    await expect(cartPage.cartTotal).toHaveText(expectedTotalAmount);

    await cartPage.proceedToCheckout();
    await loginPage.login(validUser.username, validUser.password);
    await expect(checkoutPage.orderSummaryItem(sampleProduct.name)).toBeVisible();
    await expect(checkoutPage.orderSummaryItem(secondProduct.name)).toBeVisible();
    await expect(checkoutPage.orderSummary.getByText(expectedTotal)).toBeVisible();

    await checkoutPage.fillForm(validCheckoutDetails);
    await checkoutPage.placeOrder({ waitForConfirmation: true });

    const orderDetails = page.getByRole('region', { name: 'Order details' });
    await expect(orderConfirmationPage.heading).toBeVisible();
    await expect(orderDetails.getByText(sampleProduct.name)).toBeVisible();
    await expect(orderDetails.getByText(secondProduct.name)).toBeVisible();
    await expect(orderDetails.getByText(expectedTotal)).toBeVisible();
  });

  test('cart is kept after logging out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);

    await addTwoProducts(page);
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await expect(loginPage.logoutButton).toBeVisible();

    await loginPage.logout();
    await expect(loginPage.loginLink).toBeVisible();
    await expect(cartPage.cartLink(2)).toBeVisible();

    await cartPage.goto();
    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
    await expect(cartPage.productRow(secondProduct.name)).toBeVisible();
    await expect(cartPage.cartTotal).toHaveText(expectedTotalAmount);
  });

  test('order confirmation keeps the same order number after reload', async ({ page }) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);

    await placeTwoProductOrder(page);
    const orderNumber = await orderConfirmationPage.orderNumber.textContent();
    expect(orderNumber).toMatch(/^ORD-\d+$/);

    await page.reload();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(orderConfirmationPage.heading).toBeVisible();
    await expect(orderConfirmationPage.orderNumber).toHaveText(orderNumber!);
  });

  test('checkout redirects to the empty cart after an order is placed', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);

    await placeTwoProductOrder(page);
    await checkoutPage.goto();

    await expect(page).toHaveURL('/cart');
    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.cartLink(0)).toBeVisible();
  });
});
