# Project Roadmap

This document is the **single source of truth** for the implementation plan and technical progress log.

**Current focus:** Phase 2 — Playwright Testing Framework.

---

## How to Use This Document

### Before starting a milestone

1. Review this document.
2. Confirm the next milestone scope.
3. Explain what will be implemented.
4. Explain what should be testable later.
5. Do not include unrelated work.

### After completing a milestone

1. Update this document (checklist, status, date, summary, decisions, deviations).
2. Summarize the implementation.
3. Explain important architectural decisions.
4. Suggest future Playwright test scenarios.
5. Suggest a professional Conventional Commit message.
6. Stop and wait for approval before continuing.

### Living document rules

After every completed milestone, update:

- [ ] Completed checklist items
- [ ] Milestone status and completion date
- [ ] Summary of what was actually implemented
- [ ] Important architectural decisions
- [ ] Deviations from the original plan
- [ ] Dependencies, if changed

---

## Phase Overview

| Phase | Name | Status | Focus |
|---|---|---|---|
| **1** | Demo Shop Application | ✅ Completed | React demo e-commerce app |
| **2** | Playwright Testing Framework | 🚧 In progress | POM, fixtures, suites, CI |
| **3** | AI Test Inspector | ⏳ Planned | AI-assisted failure analysis |

---

## Shared Conventions (Phase 1)

| Topic | Decision |
|---|---|
| **Stack** | React, TypeScript, Vite, Tailwind CSS, React Router, Context API, Local Storage |
| **Structure** | `app/` (application), `tests/` (Playwright — implemented in Phase 2) |
| **Data** | `app/data/products.json` (8–10 products), `app/data/users.json` (fake user) |
| **Auth** | Username `standard_user` / password `secret123`; checkout is protected |
| **Routes** | `/`, `/products`, `/products/:slug`, `/login`, `/cart`, `/checkout`, `/order-confirmation` |
| **Locator priority** | `getByRole` → `getByLabel` → stable `getByText` → `data-testid` only when needed |
| **`data-testid` convention** | kebab-case, area-prefixed: `cart-badge`, `product-card-{slug}`, `cart-item-{slug}` |
| **Out of scope (Phase 1)** | Search, filtering, payments, inventory, admin, backend, real auth |

---

# Phase 1 — Demo Shop Application

Build a simple, testable demo e-commerce application that provides realistic user journeys for Playwright learning. Specification: [`docs/APP_SPEC.md`](./APP_SPEC.md).

**Phase 1 status:** ✅ Completed  
**Phase 1 started:** 2026-07-06  
**Phase 1 completed:** 2026-07-06

---

## P1-M1 — Project Foundation

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** None

### Goal

Establish the React application scaffold, tooling, and repository structure so subsequent milestones can be built incrementally inside `app/`.

### Implementation scope

- Create `app/` with Vite + React + TypeScript + Tailwind CSS
- Configure path aliases and base project structure
- Add `app/data/` directory for static JSON
- Align repository layout with README (`app/`, `tests/`, `docs/`)
- Add npm scripts: `dev`, `build`, `preview`
- Document local setup in README (if not already present)

### User scenarios

- Developer clones the repo and runs the app locally without errors.
- Developer sees a minimal placeholder page confirming the app started successfully.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M1-01 | App dev server starts and serves the root page |
| P1-M1-02 | Page has a document title and main landmark |

### Accessibility considerations

- Valid HTML document structure (`lang` attribute on `<html>`).
- Single main landmark on the placeholder page.

### Locator strategy

- `getByRole('main')` on placeholder page.

### Acceptance criteria

- [x] `app/` exists with Vite + React + TypeScript + Tailwind configured
- [x] `npm run dev` starts the application without errors
- [x] `npm run build` completes successfully
- [x] Repository structure matches planned layout
- [x] No feature logic beyond a minimal placeholder

### Completion checklist

- [x] Vite + React + TypeScript initialized in `app/`
- [x] Tailwind CSS configured
- [x] Base folder structure created (`components/`, `pages/`, `context/`, `data/`, `types/`)
- [x] npm scripts added (`dev`, `build`, `preview`)
- [x] Placeholder root page renders
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Created `app/` as a self-contained Vite + React + TypeScript project with Tailwind CSS. Added a minimal placeholder page with `<main>` landmark and document title "Demo Shop". Restructured Playwright to `tests/` with `webServer` integration. Root `package.json` delegates `dev`, `build`, and `preview` to `app/`.

**Architectural decisions:**
- `app/` has its own `package.json` to keep the demo shop separate from root Playwright tooling.
- `@` path alias maps to `app/src/` for cleaner imports in later milestones.
- Playwright `baseURL` and `webServer` point at the Vite dev server on port 5173.

**Deviations:**
- Data directory created at `app/src/data/` (inside source tree) rather than `app/data/` for co-location with future imports.
- Removed legacy `e2e/` example spec in favour of `tests/smoke/`.

**Tests implemented:** P1-M1-01, P1-M1-02 in `tests/smoke/app-foundation.spec.ts` (2 passing).

---

## P1-M2 — Application Layout and Routing

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M1

### Goal

Create the shared application shell, navigation, and routing foundation used by all pages.

### Implementation scope

- Install and configure React Router
- Create `AppLayout` with header navigation
- Add routes: Home, Products, Cart, Login, Checkout, OrderConfirmation, NotFound
- Implement navigation links: Home, Products, Cart, Login
- Add active page indication in navigation
- Add cart badge placeholder (shows `0`)
- Create placeholder page components for each route

### User scenarios

- Visitor opens the app and lands on the Home page.
- Visitor navigates to Products, Cart, and Login via the header.
- Visitor sees which page is currently active in the navigation.
- Visitor on an unknown URL sees a 404 page with a link back to Home.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M2-01 | App loads at `/` with layout visible |
| P1-M2-02 | Navigation links (Home, Products, Cart, Login) are present |
| P1-M2-03 | Clicking Products navigates to `/products` |
| P1-M2-04 | Active nav link is indicated on the current page |
| P1-M2-05 | Unknown route shows 404 with link to Home |
| P1-M2-06 | Cart badge displays `0` initially |

### Accessibility considerations

- Landmarks: `<header>`, `<nav>`, `<main>`.
- One `<h1>` per page.
- Active nav link uses `aria-current="page"`.
- Visible `focus-visible` styles on all nav links.
- Cart link accessible name includes item count (e.g. "Cart, 0 items").

### Locator strategy

- `getByRole('navigation')`
- `getByRole('link', { name: 'Home' })`
- `getByRole('link', { name: 'Products' })`
- `getByRole('link', { name: /Cart/ })`
- `getByRole('link', { name: 'Login' })`
- `getByRole('heading', { name: 'Page not found' })`
- `data-testid="cart-badge"` only if count cannot be asserted via accessible name

### Acceptance criteria

- [x] All routes render inside a shared layout
- [x] Navigation works between all major pages
- [x] Active page is visually and semantically indicated
- [x] 404 page handles unknown routes
- [x] Cart badge visible in header (static `0` for now)

### Completion checklist

- [x] React Router configured
- [x] `AppLayout` component with header navigation
- [x] Routes: `/`, `/products`, `/login`, `/cart`, `/checkout`, `/order-confirmation`
- [x] 404 / NotFound page
- [x] Active nav state via `aria-current="page"`
- [x] Cart badge placeholder in header
- [x] Placeholder content on all pages
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Added React Router with a shared `AppLayout` (header, nav, main). Placeholder pages for all routes. `NavLink` provides active state via `aria-current="page"`. Cart link uses `aria-label="Cart, 0 items"` for accessible badge assertion.

**Architectural decisions:**
- `BrowserRouter` wraps the app in `main.tsx`; route definitions live in `App.tsx`.
- Layout route pattern (`<Route element={<AppLayout />}>`) keeps nav consistent without repeating markup.
- `NavLink` with `end` on Home prevents `/products` from highlighting Home.
- Catch-all `*` route renders `NotFoundPage` inside the layout so nav remains available on 404.

**Deviations:** None.

