import { BasePage } from './base-page';

export class ProductDetailPage extends BasePage {
  async goto(slug: string) {
    await this.page.goto(`/products/${slug}`);
  }

  heading(name: string) {
    return this.page.getByRole('heading', { name, level: 1 });
  }

  productImage(name: string) {
    return this.page.getByRole('img', { name });
  }

  addToCartButton(name: string) {
    return this.page.getByRole('button', { name: `Add ${name} to cart` });
  }

  async addToCart(name: string) {
    await this.addToCartButton(name).click();
  }

  get productNotFoundHeading() {
    return this.page.getByRole('heading', { name: 'Product not found', level: 1 });
  }

  get productNotFoundMessage() {
    return this.page.getByText('We could not find a product matching that link.');
  }

  get backToProductsLink() {
    return this.page.getByRole('link', { name: 'Back to products' });
  }

  async goBackToProducts() {
    await this.backToProductsLink.click();
  }
}
