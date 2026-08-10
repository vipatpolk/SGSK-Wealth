import { Page, Locator } from '@playwright/test';

export class HoldingsPage {
  readonly page: Page;
  readonly tabButtons: Locator;
  readonly searchInput: Locator;
  readonly symbolCards: Locator;
  readonly summaryCards: Locator;
  readonly expandedDrawer: Locator;
  readonly loader: Locator;
  readonly errorState: Locator;
  readonly retryBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButtons = page.locator('app-tab-bar button.tab-button');
    this.searchInput = page.locator('app-search-bar input');
    this.symbolCards = page.locator('.symbol-card');
    this.summaryCards = page.locator('app-summary-card');
    this.expandedDrawer = page.locator('.lots-container');
    this.loader = page.locator('#loading-state');
    this.errorState = page.locator('#error-state');
    this.retryBtn = page.locator('#retry-btn');
  }

  async selectTab(tabLabel: string) {
    const desktopTab = this.tabButtons.filter({ hasText: tabLabel }).first();
    if (await desktopTab.isVisible()) {
      await desktopTab.click();
    } else {
      const mobileDropdownBtn = this.page.locator('#tab-dropdown-btn');
      await mobileDropdownBtn.click();
      await this.page.locator('.tab-dropdown-menu button').filter({ hasText: tabLabel }).first().click();
    }
  }

  async searchSymbol(query: string) {
    await this.searchInput.fill(query);
  }

  async clickSymbolRow(symbol: string) {
    await this.page.locator(`#toggle-${symbol}`).click();
  }
}
