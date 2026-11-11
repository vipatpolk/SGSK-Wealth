import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { actorCalled } from '@serenity-js/core';
import { getPlaywrightPage } from '../../support/playwright.utils';

function getActor() {
  return actorCalled('Investor');
}

async function selectTvmCalculator(page: any) {
  await expect(page.locator('app-tools')).toBeVisible();
  const viewport = page.viewportSize();
  const isDesktop = viewport ? viewport.width >= 1024 : true;

  if (isDesktop) {
    const desktopTab = page.locator('#tool-tab-tvm-calculator');
    await expect(desktopTab).toBeVisible();
    await desktopTab.click();
  } else {
    const mobileTrigger = page.locator('#tools-mobile-dropdown-trigger');
    await expect(mobileTrigger).toBeVisible();
    await mobileTrigger.click();
    const dropdownItem = page.locator('#tool-dropdown-tvm-calculator');
    await expect(dropdownItem).toBeVisible();
    await dropdownItem.click();
  }
  await expect(page.locator('app-tvm-calculator')).toBeVisible();
}

async function selectRebalancePlanner(page: any) {
  await expect(page.locator('app-tools')).toBeVisible();
  const desktopTab = page.locator('#tool-tab-rebalance-planner');
  if (await desktopTab.isVisible()) {
    await desktopTab.click();
  } else {
    const mobileTrigger = page.locator('#tools-mobile-dropdown-trigger');
    await expect(mobileTrigger).toBeVisible();
    await mobileTrigger.click();
    const dropdownItem = page.locator('#tool-dropdown-rebalance-planner');
    await expect(dropdownItem).toBeVisible();
    await dropdownItem.click();
  }
  await expect(page.locator('app-rebalance-calculator')).toBeVisible();
}

Then('the tools hero title should contain {string}', async (text: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.tools-hero-title')).toContainText(text);
});

Then('the average cost calculator should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-avg-cost-calculator')).toBeVisible();
});

When('I select the custom simulation option from the symbol dropdown', async () => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('.symbol-search-box').click();
  await expect(page.locator('.symbol-dropdown-menu')).toBeVisible();
  const customOption = page.locator('.dropdown-option-item.custom-option');
  await customOption.click();
});

When('I click the simulation calculate button', async () => {
  const page = await getPlaywrightPage(getActor());
  const calcBtn = page.locator('#btn-calculate-simulation');
  await expect(calcBtn).toBeEnabled();
  await calcBtn.click();
});

Then('the simulation results panel and KPI grid should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.right-panel')).toBeVisible();
  await expect(page.locator('.sim-kpi-grid')).toBeVisible();
});

When('I switch to By Amount mode', async () => {
  const page = await getPlaywrightPage(getActor());
  const amountModeBtn = page.locator('#mode-amount-pill');
  await amountModeBtn.click();
  await expect(amountModeBtn).toHaveClass(/active/);
});

Then('the simulation amount input should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#input-amount')).toBeVisible();
});

When('I switch to the TVM Calculator tool', async () => {
  const page = await getPlaywrightPage(getActor());
  await selectTvmCalculator(page);
});

Then('the TVM hero display and projected value should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.tvm-hero-display')).toBeVisible();
  await expect(page.locator('.hero-main-value')).toBeVisible();
});

When('I switch the TVM solve mode to PMT', async () => {
  const page = await getPlaywrightPage(getActor());
  const solvePmtBtn = page.locator('#mode-solve-pmt');
  await solvePmtBtn.click();
  await expect(solvePmtBtn).toHaveClass(/active/);
});

Then('the target FV input should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#input-target-fv')).toBeVisible();
});

When('I select TVM compounding frequency {string}', async (freq: string) => {
  const page = await getPlaywrightPage(getActor());
  await page.locator('#compounding-dropdown-btn').click();
  await expect(page.locator('.compounding-menu')).toBeVisible();
  await page.locator(`.compounding-menu-item:has-text("${freq}")`).click();
});

Then('the active compounding frequency should display {string}', async (freq: string) => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.compounding-active-text')).toContainText(freq);
});

When('I toggle the TVM accumulation schedule table', async () => {
  const page = await getPlaywrightPage(getActor());
  const toggleScheduleBtn = page.locator('#btn-toggle-tvm-schedule');
  await toggleScheduleBtn.click();
});

Then('the schedule table should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.schedule-table')).toBeVisible();
});

When('I click the PV valuation basis {string}', async (label: string) => {
  const page = await getPlaywrightPage(getActor());
  const btn = page.locator(`.pv-source-btn:has-text("${label}")`);
  await btn.click();
});

