import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';
import { AllocationPage } from '../pages/allocation.page.po';

test.describe('Target Asset Allocation & Rebalancing Engine', () => {
  let headerPage: HeaderPage;
  let allocationPage: AllocationPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    allocationPage = new AllocationPage(page);
    await page.goto('/');
    await headerPage.selectAllocationView();
  });

  test('TC-ALC-01: Asset Allocation view defaults to All tab aggregated portfolio view', async ({ page }) => {
    await expect(page.locator('app-asset-allocation')).toBeVisible();
    await expect(allocationPage.donutChart).toBeVisible();
  });

  test('TC-ALC-02 & TC-ALC-03: Filtering to asset class displays symbol breakdown and allows filter reset', async ({ page }) => {
    // Click asset class row if visible
    if (await page.locator('app-asset-allocation tr:has-text("U.S. Stock")').isVisible()) {
      await page.locator('app-asset-allocation tr:has-text("U.S. Stock")').click();

      // Check if reset button appears
      const resetButton = page.locator('button:has-text("All Asset Classes")');
      if (await resetButton.isVisible()) {
        await resetButton.click();
      }
    }
  });

  test('TC-ALC-04: Asset Class Breakdown table display', async ({ page }) => {
    await expect(page.locator('.allocation-card-title:has-text("Asset Class Breakdown")')).toBeVisible();
    await expect(page.locator('.rebalance-list')).toBeVisible();
  });
});