**Tests implemented:** P1-M2-01 through P1-M2-06 in `tests/smoke/app-layout.spec.ts` (6 passing). P1-M1 tests still pass (8 total).

---

## P1-M3 — Product Catalogue

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M2

### Goal

Display the full product catalogue from local JSON with add-to-cart actions.

### Implementation scope

- Create `app/data/products.json` with 8–10 products (image, name, slug, category, short description, full description, price)
- Build `ProductsPage`, `ProductGrid`, and `ProductCard` components
- Load products from JSON
- Add **Add to Cart** button on each product card
- Introduce `CartContext` with `addItem()` and `totalItems`
- Update header cart badge to reflect item count

### User scenarios

- Visitor opens Products and sees all catalogue items in a grid.
- Each card shows image, name, category, short description, price, and Add to Cart.
- Visitor adds a product to the cart; the cart badge updates.
- Visitor adds the same product twice; the badge reflects total item count.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M3-01 | Catalogue displays all products from JSON |
| P1-M3-02 | Product card shows name, category, price, and description |
| P1-M3-03 | Add to Cart from catalogue updates badge to `1` |
| P1-M3-04 | Adding same product twice updates badge to `2` |
| P1-M3-05 | Product images have alt text matching product name |

### Accessibility considerations

- Product grid as a list of `article` elements with product name as heading.
- Add to Cart buttons include product name: `Add {product name} to cart`.
- Images use `alt={product.name}`.
- Price displayed as text, not color-only.

### Locator strategy

- `getByRole('heading', { name: 'Products' })`
- `getByRole('article', { name: '{Product Name}' })`
- `getByRole('button', { name: 'Add {Product Name} to cart' })`
- `getByRole('link', { name: /Cart/ })` for badge assertion
- `data-testid="product-card-{slug}"` as fallback for scoped queries

### Acceptance criteria

- [x] 8–10 products loaded from `products.json`
- [x] Product grid renders all fields per APP_SPEC
- [x] Add to Cart updates `CartContext` and header badge
- [x] Quantity increments when same product is added again

### Completion checklist

- [x] `products.json` created with 8–10 products
- [x] `ProductCard` and `ProductGrid` components
- [x] `ProductsPage` renders full catalogue
- [x] `CartContext` with `addItem()` and `totalItems`
- [x] Header cart badge wired to context
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Added 8 demo products in `products.json`, `ProductCard`/`ProductGrid` components, and `CartContext` with `addItem()` and `totalItems`. Products page renders a responsive grid; Add to Cart updates the header badge with correct singular/plural labels.

**Architectural decisions:**
- `CartProvider` wraps the app in `main.tsx`; state is in-memory for now (Local Storage in P1-M5).
- Product `article` elements use `aria-labelledby` pointing to the card heading for stable `getByRole('article', { name })` queries.
- Add to Cart button text follows the pattern `Add {product name} to cart` for accessible, testable labels.
- Product images are local SVG placeholders in `public/images/products/`.

**Deviations:** None.

**Tests implemented:** P1-M3-01 through P1-M3-05 in `tests/smoke/product-catalogue.spec.ts` (5 passing). 13 tests total across P1-M1–P1-M3.

---

## P1-M4 — Product Details

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M3

### Goal

Allow visitors to view a single product's full details and add it to the cart from the detail page.

### Implementation scope

- Add route `/products/:slug`
- Build `ProductDetailPage` showing image, full description, category, price, Add to Cart
- Link product cards to detail pages
- Add "Back to products" navigation link
- Handle unknown product slugs with a not-found state
- Reuse `CartContext.addItem()` from P1-M3

### User scenarios

- Visitor clicks a product and lands on its detail page.
- Detail page shows full description, category, price, and image.
- Visitor adds the product to the cart from the detail page.
- Visitor navigates back to the catalogue.
- Visitor entering an invalid slug sees a product-not-found message.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M4-01 | Navigating to `/products/{slug}` shows product details |
| P1-M4-02 | Detail page displays full description, category, and price |
| P1-M4-03 | Add to Cart from detail page updates cart badge |
| P1-M4-04 | Clicking product in catalogue navigates to detail page |
| P1-M4-05 | Unknown slug shows product-not-found state |
| P1-M4-06 | Back to products link returns to catalogue |

### Accessibility considerations

- Single `h1` with product name on detail page.
- "Back to products" as a visible link (not icon-only).
- Add to Cart button accessible name includes product name.
- Full description in readable paragraph text.

### Locator strategy

- `getByRole('heading', { name: '{Product Name}', level: 1 })`
- `getByRole('link', { name: 'Back to products' })`
- `getByRole('button', { name: 'Add {Product Name} to cart' })`

### Acceptance criteria

- [x] Product detail page renders all fields per APP_SPEC
- [x] Navigation from catalogue to detail works
- [x] Add to Cart works from detail page
- [x] Unknown slugs handled gracefully

### Completion checklist

- [x] Route `/products/:slug` configured
- [x] `ProductDetailPage` component
- [x] Product cards link to detail pages
- [x] Back to products navigation
- [x] Unknown slug / not-found handling
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Added `/products/:slug` route with `ProductDetailPage` showing full product details and Add to Cart. Product names on catalogue cards link to detail pages. Unknown slugs render a product-not-found state with Back to products link.

**Architectural decisions:**
- Shared `getProductBySlug()` and `formatPrice()` in `utils/products.ts` to avoid duplication between card and detail views.
- Product not-found is handled inside `ProductDetailPage` (distinct from app-level 404).
- Product name links live inside the card heading to preserve `article` accessible names for tests.

**Deviations:** None.

**Tests implemented:** P1-M4-01 through P1-M4-06 in `tests/smoke/product-details.spec.ts` (6 passing). 19 tests total across P1-M1–P1-M4.

---

## P1-M5 — Shopping Cart

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M3

### Goal

Implement the full shopping cart with quantity management, totals, persistence, and a proceed-to-checkout action.

### Implementation scope

- Extend `CartContext`: items, quantities, add/remove/update/clear, subtotal, total
- Persist cart in Local Storage (`cart` key)
- Build `CartPage` with line items, quantity controls, remove, and clear
- Display empty cart state
- Add **Proceed to checkout** button (auth guard wired in P1-M6)
- Keep header badge in sync

### User scenarios

- Visitor views the cart with all added items, quantities, and totals.
- Visitor increases or decreases item quantity.
- Visitor removes a single item or clears the entire cart.
- Visitor sees an empty-cart message when no items are present.
- Cart contents persist after a page refresh.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M5-01 | Cart shows added items with name, quantity, and line subtotal |
| P1-M5-02 | Increase quantity updates line subtotal and cart total |
| P1-M5-03 | Decrease quantity to 0 removes the item |
| P1-M5-04 | Remove item deletes it and recalculates total |
| P1-M5-05 | Clear cart empties all items |
| P1-M5-06 | Empty cart shows message and link to Products |
| P1-M5-07 | Cart persists after page reload |
| P1-M5-08 | Proceed to checkout button is visible |

### Accessibility considerations

- Cart items in a table with `<th scope="col">` headers or a list with per-row labels.
- Quantity buttons: `Increase quantity of {name}`, `Decrease quantity of {name}`.
- Remove button: `Remove {name} from cart`.
- Clear cart: `Clear cart` button with descriptive label.
- Empty state: heading + descriptive text + link to Products.

### Locator strategy

- `getByRole('heading', { name: 'Shopping cart' })`
- `getByRole('row', { name: /{Product Name}/ })` if table layout
- `getByRole('button', { name: 'Remove {Product Name} from cart' })`
- `getByRole('button', { name: 'Clear cart' })`
- `getByRole('button', { name: 'Proceed to checkout' })`
- `data-testid="cart-total"` for total amount
- `data-testid="cart-item-{slug}"` for row-scoped queries

### Acceptance criteria

- [x] All cart operations work per APP_SPEC
- [x] Subtotal and total calculate correctly
- [x] Cart persists in Local Storage across refresh
- [x] Empty cart state displayed when cart is empty
- [x] Proceed to checkout button present

