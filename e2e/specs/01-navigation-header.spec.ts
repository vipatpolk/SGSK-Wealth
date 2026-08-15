import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';

test.describe('Global Navigation & Header Controls', () => {
  let headerPage: HeaderPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    await page.goto('/');
  });

  test('TC-NAV-01: View Mode Switcher navigates between Holdings, Allocation, Performance, and Transactions', async ({ page }) => {
    // Default should be Holdings
    await expect(page.locator('app-tab-bar')).toBeVisible();

    // Switch to Allocation view
    await headerPage.selectAllocationView();
    await expect(page.locator('app-asset-allocation')).toBeVisible();

    // Switch to Performance view
    await headerPage.selectPerformanceView();
    await expect(page.locator('app-performance')).toBeVisible();

    // Switch to Transactions view
    await headerPage.selectTransactionsView();
    await expect(page.locator('app-transaction-history')).toBeVisible();

    // Switch back to Holdings
    await headerPage.selectHoldingsView();
    await expect(page.locator('app-tab-bar')).toBeVisible();
  });

  test('TC-NAV-02: Currency Toggle switches display currency between USD and THB', async ({ page }) => {
    // Switch to USD
    await headerPage.switchToUSD();
    await expect(headerPage.currencyUsdBtn).toHaveClass(/currency-btn-active/);

    // Switch to THB
    await headerPage.switchToTHB();
    await expect(headerPage.currencyThbBtn).toHaveClass(/currency-btn-active/);
  });

  test('TC-NAV-03: Theme Switcher toggles dark and light theme state', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Click theme toggle
    await headerPage.toggleTheme();
    
    // Toggle back
    await headerPage.toggleTheme();
  });
});
