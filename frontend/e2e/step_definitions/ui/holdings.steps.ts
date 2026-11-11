import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { HoldingsPage } from '../../pages/holdings.page.po';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

When('I select the {string} asset tab', async (tabName: string) => {
  const page = await getPlaywrightPage(getActor());
  const holdings = new HoldingsPage(page);
  await holdings.selectTab(tabName);
});

Then('the card for {string} should be visible', async (symbol: string) => {
  const page = await getPlaywrightPage(getActor());
  // Some symbols like PTT.BK contain a dot, so support both attribute selector and id selector
  const cardLocator = symbol.includes('.')
    ? page.locator(`[id="card-${symbol}"]`)
    : page.locator(`#card-${symbol}`);
  await expect(cardLocator).toBeVisible();
});

When('I expand the symbol row for {string}', async (symbol: string) => {
  const page = await getPlaywrightPage(getActor());
  const holdings = new HoldingsPage(page);
  await holdings.clickSymbolRow(symbol);
});

Then('the lots drawer container should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.lots-container')).toBeVisible();
});

Then('the lots drawer should contain {string}', async (text: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.lots-container')).toContainText(text);
});

When('I search holdings for {string}', async (term: string) => {
  const page = await getPlaywrightPage(getActor());
  const holdings = new HoldingsPage(page);
  await holdings.searchSymbol(term);
});
