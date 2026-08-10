import { test, expect, devices } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';

test.use({ ...devices['iPhone 14'] });

test.describe('Mobile Responsiveness & Touch Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    await page.goto('/');
  });

  test('TC-MOB-01: Mobile view renders responsive cards and touch navigation dropdown', async ({ page }) => {
    // Header mobile dropdown trigger should be visible
    const mobileDropdownTrigger = page.locator('.view-toggle-trigger');
    await expect(mobileDropdownTrigger).toBeVisible();

    // Open view dropdown on mobile
    await mobileDropdownTrigger.click();
    await expect(page.locator('#view-toggle-allocation')).toBeVisible();

    // Select Allocation
    await page.locator('#view-toggle-allocation').click();
    await expect(page.locator('app-asset-allocation')).toBeVisible();
  });
});
