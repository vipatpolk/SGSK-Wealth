import { test, expect, devices } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';

test.use({ ...devices['iPhone 14'] });

test.describe('Mobile Responsiveness & Touch Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    await page.goto('/');
  });

  test('TC-MOB-01: Mobile view renders responsive cards and native bottom navigation bar', async ({
    page,
  }) => {
    // Native bottom nav should be visible
    const bottomNav = page.locator('#view-toggle');
    await expect(bottomNav).toBeVisible();

    // Select Analytics directly via bottom nav tab
    await page.locator('#view-toggle-analytics').click();
    await expect(page.locator('app-analytics')).toBeVisible();
  });

  test('TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle', async ({
    page,
  }) => {
    // Select Tools directly via bottom nav tab
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

  test('TC-MOB-03: Native bottom navigation bar highlights active tab and switches views smoothly', async ({
    page,
  }) => {
    const dashTab = page.locator('#view-toggle-dashboard');
    const holdingsTab = page.locator('#view-toggle-holdings');
    const analyticsTab = page.locator('#view-toggle-analytics');
    const divTab = page.locator('#view-toggle-dividends');

    // Default active tab should be Dashboard
    await expect(dashTab).toHaveClass(/view-toggle-btn-active/);

    // Switch to Holdings via bottom nav
    await holdingsTab.click();
    await expect(holdingsTab).toHaveClass(/view-toggle-btn-active/);
    await expect(dashTab).not.toHaveClass(/view-toggle-btn-active/);
    await expect(page.locator('app-tab-bar')).toBeVisible();

    // Switch to Analytics via bottom nav
    await analyticsTab.click();
    await expect(analyticsTab).toHaveClass(/view-toggle-btn-active/);
    await expect(holdingsTab).not.toHaveClass(/view-toggle-btn-active/);
    await expect(page.locator('app-analytics')).toBeVisible();

    // Switch to Dividends via bottom nav
    await divTab.click();
    await expect(divTab).toHaveClass(/view-toggle-btn-active/);
    await expect(analyticsTab).not.toHaveClass(/view-toggle-btn-active/);
    await expect(page.locator('app-dividend')).toBeVisible();
  });
});
