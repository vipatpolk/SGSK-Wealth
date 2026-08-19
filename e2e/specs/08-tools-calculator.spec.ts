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
    await expect(page.locator('app-tools')).toBeVisible();
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
    await expect(page.locator('app-tools')).toBeVisible();
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

  async function selectTvmCalculator(page: any) {
    await expect(page.locator('app-tools')).toBeVisible();
    const viewport = page.viewportSize();
    const isDesktop = viewport ? viewport.width >= 1024 : true;

    if (isDesktop) {
      const desktopTab = page.locator('#tool-tab-tvm-calculator');
      await expect(desktopTab).toBeVisible();
      await desktopTab.click();
    } else {
      const mobileTrigger = page.locator('#tools-mobile-dropdown-trigger');
      await expect(mobileTrigger).toBeVisible();
      await mobileTrigger.click();
      const dropdownItem = page.locator('#tool-dropdown-tvm-calculator');
      await expect(dropdownItem).toBeVisible();
      await dropdownItem.click();
    }
    await expect(page.locator('app-tvm-calculator')).toBeVisible();
  }

  test('TC-TOOLS-04: Switch to TVM Calculator and calculate Future Value', async ({ page }) => {
    await headerPage.selectToolsView();
    await expect(page.locator('app-tools')).toBeVisible();

    // Select TVM Calculator
    await selectTvmCalculator(page);

    // Verify TVM Calculator is visible
    await expect(page.locator('app-tvm-calculator')).toBeVisible();

    // Verify Hero Display is visible with projected amount
    await expect(page.locator('.tvm-hero-display')).toBeVisible();
    await expect(page.locator('.hero-main-value')).toBeVisible();

    // Switch solve mode to PMT
    const solvePmtBtn = page.locator('#mode-solve-pmt');
    await solvePmtBtn.click();
    await expect(solvePmtBtn).toHaveClass(/active/);
    await expect(page.locator('#input-target-fv')).toBeVisible();

    // Open compounding dropdown and select Quarterly
    await page.locator('#compounding-dropdown-btn').click();
    await expect(page.locator('.compounding-menu')).toBeVisible();
    await page.locator('.compounding-menu-item:has-text("Quarterly")').click();
    await expect(page.locator('.compounding-active-text')).toContainText('Quarterly');

    // Toggle Schedule Table
    const toggleScheduleBtn = page.locator('#btn-toggle-tvm-schedule');
    await toggleScheduleBtn.click();
    await expect(page.locator('.schedule-table')).toBeVisible();
  });

  test('TC-TOOLS-05: TVM Calculator asset class multi-selection and valuation basis', async ({ page }) => {
    await headerPage.selectToolsView();
    await selectTvmCalculator(page);
    await expect(page.locator('app-tvm-calculator')).toBeVisible();

    // Verify PV Valuation Basis buttons
    const investedBtn = page.locator('.pv-source-btn:has-text("Invested Cost")');
    await investedBtn.click();
    await expect(investedBtn).toHaveClass(/active/);

    const marketValBtn = page.locator('.pv-source-btn:has-text("Market Value")');
    await marketValBtn.click();
    await expect(marketValBtn).toHaveClass(/active/);

    // Verify Asset Type chips if present
    const assetChips = page.locator('.asset-type-chip');
    const chipCount = await assetChips.count();
    if (chipCount > 1) {
      // Click second chip (individual asset class)
      await assetChips.nth(1).click();
      await expect(assetChips.nth(1)).toHaveClass(/active/);

      // Click first chip (All Classes) to reset
      await assetChips.first().click();
      await expect(assetChips.first()).toHaveClass(/active/);
    }
  });

  test('TC-TOOLS-06: TVM Calculator Year-by-Year Growth Chart and Area/Lines toggle', async ({ page }) => {
    await headerPage.selectToolsView();
    await selectTvmCalculator(page);
    await expect(page.locator('app-tvm-calculator')).toBeVisible();

    // Verify Chart Card & SVG are rendered
    await expect(page.locator('.tvm-chart-card')).toBeVisible();
    await expect(page.locator('.tvm-growth-svg')).toBeVisible();
    await expect(page.locator('.chart-line-balance')).toBeVisible();
    await expect(page.locator('.chart-line-invested')).toBeVisible();

    // Toggle to Lines mode
    const linesBtn = page.locator('.chart-mode-btn:has-text("Lines")');
    await linesBtn.click();
    await expect(linesBtn).toHaveClass(/active/);
    await expect(page.locator('.chart-area-balance')).toHaveCount(0);

    // Toggle back to Area mode
    const areaBtn = page.locator('.chart-mode-btn:has-text("Area")');
    await areaBtn.click();
    await expect(areaBtn).toHaveClass(/active/);
    await expect(page.locator('.chart-area-balance')).toBeVisible();
  });
});

