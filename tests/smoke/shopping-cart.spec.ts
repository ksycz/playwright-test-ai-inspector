import { test, expect } from '@playwright/test';
import { catalogue, sampleProduct } from '../data';
import { addProductAndOpenCart } from '../fixtures';
import { CartPage, ProductsPage } from '../pages';

test.describe('@smoke P1-M5 — Shopping Cart', () => {
  test('P1-M5-01: cart shows added items with name, quantity, and line subtotal', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    const row = cartPage.productRow(sampleProduct.name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: '1' })).toBeVisible();
    await expect(row.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M5-02: increase quantity updates line subtotal and cart total', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    const lineSubtotal = sampleProduct.price * 2;
    await cartPage.increaseQuantityButton(sampleProduct.name).click();

    await expect(cartPage.cartTotal).toHaveText(`$${lineSubtotal.toFixed(2)}`);
    await expect(cartPage.productRow(sampleProduct.name).getByText(`$${lineSubtotal.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M5-03: decrease quantity to 0 removes the item', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    await cartPage.decreaseQuantityButton(sampleProduct.name).click();

    await expect(cartPage.emptyHeading).toBeVisible();
  });

  test('P1-M5-04: remove item deletes it and recalculates total', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    await cartPage.removeProductButton(sampleProduct.name).click();

    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.cartTotal).toHaveCount(0);
  });

  test('P1-M5-05: clear cart empties all items', async ({ page }) => {
    const cartPage = new CartPage(page);
    const productsPage = new ProductsPage(page);
    await addProductAndOpenCart(page);
    await productsPage.goto();
    await productsPage.addToCart(catalogue[1].name);
    await cartPage.goto();
    await cartPage.clearCart();

    await expect(cartPage.emptyHeading).toBeVisible();
  });

  test('P1-M5-06: empty cart shows message and link to Products', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(cartPage.emptyHeading).toBeVisible();
    await expect(cartPage.browseProductsLink).toBeVisible();
  });

  test('P1-M5-07: cart persists after page reload', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    await page.reload();

    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
    await expect(cartPage.cartLink(1)).toBeVisible();
  });

  test('P1-M5-08: proceed to checkout button is visible', async ({ page }) => {
    const cartPage = new CartPage(page);
    await addProductAndOpenCart(page);

    await expect(cartPage.proceedToCheckoutButton).toBeVisible();
  });
});
