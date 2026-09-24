import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';

test.describe('Dividend Analytics & Yield on Cost (YOC)', () => {
  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    await page.goto('/');

    // Navigate to Dividend tab
    const isMobile = await page.locator('.mobile-bottom-nav').isVisible().catch(() => false);
    if (isMobile) {
      await page.locator('#view-toggle-dividends').click();
    } else {
      await page.locator('#view-toggle-dividends').click();
    }
    await expect(page.locator('app-dividend')).toBeVisible();
  });

  test('TC-DIV-01: Displays summary KPI cards including Yield on Cost (YOC)', async ({ page }) => {
    const summaryCards = page.locator('.div-summary-card');
    await expect(summaryCards).toHaveCount(5);

    // Card 3: Yield on Cost (YOC)
    const yocCard = summaryCards.nth(2);
    await expect(yocCard.locator('.div-summary-label')).toContainText('Yield on Cost (YOC)');
    await expect(yocCard.locator('.div-summary-value')).toContainText('7.50%');
    await expect(yocCard.locator('.div-summary-sub')).toContainText('Market Yield');
  });

  test('TC-DIV-02: Displays asset type breakdown cards with accurate YOC indicators', async ({ page }) => {
    const assetCards = page.locator('.div-asset-card');
    await expect(assetCards.first()).toBeVisible();

    // Check Thai Stock card
    const thaiCard = assetCards.filter({ hasText: /Thai Stock/i });
    await expect(thaiCard).toBeVisible();
    await expect(thaiCard.locator('.asset-card-metrics')).toContainText('YOC:');
    await expect(thaiCard.locator('.asset-card-metrics')).toContainText('7.43%');

    // Check U.S. Stock card
    const usCard = assetCards.filter({ hasText: /U\.S\. Stock/i });
    await expect(usCard).toBeVisible();
    await expect(usCard.locator('.asset-card-metrics')).toContainText('YOC:');
    await expect(usCard.locator('.asset-card-metrics')).toContainText('0.54%');
  });

  test('TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion', async ({ page }) => {
    const yocCardValue = page.locator('.div-summary-card').nth(2).locator('.div-summary-value');

    // Default: All Assets -> 7.50%
    await expect(yocCardValue).toContainText('7.50%');

    // Filter to Thai Stocks
    const thaiPill = page.locator('.global-pill-btn', { hasText: 'Thai Stocks' });
    await thaiPill.click();
    await expect(yocCardValue).toContainText('7.43%');

    // Filter to U.S. Stocks -> 0.54% (not distorted by double exchange rate conversion)
    const usPill = page.locator('.global-pill-btn', { hasText: 'U.S. Stocks' });
    await usPill.click();
    await expect(yocCardValue).toContainText('0.54%');

    // Filter back to All Assets
    const allPill = page.locator('.global-pill-btn', { hasText: 'All Assets' });
    await allPill.click();
    await expect(yocCardValue).toContainText('7.50%');
  });

  test('TC-DIV-04: Captures visual screenshot of dividend analytics page', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'Chromium Desktop') {
      await page.screenshot({
        path: 'C:/Users/vipat/.gemini/antigravity-cli/brain/b3e34336-aba3-4cc9-93ee-8c08c8aeab01/dividend_desktop_yoc.png',
        fullPage: false,
      });

      // Scroll to Asset Breakdown and Table
      await page.locator('.div-asset-grid').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: 'C:/Users/vipat/.gemini/antigravity-cli/brain/b3e34336-aba3-4cc9-93ee-8c08c8aeab01/dividend_desktop_breakdown.png',
        fullPage: false,
      });
    } else if (testInfo.project.name === 'Mobile Chrome (Pixel 7)') {
      await page.screenshot({
        path: 'C:/Users/vipat/.gemini/antigravity-cli/brain/b3e34336-aba3-4cc9-93ee-8c08c8aeab01/dividend_mobile_yoc.png',
        fullPage: false,
      });

      // Scroll to Asset Cards on mobile
      await page.locator('.div-asset-grid').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: 'C:/Users/vipat/.gemini/antigravity-cli/brain/b3e34336-aba3-4cc9-93ee-8c08c8aeab01/dividend_mobile_breakdown.png',
        fullPage: false,
      });
    }
  });

  test('TC-DIV-05: Monthly Cashflow Timeline includes Bonds in legend and timeline segments', async ({ page }) => {
    const chartCard = page.locator('.div-chart-card');
    await expect(chartCard).toBeVisible();

    const legend = chartCard.locator('.div-legend');
    await expect(legend).toContainText('U.S. Stocks');
    await expect(legend).toContainText('Thai Stocks');
    await expect(legend).toContainText('Mutual Funds');
    await expect(legend).toContainText('Bonds');
  });
});