Then('the {string} valuation basis button should be active', async (label: string) => {
  const page = await getPlaywrightPage(getActor());
  const btn = page.locator(`.pv-source-btn:has-text("${label}")`);
  await expect(btn).toHaveClass(/active/);
});

Then('I test asset type chips selection if present', async () => {
  const page = await getPlaywrightPage(getActor());
  const assetChips = page.locator('.asset-type-chip');
  const chipCount = await assetChips.count();
  if (chipCount > 1) {
    await assetChips.nth(1).click();
    await expect(assetChips.nth(1)).toHaveClass(/active/);
    await assetChips.first().click();
    await expect(assetChips.first()).toHaveClass(/active/);
  }
});

Then('the TVM growth chart card and svg should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.tvm-chart-card')).toBeVisible();
  await expect(page.locator('.tvm-growth-svg')).toBeVisible();
  await expect(page.locator('.chart-line-balance')).toBeVisible();
  await expect(page.locator('.chart-line-invested')).toBeVisible();
});

When('I toggle TVM chart mode to {string}', async (mode: string) => {
  const page = await getPlaywrightPage(getActor());
  const btn = page.locator(`.chart-mode-btn:has-text("${mode}")`);
  await btn.click();
});

Then('the lines chart mode button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const linesBtn = page.locator('.chart-mode-btn:has-text("Lines")');
  await expect(linesBtn).toHaveClass(/active/);
  await expect(page.locator('.chart-area-balance')).toHaveCount(0);
});

Then('the area chart mode button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const areaBtn = page.locator('.chart-mode-btn:has-text("Area")');
  await expect(areaBtn).toHaveClass(/active/);
  await expect(page.locator('.chart-area-balance')).toBeVisible();
});

When('I switch to the Rebalance Planner tool', async () => {
  const page = await getPlaywrightPage(getActor());
  await selectRebalancePlanner(page);
});

Then('the rebalance calculator should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('app-rebalance-calculator')).toBeVisible();
});

Then('the rebalance KPI grid should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.rebalance-kpi-grid')).toBeVisible();
});

Then('the Standard rebalance mode button should be active', async () => {
  const page = await getPlaywrightPage(getActor());
  const stdBtn = page.locator('#btn-mode-standard');
  await expect(stdBtn).toHaveClass(/active/);
});

Then('the No-Sell rebalance mode button should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  const noSellBtn = page.locator('#btn-mode-nosell');
  await expect(noSellBtn).toBeVisible();
});

Then('I test Rebalance Planner equal weight actions if groups exist', async () => {
  const page = await getPlaywrightPage(getActor());
  const groups = page.locator('.asset-class-card');
  const groupCount = await groups.count();
  if (groupCount > 0) {
    const firstGroup = groups.first();
    await expect(firstGroup).toBeVisible();
    const equalWeightBtn = firstGroup.locator('button:has-text("Equal Weight")');
    if (await equalWeightBtn.isVisible()) {
      await equalWeightBtn.click();
    }
    await expect(firstGroup.locator('.target-sum-badge')).toBeVisible();
  }
});

When('I click the No-Sell mode button', async () => {
  const page = await getPlaywrightPage(getActor());
  const noSellBtn = page.locator('#btn-mode-nosell');
  await noSellBtn.click();
  await expect(noSellBtn).toHaveClass(/active/);
});

Then('the No-Sell settings panel should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#nosell-settings-panel')).toBeVisible();
});

When('I select the custom cash deposit radio', async () => {
  const page = await getPlaywrightPage(getActor());
  const depositRadio = page.locator('#radio-custom-deposit');
  await depositRadio.click();
});

Then('the custom cash input should be visible', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('#custom-cash-input')).toBeVisible();
});

Then('I test Rebalance Planner class chip filters if present', async () => {
  const page = await getPlaywrightPage(getActor());
  await expect(page.locator('.rebalance-kpi-grid')).toBeVisible();

  const classChips = page.locator('.class-chip');
  const chipCount = await classChips.count();
  if (chipCount > 1) {
    await classChips.nth(1).click();
    await expect(classChips.nth(1)).toHaveClass(/active/);
    await expect(page.locator('.kpi-card .kpi-label').first()).toContainText('Class Value');

    await classChips.first().click();
    await expect(classChips.first()).toHaveClass(/active/);
    await expect(page.locator('.kpi-card .kpi-label').first()).toContainText('Portfolio Value');
  }
});