### Completion checklist

- [x] `CartContext` fully implemented
- [x] Local Storage persistence
- [x] `CartPage` with line items and controls
- [x] Quantity increase/decrease
- [x] Remove item and clear cart
- [x] Subtotal and total calculation
- [x] Empty cart state
- [x] Proceed to checkout button
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Extended `CartContext` with quantity controls, remove, clear, subtotal/total, and Local Storage persistence (`cart` key). Built full `CartPage` with accessible table layout, empty state, and Proceed to checkout button.

**Architectural decisions:**
- Cart storage logic isolated in `utils/cartStorage.ts` for testability and corrupt-data fallback.
- `CartProvider` lazy-loads from Local Storage on mount and syncs on every items change.
- Cart total equals subtotal (no tax/shipping in MVP).
- Proceed to checkout navigates to `/checkout`; auth guard deferred to P1-M6.

**Deviations:** None.

**Tests implemented:** P1-M5-01 through P1-M5-08 in `tests/smoke/shopping-cart.spec.ts` (8 passing). 27 tests total across P1-M1–P1-M5.

---

## P1-M6 — Fake Authentication

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M2, P1-M5

### Goal

Implement fake login/logout with session persistence and protect the checkout route.

### Implementation scope

- Create `app/data/users.json` with `standard_user` / `secret123`
- Build `AuthContext` with Local Storage persistence (`auth` key)
- Build `LoginPage` with username/password form and validation
- Add `ProtectedRoute` wrapper for `/checkout` and `/order-confirmation`
- Support return URL: `/login?redirect=/checkout`
- Update header: Login vs welcome message + Logout
- Wire **Proceed to checkout** auth guard from P1-M5

### User scenarios

- Guest clicks Login and sees a username/password form.
- User logs in with valid credentials and sees a welcome message.
- User enters invalid credentials and sees an error message.
- Logged-in user sees Logout in the navigation.
- Session persists after page refresh.
- Guest navigating to `/checkout` is redirected to `/login`.
- After login, user returns to the intended page (e.g. checkout).

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M6-01 | Login with `standard_user` / `secret123` succeeds |
| P1-M6-02 | Invalid credentials show error message |
| P1-M6-03 | Empty fields show validation errors |
| P1-M6-04 | Logout clears session and shows Login link |
| P1-M6-05 | Session persists after page reload |
| P1-M6-06 | Guest at `/checkout` redirects to `/login` |
| P1-M6-07 | Login with redirect returns to intended page |
| P1-M6-08 | Logged-in user can proceed to checkout |

### Accessibility considerations

- Labels linked to inputs via `htmlFor`/`id` — enables `getByLabel('Username')`.
- Error message uses `role="alert"` on failed login.
- Submit button: `Log in`.
- Password field `type="password"` with visible label.
- Validation errors linked via `aria-describedby`.

### Locator strategy

- `getByLabel('Username')`, `getByLabel('Password')`
- `getByRole('button', { name: 'Log in' })`
- `getByRole('alert')` for login error
- `getByRole('button', { name: 'Log out' })`
- `getByText('Welcome, standard_user')`

### Acceptance criteria

- [x] Valid credentials log the user in
- [x] Invalid credentials show an error without navigation
- [x] Session persists in Local Storage
- [x] Logout clears session
- [x] Checkout route is protected
- [x] Return URL redirect works after login

### Completion checklist

- [x] `users.json` with fake credentials
- [x] `AuthContext` with Local Storage persistence
- [x] `LoginPage` with form and validation
- [x] `ProtectedRoute` for checkout and confirmation
- [x] Return URL support (`?redirect=`)
- [x] Header shows Login/Logout state
- [x] Proceed to checkout auth guard wired
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Added fake authentication with `AuthContext`, login form, Local Storage session (`auth` key), and `ProtectedRoute` for checkout and order confirmation. Header shows welcome message and Log out when authenticated; Proceed to checkout redirects guests to login with return URL.

**Architectural decisions:**
- Auth storage isolated in `utils/authStorage.ts` mirroring cart pattern.
- `sanitizeRedirectPath()` prevents open redirects; invalid redirect falls back to `/products`.
- `ProtectedRoute` wraps route elements in `App.tsx` rather than nested route objects for clarity.
- Logout does not clear cart (documented behaviour for P1-M5).

**Deviations:** None.

**Tests implemented:** P1-M6-01 through P1-M6-08 in `tests/smoke/authentication.spec.ts` (8 passing). 35 tests total across P1-M1–P1-M6.

---

## P1-M7 — Checkout Flow

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M5, P1-M6

### Goal

Implement the checkout form, validation, order confirmation, and cart clearing.

### Implementation scope

- Build `CheckoutPage` with form fields: Name, Email, Address, City, ZIP Code
- Display read-only order summary alongside the form
- Client-side validation (required fields, basic email format)
- On submit: generate order ID (`ORD-{timestamp}`), clear cart, navigate to confirmation
- Build `OrderConfirmationPage` with order number, items, total, link to Products
- Guards: auth required, cart non-empty

### User scenarios

- Logged-in user with items proceeds to checkout and sees the form plus order summary.
- User submits valid details and sees an order confirmation page.
- User with an empty cart is blocked from checkout.
- User submits with missing fields and sees validation errors.
- Cart is cleared after a successful order.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M7-01 | Happy path: fill form, submit, see confirmation with order number |
| P1-M7-02 | Order summary on checkout matches cart contents |
| P1-M7-03 | Empty cart blocks checkout |
| P1-M7-04 | Required field validation on empty submit |
| P1-M7-05 | Invalid email format shows validation error |
| P1-M7-06 | Cart cleared after successful order |
| P1-M7-07 | Full E2E: browse → add → login → checkout → confirm |
| P1-M7-08 | Direct visit to confirmation without order redirects away |

### Accessibility considerations

- Form labels: Name, Email, Address, City, ZIP Code.
- Order summary section with `h2` heading.
- Confirmation page: `h1` "Order confirmed" with order number in text.
- Required fields marked with `aria-required="true"`.
- Submit button: `Place order`.

### Locator strategy

- `getByLabel('Name')`, `getByLabel('Email')`, `getByLabel('Address')`, `getByLabel('City')`, `getByLabel('ZIP Code')`
- `getByRole('button', { name: 'Place order' })`
- `getByRole('heading', { name: 'Order confirmed' })`
- `getByRole('region', { name: 'Order summary' })`
- `data-testid="order-number"` for dynamic order ID

### Acceptance criteria

- [x] Checkout form renders all fields per APP_SPEC
- [x] Validation errors shown for invalid/missing input
- [x] Order confirmation displays order number and summary
- [x] Cart cleared after successful checkout
- [x] Empty cart and unauthenticated access blocked

### Completion checklist

- [x] `CheckoutPage` with form and order summary
- [x] Client-side validation
- [x] Order ID generation
- [x] Cart cleared on successful submit
- [x] `OrderConfirmationPage` with order details
- [x] Auth and cart-non-empty guards
- [x] Double-submit prevention (disable button on submit)
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Built full checkout form with order summary, client-side validation, order ID generation (`ORD-{timestamp}`), and order confirmation page. Orders stored in `sessionStorage`; cart clears on successful submit. Empty cart redirects from checkout; confirmation page redirects to cart when no order exists.

**Architectural decisions:**
- Checkout validation isolated in `utils/checkout.ts` mirroring login pattern.
- Order snapshot stored in `sessionStorage` via `utils/orderStorage.ts` (session-scoped, not persisted across tabs).
- `isCompletingOrderRef` prevents empty-cart redirect race when cart clears before navigation completes.
- Order confirmation reads order from storage on render; no separate OrderContext needed for MVP.

**Deviations:** None.

**Tests implemented:** P1-M7-01 through P1-M7-08 in `tests/smoke/checkout-flow.spec.ts` (8 passing). 43 tests total across P1-M1–P1-M7.

---

## P1-M8 — Home Page and Featured Products

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M3

### Goal

Build the Home landing page with shop introduction and featured products, per APP_SPEC.

