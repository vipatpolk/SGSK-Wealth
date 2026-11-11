import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { HeaderPage } from '../../pages/header.component.po';
import { getPlaywrightPage } from '../../support/playwright.utils';
import { mockPortfolioAPIError } from '../../utils/api-mock.utils';

function getActor() {
  return actorCalled('Investor');
}

Given('I open the SGSK Wealth application', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.goto('/');
});

Given('the backend API returns error status {int}', async (statusCode: number) => {
  const page = await getPlaywrightPage(getActor());
  await mockPortfolioAPIError(page, statusCode);
});

When('I open the SGSK Wealth application without mocking', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.goto('/');
});

When('I switch to the Holdings view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectHoldingsView();
});

When('I switch to the Analytics view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectAnalyticsView();
});

When('I switch to the Allocation sub-tab', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectAllocationView();
});

When('I navigate to the Allocation analytics view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectAllocationView();
});

When('I switch to the Performance sub-tab', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectPerformanceView();
});

When('I switch to the Transactions view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectTransactionsView();
});

When('I navigate to the Tools view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectToolsView();
});

When('I navigate to the Dividends view', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#view-toggle-dividends').click();
  await expect(page.locator('app-dividend')).toBeVisible();
});

When('I switch back to the Dashboard view', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.selectDashboardView();
});

Then('the Dashboard view should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#dashboard-view')).toBeVisible();
});

Then('the asset tab bar should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-tab-bar')).toBeVisible();
});

Then('the analytics container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-analytics')).toBeVisible();
});

Then('the asset allocation container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-asset-allocation')).toBeVisible();
});

Then('the performance analytics container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-performance')).toBeVisible();
});

Then('the transaction history container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-transaction-history')).toBeVisible();
});

Then('the tools container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-tools')).toBeVisible();
});

Then('the dividend container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-dividend')).toBeVisible();
});

When('I switch currency to USD', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.switchToUSD();
});

When('I switch currency to THB', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.switchToTHB();
});

Then('the USD currency button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await expect(header.currencyUsdBtn).toHaveClass(/currency-btn-active/);
});

Then('the THB currency button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await expect(header.currencyThbBtn).toHaveClass(/currency-btn-active/);
});

When('I toggle the theme', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.toggleTheme();
});

Then('the document theme attribute should be {string}', async (theme: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
});

When('I toggle privacy mode', async () => {
  const page = await getPlaywrightPage(getActor());
  const header = new HeaderPage(page);
  await header.privacyToggleBtn.click();
});

Then('the document privacy attribute should be {string}', async (val: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('html')).toHaveAttribute('data-privacy', val);
});

Then('the error state card should be visible with {string}', async (text: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#error-state')).toBeVisible();
  await expect(page.locator('#error-state')).toContainText(text);
});

Then('the retry button should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#retry-btn')).toBeVisible();
});
