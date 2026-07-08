# Page Objects

Playwright Page Object Model classes for the Demo Shop app.

Naming convention:

- Class names use `PascalCase` and end with `Page`
- File names use `kebab-case`

All locators should live in page objects, not in spec files.

## Available page objects

- `BasePage` — shared layout and navigation helpers
- `HomePage` — home page and featured products
- `ProductsPage` — product catalogue
- `ProductDetailPage` — product detail and not-found states
- `CartPage` — shopping cart
- `LoginPage` — authentication
- `CheckoutPage` — checkout form and order summary
- `OrderConfirmationPage` — order confirmation
- `NotFoundPage` — app-level 404 page

Import from `../pages` in smoke specs.