### Implementation scope

- Build `HomePage` with intro copy describing the demo shop
- Display featured products section (subset of catalogue flagged in JSON)
- Link featured product cards to detail pages
- Handle case when no products are flagged as featured

### User scenarios

- Visitor lands on Home and reads a brief shop introduction.
- Visitor sees featured products with key details.
- Visitor navigates to a product detail page from a featured card.
- Visitor uses navigation to reach other major pages from Home.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M8-01 | Home page shows intro heading and description |
| P1-M8-02 | Featured products section renders product cards |
| P1-M8-03 | Clicking featured product navigates to detail page |
| P1-M8-04 | No featured products shows fallback message |

### Accessibility considerations

- Proper heading hierarchy: `h1` for intro, `h2` for featured section.
- Featured products use same card accessibility patterns as P1-M3.
- Intro text readable and concise.

### Locator strategy

- `getByRole('heading', { name: 'Welcome to Demo Shop' })` (or stable copy)
- `getByRole('heading', { name: 'Featured products' })`
- `getByRole('article', { name: '{Product Name}' })` within featured section

### Acceptance criteria

- [x] Home page introduces the demo shop
- [x] Featured products displayed from JSON
- [x] Featured cards link to product detail pages
- [x] Navigation to all major pages works from Home

### Completion checklist

- [x] `HomePage` with intro content
- [x] Featured products flagged in `products.json`
- [x] Featured products section with `ProductCard` reuse
- [x] Links to product detail pages
- [x] Empty featured fallback message
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Rebuilt `HomePage` with welcome intro copy and a featured products section using reused `ProductGrid`/`ProductCard` components. Featured products filtered via `getFeaturedProducts()` from JSON `featured` flags. Empty state shows fallback message; `?featured=none` query param enables E2E testing of empty featured state.

**Architectural decisions:**
- `getFeaturedProducts()` added to `utils/products.ts` alongside existing catalogue helpers.
- Featured section uses `h2` under `h1` intro for proper heading hierarchy.
- `ProductGrid` reuse keeps card accessibility and add-to-cart behaviour consistent with catalogue.

**Deviations:**
- Home `h1` changed from "Demo Shop" to "Welcome to Demo Shop" per P1-M8 locator strategy; P1-M1/P1-M2 smoke tests updated accordingly.
- `?featured=none` query param added as a testability hook for P1-M8-04 empty featured state.

**Tests implemented:** P1-M8-01 through P1-M8-04 in `tests/smoke/home-page.spec.ts` (4 passing). 47 tests total across P1-M1–P1-M8.

---

## P1-M9 — Error and Empty States

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M2, P1-M4, P1-M5, P1-M6, P1-M7

### Goal

Consolidate and polish all error, empty, and edge-case states across the application.

### Implementation scope

- Review and standardize 404 page (app-level and product-level)
- Standardize empty cart state (verify from P1-M5)
- Standardize invalid login message (verify from P1-M6)
- Standardize form validation messages (verify from P1-M7)
- Standardize empty featured products state (verify from P1-M8)
- Handle corrupt Local Storage gracefully (cart and auth)
- Handle direct URL access to confirmation without a valid order
- Ensure consistent error message copy and visual treatment

### User scenarios

- Visitor navigates to an unknown URL and sees a helpful 404 page.
- Visitor searches for a non-existent product and sees a product-not-found page.
- Visitor views an empty cart and sees guidance to browse products.
- Visitor enters wrong login credentials and sees a clear error.
- Visitor submits an incomplete checkout form and sees field-level errors.
- Visitor with corrupted Local Storage data sees a clean fallback state.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M9-01 | 404 page for unknown app route |
| P1-M9-02 | Product not found for invalid slug |
| P1-M9-03 | Empty cart state with link to Products |
| P1-M9-04 | Invalid login error message |
| P1-M9-05 | Checkout validation errors for each required field |
| P1-M9-06 | Corrupt cart Local Storage falls back to empty cart |
| P1-M9-07 | Direct confirmation URL without order redirects |

### Accessibility considerations

- Error messages use `role="alert"` where appropriate.
- Empty states use headings and descriptive text (not icon-only).
- 404 page provides a clear navigation path back.
- Validation errors linked to fields via `aria-describedby`.

### Locator strategy

- `getByRole('heading', { name: 'Page not found' })`
- `getByRole('heading', { name: 'Product not found' })`
- `getByRole('heading', { name: 'Your cart is empty' })`
- `getByRole('alert')` for login and form errors

### Acceptance criteria

- [x] All error states listed in APP_SPEC are implemented
- [x] Error and empty state copy is consistent across the app
- [x] Corrupt Local Storage handled without crashes
- [x] Each error state provides a clear next action for the user

### Completion checklist

- [x] 404 page reviewed and polished
- [x] Product not-found state reviewed
- [x] Empty cart state reviewed
- [x] Invalid login message reviewed
- [x] Form validation messages reviewed
- [x] Empty featured products fallback reviewed
- [x] Corrupt Local Storage handling added
- [x] Stale confirmation page redirect added
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Consolidated error and empty state regression tests in a dedicated smoke suite. Hardened `cartStorage` and `authStorage` to validate stored data, clear corrupt entries, and fall back to safe defaults without crashing.

**Architectural decisions:**
- Cart items validated with `isValidCartItem()` before hydration; partial or malformed arrays treated as corrupt and cleared.
- Auth session requires non-empty `username` string; invalid shapes clear storage and log user out.
- Existing page copy and visual patterns from P1-M2–P1-M8 retained; P1-M9 focuses on verification and storage resilience rather than UI rewrites.

**Deviations:** None.

**Tests implemented:** P1-M9-01 through P1-M9-07 in `tests/smoke/error-empty-states.spec.ts` (7 passing). 54 tests total across P1-M1–P1-M9.

---

## P1-M10 — Accessibility and Testability Polish

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** P1-M1–P1-M9

### Goal

Final pass on accessibility, responsive layout, and testability to ensure the app is a stable foundation for Phase 2 Playwright work.

### Implementation scope

- Responsive layout for all pages (mobile and desktop)
- Verify heading hierarchy on every page
- Verify keyboard navigation and focus states
- Verify all forms are fully label-accessible
- Review `data-testid` usage — add only where semantic locators are insufficient
- Remove any unstable DOM patterns (random IDs, layout-dependent selectors)
- Touch targets ≥ 44×44px on mobile
- Mobile navigation (wrap or simple menu if header overflows)

### User scenarios

- User on mobile viewport completes the full purchase flow without horizontal scroll.
- User navigates the entire app using keyboard only.
- User on desktop sees the same stable layout as during development.
- Tester can locate all interactive elements using Playwright `getByRole` queries.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P1-M10-01 | Full E2E happy path on desktop (1280px) |
| P1-M10-02 | Full E2E happy path on mobile (375px / Pixel 5) |
| P1-M10-03 | All pages have exactly one `h1` |
| P1-M10-04 | All form fields reachable and submittable via keyboard |
| P1-M10-05 | No horizontal scroll on mobile viewports |

### Accessibility considerations

- Complete audit of heading hierarchy across all routes.
- All interactive elements reachable via Tab key.
- `focus-visible` ring on all focusable elements.
- If hamburger menu used: `aria-label`, `aria-expanded`, `aria-controls`.
- No information conveyed by hover-only interactions.
- Color contrast meets WCAG AA.

### Locator strategy

- Final review: all interactive elements locatable via `getByRole` or `getByLabel`.
- Document any `data-testid` additions with justification.
- No mobile-specific test IDs — same locators work across viewports.

### Acceptance criteria

- [x] App is responsive on mobile and desktop
- [x] All pages pass heading hierarchy review
- [x] All forms fully accessible by label
- [x] All interactive elements keyboard-reachable
- [x] DOM structure is stable and predictable for Playwright
- [x] Phase 1 ready for Phase 2 test implementation

### Completion checklist

