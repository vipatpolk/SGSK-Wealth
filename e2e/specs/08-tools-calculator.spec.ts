import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';

test.describe('Tools Hub & Avg Cost Calculator', () => {
  let headerPage: HeaderPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    await page.goto('/');
  });

  test('TC-TOOLS-01: Navigation to Tools tab and renders Avg Cost Calculator', async ({ page }) => {
    // Navigate to Tools Hub
    await headerPage.selectToolsView();
    await expect(page.locator('app-tools')).toBeVisible();

    // Verify Tools Header
    await expect(page.locator('.tools-hero-title')).toContainText('Investor Tools & Simulators');

    // Verify Calculator is embedded
    await expect(page.locator('app-avg-cost-calculator')).toBeVisible();
  });

  test('TC-TOOLS-02: Symbol selection and forward Buy simulation', async ({ page }) => {
    await headerPage.selectToolsView();
    await expect(page.locator('app-avg-cost-calculator')).toBeVisible();

    // Open symbol dropdown
    await page.locator('.symbol-search-box').click();
    await expect(page.locator('.symbol-dropdown-menu')).toBeVisible();

    // Select custom simulation option
    const customOption = page.locator('.dropdown-option-item.custom-option');
    await customOption.click();

    // Verify calculator is active and enabled
    const calcBtn = page.locator('#btn-calculate-simulation');
    await expect(calcBtn).toBeEnabled();

    // Trigger calculation
    await calcBtn.click();
    await expect(page.locator('.right-panel')).toBeVisible();
    await expect(page.locator('.sim-kpi-grid')).toBeVisible();
  });

  test('TC-TOOLS-03: Switching between Shares and Amount mode', async ({ page }) => {
    await headerPage.selectToolsView();
    await expect(page.locator('app-avg-cost-calculator')).toBeVisible();

    // Enable Custom Mode
    await page.locator('.symbol-search-box').click();
    await expect(page.locator('.symbol-dropdown-menu')).toBeVisible();
    await page.locator('.dropdown-option-item.custom-option').click();

    // Click By Amount mode pill
    const amountModeBtn = page.locator('#mode-amount-pill');
    await amountModeBtn.click();
    await expect(amountModeBtn).toHaveClass(/active/);

    // Verify amount input is visible
    await expect(page.locator('#input-amount')).toBeVisible();
  });
});
