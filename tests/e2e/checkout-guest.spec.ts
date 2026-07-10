import { test, expect } from '@playwright/test';
import { addProductAndOpenCart } from '../fixtures';
import { CartPage, CheckoutPage, LoginPage } from '../pages';

test.describe('@e2e Checkout authentication', () => {
  test('P2-M6-03: guest redirected to login when accessing checkout', async ({ page }) => {
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);
    const checkoutPage = new CheckoutPage(page);

    await addProductAndOpenCart(page);
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');
    await expect(loginPage.heading).toBeVisible();

    await checkoutPage.goto();

    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');
    await expect(loginPage.heading).toBeVisible();
  });
});
