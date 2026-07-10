import { test, expect } from '@playwright/test';
import { featuredProducts } from '../data';
import { HomePage, ProductDetailPage } from '../pages';

const sampleFeaturedProduct = featuredProducts[0];

test.describe('@smoke P1-M8 — Home Page and Featured Products', () => {
  test('P1-M8-01: home page shows intro heading and description', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.introText).toBeVisible();
  });

  test('P1-M8-02: featured products section renders product cards', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.featuredProductsHeading).toBeVisible();

    for (const product of featuredProducts) {
      await expect(homePage.featuredProductCard(product.name)).toBeVisible();
    }
  });

  test('P1-M8-03: clicking featured product navigates to detail page', async ({ page }) => {
    const homePage = new HomePage(page);
    const productDetailPage = new ProductDetailPage(page);
    await homePage.goto();
    await homePage.openFeaturedProduct(sampleFeaturedProduct.name);

    await expect(page).toHaveURL(`/products/${sampleFeaturedProduct.slug}`);
    await expect(productDetailPage.heading(sampleFeaturedProduct.name)).toBeVisible();
  });

  test('P1-M8-04: no featured products shows fallback message', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.gotoWithNoFeatured();

    await expect(homePage.featuredProductsHeading).toBeVisible();
    await expect(homePage.noFeaturedMessage).toBeVisible();
    await expect(homePage.productCards).toHaveCount(0);
  });
});
