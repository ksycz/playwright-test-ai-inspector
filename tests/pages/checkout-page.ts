import { BasePage } from './base-page';

export interface CheckoutDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
}

export class CheckoutPage extends BasePage {
  async goto() {
    await this.page.goto('/checkout');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Checkout', level: 1 });
  }

  get nameInput() {
    return this.page.getByLabel('Name');
  }

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get addressInput() {
    return this.page.getByLabel('Address');
  }

  get cityInput() {
    return this.page.getByLabel('City');
  }

  get zipCodeInput() {
    return this.page.getByLabel('ZIP Code');
  }

  get placeOrderButton() {
    return this.page.getByRole('button', { name: 'Place order' });
  }

  get orderSummary() {
    return this.page.getByRole('region', { name: 'Order summary' });
  }

  validationError(message: string) {
    return this.page.getByText(message);
  }

  orderSummaryItem(productName: string) {
    return this.orderSummary.getByRole('listitem').filter({ hasText: productName });
  }

  async fillForm(details: CheckoutDetails) {
    await this.nameInput.fill(details.name);
    await this.emailInput.fill(details.email);
    await this.addressInput.fill(details.address);
    await this.cityInput.fill(details.city);
    await this.zipCodeInput.fill(details.zipCode);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}
