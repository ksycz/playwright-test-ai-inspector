# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-locfail.spec.ts >> expect renamed heading
- Location: tests/zz-locfail.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Your basket is empty' })
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Your basket is empty' }) with timeout 3000ms
  - waiting for getByRole('heading', { name: 'Your basket is empty' })

```

```yaml
- banner:
  - paragraph: Demo Shop
  - navigation "Main":
    - list:
      - listitem:
        - link "Home":
          - /url: /
      - listitem:
        - link "Products":
          - /url: /products
      - listitem:
        - link "Cart, 0 items":
          - /url: /cart
          - text: Cart (0)
      - listitem:
        - link "Login":
          - /url: /login
- main:
  - heading "Shopping cart" [level=1]
  - heading "Your cart is empty" [level=2]
  - paragraph: Add products from the catalogue to get started.
  - paragraph:
    - link "Browse products":
      - /url: /products
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | test('click renamed button', async ({ page }) => {
  3  |   await page.goto('/products');
  4  |   await page.getByRole('button', { name: 'Add Wireless Mouse to basket' }).click({ timeout: 3000 });
  5  | });
  6  | test('expect renamed heading', async ({ page }) => {
  7  |   await page.goto('/cart');
> 8  |   await expect(page.getByRole('heading', { name: 'Your basket is empty' })).toBeVisible({ timeout: 3000 });
     |                                                                             ^ Error: expect(locator).toBeVisible() failed
  9  | });
  10 | test('label renamed', async ({ page }) => {
  11 |   await page.goto('/login');
  12 |   await page.getByLabel('User name', { exact: true }).fill('x', { timeout: 3000 });
  13 | });
  14 | 
```