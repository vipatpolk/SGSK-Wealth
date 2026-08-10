import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HoldingsPage } from '../pages/holdings.page.po';

test.describe('Portfolio Holdings & FIFO Share Lot Accounting', () => {
  let holdingsPage: HoldingsPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    holdingsPage = new HoldingsPage(page);
    await page.goto('/');
  });

  test('TC-HLD-01: Asset Tab Filtering displays symbols matching tab category', async ({ page }) => {
    // Select US Stock tab
    await holdingsPage.selectTab('U.S. Stock');
    await expect(page.locator('#card-AAPL')).toBeVisible();

    // Select Thai Stock tab
    await holdingsPage.selectTab('Thai Stock');
    await expect(page.locator('[id="card-PTT.BK"]')).toBeVisible();

    // Select Crypto tab
    await holdingsPage.selectTab('Cryptocurrency');
    await expect(page.locator('#card-BTC')).toBeVisible();

    // Select Mutual Fund tab
    await holdingsPage.selectTab('Mutual Fund');
    await expect(page.locator('#card-K-USA')).toBeVisible();

    // Select Closed Position tab
    await holdingsPage.selectTab('Closed Position');
    await expect(page.locator('#card-NVDA')).toBeVisible();
  });

  test('TC-HLD-02: Expanding Symbol Row reveals FIFO share lot details', async ({ page }) => {
    await holdingsPage.selectTab('U.S. Stock');
    await holdingsPage.clickSymbolRow('AAPL');

    // Verify expanded drawer displays lots
    await expect(page.locator('.lots-container')).toBeVisible();
    await expect(page.locator('.lots-container')).toContainText('Jan 15, 2024');
    await expect(page.locator('.lots-container')).toContainText('Mar 10, 2024');
  });

  test('TC-HLD-03: Search Bar filters portfolio holdings by symbol or name', async ({ page }) => {
    await holdingsPage.searchSymbol('Bitcoin');
    await expect(page.locator('#card-BTC')).toBeVisible();
  });
});