- [x] Responsive layout on all pages
- [x] Mobile navigation works
- [x] Heading hierarchy verified
- [x] Keyboard navigation verified
- [x] Focus states visible on all interactive elements
- [x] `data-testid` audit completed
- [x] Touch targets verified on mobile
- [x] Phase 1 completion summary written in this document
- [x] Roadmap updated with completion summary

### Implementation notes

**Summary:** Final Phase 1 pass on responsive layout, touch targets (min 44px), and mobile-friendly header (stacked layout with wrapping nav). Added cross-viewport E2E, heading hierarchy, keyboard form submission, and horizontal scroll regression tests.

**Architectural decisions:**
- Mobile nav uses stacked header + `flex-wrap` rather than a hamburger menu — sufficient for demo scope and keeps locators identical across viewports.
- Touch targets applied via `min-h-11` / `min-w-11` on nav links, cart controls, and primary action buttons.
- `data-testid` audit: retained four justified IDs (`product-card-{slug}`, `cart-item-{slug}`, `cart-total`, `order-number`); no new IDs added.

**Deviations:** None.

**Tests implemented:** P1-M10-01 through P1-M10-05 in `tests/smoke/accessibility-polish.spec.ts` (5 passing). **59 tests total across P1-M1–P1-M10.**

### Phase 1 completion summary

Phase 1 delivered a full demo e-commerce application with product catalogue, cart, fake auth, checkout, home page, error states, and accessibility polish. The app uses semantic HTML, `getByRole`-friendly patterns, Local Storage persistence, and 59 passing Playwright smoke tests across 10 milestones — ready for Phase 2 framework work (POM, fixtures, CI).

---

## Phase 1 — Milestone Dependency Graph

```text
P1-M1 Project Foundation
 └── P1-M2 Layout & Routing
      ├── P1-M3 Product Catalogue
      │    ├── P1-M4 Product Details
      │    └── P1-M8 Home & Featured Products
      └── P1-M5 Shopping Cart
           └── P1-M6 Fake Authentication
                └── P1-M7 Checkout Flow
                     └── P1-M9 Error & Empty States
                          └── P1-M10 Accessibility & Testability Polish
```

---

## Phase 1 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P1-M1 — Project Foundation | ✅ Completed | 2026-07-06 |
| P1-M2 — Application Layout and Routing | ✅ Completed | 2026-07-06 |
| P1-M3 — Product Catalogue | ✅ Completed | 2026-07-06 |
| P1-M4 — Product Details | ✅ Completed | 2026-07-06 |
| P1-M5 — Shopping Cart | ✅ Completed | 2026-07-06 |
| P1-M6 — Fake Authentication | ✅ Completed | 2026-07-06 |
| P1-M7 — Checkout Flow | ✅ Completed | 2026-07-06 |
| P1-M8 — Home Page and Featured Products | ✅ Completed | 2026-07-06 |
| P1-M9 — Error and Empty States | ✅ Completed | 2026-07-06 |
| P1-M10 — Accessibility and Testability Polish | ✅ Completed | 2026-07-06 |

---

# Phase 2 — Playwright Testing Framework

Build a production-inspired Playwright testing framework against the completed demo shop. Phase 1 delivered **59 passing smoke tests** in `tests/smoke/`; Phase 2 refactors those tests into a maintainable framework and adds E2E suites, reporting, and CI.

**Phase 2 status:** 🚧 In progress  
**Phase 2 started:** 2026-07-06  
**Phase 2 completed:** —

---

## Shared Conventions (Phase 2)

| Topic | Decision |
|---|---|
| **Test location** | `tests/` at repo root (unchanged) |
| **Folder layout** | `pages/`, `fixtures/`, `data/`, `smoke/`, `e2e/` |
| **Page Object Model** | One page class per app route/screen; locators live in page objects |
| **Locator priority** | Same as app: `getByRole` → `getByLabel` → stable text → `data-testid` |
| **Fixtures** | `auth` (logged-in session), `cart` (preloaded cart), composable with POM |
| **Test data** | `tests/data/` mirrors app credentials and sample products (single source for tests) |
| **Tags** | `@smoke`, `@e2e`, `@auth`, `@cart` via `test.describe` / `grep` |
| **Artifacts** | Traces on first retry; screenshots and videos on failure |
| **CI** | GitHub Actions on push/PR; upload HTML report and failure artifacts |
| **Naming** | Spec files: `kebab-case.spec.ts`; page objects: `PascalCase` + `Page` suffix |

---

## P2-M1 — Framework Foundation and Folder Structure

**Status:** ✅ Completed  
**Completed:** 2026-07-07  
**Dependencies:** Phase 1 complete

### Goal

Establish the Playwright framework folder structure, enhanced configuration, and npm scripts so subsequent milestones have a consistent foundation.

### Implementation scope

- Create `tests/pages/`, `tests/fixtures/`, `tests/data/`
- Enhance `playwright.config.ts` (output dirs, `screenshot`, `video`, reporter list)
- Add TypeScript config for tests if needed (`tests/tsconfig.json` or extend root)
- Add npm scripts: `test:smoke`, `test:e2e` (e2e may be empty initially)
- Document framework conventions in `docs/LESSONS_LEARNED.md` or new `docs/TESTING.md`

### User scenarios

- Developer clones repo and understands where tests, page objects, and fixtures live.
- Developer runs `npm test` and existing smoke tests still pass unchanged.
- Developer runs `npm run test:smoke` to execute only smoke-tagged tests (once tags added in P2-M5).

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M1-01 | `npm test` runs all existing smoke specs successfully |
| P2-M1-02 | Framework folders exist with documented purpose |
| P2-M1-03 | `playwright.config.ts` captures failure screenshots |

### Acceptance criteria

- [x] Folder structure `pages/`, `fixtures/`, `data/` created
- [x] Playwright config enhanced for artifacts
- [x] All 59 Phase 1 smoke tests still pass
- [x] Framework conventions documented

### Completion checklist

- [x] `tests/pages/` directory
- [x] `tests/fixtures/` directory
- [x] `tests/data/` directory
- [x] Enhanced `playwright.config.ts`
- [x] npm scripts for suite filtering
- [x] Documentation updated
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added framework directories: `tests/pages/`, `tests/fixtures/`, and `tests/data/` with starter README guidance.
- Enhanced Playwright config for artifacts and reporting (`outputDir`, `screenshot`, `video`, multi-reporter list).
- Added test scripts for suite targeting (`test:smoke`, `test:e2e` with pass-when-empty behavior).
- Added `tests/tsconfig.json` for future framework TypeScript files.
- Documented framework conventions in `docs/TESTING.md`.

Architectural decisions:

- Kept existing smoke tests unchanged while laying the foundation for phased migration in P2-M2 through P2-M5.
- Chose `test:e2e` based on `@e2e` tags to align with milestone plan and avoid hard-coding folder assumptions early.

---

## P2-M2 — Page Object Model

**Status:** ✅ Completed  
**Completed:** 2026-07-07  
**Dependencies:** P2-M1

### Goal

Introduce Page Object Model classes that encapsulate locators and common actions for each major app screen.

### Implementation scope

- Create `BasePage` with shared navigation helpers (go to Products, Cart, Login, etc.)
- Create page objects: `HomePage`, `ProductsPage`, `ProductDetailPage`, `CartPage`, `LoginPage`, `CheckoutPage`, `OrderConfirmationPage`, `NotFoundPage`
- Locators use `getByRole` / `getByLabel` per Phase 1 conventions
- Refactor 2–3 smoke specs as reference implementations (full migration in P2-M5)

### User scenarios

- Tester updates a locator in one page object instead of across multiple spec files.
- New specs read as user journeys (`productsPage.addToCart(name)`) rather than raw selectors.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M2-01 | `ProductsPage` adds item to cart via page object |
| P2-M2-02 | `LoginPage` performs login via page object |
| P2-M2-03 | `BasePage` navigation helpers reach all major routes |

### Locator strategy

- All locators defined inside page object classes as getters or private fields
- No CSS/XPath selectors in spec files
- Reuse app `data-testid` values only inside page objects when semantic locators are insufficient

### Acceptance criteria

