import { BasePage } from './base-page';

export class CartPage extends BasePage {
  async goto() {
    await this.page.goto('/cart');
  }

  get emptyHeading() {
    return this.page.getByRole('heading', { name: 'Your cart is empty' });
  }

  get emptyMessage() {
    return this.page.getByText('Add products from the catalogue to get started.');
  }

  get browseProductsLink() {
    return this.page.getByRole('link', { name: 'Browse products' });
  }

  get proceedToCheckoutButton() {
    return this.page.getByRole('button', { name: 'Proceed to checkout' });
  }

  get clearCartButton() {
    return this.page.getByRole('button', { name: 'Clear cart' });
  }

  get cartTotal() {
    return this.page.getByTestId('cart-total');
  }

  productRow(productName: string) {
    return this.page.getByRole('row', { name: new RegExp(productName) });
  }

  increaseQuantityButton(productName: string) {
    return this.page.getByRole('button', { name: `Increase quantity of ${productName}` });
  }

  decreaseQuantityButton(productName: string) {
    return this.page.getByRole('button', { name: `Decrease quantity of ${productName}` });
  }

  removeProductButton(productName: string) {
    return this.page.getByRole('button', { name: `Remove ${productName} from cart` });
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  async clearCart() {
    await this.clearCartButton.click();
  }
}
