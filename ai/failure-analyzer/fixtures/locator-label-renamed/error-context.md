# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-locfail.spec.ts >> label renamed
- Location: tests/zz-locfail.spec.ts:10:5

# Error details

```
TimeoutError: locator.fill: Timeout 3000ms exceeded.
Call log:
  - waiting for getByLabel('User name', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - paragraph [ref=e7]: Demo Shop
      - navigation "Main" [ref=e8]:
        - list [ref=e9]:
          - listitem [ref=e10]:
            - link "Home" [ref=e11] [cursor=pointer]:
              - /url: /
          - listitem [ref=e12]:
            - link "Products" [ref=e13] [cursor=pointer]:
              - /url: /products
          - listitem [ref=e14]:
            - link "Cart, 0 items" [ref=e15] [cursor=pointer]:
              - /url: /cart
              - text: Cart (0)
          - listitem [ref=e16]:
            - link "Login" [ref=e17] [cursor=pointer]:
              - /url: /login
  - main [ref=e18]:
    - heading "Log in" [level=1] [ref=e19]
    - paragraph [ref=e20]: Sign in to continue to checkout.
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]: Username
        - textbox "Username" [ref=e24]
      - generic [ref=e25]:
        - generic [ref=e26]: Password
        - textbox "Password" [ref=e27]
      - button "Log in" [ref=e28]
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
  8  |   await expect(page.getByRole('heading', { name: 'Your basket is empty' })).toBeVisible({ timeout: 3000 });
  9  | });
  10 | test('label renamed', async ({ page }) => {
  11 |   await page.goto('/login');
> 12 |   await page.getByLabel('User name', { exact: true }).fill('x', { timeout: 3000 });
     |                                                       ^ TimeoutError: locator.fill: Timeout 3000ms exceeded.
  13 | });
  14 | 
```