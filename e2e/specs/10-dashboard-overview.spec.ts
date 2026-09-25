import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';

test.describe('Dashboard Landing Page & Executive Overview', () => {
  let headerPage: HeaderPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    await page.goto('/');
  });

  test('TC-DASH-01: Application lands on Dashboard by default with Executive Net Worth banner', async ({ page }) => {
    // Assert dashboard container is visible
    const dashboardView = page.locator('#dashboard-view');
    await expect(dashboardView).toBeVisible();

    // Assert Dashboard button is active in header navigation
    const dashBtn = page.locator('#view-toggle-dashboard');
    await expect(dashBtn).toHaveClass(/view-toggle-btn-active/);

    // Verify Executive Net Worth is displayed
    const netWorth = page.locator('#dashboard-net-worth');
    await expect(netWorth).toBeVisible();

    // Verify 4 KPI cards are rendered
    await expect(page.locator('#kpi-invested')).toBeVisible();
    await expect(page.locator('#kpi-unrealized')).toBeVisible();
    await expect(page.locator('#kpi-realized')).toBeVisible();
    await expect(page.locator('#kpi-dividends')).toBeVisible();
  });

  test('TC-DASH-02: Asset Allocation donut chart is displayed with direct navigation', async ({ page }) => {
    const allocCard = page.locator('#dashboard-allocation-card');
    await expect(allocCard).toBeVisible();

    // Verify donut svg chart exists
    const donutSvg = allocCard.locator('.donut-svg');
    await expect(donutSvg).toBeVisible();

    // Click on Allocation action button
    const gotoAllocBtn = page.locator('#btn-goto-allocation');
    await gotoAllocBtn.click();

    // Verify we are now on Asset Allocation view
    await expect(page.locator('app-asset-allocation')).toBeVisible();
  });

  test('TC-DASH-03: Performance top movers card renders and navigates to performance view', async ({ page }) => {
    const perfCard = page.locator('#dashboard-performance-card');
    await expect(perfCard).toBeVisible();

    // Click on Performance action button
    const gotoPerfBtn = page.locator('#btn-goto-performance');
    await gotoPerfBtn.click();

    // Verify we are now on Performance view
    await expect(page.locator('app-performance')).toBeVisible();
  });

  test('TC-DASH-04: Financial Tools launchpad opens simulator directly in Tools view', async ({ page }) => {
    const toolsCard = page.locator('#dashboard-tools-card');
    await expect(toolsCard).toBeVisible();

    // Click Rebalance Planner card
    const rebalanceCard = page.locator('#launch-rebalance-planner');
    await expect(rebalanceCard).toBeVisible();
    await rebalanceCard.click();

    // Should navigate to Tools view
    await expect(page.locator('app-tools')).toBeVisible();
    // And Rebalance Calculator should be active
    await expect(page.locator('app-rebalance-calculator')).toBeVisible();
  });

  test('TC-DASH-05: Currency switch converts Net Worth and KPI amounts', async ({ page }) => {
    const netWorth = page.locator('#dashboard-net-worth');
    await expect(netWorth).toBeVisible();

    // Switch to USD
    await headerPage.switchToUSD();
    await expect(page.locator('#currency-usd')).toHaveClass(/currency-btn-active/);

    // Switch to THB
    await headerPage.switchToTHB();
    await expect(page.locator('#currency-thb')).toHaveClass(/currency-btn-active/);
  });

  test('TC-DASH-06: Privacy toggle hides monetary values on Dashboard', async ({ page }) => {
    const netWorth = page.locator('#dashboard-net-worth');
    await expect(netWorth).toBeVisible();

    // Toggle privacy on
    await headerPage.privacyToggleBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-privacy', 'true');

    // Toggle privacy off
    await headerPage.privacyToggleBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-privacy', 'false');
  });
});
