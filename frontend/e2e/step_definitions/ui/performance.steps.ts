import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { PerformancePage } from '../../pages/performance.page.po';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

Then('the performance summary grid should render 5 KPI cards', async () => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await expect(performance.summaryGrid).toBeVisible();
  await expect(performance.summaryCards).toHaveCount(5);
});

When('I select the performance date preset {string}', async (preset: string) => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await expect(performance.datePickerTrigger).toBeVisible();
  await performance.selectDatePreset(preset);
});

Then('the date range picker trigger should display {string}', async (text: string) => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await expect(performance.datePickerTrigger).toContainText(text);
});

Then(
  'the performance sections should contain {string} and {string}',
  async (section1: string, section2: string) => {
    const page = await getPlaywrightPage(getActor());
    await expect(page.locator('.perf-chart-title').first()).toContainText(section1);
    await expect(page.locator('.perf-chart-title').nth(1)).toContainText(section2);
  }
);

When('I search performance symbols for {string}', async (query: string) => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await performance.searchSymbol(query);
});

Then('the performance autocomplete dropdown should suggest {string}', async (name: string) => {
  const page = await getPlaywrightPage(getActor());
  const dropdown = page.locator('#perf-autocomplete-dropdown');
  await expect(dropdown).toBeVisible();
  await expect(page.locator('.perf-autocomplete-item')).toHaveCount(1);
  await expect(page.locator('.perf-autocomplete-item-name')).toContainText(name);
});

When('I filter performance by status {string}', async (status: string) => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await expect(performance.statusSelect).toBeVisible();
  await performance.filterByStatus(status as 'all' | 'open' | 'closed');
});

Then('the status select should have value {string}', async (status: string) => {
  const page = await getPlaywrightPage(getActor());
  const performance = new PerformancePage(page);
  await expect(performance.statusSelect).toHaveValue(status);
});
