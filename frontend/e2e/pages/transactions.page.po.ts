import { Page, Locator } from '@playwright/test';

export class TransactionsPage {
  readonly page: Page;
  readonly transactionRows: Locator;
  readonly exportCsvTriggerBtn: Locator;
  readonly exportAllBtn: Locator;
  readonly exportOpenBtn: Locator;
  readonly pageSizeDropdown: Locator;
  readonly datePresets: Locator;

  constructor(page: Page) {
    this.page = page;
    this.transactionRows = page.locator('app-transaction-history tbody tr, app-transaction-history .tx-row');
    this.exportCsvTriggerBtn = page.locator('#btn-export-csv-trigger');
    this.exportAllBtn = page.locator('#btn-export-all');
    this.exportOpenBtn = page.locator('#btn-export-open');
    this.pageSizeDropdown = page.locator('app-transaction-history select');
    this.datePresets = page.locator('app-date-range-picker button');
  }

  async selectDatePreset(presetLabel: string) {
    await this.datePresets.filter({ hasText: presetLabel }).click();
  }

  async exportAllTransactions() {
    await this.exportCsvTriggerBtn.click();
    await this.exportAllBtn.click();
  }
}
