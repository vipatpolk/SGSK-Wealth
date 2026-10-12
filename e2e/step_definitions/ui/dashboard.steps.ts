import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

Then('the Dashboard header navigation button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const dashBtn = page.locator('#view-toggle-dashboard');
  await expect(dashBtn).toHaveClass(/view-toggle-btn-active/);
});

Then('the Executive Net Worth banner should be displayed', async () => {
  const page = await getPlaywrightPage(getActor());
  const netWorth = page.locator('#dashboard-net-worth');
  await expect(netWorth).toBeVisible();
});

Then('the 4 executive KPI cards should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#kpi-invested')).toBeVisible();
  await expect(page.locator('#kpi-unrealized')).toBeVisible();
  await expect(page.locator('#kpi-realized')).toBeVisible();
  await expect(page.locator('#kpi-dividends')).toBeVisible();
});

Then('the Dashboard allocation card and donut svg should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const allocCard = page.locator('#dashboard-allocation-card');
  await expect(allocCard).toBeVisible();
  await expect(allocCard.locator('.donut-svg')).toBeVisible();
});

When('I click the Dashboard go to allocation button', async () => {
  const page = await getPlaywrightPage(getActor());
  const gotoAllocBtn = page.locator('#btn-goto-allocation');
  await gotoAllocBtn.click();
});

Then('the Dashboard performance card should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const perfCard = page.locator('#dashboard-performance-card');
  await expect(perfCard).toBeVisible();
});

When('I click the Dashboard go to performance button', async () => {
  const page = await getPlaywrightPage(getActor());
  const gotoPerfBtn = page.locator('#btn-goto-performance');
  await gotoPerfBtn.click();
});

Then('the Dashboard tools launchpad card should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const toolsCard = page.locator('#dashboard-tools-card');
  await expect(toolsCard).toBeVisible();
});

When('I click the Dashboard launch Rebalance Planner card', async () => {
  const page = await getPlaywrightPage(getActor());
  const rebalanceCard = page.locator('#launch-rebalance-planner');
  await expect(rebalanceCard).toBeVisible();
  await rebalanceCard.click();
});
