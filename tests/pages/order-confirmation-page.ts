import { BasePage } from './base-page';

export class OrderConfirmationPage extends BasePage {
  async goto() {
    await this.page.goto('/order-confirmation');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Order confirmed', level: 1 });
  }

  get orderNumber() {
    return this.page.getByTestId('order-number');
  }

  get continueShoppingLink() {
    return this.page.getByRole('link', { name: 'Continue shopping' });
  }
}
