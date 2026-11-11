import { Page, Locator } from '@playwright/test';

export class AllocationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly donutChart: Locator;
  readonly editTargetsBtn: Locator;
  readonly saveTargetsBtn: Locator;
  readonly cancelEditBtn: Locator;
  readonly resetFilterBtn: Locator;
  readonly targetInputs: Locator;
  readonly targetSumWarning: Locator;
  readonly top5ToggleBtn: Locator;
  readonly classRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('app-asset-allocation h2, app-asset-allocation h3').first();
    this.donutChart = page.locator('app-asset-allocation .donut-svg');
    this.editTargetsBtn = page.locator('button:has-text("Edit Targets"), button:has-text("Edit Target Allocation")');
    this.saveTargetsBtn = page.locator('button:has-text("Save Targets"), button:has-text("Save")');
    this.cancelEditBtn = page.locator('button:has-text("Cancel")');
    this.resetFilterBtn = page.locator('button:has-text("All Asset Classes")');
    this.targetInputs = page.locator('app-asset-allocation input[type="number"]');
    this.targetSumWarning = page.locator('app-asset-allocation .warning-message, app-asset-allocation .text-red-500, app-asset-allocation .bg-red-500');
    this.top5ToggleBtn = page.locator('button:has-text("Top 5"), button:has-text("Show All")');
    this.classRows = page.locator('app-asset-allocation tr');
  }

  async clickClassRow(className: string) {
    await this.page.locator(`app-asset-allocation tr:has-text("${className}")`).first().click();
  }

  async resetClassFilter() {
    await this.resetFilterBtn.click();
  }
}
