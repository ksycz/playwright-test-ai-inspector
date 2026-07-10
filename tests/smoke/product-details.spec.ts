import { test, expect } from '@playwright/test';
import { sampleProduct } from '../data';
import { ProductDetailPage, ProductsPage } from '../pages';

test.describe('@smoke P1-M4 — Product Details', () => {
  test('P1-M4-01: navigating to /products/{slug} shows product details', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto(sampleProduct.slug);

    await expect(page).toHaveURL(`/products/${sampleProduct.slug}`);
    await expect(productDetailPage.heading(sampleProduct.name)).toBeVisible();
    await expect(productDetailPage.productImage(sampleProduct.name)).toBeVisible();
  });

  test('P1-M4-02: detail page displays full description, category, and price', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto(sampleProduct.slug);

    await expect(page.getByText(sampleProduct.category)).toBeVisible();
    await expect(page.getByText(sampleProduct.fullDescription)).toBeVisible();
    await expect(page.getByText(`$${sampleProduct.price.toFixed(2)}`)).toBeVisible();
  });

  test('P1-M4-03: add to cart from detail page updates cart badge', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto(sampleProduct.slug);
    await productDetailPage.addToCart(sampleProduct.name);

    await expect(productDetailPage.cartLink(1)).toBeVisible();
  });

  test('P1-M4-04: clicking product in catalogue navigates to detail page', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const productDetailPage = new ProductDetailPage(page);
    await productsPage.goto();
    await productsPage.openProduct(sampleProduct.name);

    await expect(page).toHaveURL(`/products/${sampleProduct.slug}`);
    await expect(productDetailPage.heading(sampleProduct.name)).toBeVisible();
  });

  test('P1-M4-05: unknown slug shows product-not-found state', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    await productDetailPage.goto('unknown-product');

    await expect(productDetailPage.productNotFoundHeading).toBeVisible();
    await expect(productDetailPage.backToProductsLink).toBeVisible();
  });

  test('P1-M4-06: back to products link returns to catalogue', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const productsPage = new ProductsPage(page);
    await productDetailPage.goto(sampleProduct.slug);
    await productDetailPage.goBackToProducts();

    await expect(page).toHaveURL('/products');
    await expect(productsPage.heading).toBeVisible();
  });
});
