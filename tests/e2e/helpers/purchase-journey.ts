import { type Page, expect } from '@playwright/test';
import { sampleProduct, validCheckoutDetails, validUser } from '../../data';
import {
  CartPage,
  CheckoutPage,
  LoginPage,
  OrderConfirmationPage,
  ProductsPage,
} from '../../pages';

export async function completeGuestPurchaseJourney(page: Page) {
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
  await checkoutPage.placeOrder({ waitForConfirmation: true });

  await expect(page).toHaveURL('/order-confirmation');
  await expect(orderConfirmationPage.heading).toBeVisible();
  await expect(orderConfirmationPage.orderNumber).toHaveText(/^ORD-\d+$/);
  await expect(page.getByText(sampleProduct.name)).toBeVisible();
  await expect(orderConfirmationPage.continueShoppingLink).toBeVisible();
}
