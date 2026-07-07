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

## Scripts

- `npm test` - full Playwright suite
- `npm run test:smoke` - smoke specs in `tests/smoke/`
- `npm run test:e2e` - tests tagged with `@e2e` (passes when none exist yet)

## Naming

- Spec files: `kebab-case.spec.ts`
- Milestone IDs in smoke tests: `P1-Mx-yy`
- Page object classes: `PascalCase` with `Page` suffix
