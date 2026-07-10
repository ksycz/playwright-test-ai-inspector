# Fixtures

Custom Playwright fixtures for authenticated sessions and preloaded cart state.

## Usage

Import the extended `test` helper instead of `@playwright/test`:

```ts
import { test, expect } from '../fixtures';
import { CheckoutPage } from '../pages';

test('checkout with logged-in session', async ({ loggedInPage }) => {
  const checkoutPage = new CheckoutPage(loggedInPage);
  await checkoutPage.goto();
  await expect(checkoutPage.heading).toBeVisible();
});
```

## Available fixtures

| Fixture | Description |
|---|---|
| `loggedInPage` | Page with a valid demo user session (`standard_user`) |
| `cartWithItem` | Page with `sampleProduct` already added to the cart |

## Helpers

Reusable setup functions are also exported for specs that still use the default Playwright `test`:

- `loginViaUi(page)` — logs in through the login form
- `addSampleProductToCart(page)` — adds the shared sample product via the catalogue
- `loginWithProductInCart(page)` — logs in and adds the sample product
- `addProductAndOpenCart(page)` — adds the sample product and navigates to the cart page

## Examples

See `fixtures.spec.ts` for P2-M4 fixture scenarios.
