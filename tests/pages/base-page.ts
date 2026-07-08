import { type Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get banner() {
    return this.page.getByRole('banner');
  }

  get navigation() {
    return this.page.getByRole('navigation');
  }

  get main() {
    return this.page.getByRole('main');
  }

  get homeLink() {
    return this.page.getByRole('link', { name: 'Home' });
  }

  get productsLink() {
    return this.page.getByRole('link', { name: 'Products' });
  }

  get loginLink() {
    return this.page.getByRole('link', { name: 'Login' });
  }

  cartLink(itemCount: number) {
    const suffix = itemCount === 1 ? '1 item' : `${itemCount} items`;
    return this.page.getByRole('link', { name: `Cart, ${suffix}` });
  }

  get cartNavLink() {
    return this.page.getByRole('link', { name: /Cart/ });
  }

  async gotoHome() {
    await this.page.goto('/');
  }

  async gotoProducts() {
    await this.page.goto('/products');
  }

  async gotoCart() {
    await this.page.goto('/cart');
  }

  async gotoLogin() {
    await this.page.goto('/login');
  }

  async gotoCheckout() {
    await this.page.goto('/checkout');
  }

  async navigateToHome() {
    await this.homeLink.click();
  }

  async navigateToProducts() {
    await this.productsLink.click();
  }

  async navigateToCart() {
    await this.cartNavLink.click();
  }

  async navigateToLogin() {
    await this.loginLink.click();
  }
}
