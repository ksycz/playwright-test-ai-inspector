import { test, expect } from '@playwright/test';
import { completeGuestPurchaseJourney } from './helpers/purchase-journey';

test.describe('@e2e Purchase journey', () => {
  test('P2-M6-01: full purchase journey on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await completeGuestPurchaseJourney(page);
  });

  test('P2-M6-02: full purchase journey on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await completeGuestPurchaseJourney(page);
  });
});
