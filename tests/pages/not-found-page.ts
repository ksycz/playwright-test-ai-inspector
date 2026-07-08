import { BasePage } from './base-page';

export class NotFoundPage extends BasePage {
  async goto(path = '/does-not-exist') {
    await this.page.goto(path);
  }

  get heading() {
    return this.page.getByRole('heading', { name: 'Page not found', level: 1 });
  }

  get message() {
    return this.page.getByText('The page you are looking for does not exist.');
  }

  get backToHomeLink() {
    return this.page.getByRole('link', { name: 'Back to Home' });
  }
}
