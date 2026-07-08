import { BasePage } from './base-page';

export class HomePage extends BasePage {
  async goto() {
    await this.page.goto('/');
  }

  async gotoWithNoFeatured() {
    await this.page.goto('/?featured=none');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Welcome to Demo Shop', level: 1 });
  }

  get introText() {
    return this.page.getByText(
      'A simple demo e-commerce app for learning Playwright and test automation.',
    );
  }

  get featuredProductsHeading() {
    return this.page.getByRole('heading', { name: 'Featured products', level: 2 });
  }

  get noFeaturedMessage() {
    return this.page.getByText('No featured products at the moment.');
  }

  get productCards() {
    return this.page.getByRole('article');
  }

  featuredProductCard(name: string) {
    return this.page.getByRole('article', { name });
  }

  async openFeaturedProduct(name: string) {
    await this.featuredProductCard(name).getByRole('link', { name }).click();
  }
}
