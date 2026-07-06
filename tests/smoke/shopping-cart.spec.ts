import { test, expect } from '@playwright/test';
import products from '../../app/src/data/products.json';

const sampleProduct = products[0];

async function addSampleProductToCart(page: import('@playwright/test').Page) {
  await page.goto('/products');
  await page.getByRole('button', { name: `Add ${sampleProduct.name} to cart` }).click();
  await page.goto('/cart');
}

test.describe('P1-M5 — Shopping Cart', () => {
  test('P1-M5-01: cart shows added items with name, quantity, and line subtotal', async ({ page }) => {
    await addSampleProductToCart(page);

    const row = page.getByRole('row', { name: new RegExp(sampleProduct.name) });
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: '1' })).toBeVisible();
    await expect(row.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M5-02: increase quantity updates line subtotal and cart total', async ({ page }) => {
    await addSampleProductToCart(page);

    const lineSubtotal = sampleProduct.price * 2;
    await page.getByRole('button', { name: `Increase quantity of ${sampleProduct.name}` }).click();

    await expect(page.getByTestId('cart-total')).toHaveText(`$${lineSubtotal.toFixed(2)}`);
    await expect(
      page.getByRole('row', { name: new RegExp(sampleProduct.name) }).getByText(
        `$${lineSubtotal.toFixed(2)}`,
      ),
    ).toBeVisible();
  });

  test('P1-M5-03: decrease quantity to 0 removes the item', async ({ page }) => {
    await addSampleProductToCart(page);

    await page.getByRole('button', { name: `Decrease quantity of ${sampleProduct.name}` }).click();

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('P1-M5-04: remove item deletes it and recalculates total', async ({ page }) => {
    await addSampleProductToCart(page);

    await page.getByRole('button', { name: `Remove ${sampleProduct.name} from cart` }).click();

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(page.getByTestId('cart-total')).toHaveCount(0);
  });

  test('P1-M5-05: clear cart empties all items', async ({ page }) => {
    await addSampleProductToCart(page);
    await page.goto('/products');
    await page.getByRole('button', { name: `Add ${products[1].name} to cart` }).click();
    await page.goto('/cart');

    await page.getByRole('button', { name: 'Clear cart' }).click();

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('P1-M5-06: empty cart shows message and link to Products', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse products' })).toBeVisible();
  });

  test('P1-M5-07: cart persists after page reload', async ({ page }) => {
    await addSampleProductToCart(page);

    await page.reload();

    await expect(page.getByRole('row', { name: new RegExp(sampleProduct.name) })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();
  });

  test('P1-M5-08: proceed to checkout button is visible', async ({ page }) => {
    await addSampleProductToCart(page);

    await expect(page.getByRole('button', { name: 'Proceed to checkout' })).toBeVisible();
  });
});
