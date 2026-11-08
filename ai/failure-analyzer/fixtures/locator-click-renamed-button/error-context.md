# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-locfail.spec.ts >> click renamed button
- Location: tests/zz-locfail.spec.ts:2:5

# Error details

```
TimeoutError: locator.click: Timeout 3000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add Wireless Mouse to basket' })

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
    - heading "Products" [level=1] [ref=e19]
    - paragraph [ref=e20]: Browse our demo catalogue and add items to your cart.
    - list [ref=e22]:
      - listitem [ref=e23]:
        - article [ref=e24]:
          - img "Wireless Mouse" [ref=e26]
          - heading [level=2] [ref=e27]:
            - link "Wireless Mouse" [ref=e28] [cursor=pointer]:
              - /url: /products/wireless-mouse
          - paragraph [ref=e29]:
            - generic [ref=e30]: Electronics
          - paragraph [ref=e31]: Ergonomic wireless mouse with silent clicks.
          - paragraph [ref=e32]: $29.99
          - button "Add Wireless Mouse to cart" [ref=e33]
      - listitem [ref=e34]:
        - article [ref=e35]:
          - img "Mechanical Keyboard" [ref=e37]
          - heading [level=2] [ref=e38]:
            - link "Mechanical Keyboard" [ref=e39] [cursor=pointer]:
              - /url: /products/mechanical-keyboard
          - paragraph [ref=e40]:
            - generic [ref=e41]: Electronics
          - paragraph [ref=e42]: Compact mechanical keyboard with tactile switches.
          - paragraph [ref=e43]: $89.99
          - button "Add Mechanical Keyboard to cart" [ref=e44]
      - listitem [ref=e45]:
        - article [ref=e46]:
          - img "USB-C Hub" [ref=e48]
          - heading [level=2] [ref=e49]:
            - link "USB-C Hub" [ref=e50] [cursor=pointer]:
              - /url: /products/usb-c-hub
          - paragraph [ref=e51]:
            - generic [ref=e52]: Electronics
          - paragraph [ref=e53]: 7-in-1 USB-C hub with HDMI and SD card reader.
          - paragraph [ref=e54]: $45.00
          - button "Add USB-C Hub to cart" [ref=e55]
      - listitem [ref=e56]:
        - article [ref=e57]:
          - img "Desk Lamp" [ref=e59]
          - heading [level=2] [ref=e60]:
            - link "Desk Lamp" [ref=e61] [cursor=pointer]:
              - /url: /products/desk-lamp
          - paragraph [ref=e62]:
            - generic [ref=e63]: Home Office
          - paragraph [ref=e64]: LED desk lamp with adjustable brightness.
          - paragraph [ref=e65]: $34.50
          - button "Add Desk Lamp to cart" [ref=e66]
      - listitem [ref=e67]:
        - article [ref=e68]:
          - img "Notebook Set" [ref=e70]
          - heading [level=2] [ref=e71]:
            - link "Notebook Set" [ref=e72] [cursor=pointer]:
              - /url: /products/notebook-set
          - paragraph [ref=e73]:
            - generic [ref=e74]: Stationery
          - paragraph [ref=e75]: Set of three ruled A5 notebooks.
          - paragraph [ref=e76]: $12.99
          - button "Add Notebook Set to cart" [ref=e77]
      - listitem [ref=e78]:
        - article [ref=e79]:
          - img "Insulated Bottle" [ref=e81]
          - heading [level=2] [ref=e82]:
            - link "Insulated Bottle" [ref=e83] [cursor=pointer]:
              - /url: /products/insulated-bottle
          - paragraph [ref=e84]:
            - generic [ref=e85]: Accessories
          - paragraph [ref=e86]: Stainless steel bottle keeps drinks cold for 24 hours.
          - paragraph [ref=e87]: $24.99
          - button "Add Insulated Bottle to cart" [ref=e88]
      - listitem [ref=e89]:
        - article [ref=e90]:
          - img "Laptop Stand" [ref=e92]
          - heading [level=2] [ref=e93]:
            - link "Laptop Stand" [ref=e94] [cursor=pointer]:
              - /url: /products/laptop-stand
          - paragraph [ref=e95]:
            - generic [ref=e96]: Home Office
          - paragraph [ref=e97]: Adjustable aluminium laptop stand.
          - paragraph [ref=e98]: $39.99
          - button "Add Laptop Stand to cart" [ref=e99]
      - listitem [ref=e100]:
        - article [ref=e101]:
          - img "HD Webcam" [ref=e103]
          - heading [level=2] [ref=e104]:
            - link "HD Webcam" [ref=e105] [cursor=pointer]:
              - /url: /products/webcam-hd
          - paragraph [ref=e106]:
            - generic [ref=e107]: Electronics
          - paragraph [ref=e108]: 1080p webcam with built-in microphone.
          - paragraph [ref=e109]: $59.99
          - button "Add HD Webcam to cart" [ref=e110]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | test('click renamed button', async ({ page }) => {
  3  |   await page.goto('/products');
> 4  |   await page.getByRole('button', { name: 'Add Wireless Mouse to basket' }).click({ timeout: 3000 });
     |                                                                            ^ TimeoutError: locator.click: Timeout 3000ms exceeded.
  5  | });
  6  | test('expect renamed heading', async ({ page }) => {
  7  |   await page.goto('/cart');
  8  |   await expect(page.getByRole('heading', { name: 'Your basket is empty' })).toBeVisible({ timeout: 3000 });
  9  | });
  10 | test('label renamed', async ({ page }) => {
  11 |   await page.goto('/login');
  12 |   await page.getByLabel('User name', { exact: true }).fill('x', { timeout: 3000 });
  13 | });
  14 | 
```