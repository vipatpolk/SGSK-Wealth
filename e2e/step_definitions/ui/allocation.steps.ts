import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { AllocationPage } from '../../pages/allocation.page.po';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

Then('the allocation donut chart should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const allocation = new AllocationPage(page);
  await expect(allocation.donutChart).toBeVisible();
});

When('I filter allocation to {string} if present', async (className: string) => {
  const page = await getPlaywrightPage(getActor());
  const row = page.locator(`app-asset-allocation tr:has-text("${className}")`);
  if (await row.isVisible()) {
    await row.click();
  }
});

Then('I reset the allocation filter if the reset button is visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const resetButton = page.locator('button:has-text("All Asset Classes")');
  if (await resetButton.isVisible()) {
    await resetButton.click();
  }
});

Then('the asset class breakdown table and rebalance list should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(
    page.locator('.allocation-card-title:has-text("Asset Class Breakdown")')
  ).toBeVisible();
  await expect(page.locator('.rebalance-list')).toBeVisible();
});
