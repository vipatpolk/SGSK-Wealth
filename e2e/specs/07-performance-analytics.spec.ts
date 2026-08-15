import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';
import { PerformancePage } from '../pages/performance.page.po';

test.describe('Investment Performance & Analytics Engine', () => {
  let headerPage: HeaderPage;
  let performancePage: PerformancePage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    performancePage = new PerformancePage(page);
    await page.goto('/');
    await headerPage.selectPerformanceView();
  });

  test('TC-PRF-01: Performance view renders summary KPI cards', async ({ page }) => {
    await expect(performancePage.container).toBeVisible();
    await expect(performancePage.summaryGrid).toBeVisible();
    await expect(performancePage.summaryCards).toHaveCount(5);
  });

  test('TC-PRF-02: Date range preset buttons trigger timeframe updates', async ({ page }) => {
    await expect(performancePage.datePickerTrigger).toBeVisible();
    
    // Open date picker and click YTD preset
    await performancePage.selectDatePreset('YTD');
    await expect(performancePage.datePickerTrigger).toContainText('YTD');

    // Open date picker and click Last 30 Days preset
    await performancePage.selectDatePreset('Last 30 Days');
    await expect(performancePage.datePickerTrigger).toContainText('Last 30 Days');
  });

  test('TC-PRF-03: Asset Type Return and Top Movers sections render correctly', async ({ page }) => {
    await expect(page.locator('.perf-chart-title').first()).toContainText('Asset Type Return');
    await expect(page.locator('.perf-chart-title').nth(1)).toContainText('Top Movers');
  });

  test('TC-PRF-04: Symbol search autocomplete dropdown provides instant suggestions', async ({ page }) => {
    await performancePage.searchSymbol('AAP');
    const dropdown = page.locator('#perf-autocomplete-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(page.locator('.perf-autocomplete-item')).toHaveCount(1);
    await expect(page.locator('.perf-autocomplete-item-name')).toContainText('Apple');
  });

  test('TC-PRF-05: Status and Asset Type filters are accessible and selectable', async ({ page }) => {
    await expect(performancePage.statusSelect).toBeVisible();
    await performancePage.filterByStatus('open');
    await expect(performancePage.statusSelect).toHaveValue('open');

    await performancePage.filterByStatus('closed');
    await expect(performancePage.statusSelect).toHaveValue('closed');

    await performancePage.filterByStatus('all');
    await expect(performancePage.statusSelect).toHaveValue('all');
  });
});
