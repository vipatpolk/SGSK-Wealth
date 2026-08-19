import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly logoText: Locator;
  readonly viewToggleHoldingsBtn: Locator;
  readonly viewToggleAllocationBtn: Locator;
  readonly viewTogglePerformanceBtn: Locator;
  readonly viewToggleTransactionsBtn: Locator;
  readonly currencyUsdBtn: Locator;
  readonly currencyThbBtn: Locator;
  readonly themeToggleBtn: Locator;
  readonly viewToggleTriggerBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoText = page.locator('.logo-text');
    this.viewToggleHoldingsBtn = page.locator('#view-toggle-holdings');
    this.viewToggleAllocationBtn = page.locator('#view-toggle-allocation');
    this.viewTogglePerformanceBtn = page.locator('#view-toggle-performance');
    this.viewToggleTransactionsBtn = page.locator('#view-toggle-transactions');
    this.viewToggleToolsBtn = page.locator('#view-toggle-tools');
    this.currencyUsdBtn = page.locator('#currency-usd');
    this.currencyThbBtn = page.locator('#currency-thb');
    this.themeToggleBtn = page.locator('#theme-toggle-btn');
    this.viewToggleTriggerBtn = page.locator('.view-toggle-trigger');
  }

  private isDesktop(): boolean {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width >= 640 : true;
  }

  async selectHoldingsView() {
    if (this.isDesktop()) {
      await this.viewToggleHoldingsBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleHoldingsBtn.click();
    }
  }

  async selectAllocationView() {
    if (this.isDesktop()) {
      await this.viewToggleAllocationBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleAllocationBtn.click();
    }
  }

  async selectPerformanceView() {
    if (this.isDesktop()) {
      await this.viewTogglePerformanceBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewTogglePerformanceBtn.click();
    }
  }

  async selectTransactionsView() {
    if (this.isDesktop()) {
      await this.viewToggleTransactionsBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleTransactionsBtn.click();
    }
  }

  async selectToolsView() {
    if (this.isDesktop()) {
      await this.viewToggleToolsBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleToolsBtn.click();
    }
  }

  async switchToUSD() {
    await this.currencyUsdBtn.click();
  }

  async switchToTHB() {
    await this.currencyThbBtn.click();
  }

  async toggleTheme() {
    await this.themeToggleBtn.click();
  }
}
