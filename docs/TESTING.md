# Testing Framework Conventions

This document captures the baseline Playwright framework structure introduced in Phase 2.

## Folder structure

- `tests/smoke/` - current smoke regression suite from Phase 1
- `tests/pages/` - Page Object Model classes (Phase 2+)
- `tests/fixtures/` - reusable fixture composition (Phase 2+)
- `tests/data/` - centralized test data and constants (Phase 2+)

## Locator strategy

- Prefer semantic locators: `getByRole`, `getByLabelText`, and visible user-facing text
- Use `data-testid` only when semantic roles and names are insufficient
- Keep locator definitions in page objects once POM migration begins

## Artifacts and reporting

Playwright is configured to:

- write output artifacts to `test-results/`
- capture screenshots only on failure
- retain video only on failure
- capture traces on first retry
- produce both list and HTML reports

Use `npm run report` to open the latest HTML report.

## Page Object Model

- Page objects live in `tests/pages/` and export from `tests/pages/index.ts`
- Specs import page objects and express user journeys through page methods
- Locators are defined as getters or methods on page object classes
- Reference refactors: `app-layout.spec.ts`, `product-catalogue.spec.ts`, `authentication.spec.ts`

## Centralized test data

- Test data modules live in `tests/data/` and export from `tests/data/index.ts`
- `users.ts` provides demo credentials (`validUser`, `invalidUser`, `demoUsers`)
- `products.ts` mirrors the app catalogue (`catalogue`, `sampleProduct`, `featuredProducts`)
- `checkout.ts` contains `validCheckoutDetails`, `invalidEmailDetails`, and `checkoutFieldErrors`
- Existing smoke specs import shared data from `tests/data/` and setup helpers from `tests/fixtures/`
- Smoke tests are tagged with `@smoke` in describe titles; `npm run test:smoke` filters by tag

## Fixtures

- Custom fixtures live in `tests/fixtures/` and export from `tests/fixtures/index.ts`
- Import `test` and `expect` from `../fixtures` (not `@playwright/test`) when using fixtures
- `loggedInPage` — authenticated session via UI login
- `cartWithItem` — catalogue page with the shared sample product in cart
- Helpers `loginViaUi(page)` and `addSampleProductToCart(page)` are available for gradual adoption
- Example scenarios: `tests/fixtures/fixtures.spec.ts`

## E2E journey suites

- E2E specs live in `tests/e2e/` and are tagged with `@e2e` in describe titles
- Run with `npm run test:e2e` (filters by `@e2e` tag)
- Journeys cover guest purchase (desktop/mobile), checkout auth guard, cart persistence, and returning customer checkout

## Scripts

- `npm test` - full Playwright suite
- `npm run test:smoke` - tests tagged with `@smoke`
- `npm run test:e2e` - tests tagged with `@e2e` (passes when none exist yet)

## Naming

- Spec files: `kebab-case.spec.ts`
- Milestone IDs in smoke tests: `P1-Mx-yy`
- Page object classes: `PascalCase` with `Page` suffix
