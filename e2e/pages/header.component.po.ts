import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly logoText: Locator;
  readonly viewToggleHoldingsBtn: Locator;
  readonly viewToggleAllocationBtn: Locator;
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
    this.viewToggleTransactionsBtn = page.locator('#view-toggle-transactions');
    this.currencyUsdBtn = page.locator('#currency-usd');
    this.currencyThbBtn = page.locator('#currency-thb');
    this.themeToggleBtn = page.locator('#theme-toggle-btn');
    this.viewToggleTriggerBtn = page.locator('.view-toggle-trigger');
  }

  async selectHoldingsView() {
    if (await this.viewToggleHoldingsBtn.isVisible()) {
      await this.viewToggleHoldingsBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleHoldingsBtn.click();
    }
  }

  async selectAllocationView() {
    if (await this.viewToggleAllocationBtn.isVisible()) {
      await this.viewToggleAllocationBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleAllocationBtn.click();
    }
  }

  async selectTransactionsView() {
    if (await this.viewToggleTransactionsBtn.isVisible()) {
      await this.viewToggleTransactionsBtn.click();
    } else {
      await this.viewToggleTriggerBtn.click();
      await this.viewToggleTransactionsBtn.click();
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