- [x] `BasePage` and all major page objects implemented
- [x] At least 2 smoke specs refactored to use POM
- [x] No duplicate locator strings across refactored specs
- [x] All tests still pass

### Completion checklist

- [x] `BasePage` component
- [x] Page objects for all major routes
- [x] Reference spec refactors
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added `BasePage` plus page objects for all major routes: Home, Products, Product Detail, Cart, Login, Checkout, Order Confirmation, and Not Found.
- Refactored three smoke specs as reference implementations: `app-layout.spec.ts`, `product-catalogue.spec.ts`, and `authentication.spec.ts`.
- Centralized navigation, form, and cart interactions in page object methods while keeping assertions in specs.

Architectural decisions:

- Page objects expose locators as getters and user actions as methods; specs retain `expect` assertions for readability.
- Used `getByRole` / `getByLabel` throughout; `data-testid` only in `CartPage` and `OrderConfirmationPage` where semantic alternatives are weaker.
- Left remaining smoke specs unchanged for full POM migration in P2-M5.

---

## P2-M3 — Centralized Test Data

**Status:** ✅ Completed  
**Completed:** 2026-07-08  
**Dependencies:** P2-M1

### Goal

Provide a single test data module for credentials, products, checkout details, and URLs used across all suites.

### Implementation scope

- Create `tests/data/users.ts`, `tests/data/products.ts`, `tests/data/checkout.ts`
- Export constants aligned with `app/src/data/` (e.g. `standard_user` / `secret123`)
- Add helper for sample product slug/name used in cart and checkout tests
- Replace inline test data in smoke specs (during P2-M5 migration)

### User scenarios

- Tester changes demo credentials in one file when app data changes.
- E2E specs import shared checkout details instead of duplicating objects.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M3-01 | Test data exports valid user credentials |
| P2-M3-02 | Test data exports at least one product slug and name |
| P2-M3-03 | Checkout test data matches form field labels |

### Acceptance criteria

- [x] Centralized test data modules created
- [x] Data aligned with app JSON sources
- [x] Documented import pattern for specs

### Completion checklist

- [x] `tests/data/users.ts`
- [x] `tests/data/products.ts`
- [x] `tests/data/checkout.ts`
- [x] `tests/data/index.ts` barrel export (optional)
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added centralized test data modules for users, products, and checkout flows under `tests/data/`, plus a barrel export in `tests/data/index.ts`.
- Kept data aligned with app sources (`app/src/data/products.json` and `standard_user` / `secret123` credentials used in Phase 1 smoke specs).
- Left smoke specs using inline literals for now; migration to shared data is scheduled for P2-M5.

Architectural decisions:

- Test data modules expose small, focused exports (e.g. `validUser`, `sampleProduct`, `validCheckoutDetails`) to keep imports explicit in specs.
- Centralized error-case data (like `checkoutFieldErrors`) mirrors existing spec usage to make future refactors mechanical.

---

## P2-M4 — Auth and Cart Fixtures

**Status:** ✅ Completed  
**Completed:** 2026-07-08  
**Dependencies:** P2-M2, P2-M3

### Goal

Create Playwright fixtures that provide authenticated sessions and preloaded carts to reduce setup boilerplate in specs.

### Implementation scope

- Create `tests/fixtures/auth.fixture.ts` — logged-in `page` fixture
- Create `tests/fixtures/cart.fixture.ts` — page with item(s) in cart
- Compose fixtures with page objects where appropriate
- Optional: `storageState` for faster auth reuse
- Add example specs demonstrating fixture usage

### User scenarios

- Tester writes checkout spec with `loggedInPage` fixture instead of manual login steps.
- Tester writes cart spec with `cartWithItem` fixture instead of manual add-to-cart navigation.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M4-01 | Auth fixture provides logged-in session |
| P2-M4-02 | Cart fixture provides cart with one item |
| P2-M4-03 | Fixtures compose with existing page objects |

### Acceptance criteria

- [x] Auth fixture logs in via UI or storage state
- [x] Cart fixture preloads cart via UI
- [x] Example specs use fixtures successfully
- [x] Fixtures documented with usage examples

### Completion checklist

- [x] `auth` fixture implemented
- [x] `cart` fixture implemented
- [x] Custom `test` export from `tests/fixtures/index.ts`
- [x] Example fixture specs
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added `loggedInPage` and `cartWithItem` fixtures using Playwright `test.extend` and `mergeTests`.
- Exported reusable helpers `loginViaUi` and `addSampleProductToCart` for gradual adoption in smoke specs.
- Added `tests/fixtures/fixtures.spec.ts` with P2-M4-01 through P2-M4-03 example scenarios composing fixtures with page objects.

Architectural decisions:

- Used UI-based setup (not `storageState`) to keep fixture behavior aligned with real user flows and existing smoke tests.
- Kept smoke specs unchanged; fixture adoption across the suite is scheduled for P2-M5.

---

## P2-M5 — Smoke Suite Refactor and Tags

**Status:** ✅ Completed  
**Completed:** 2026-07-09  
**Dependencies:** P2-M2, P2-M3, P2-M4

### Goal

Migrate all 59 Phase 1 smoke tests to use page objects, shared test data, and fixtures where appropriate; introduce `@smoke` tags.

### Implementation scope

- Refactor all specs in `tests/smoke/` to use POM and `tests/data/`
- Apply fixtures to auth/cart/checkout specs where they reduce noise
- Tag smoke suite with `@smoke` (via title or `grep` config)
- Ensure `npm run test:smoke` runs only smoke tests
- Remove duplicated helpers across spec files

### User scenarios

- Developer runs `npm run test:smoke` for a fast confidence check before commit.
- Smoke specs are readable and maintainable with no raw locators in spec bodies.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M5-01 | All 59 smoke tests pass after POM migration |
| P2-M5-02 | `npm run test:smoke` executes smoke suite only |
| P2-M5-03 | No duplicate login/add-to-cart helpers in spec files |

### Acceptance criteria

- [x] All smoke specs use page objects
- [x] Shared test data used consistently
- [x] `@smoke` tag/filter works
- [x] 59 tests passing

### Completion checklist

- [x] All `tests/smoke/*.spec.ts` refactored
- [x] Fixtures applied where beneficial
- [x] `test:smoke` npm script verified
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Refactored all 10 smoke spec files to use page objects, shared test data from `tests/data/`, and fixture helpers for auth/cart setup.
- Tagged every smoke describe block with `@smoke` and updated `npm run test:smoke` to filter by tag.
- Removed duplicated inline credentials, product imports, and login/add-to-cart helpers from smoke specs.

Architectural decisions:

- Smoke specs continue using the default Playwright `test` with fixture helper functions rather than fixture-injected pages, keeping migration incremental while eliminating duplication.
- Left `runPurchaseHappyPath` local to accessibility specs as a journey helper built from page objects.

---

## P2-M6 — E2E Journey Suites

**Status:** ✅ Completed  
**Completed:** 2026-07-10  
**Dependencies:** P2-M5

### Goal

Add dedicated end-to-end journey specs that exercise full user flows across multiple pages, tagged `@e2e`.

### Implementation scope

- Create `tests/e2e/` directory
- Implement journeys: guest browse → login → purchase, returning customer checkout, cart management flow
- Add desktop (1280px) and mobile (375px) viewport coverage for primary journey
- Tag with `@e2e`; add `npm run test:e2e`
- Reuse POM, fixtures, and test data throughout

### User scenarios

- Tester runs `npm run test:e2e` before a release for full journey confidence.
- CI runs smoke on every push and e2e on PR merge (configured in P2-M8).

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M6-01 | Full purchase journey on desktop |
| P2-M6-02 | Full purchase journey on mobile viewport |
| P2-M6-03 | Guest redirected to login when accessing checkout |
| P2-M6-04 | Cart persistence across navigation |

### Acceptance criteria

- [x] `tests/e2e/` suite with at least 4 journey specs
- [x] `@e2e` tag/filter works
- [x] Desktop and mobile coverage for primary journey
- [x] All e2e tests pass

### Completion checklist

