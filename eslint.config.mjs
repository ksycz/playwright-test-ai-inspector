// Lint gate for the Playwright tests: catches tests that can pass without checking anything.
// It fails CI (unlike the convention review in ai/pr-review, which only comments).
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['tests/**/*.ts'],
    ignores: ['tests/reporters/**'],
    languageOptions: { parser: tseslint.parser },
    plugins: { playwright },
    rules: {
      // A test with no assertion runs clean and proves nothing.
      // Helpers that assert count as assertions: expectSomething(...) by name, and the shared
      // purchase journey (tests/e2e/helpers/purchase-journey.ts, eight assertions inside).
      'playwright/expect-expect': [
        'error',
        { assertFunctionPatterns: ['^expect[A-Z]'], assertFunctionNames: ['completeGuestPurchaseJourney'] },
      ],
      // `expect(locator).toBeVisible()` without await can still be running when the test ends,
      // so its failure is lost. Same for page actions.
      'playwright/missing-playwright-await': 'error',
      'playwright/valid-expect': 'error',
      'playwright/no-standalone-expect': 'error',
      // An assertion inside an if may never run.
      'playwright/no-conditional-expect': 'error',
      // test.only skips the rest of the suite in CI.
      'playwright/no-focused-test': 'error',
      // Fixed sleeps make tests slow and flaky; wait for a locator or a response instead.
      'playwright/no-wait-for-timeout': 'error',
      // Every test title starts with its ID (P2-M6-05: ...); the run summary and failure trends
      // group by it, and a title without one can't be found in the roadmap tables.
      'playwright/valid-title': ['error', { mustMatch: { test: '^P\\d+-M\\d+-\\d+: ' } }],
      // Retrying web-first assertions instead of reading a value once and comparing it.
      'playwright/prefer-web-first-assertions': 'error',
    },
  },
];
