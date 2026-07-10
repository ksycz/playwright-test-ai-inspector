import { mergeTests, type Page } from '@playwright/test';
import { CartPage } from '../pages';
import { authTest, loginViaUi } from './auth.fixture';
import { addSampleProductToCart, cartTest } from './cart.fixture';

export const test = mergeTests(authTest, cartTest);

export { expect } from '@playwright/test';
export { loginViaUi } from './auth.fixture';
export { addSampleProductToCart } from './cart.fixture';

export async function loginWithProductInCart(page: Page) {
  await loginViaUi(page);
  await addSampleProductToCart(page);
}

export async function addProductAndOpenCart(page: Page) {
  await addSampleProductToCart(page);
  const cartPage = new CartPage(page);
  await cartPage.goto();
}
