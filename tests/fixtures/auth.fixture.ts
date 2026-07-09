import { test as base, type Page } from '@playwright/test';
import { validUser } from '../data';
import { LoginPage } from '../pages';

export type AuthFixtures = {
  loggedInPage: Page;
};

export async function loginViaUi(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
}

export const authTest = base.extend<AuthFixtures>({
  loggedInPage: async ({ page }, use) => {
    await loginViaUi(page);
    await use(page);
  },
});
