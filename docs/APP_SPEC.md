# Demo Shop Application Specification

## Purpose

This application exists solely to provide realistic user journeys for learning Playwright and building AI-assisted test automation tools.

It is **not** intended to become a production-ready e-commerce application.

The application should remain intentionally simple while exposing enough functionality to support realistic end-to-end testing scenarios.

---

# Project Goals

The application should:

- provide realistic user workflows
- be easy to automate with Playwright
- demonstrate modern React architecture
- follow accessibility best practices
- be easy to maintain and extend
- serve as a stable foundation for AI-assisted testing experiments

---

# Target Users

The application is intended for:

- software testers
- SDETs
- QA engineers
- developers learning Playwright

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Context API

## Data

- Local JSON seed files under `app/src/data/` (reference / test imports)
- Static HTTP catalogue under `app/public/api/` (runtime source of truth; Vite-served)
- Local Storage (auth session, cart)

## Authentication

- Fake authentication only
- No backend
- No database
- No external authentication providers
- Demo credentials are **not** published under `/api`

---

# Functional Requirements

## Home

The landing page should:

- briefly introduce the demo shop
- provide navigation to all major pages
- display featured products

---

## Login

Implement a fake login flow.

Credentials:

Username:

```text
standard_user

```

Password:

```text
secret123

```

**Security note (intentional demo design):** These credentials live in `app/src/data/users.json` and ship in the client JS bundle. Auth is theatrical (Local Storage session `{ username }` only)—anyone can inspect the build or forge a session in DevTools. Passwords are **not** published under `/api`. Do not reuse this pattern for a real backend.

Requirements:

- authentication state stored in Context
- session persisted in Local Storage
- logout supported
- protected checkout route

---

## Product Catalogue

Display approximately 8–10 demo products.

Each product should contain:

- image
- name
- category
- short description
- price
- Add to Cart button

Products should be loaded from the static catalogue API (`GET /api/products.json`) in the running app. Keep `app/src/data/products.json` aligned as a seed/reference copy for tests.

---

## Product Details

Each product page should display:

- image
- full description
- category
- price
- Add to Cart button

---

## Shopping Cart

The cart should support:

- adding products
- removing products
- increasing quantity
- decreasing quantity
- calculating subtotal
- calculating total
- clearing the cart

The cart should persist after page refresh.

---

## Checkout

Implement a simple checkout form.

Fields:

- Name
- Email
- Address
- City
- ZIP Code

Requirements:

- validate required fields
- display validation errors
- clear cart after successful checkout
- display confirmation page

---

## Navigation

Navigation should include:

- Home
- Products
- Cart
- Login / Logout

Requirements:

- responsive navigation
- active page indication
- cart badge displaying item count

---

## Error Handling

Provide:

- 404 page
- invalid login message
- empty cart state
- form validation messages

---

# Non-Functional Requirements

The application should be:

- responsive
- accessible
- fast
- predictable
- easy to understand
- easy to extend

Avoid unnecessary complexity.

---

# Accessibility Requirements

Use:

- semantic HTML
- accessible forms
- proper heading hierarchy
- visible focus states
- keyboard navigation
- ARIA attributes only where appropriate

---

# Testability Requirements

This application is designed primarily for automated testing.

Therefore:

- use stable DOM structure
- prefer semantic HTML
- avoid randomly generated IDs
- avoid unnecessary animations
- avoid unpredictable rendering
- prefer accessible elements that work well with Playwright's `getByRole()` locators

Use `data-testid` only when semantic locators are insufficient.

---

# Future Playwright Coverage

The application should support automated tests for:

## Authentication

- successful login
- invalid login
- logout
- protected routes

## Products

- product list
- product details
- navigation
- filtering (optional)

## Shopping Cart

- add item
- remove item
- change quantity
- calculate totals
- persist cart

## Checkout

- successful checkout
- validation
- empty cart
- protected checkout

## General

- routing
- responsive layout
- accessibility
- page navigation

---

# AI Integration Goals

The demo shop is a stable substrate for AI-assisted testing tools under `ai/`.

## Delivered modules

| Module | Purpose |
|---|---|
| Failure Analyzer | Collect Playwright artifacts → classify → Markdown/HTML reports (optional LLM) |
| Flaky Test Detector | Flaky vs hard-fail from Playwright JSON |
| Historical Failure Trends | JSONL history + trend Markdown |
| Run / PR Summaries | Multi-suite Markdown + sticky PR comments |

## Still optional / future ideas

- Locator change suggestions
- Visual regression insights (beyond `@visual` baselines)

The application should keep evolving so these tools can be added without changing core shop behaviour.

---

# Design Principles

The application should prioritize:

- simplicity
- readability
- maintainability
- consistency
- testability

The objective is to create a realistic but intentionally lightweight application that demonstrates professional engineering and testing practices rather than implementing a full-featured e-commerce platform.