- [x] `tests/e2e/` directory and specs
- [x] `test:e2e` npm script
- [x] Mobile viewport project or per-test viewport
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added `tests/e2e/` with four journey spec files and a shared `completeGuestPurchaseJourney` helper.
- Implemented P2-M6-01 through P2-M6-04 scenarios plus a returning-customer checkout journey.
- Desktop (1280px) and mobile (375px) viewport coverage for the primary guest purchase flow.

Architectural decisions:

- Used per-test viewport sizing for mobile coverage instead of a separate Playwright project, keeping the config simple until CI matrix needs grow in P2-M8.
- Extracted the guest purchase flow into `tests/e2e/helpers/purchase-journey.ts` to avoid duplicating the smoke checkout E2E steps.

---

## P2-M7 — Reporting, Traces, and Debug Artifacts

**Status:** ✅ Completed  
**Completed:** 2026-07-10  
**Dependencies:** P2-M1

### Goal

Configure rich failure artifacts and document the debugging workflow to support manual investigation and future AI Failure Analyzer (Phase 3).

### Implementation scope

- Configure `trace`, `screenshot`, `video` policies in `playwright.config.ts`
- Add `list` reporter for CI logs alongside `html`
- Document trace viewer workflow (`npx playwright show-trace`)
- Ensure `test-results/` and `playwright-report/` outputs are predictable
- Optional: `playwright.config.ts` `outputDir` organization

### User scenarios

- Tester opens HTML report after a failed run and inspects screenshots.
- Tester opens trace file to step through a failed E2E journey.
- Phase 3 AI module can rely on consistent artifact paths.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M7-01 | Failed test produces screenshot in `test-results/` |
| P2-M7-02 | Retried test produces trace file |
| P2-M7-03 | `npm run report` opens HTML report |

### Acceptance criteria

- [x] Screenshot on failure configured
- [x] Video on failure configured (or retain-on-failure)
- [x] Trace strategy documented
- [x] Debugging workflow documented

### Completion checklist

- [x] Artifact config in `playwright.config.ts`
- [x] CI-friendly reporter setup
- [x] Debugging docs updated
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Documented artifact policy in `playwright.config.ts` with explicit `outputDir` and `playwright-report` HTML output folder.
- Added `npm run trace` script for opening trace files; updated `npm run report` to target `playwright-report/` explicitly.
- Expanded debugging workflow in `docs/TESTING.md` and `README.md` (HTML report, trace viewer, UI/headed modes, error context files).

Architectural decisions:

- Kept `trace: 'on-first-retry'` paired with CI retries rather than `retain-on-failure` for all traces, balancing artifact size with debuggability.
- Stable artifact paths (`test-results/`, `playwright-report/`) documented for Phase 3 AI Failure Analyzer consumption.

---

## P2-M8 — GitHub Actions CI

**Status:** ✅ Completed  
**Completed:** 2026-07-15  
**Dependencies:** P2-M5, P2-M7

### Goal

Run Playwright tests automatically on GitHub Actions with artifact upload for reports and failure debugging.

### Implementation scope

- Create `.github/workflows/playwright.yml`
- Run on `push` to `main` and on `pull_request`
- Use Node 22, `npm run setup`, `npm test` (or `test:smoke` + `test:e2e`)
- Upload `playwright-report/` and `test-results/` as artifacts on failure
- Set `CI=true` for Playwright config (fresh webServer, retries)
- Update README with CI badge and status

### User scenarios

- Contributor opens PR and sees Playwright check pass or fail.
- Reviewer downloads HTML report artifact from failed CI run.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| P2-M8-01 | CI workflow runs on pull request |
| P2-M8-02 | CI uploads report artifact on failure |
| P2-M8-03 | CI uses Node 22 and project-local browsers |

### Acceptance criteria

- [x] GitHub Actions workflow runs successfully
- [x] Smoke (and e2e) tests pass in CI
- [x] Artifacts uploaded on failure
- [x] README documents CI behavior

### Completion checklist

- [x] `.github/workflows/playwright.yml`
- [x] Artifact upload configured
- [x] README CI section updated
- [x] Phase 2 completion summary written in this document
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added `.github/workflows/playwright.yml` with parallel matrix jobs for `test:smoke` and `test:e2e`.
- CI uses Node 22 from `.nvmrc`, `npm run setup`, Playwright system deps, and `CI=true` for config-aligned runs.
- Failure artifacts (`playwright-report/`, `test-results/`) uploaded per matrix job.
- README badge and CI documentation added.

Architectural decisions:

- Split smoke and e2e into parallel matrix jobs for faster feedback and clearer failure attribution.
- Installed `playwright install-deps` in CI only (Linux system libraries) without changing local setup scripts.

---

## Phase 2 — Milestone Dependency Graph

```text
Phase 1 Demo Shop (complete)
 └── P2-M1 Framework Foundation
      ├── P2-M2 Page Object Model ────────┐
      ├── P2-M3 Centralized Test Data ──┤
      │    └── P2-M4 Auth & Cart Fixtures
      │         └── P2-M5 Smoke Refactor & Tags
      │              └── P2-M6 E2E Journey Suites
      └── P2-M7 Reporting & Artifacts
           └── P2-M8 GitHub Actions CI (also depends P2-M5)
```

---

## Phase 2 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P2-M1 — Framework Foundation and Folder Structure | ✅ Completed | 2026-07-07 |
| P2-M2 — Page Object Model | ✅ Completed | 2026-07-07 |
| P2-M3 — Centralized Test Data | ✅ Completed | 2026-07-08 |
| P2-M4 — Auth and Cart Fixtures | ✅ Completed | 2026-07-08 |
| P2-M5 — Smoke Suite Refactor and Tags | ✅ Completed | 2026-07-09 |
| P2-M6 — E2E Journey Suites | ✅ Completed | 2026-07-10 |
| P2-M7 — Reporting, Traces, and Debug Artifacts | ✅ Completed | 2026-07-10 |
| P2-M8 — GitHub Actions CI | ✅ Completed | 2026-07-15 |

**Phase 2 status: ✅ Complete** — all 8 milestones delivered (2026-07-07 through 2026-07-15).

### Phase 2 — Completion Summary

Phase 2 transformed the Phase 1 inline smoke suite into a production-inspired Playwright framework:

- **Framework structure** — `tests/pages/`, `tests/fixtures/`, `tests/data/`, `tests/e2e/`
- **Page Object Model** — 9 page objects covering all major routes
- **Centralized test data** — users, products, checkout constants
- **Fixtures** — `loggedInPage`, `cartWithItem`, and reusable setup helpers
- **Tagged suites** — `@smoke` (59 tests), `@e2e` (6 tests), filterable npm scripts
- **Artifacts** — screenshots, video, traces on failure; documented debugging workflow
- **CI** — GitHub Actions matrix for smoke + e2e with artifact upload

**Total tests:** 68 (59 smoke + 6 e2e + 3 fixture examples). Ready for Phase 3 AI Test Inspector.

---

# Phase 3 — AI Test Inspector

**Status:** 🚧 In progress — P3-M2 complete; P3-M3 next  
**Current focus:** Markdown investigation report generator

### Goal

Build AI-assisted testing tools that consume Playwright artifacts (`test-results/`) and generate actionable investigation insights.

### Design principles

- **Deterministic first** — collect and classify without an LLM so behaviour is testable and works offline
- **Optional LLM later** — provider interface for root-cause suggestions when an API key is present
- **Stable inputs** — rely on P2-M7 artifact paths (`test-results/`, `error-context.md`, screenshots, traces)
- **No backend** — CLI + local Node scripts only

### Planned modules (high-level)

- AI Failure Analyzer (artifacts → structured context → report)
- Heuristic failure classification
- Structured Markdown investigation reports
- Optional LLM root-cause suggestions
- Future: flaky detection, locator suggestions, PR summaries

---

## P3-M1 — Failure Artifact Ingestion and CLI Scaffold

**Status:** ✅ Completed  
**Completed:** 2026-07-17  
**Dependencies:** Phase 2 complete (P2-M7 artifact layout)

