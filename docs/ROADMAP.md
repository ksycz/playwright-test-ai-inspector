# Project Roadmap

This document is the **single source of truth** for the implementation plan and technical progress log.

**Current focus:** Phase 1 — Demo Shop Application only.

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
| **1** | Demo Shop Application | 🚧 In progress | React demo e-commerce app |
| **2** | Playwright Testing Framework | ⏳ Planned | POM, fixtures, suites, CI |
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

**Phase 1 status:** 🚧 In progress  
**Phase 1 started:** 2026-07-06  
**Phase 1 completed:** —

---

## M1 — Project Foundation

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
| M1-01 | App dev server starts and serves the root page |
| M1-02 | Page has a document title and main landmark |

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

**Tests implemented:** M1-01, M1-02 in `tests/smoke/app-foundation.spec.ts` (2 passing).

---

## M2 — Application Layout and Routing

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** M1

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
| M2-01 | App loads at `/` with layout visible |
| M2-02 | Navigation links (Home, Products, Cart, Login) are present |
| M2-03 | Clicking Products navigates to `/products` |
| M2-04 | Active nav link is indicated on the current page |
| M2-05 | Unknown route shows 404 with link to Home |
| M2-06 | Cart badge displays `0` initially |

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

**Tests implemented:** M2-01 through M2-06 in `tests/smoke/app-layout.spec.ts` (6 passing). M1 tests still pass (8 total).

---

## M3 — Product Catalogue

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** M2

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
| M3-01 | Catalogue displays all products from JSON |
| M3-02 | Product card shows name, category, price, and description |
| M3-03 | Add to Cart from catalogue updates badge to `1` |
| M3-04 | Adding same product twice updates badge to `2` |
| M3-05 | Product images have alt text matching product name |

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
- `CartProvider` wraps the app in `main.tsx`; state is in-memory for now (Local Storage in M5).
- Product `article` elements use `aria-labelledby` pointing to the card heading for stable `getByRole('article', { name })` queries.
- Add to Cart button text follows the pattern `Add {product name} to cart` for accessible, testable labels.
- Product images are local SVG placeholders in `public/images/products/`.

**Deviations:** None.

**Tests implemented:** M3-01 through M3-05 in `tests/smoke/product-catalogue.spec.ts` (5 passing). 13 tests total across M1–M3.

---

## M4 — Product Details

**Status:** ✅ Completed  
**Completed:** 2026-07-06  
**Dependencies:** M3

### Goal

Allow visitors to view a single product's full details and add it to the cart from the detail page.

### Implementation scope

- Add route `/products/:slug`
- Build `ProductDetailPage` showing image, full description, category, price, Add to Cart
- Link product cards to detail pages
- Add "Back to products" navigation link
- Handle unknown product slugs with a not-found state
- Reuse `CartContext.addItem()` from M3

### User scenarios

- Visitor clicks a product and lands on its detail page.
- Detail page shows full description, category, price, and image.
- Visitor adds the product to the cart from the detail page.
- Visitor navigates back to the catalogue.
- Visitor entering an invalid slug sees a product-not-found message.

### Future Playwright test scenarios

| ID | Scenario |
|---|---|
| M4-01 | Navigating to `/products/{slug}` shows product details |
| M4-02 | Detail page displays full description, category, and price |
| M4-03 | Add to Cart from detail page updates cart badge |
| M4-04 | Clicking product in catalogue navigates to detail page |
| M4-05 | Unknown slug shows product-not-found state |
| M4-06 | Back to products link returns to catalogue |

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

**Tests implemented:** M4-01 through M4-06 in `tests/smoke/product-details.spec.ts` (6 passing). 19 tests total across M1–M4.

---

## M5 — Shopping Cart

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M3

### Goal

Implement the full shopping cart with quantity management, totals, persistence, and a proceed-to-checkout action.

### Implementation scope

- Extend `CartContext`: items, quantities, add/remove/update/clear, subtotal, total
- Persist cart in Local Storage (`cart` key)
- Build `CartPage` with line items, quantity controls, remove, and clear
- Display empty cart state
- Add **Proceed to checkout** button (auth guard wired in M6)
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
| M5-01 | Cart shows added items with name, quantity, and line subtotal |
| M5-02 | Increase quantity updates line subtotal and cart total |
| M5-03 | Decrease quantity to 0 removes the item |
| M5-04 | Remove item deletes it and recalculates total |
| M5-05 | Clear cart empties all items |
| M5-06 | Empty cart shows message and link to Products |
| M5-07 | Cart persists after page reload |
| M5-08 | Proceed to checkout button is visible |

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

- [ ] All cart operations work per APP_SPEC
- [ ] Subtotal and total calculate correctly
- [ ] Cart persists in Local Storage across refresh
- [ ] Empty cart state displayed when cart is empty
- [ ] Proceed to checkout button present

