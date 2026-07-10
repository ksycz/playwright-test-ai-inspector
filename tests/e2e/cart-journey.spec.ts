import { test, expect } from '@playwright/test';
import { catalogue, sampleProduct } from '../data';
import { addSampleProductToCart } from '../fixtures';
import { CartPage, HomePage, ProductsPage } from '../pages';

test.describe('@e2e Cart journey', () => {
  test('P2-M6-04: cart persistence across navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);

    await addSampleProductToCart(page);
    await expect(productsPage.cartLink(1)).toBeVisible();

    await homePage.goto();
    await expect(homePage.cartLink(1)).toBeVisible();

    await productsPage.goto();
    await expect(productsPage.cartLink(1)).toBeVisible();

    await cartPage.goto();
    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
    await expect(cartPage.cartLink(1)).toBeVisible();
  });

  test('cart management updates quantities and removes items', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const secondProduct = catalogue[1];

    await productsPage.goto();
    await productsPage.addToCart(sampleProduct.name);
    await productsPage.addToCart(secondProduct.name);
    await expect(productsPage.cartLink(2)).toBeVisible();

    await cartPage.goto();
    await cartPage.increaseQuantityButton(sampleProduct.name).click();
    await expect(cartPage.cartLink(3)).toBeVisible();

    await cartPage.removeProductButton(secondProduct.name).click();
    await expect(cartPage.productRow(sampleProduct.name)).toBeVisible();
    await expect(cartPage.productRow(secondProduct.name)).toHaveCount(0);
    await expect(cartPage.cartLink(2)).toBeVisible();
  });
});
