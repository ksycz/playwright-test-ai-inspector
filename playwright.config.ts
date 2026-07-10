import { defineConfig, devices } from '@playwright/test';

/**
 * Artifact policy (P2-M7):
 * - test-results/  — per-test output (screenshots, videos, traces, error context)
 * - playwright-report/ — HTML report from the html reporter
 *
 * Trace strategy: on-first-retry (captures traces when CI retries a flaky/failed test).
 * Screenshot/video: only retained on failure to keep local runs lightweight.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
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