### Completion checklist

- [ ] `CartContext` fully implemented
- [ ] Local Storage persistence
- [ ] `CartPage` with line items and controls
- [ ] Quantity increase/decrease
- [ ] Remove item and clear cart
- [ ] Subtotal and total calculation
- [ ] Empty cart state
- [ ] Proceed to checkout button
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## M6 — Fake Authentication

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M2, M5

### Goal

Implement fake login/logout with session persistence and protect the checkout route.

### Implementation scope

- Create `app/data/users.json` with `standard_user` / `secret123`
- Build `AuthContext` with Local Storage persistence (`auth` key)
- Build `LoginPage` with username/password form and validation
- Add `ProtectedRoute` wrapper for `/checkout` and `/order-confirmation`
- Support return URL: `/login?redirect=/checkout`
- Update header: Login vs welcome message + Logout
- Wire **Proceed to checkout** auth guard from M5

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
| M6-01 | Login with `standard_user` / `secret123` succeeds |
| M6-02 | Invalid credentials show error message |
| M6-03 | Empty fields show validation errors |
| M6-04 | Logout clears session and shows Login link |
| M6-05 | Session persists after page reload |
| M6-06 | Guest at `/checkout` redirects to `/login` |
| M6-07 | Login with redirect returns to intended page |
| M6-08 | Logged-in user can proceed to checkout |

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

- [ ] Valid credentials log the user in
- [ ] Invalid credentials show an error without navigation
- [ ] Session persists in Local Storage
- [ ] Logout clears session
- [ ] Checkout route is protected
- [ ] Return URL redirect works after login

### Completion checklist

- [ ] `users.json` with fake credentials
- [ ] `AuthContext` with Local Storage persistence
- [ ] `LoginPage` with form and validation
- [ ] `ProtectedRoute` for checkout and confirmation
- [ ] Return URL support (`?redirect=`)
- [ ] Header shows Login/Logout state
- [ ] Proceed to checkout auth guard wired
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## M7 — Checkout Flow

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M5, M6

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
| M7-01 | Happy path: fill form, submit, see confirmation with order number |
| M7-02 | Order summary on checkout matches cart contents |
| M7-03 | Empty cart blocks checkout |
| M7-04 | Required field validation on empty submit |
| M7-05 | Invalid email format shows validation error |
| M7-06 | Cart cleared after successful order |
| M7-07 | Full E2E: browse → add → login → checkout → confirm |
| M7-08 | Direct visit to confirmation without order redirects away |

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

- [ ] Checkout form renders all fields per APP_SPEC
- [ ] Validation errors shown for invalid/missing input
- [ ] Order confirmation displays order number and summary
- [ ] Cart cleared after successful checkout
- [ ] Empty cart and unauthenticated access blocked

### Completion checklist

- [ ] `CheckoutPage` with form and order summary
- [ ] Client-side validation
- [ ] Order ID generation
- [ ] Cart cleared on successful submit
- [ ] `OrderConfirmationPage` with order details
- [ ] Auth and cart-non-empty guards
- [ ] Double-submit prevention (disable button on submit)
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## M8 — Home Page and Featured Products

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M3

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
| M8-01 | Home page shows intro heading and description |
| M8-02 | Featured products section renders product cards |
| M8-03 | Clicking featured product navigates to detail page |
| M8-04 | No featured products shows fallback message |

### Accessibility considerations

- Proper heading hierarchy: `h1` for intro, `h2` for featured section.
- Featured products use same card accessibility patterns as M3.
- Intro text readable and concise.

### Locator strategy

- `getByRole('heading', { name: 'Welcome to Demo Shop' })` (or stable copy)
- `getByRole('heading', { name: 'Featured products' })`
- `getByRole('article', { name: '{Product Name}' })` within featured section

### Acceptance criteria

- [ ] Home page introduces the demo shop
- [ ] Featured products displayed from JSON
- [ ] Featured cards link to product detail pages
- [ ] Navigation to all major pages works from Home

### Completion checklist

- [ ] `HomePage` with intro content
- [ ] Featured products flagged in `products.json`
- [ ] Featured products section with `ProductCard` reuse
- [ ] Links to product detail pages
- [ ] Empty featured fallback message
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## M9 — Error and Empty States

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M2, M4, M5, M6, M7

### Goal

Consolidate and polish all error, empty, and edge-case states across the application.

### Implementation scope

- Review and standardize 404 page (app-level and product-level)
- Standardize empty cart state (verify from M5)
- Standardize invalid login message (verify from M6)
- Standardize form validation messages (verify from M7)
- Standardize empty featured products state (verify from M8)
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
| M9-01 | 404 page for unknown app route |
| M9-02 | Product not found for invalid slug |
| M9-03 | Empty cart state with link to Products |
| M9-04 | Invalid login error message |
| M9-05 | Checkout validation errors for each required field |
| M9-06 | Corrupt cart Local Storage falls back to empty cart |
| M9-07 | Direct confirmation URL without order redirects |

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

