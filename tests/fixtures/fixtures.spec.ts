import { sampleProduct, validUser } from '../data';
import { CartPage, CheckoutPage, LoginPage, ProductsPage } from '../pages';
import { expect, test } from './index';

test.describe('P2-M4 — Auth and Cart Fixtures', () => {
  test('P2-M4-01: auth fixture provides logged-in session', async ({ loggedInPage }) => {
    const loginPage = new LoginPage(loggedInPage);

    await expect(loginPage.welcomeMessage(validUser.username)).toBeVisible();
    await expect(loginPage.logoutButton).toBeVisible();
  });

  test('P2-M4-02: cart fixture provides cart with one item', async ({ cartWithItem }) => {
    const productsPage = new ProductsPage(cartWithItem);
    const cartPage = new CartPage(cartWithItem);

    await expect(productsPage.cartLink(1)).toBeVisible();

    await cartPage.goto();
    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
  });

  test('P2-M4-03: fixtures compose with existing page objects', async ({ loggedInPage }) => {
    const productsPage = new ProductsPage(loggedInPage);
    const checkoutPage = new CheckoutPage(loggedInPage);

    await productsPage.goto();
    await productsPage.addToCart(sampleProduct.name);
    await checkoutPage.goto();

    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.orderSummary).toContainText(sampleProduct.name);
  });
});
