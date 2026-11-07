import { defineConfig, devices } from '@playwright/test';

/**
 * Artifact policy (P2-M7):
 * - test-results/  — per-test output (screenshots, videos, traces, error context)
 *                   and playwright-results.json (JSON reporter for flaky analysis)
 * - playwright-report/ — HTML report from the html reporter
 *
 * Trace strategy: on-first-retry (captures traces when CI retries a flaky/failed test).
 * Screenshot/video: only retained on failure to keep local runs lightweight.
 * Flaky analysis: npm run analyze:flaky (reads test-results/playwright-results.json)
 *
 * Visual regression (Phase 6):
 * - Tagged @visual suite via `npm run test:visual`
 * - Baselines committed next to specs (*-snapshots/)
 * - Animations disabled; modest maxDiffPixelRatio for CI vs local font AA
 */
export default defineConfig({
  testDir: './tests',
  // Reporter unit tests live next to the reporter and use node:test, not Playwright.
  testIgnore: '**/reporters/**',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Two workers on CI. Higher than that waits on a green smoke run first.
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['./tests/reporters/readable.ts'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],
  // One baseline set per project (omit OS platform from path).
  snapshotPathTemplate:
    '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.1,
    },
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix app',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
