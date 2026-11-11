import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

Given('I open the ShareLot application on a mobile viewport', async () => {
  const page = await getPlaywrightPage(getActor());
  // iPhone 14 viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
});

Then('the native bottom navigation bar should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#view-toggle')).toBeVisible();
});

When('I tap Analytics on the bottom navigation bar', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#view-toggle-analytics').click();
});

When('I tap Tools on the bottom navigation bar', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#view-toggle-tools').click();
});

When('I select Rebalance Planner from the mobile tools dropdown', async () => {
  const page = await getPlaywrightPage(getActor());
  const toolsMobileTrigger = page.locator('#tools-mobile-dropdown-trigger');
  await expect(toolsMobileTrigger).toBeVisible();
  await toolsMobileTrigger.click();
  await page.locator('#tool-dropdown-rebalance-planner').click();
});

Then('the mobile rebalance mode toggle should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.rebalance-mode-toggle')).toBeVisible();
  await expect(page.locator('.mode-text-mobile').first()).toBeVisible();
});

Then('the mobile symbol cards should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.mobile-symbol-cards-list').first()).toBeVisible();
});

Then('the bottom nav dashboard tab should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#view-toggle-dashboard')).toHaveClass(/view-toggle-btn-active/);
});

When('I tap Holdings on the bottom navigation bar', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#view-toggle-holdings').click();
});

Then('the bottom nav holdings tab should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#view-toggle-holdings')).toHaveClass(/view-toggle-btn-active/);
  await expect(page.locator('#view-toggle-dashboard')).not.toHaveClass(/view-toggle-btn-active/);
});

Then('the bottom nav analytics tab should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#view-toggle-analytics')).toHaveClass(/view-toggle-btn-active/);
});

When('I tap Dividends on the bottom navigation bar', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#view-toggle-dividends').click();
});

Then('the bottom nav dividends tab should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#view-toggle-dividends')).toHaveClass(/view-toggle-btn-active/);
  await expect(page.locator('#view-toggle-analytics')).not.toHaveClass(/view-toggle-btn-active/);
});
