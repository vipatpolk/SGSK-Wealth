import { Page, Locator } from '@playwright/test';

export class PerformancePage {
  readonly page: Page;
  readonly container: Locator;
  readonly summaryGrid: Locator;
  readonly summaryCards: Locator;
  readonly barChart: Locator;
  readonly barRows: Locator;
  readonly gainersList: Locator;
  readonly losersList: Locator;
  readonly searchInput: Locator;
  readonly assetTypeSelect: Locator;
  readonly statusSelect: Locator;
  readonly sortSelect: Locator;
  readonly sortDirectionBtn: Locator;
  readonly symbolRows: Locator;
  readonly datePickerTrigger: Locator;
  readonly datePickerPopover: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('.perf-container');
    this.summaryGrid = page.locator('.perf-summary-grid');
    this.summaryCards = page.locator('.perf-summary-card');
    this.barChart = page.locator('.perf-bar-chart');
    this.barRows = page.locator('.perf-bar-row');
    this.gainersList = page.locator('.perf-gainers-list');
    this.losersList = page.locator('.perf-losers-list');
    this.searchInput = page.locator('.perf-search-input');
    this.assetTypeSelect = page.locator('.perf-filter-select').nth(0);
    this.statusSelect = page.locator('.perf-filter-select').nth(1);
    this.sortSelect = page.locator('.perf-filter-select').nth(2);
    this.sortDirectionBtn = page.locator('.perf-filter-btn');
    this.symbolRows = page.locator('.perf-symbol-row');
    this.datePickerTrigger = page.locator('#datepicker-trigger-btn');
    this.datePickerPopover = page.locator('.datepicker-popover');
  }

  async searchSymbol(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByAssetType(assetType: string) {
    await this.assetTypeSelect.selectOption(assetType);
  }

  async filterByStatus(status: 'all' | 'open' | 'closed') {
    await this.statusSelect.selectOption(status);
  }

  async sortBy(field: string) {
    await this.sortSelect.selectOption(field);
  }

  async selectDatePreset(preset: string) {
    if (!(await this.datePickerPopover.isVisible())) {
      await this.datePickerTrigger.click();
    }
    const btn = this.page.locator(`.preset-item:has-text("${preset}")`);
    await btn.click();
  }
}
