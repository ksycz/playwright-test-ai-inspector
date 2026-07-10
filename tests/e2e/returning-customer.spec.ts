import { test, expect } from '@playwright/test';
import { sampleProduct, validCheckoutDetails } from '../data';
import { loginWithProductInCart } from '../fixtures';
import { CheckoutPage, LoginPage, OrderConfirmationPage } from '../pages';

test.describe('@e2e Returning customer checkout', () => {
  test('logged-in customer completes checkout without auth redirect', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);
    const orderConfirmationPage = new OrderConfirmationPage(page);

    await loginWithProductInCart(page);
    await checkoutPage.goto();

    await expect(page).toHaveURL('/checkout');
    await expect(loginPage.heading).toHaveCount(0);

    await checkoutPage.fillForm(validCheckoutDetails);
    await checkoutPage.placeOrder();

    await expect(page).toHaveURL('/order-confirmation');
    await expect(orderConfirmationPage.heading).toBeVisible();
    await expect(orderConfirmationPage.orderNumber).toHaveText(/^ORD-\d+$/);
    await expect(page.getByText(sampleProduct.name)).toBeVisible();
  });
});