- [ ] All error states listed in APP_SPEC are implemented
- [ ] Error and empty state copy is consistent across the app
- [ ] Corrupt Local Storage handled without crashes
- [ ] Each error state provides a clear next action for the user

### Completion checklist

- [ ] 404 page reviewed and polished
- [ ] Product not-found state reviewed
- [ ] Empty cart state reviewed
- [ ] Invalid login message reviewed
- [ ] Form validation messages reviewed
- [ ] Empty featured products fallback reviewed
- [ ] Corrupt Local Storage handling added
- [ ] Stale confirmation page redirect added
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## M10 — Accessibility and Testability Polish

**Status:** ⏳ Not started  
**Completed:** —  
**Dependencies:** M1–M9

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
| M10-01 | Full E2E happy path on desktop (1280px) |
| M10-02 | Full E2E happy path on mobile (375px / Pixel 5) |
| M10-03 | All pages have exactly one `h1` |
| M10-04 | All form fields reachable and submittable via keyboard |
| M10-05 | No horizontal scroll on mobile viewports |

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

- [ ] App is responsive on mobile and desktop
- [ ] All pages pass heading hierarchy review
- [ ] All forms fully accessible by label
- [ ] All interactive elements keyboard-reachable
- [ ] DOM structure is stable and predictable for Playwright
- [ ] Phase 1 ready for Phase 2 test implementation

### Completion checklist

- [ ] Responsive layout on all pages
- [ ] Mobile navigation works
- [ ] Heading hierarchy verified
- [ ] Keyboard navigation verified
- [ ] Focus states visible on all interactive elements
- [ ] `data-testid` audit completed
- [ ] Touch targets verified on mobile
- [ ] Phase 1 completion summary written in this document
- [ ] Roadmap updated with completion summary

### Implementation notes

_Summary, architectural decisions, and deviations will be recorded here after completion._

---

## Phase 1 — Milestone Dependency Graph

```text
M1 Project Foundation
 └── M2 Layout & Routing
      ├── M3 Product Catalogue
      │    ├── M4 Product Details
      │    └── M8 Home & Featured Products
      └── M5 Shopping Cart
           └── M6 Fake Authentication
                └── M7 Checkout Flow
                     └── M9 Error & Empty States
                          └── M10 Accessibility & Testability Polish
```

---

## Phase 1 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| M1 — Project Foundation | ✅ Completed | 2026-07-06 |
| M2 — Application Layout and Routing | ✅ Completed | 2026-07-06 |
| M3 — Product Catalogue | ✅ Completed | 2026-07-06 |
| M4 — Product Details | ✅ Completed | 2026-07-06 |
| M5 — Shopping Cart | ⏳ Not started | — |
| M6 — Fake Authentication | ⏳ Not started | — |
| M7 — Checkout Flow | ⏳ Not started | — |
| M8 — Home Page and Featured Products | ⏳ Not started | — |
| M9 — Error and Empty States | ⏳ Not started | — |
| M10 — Accessibility and Testability Polish | ⏳ Not started | — |

---

# Phase 2 — Playwright Testing Framework

**Status:** ⏳ Planned — expand after Phase 1 is complete.

### Goal

Build a production-inspired Playwright testing framework against the completed demo shop.

### Planned scope (high-level)

- Restructure tests into `tests/` with Page Object Model
- Auth and cart fixtures
- Centralized test data module
- Smoke, E2E, auth, and cart test suites
- HTML reports, Trace Viewer, screenshots, and videos on failure
- GitHub Actions CI with artifact upload
- Test tags (`@smoke`, `@e2e`)

### Milestones

_To be defined after Phase 1 completion._

---

# Phase 3 — AI Test Inspector

**Status:** ⏳ Planned — expand after Phase 2 is complete.

### Goal

Build AI-assisted testing tools that consume Playwright artifacts and generate actionable insights.

### Planned scope (high-level)

- AI Failure Analyzer (traces, screenshots, stack traces, console logs)
- Structured Markdown investigation reports
- Failure classification and root cause suggestions
- Future modules: flaky test detection, locator suggestions, PR summaries

### Milestones

_To be defined after Phase 2 completion._

---

## Document History

| Date | Change |
|---|---|
| 2026-07-06 | M4 completed — product detail page, slug routing, card links |
| 2026-07-06 | M3 completed — product catalogue, CartContext, add to cart |
| 2026-07-06 | M2 completed — React Router, AppLayout, navigation, 404 page |
| 2026-07-06 | M1 completed — React app scaffold, Tailwind, Playwright foundation tests |
| 2026-07-06 | Initial roadmap created with Phase 1 milestones M1–M10 |
