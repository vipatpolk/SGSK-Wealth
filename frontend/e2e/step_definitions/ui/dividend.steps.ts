import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

Then('the dividend view should render 5 summary KPI cards', async () => {
  const page = await getPlaywrightPage(getActor());
  const summaryCards = page.locator('.div-summary-card');
  await expect(summaryCards).toHaveCount(5);
});

Then(
  'the Yield on Cost card should display {string} and label {string}',
  async (value: string, label: string) => {
    const page = await getPlaywrightPage(getActor());
    const yocCard = page.locator('.div-summary-card').nth(2);
    await expect(yocCard.locator('.div-summary-label')).toContainText(label);
    await expect(yocCard.locator('.div-summary-value')).toContainText(value);
    await expect(yocCard.locator('.div-summary-sub')).toContainText('Market Yield');
  }
);

Then(
  'the dividend asset breakdown card for {string} should display YOC {string}',
  async (assetName: string, expectedYoc: string) => {
    const page = await getPlaywrightPage(getActor());
    const assetCards = page.locator('.div-asset-card');
    await expect(assetCards.first()).toBeVisible();

    const regex = new RegExp(assetName, 'i');
    const card = assetCards.filter({ hasText: regex });
    await expect(card).toBeVisible();
    await expect(card.locator('.asset-card-metrics')).toContainText('YOC:');
    await expect(card.locator('.asset-card-metrics')).toContainText(expectedYoc);
  }
);

Then('the Yield on Cost KPI card should show {string}', async (expectedVal: string) => {
  const page = await getPlaywrightPage(getActor());
  const yocCardValue = page.locator('.div-summary-card').nth(2).locator('.div-summary-value');
  await expect(yocCardValue).toContainText(expectedVal);
});

When('I filter dividends to asset type {string}', async (assetType: string) => {
  const page = await getPlaywrightPage(getActor());
  const pill = page.locator('.global-pill-btn', { hasText: assetType });
  await pill.click();
});

Then('the monthly cashflow timeline chart should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const chartCard = page.locator('.div-chart-card');
  await expect(chartCard).toBeVisible();
});

Then(
  'the timeline legend should contain {string}, {string}, {string}, and {string}',
  async (leg1: string, leg2: string, leg3: string, leg4: string) => {
    const page = await getPlaywrightPage(getActor());
    const legend = page.locator('.div-chart-card .div-legend');
    await expect(legend).toContainText(leg1);
    await expect(legend).toContainText(leg2);
    await expect(legend).toContainText(leg3);
    await expect(legend).toContainText(leg4);
  }
);
