import { BasePage } from './base-page';

export class ProductsPage extends BasePage {
  async goto() {
    await this.page.goto('/products');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Products', level: 1 });
  }

  get productCards() {
    return this.page.getByRole('article');
  }

  productCard(name: string) {
    return this.page.getByRole('article', { name });
  }

  addToCartButton(name: string) {
    return this.page.getByRole('button', { name: `Add ${name} to cart` });
  }

  productImage(name: string) {
    return this.page.getByRole('img', { name });
  }

  async addToCart(name: string) {
    await this.addToCartButton(name).click();
  }

  async openProduct(name: string) {
    await this.productCard(name).getByRole('link', { name }).click();
  }
}
