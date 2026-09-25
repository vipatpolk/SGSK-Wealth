import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly logoText: Locator;
  readonly viewToggleDashboardBtn: Locator;
  readonly viewToggleHoldingsBtn: Locator;
  readonly viewToggleAllocationBtn: Locator;
  readonly viewTogglePerformanceBtn: Locator;
  readonly viewToggleTransactionsBtn: Locator;
  readonly viewToggleToolsBtn: Locator;
  readonly currencyUsdBtn: Locator;
  readonly currencyThbBtn: Locator;
  readonly themeToggleBtn: Locator;
  readonly privacyToggleBtn: Locator;
  readonly viewToggleTriggerBtn: Locator;
  readonly sideNavCloseBtn: Locator;
  readonly sideNavBackdrop: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoText = page.locator('.logo-text');
    this.viewToggleDashboardBtn = page.locator('#view-toggle-dashboard');
    this.viewToggleHoldingsBtn = page.locator('#view-toggle-holdings');
    this.viewToggleAllocationBtn = page.locator('#view-toggle-allocation');
    this.viewTogglePerformanceBtn = page.locator('#view-toggle-performance');
    this.viewToggleTransactionsBtn = page.locator('#view-toggle-transactions');
    this.viewToggleToolsBtn = page.locator('#view-toggle-tools');
    this.currencyUsdBtn = page.locator('#currency-usd');
    this.currencyThbBtn = page.locator('#currency-thb');
    this.themeToggleBtn = page.locator('#theme-toggle-btn');
    this.privacyToggleBtn = page.locator('#privacy-toggle-btn');
    this.viewToggleTriggerBtn = page.locator('.view-toggle-trigger');
    this.sideNavCloseBtn = page.locator('#side-nav-close-btn');
    this.sideNavBackdrop = page.locator('.view-toggle-backdrop');
  }

  private isDesktop(): boolean {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width > 1200 : true;
  }

  async selectDashboardView() {
    await this.viewToggleDashboardBtn.click();
  }

  async selectHoldingsView() {
    await this.viewToggleHoldingsBtn.click();
  }

  async selectAllocationView() {
    await this.viewToggleAllocationBtn.click();
  }

  async selectPerformanceView() {
    await this.viewTogglePerformanceBtn.click();
  }

  async selectTransactionsView() {
    await this.viewToggleTransactionsBtn.click();
  }

  async selectToolsView() {
    await this.viewToggleToolsBtn.click();
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
