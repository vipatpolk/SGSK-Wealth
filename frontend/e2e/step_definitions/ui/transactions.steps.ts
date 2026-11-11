import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { TransactionsPage } from '../../pages/transactions.page.po';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

let downloadedFileName = '';

Then('the transaction history ledger should contain {string}', async (text: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-transaction-history')).toContainText(text);
});

When('I trigger CSV export of all transactions', async () => {
  const page = await getPlaywrightPage(getActor());
  const transactions = new TransactionsPage(page);
  await expect(transactions.exportCsvTriggerBtn).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await transactions.exportAllTransactions();
  const download = await downloadPromise;
  downloadedFileName = download.suggestedFilename();
});

Then('the downloaded file name should match the pattern {string}', (pattern: string) => {
  const regex = new RegExp(pattern, 'i');
  expect(downloadedFileName).toMatch(regex);
});
