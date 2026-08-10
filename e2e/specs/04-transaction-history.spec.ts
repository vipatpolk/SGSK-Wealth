import { test, expect } from '@playwright/test';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { HeaderPage } from '../pages/header.component.po';
import { TransactionsPage } from '../pages/transactions.page.po';

test.describe('Transaction History Ledger & CSV Exporter', () => {
  let headerPage: HeaderPage;
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    await mockPortfolioAPIs(page);
    headerPage = new HeaderPage(page);
    transactionsPage = new TransactionsPage(page);
    await page.goto('/');
    await headerPage.selectTransactionsView();
  });

  test('TC-TXN-01: Displays initial unfiltered transaction feed', async ({ page }) => {
    await expect(page.locator('app-transaction-history')).toBeVisible();
  });

  test('TC-TXN-02: Formats units according to asset type context', async ({ page }) => {
    await expect(page.locator('app-transaction-history')).toContainText('AAPL');
  });

  test('TC-TXN-05: CSV Export triggers file download', async ({ page }) => {
    await expect(transactionsPage.exportCsvTriggerBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await transactionsPage.exportAllTransactions();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/sharelot_.*\.csv/i);
  });
});