### Goal

Create a local CLI that collects Playwright failure artifacts from a `test-results/` folder into a normalized JSON context object for later classification and reporting.

### Implementation scope

- Create `ai/failure-analyzer/` with TypeScript modules (`types`, `collect`, `cli`)
- Discover screenshots, videos, traces, and `error-context.md` under a given failure directory
- Emit normalized JSON to stdout (and optional `--out` file)
- Add npm scripts: `analyze:failure`, `test:ai`
- Add golden fixtures under `ai/failure-analyzer/fixtures/` for unit tests
- Document usage in `ai/failure-analyzer/README.md` and `docs/TESTING.md`

### User scenarios

- Developer points the CLI at a failed test folder and receives structured JSON of available artifacts.
- Developer runs unit tests for the collector without needing Playwright browsers.

### Future test scenarios

| ID | Scenario |
|---|---|
| P3-M1-01 | Collector finds screenshot, video, error-context, and trace paths in a fixture folder |
| P3-M1-02 | Collector returns empty lists gracefully for a folder with no artifacts |
| P3-M1-03 | CLI exits non-zero when the target path does not exist |

### Acceptance criteria

- [x] Collector returns normalized `FailureContext` JSON
- [x] CLI script works against fixture and real `test-results/` paths
- [x] Unit tests cover happy path and missing-path edge cases
- [x] Usage documented

### Completion checklist

- [x] `ai/failure-analyzer/` modules
- [x] Fixtures + unit tests
- [x] npm scripts
- [x] Docs updated
- [x] Roadmap updated with completion summary

### Implementation notes

Summary:

- Added `ai/failure-analyzer/` with `collectFailureContext()`, CLI entrypoint, golden fixtures, and Node test suite (`npm run test:ai`).
- CLI supports `--out <file.json>` and prints normalized artifact paths plus `errorContextText`.

Architectural decisions:

- Used `.mts` ESM modules instead of root `"type": "module"` so Playwright can continue importing JSON test data without import attributes.
- Kept the collector deterministic and offline — classification/reporting deferred to P3-M2/P3-M3.

---

## P3-M2 — Heuristic Failure Classification

**Status:** ✅ Completed  
**Completed:** 2026-07-17  
**Dependencies:** P3-M1

### Goal

Classify failures into stable categories using deterministic heuristics on error text and artifact signals (no LLM).

### Implementation scope

- Categories: `assertion`, `timeout`, `locator`, `network`, `auth`, `unknown`
- Score confidence from keyword/signal matches
- Attach classification to `FailureContext`
- Unit tests with fixture error snippets

### Acceptance criteria

- [x] Classifier returns category + confidence
- [x] Known fixture errors map to expected categories
- [x] Unknown errors fall back to `unknown`

### Implementation notes

Summary:

- Added `classifyFailure()` with ordered heuristic rules and confidence scores.
- Wired classification into `collectFailureContext()` so CLI JSON always includes `classification`.
- Added 7 unit tests covering all categories plus missing-error-text fallback.

Architectural decisions:

- Highest-confidence matching rule wins when multiple signals appear (e.g. expect + Timeout → assertion).
- Kept classification fully offline and deterministic for portfolio reliability before optional LLM (P3-M4).

---

## P3-M3 — Markdown Investigation Report Generator

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** P3-M1, P3-M2

### Goal

Generate a structured Markdown investigation report from collected context and classification.

### Implementation scope

- Report sections: summary, classification, artifacts, suggested next steps
- Write report to `ai-reports/` (gitignored) or `--out` path
- npm script: `analyze:report`

### Acceptance criteria

- [ ] Report includes classification and artifact links
- [ ] Suggested steps vary by category
- [ ] Unit tests assert required sections

---

## P3-M4 — Optional LLM Root-Cause Suggestions

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** P3-M3

### Goal

Add an optional LLM provider interface that enhances reports with root-cause suggestions when configured; fall back to heuristic report when not.

### Implementation scope

- Provider interface (`suggestRootCause(context)`)
- Env-based opt-in (e.g. `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) — never required
- Prompt template constrained by `docs/AI_GUIDELINES.md`
- No secrets committed

### Acceptance criteria

- [ ] Works offline without API keys
- [ ] With provider mocked, suggestions appear in report
- [ ] Provider interface is swappable

---

## P3-M5 — Analyzer Integration and Documentation Polish

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** P3-M3 (P3-M4 optional)

### Goal

Polish end-to-end CLI UX, README/AI module docs, and optional CI hook notes for using the analyzer on downloaded failure artifacts.

### Implementation scope

- End-to-end CLI flow documented
- README AI Modules section updated with real commands
- Phase 3 progress summary in roadmap

### Acceptance criteria

- [ ] Documented one-command analyze flow
- [ ] Sample report checked into docs or fixtures (sanitized)
- [ ] Phase 3 milestones marked complete where delivered

---

## Phase 3 — Milestone Dependency Graph

```text
Phase 2 complete
 └── P3-M1 Failure Artifact Ingestion
      └── P3-M2 Heuristic Classification
           └── P3-M3 Markdown Report Generator
                ├── P3-M4 Optional LLM Suggestions
                └── P3-M5 Integration & Docs Polish
```

---

## Phase 3 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P3-M1 — Failure Artifact Ingestion and CLI Scaffold | ✅ Completed | 2026-07-17 |
| P3-M2 — Heuristic Failure Classification | ✅ Completed | 2026-07-17 |
| P3-M3 — Markdown Investigation Report Generator | ⏳ Not started | — |
| P3-M4 — Optional LLM Root-Cause Suggestions | ⏳ Not started | — |
| P3-M5 — Analyzer Integration and Documentation Polish | ⏳ Not started | — |

---

## Document History

| Date | Change |
|---|---|
| 2026-07-17 | P3-M2 completed — heuristic failure classification with confidence scoring |
| 2026-07-17 | P3-M1 completed — failure artifact collector CLI, fixtures, and `npm run test:ai` |
| 2026-07-17 | Phase 3 milestones defined — P3-M1 through P3-M5 (AI Failure Analyzer) |
| 2026-07-15 | P2-M8 completed — GitHub Actions CI with smoke/e2e matrix and failure artifact upload; Phase 2 complete |
| 2026-07-10 | P2-M7 completed — artifact policy documented, trace/report scripts, and debugging workflow |
| 2026-07-10 | P2-M6 completed — E2E journey suites with @e2e tag, desktop/mobile purchase flow, and cart journeys |
| 2026-07-09 | P2-M5 completed — smoke suite refactored to POM/data/fixtures with `@smoke` tag filtering |
| 2026-07-08 | P2-M4 completed — auth and cart fixtures with example specs and fixture documentation |
| 2026-07-08 | P2-M3 completed — centralized test data modules for users, products, and checkout |
| 2026-07-07 | P2-M2 completed — Page Object Model for all major routes, three reference spec refactors |
| 2026-07-07 | P2-M1 completed — framework folders, enhanced Playwright artifacts/reporters, suite scripts, and testing conventions |
| 2026-07-06 | Phase 1 milestones renamed to P1-M1–P1-M10 for consistency with Phase 2 |
| 2026-07-06 | Phase 2 milestones defined — P2-M1 through P2-M8 (POM, fixtures, CI) |
| 2026-07-06 | Phase 1 completed — P1-M10 accessibility polish, 59 smoke tests, ready for Phase 2 |
| 2026-07-06 | P1-M10 completed — responsive layout, touch targets, cross-viewport E2E tests |
| 2026-07-06 | P1-M5 completed — shopping cart page, Local Storage, quantity controls |
| 2026-07-06 | P1-M4 completed — product detail page, slug routing, card links |
| 2026-07-06 | P1-M3 completed — product catalogue, CartContext, add to cart |
| 2026-07-06 | P1-M2 completed — React Router, AppLayout, navigation, 404 page |
| 2026-07-06 | P1-M1 completed — React app scaffold, Tailwind, Playwright foundation tests |
| 2026-07-06 | Initial roadmap created with Phase 1 milestones P1-M1–P1-M10 |
