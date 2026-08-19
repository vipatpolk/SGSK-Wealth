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

  test('TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle', async ({ page }) => {
    // Open view dropdown on mobile
    const mobileDropdownTrigger = page.locator('.view-toggle-trigger');
    await mobileDropdownTrigger.click();

    // Select Tools
    await page.locator('#view-toggle-tools').click();
    await expect(page.locator('app-tools')).toBeVisible();

    // Open tools mobile dropdown and select Rebalance Planner
    const toolsMobileTrigger = page.locator('#tools-mobile-dropdown-trigger');
    await expect(toolsMobileTrigger).toBeVisible();
    await toolsMobileTrigger.click();
    await page.locator('#tool-dropdown-rebalance-planner').click();

    // Verify Rebalance Calculator and mobile elements
    await expect(page.locator('app-rebalance-calculator')).toBeVisible();
    await expect(page.locator('.rebalance-mode-toggle')).toBeVisible();
    await expect(page.locator('.mode-text-mobile').first()).toBeVisible();

    // Verify mobile symbol cards are visible on mobile view
    const mobileCards = page.locator('.mobile-symbol-cards-list');
    await expect(mobileCards.first()).toBeVisible();
  });
});

