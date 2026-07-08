import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  async goto() {
    await this.page.goto('/login');
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Log in', level: 1 });
  }

  get usernameInput() {
    return this.page.getByLabel('Username');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Log in' });
  }

  get logoutButton() {
    return this.page.getByRole('button', { name: 'Log out' });
  }

  get errorAlert() {
    return this.page.getByRole('alert');
  }

  welcomeMessage(username: string) {
    return this.page.getByText(`Welcome, ${username}`);
  }

  validationError(message: string) {
    return this.page.getByText(message);
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
