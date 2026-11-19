import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  ASSET_TABS,
  AnalyticsSubTab,
  AssetTab,
  HoldingsSubTab,
} from '@shared/config/asset.constants';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';
import { FactsheetRequestTarget } from '@shared/models/factsheet.model';
import {
  ClosedPortfolioPosition,
  PortfolioHoldingsResponse,
  PortfolioPosition,
} from '@shared/models/portfolio.model';
import { ToolId } from '@shared/models/tools.model';
import {
  ClosedSymbolSummary,
  SymbolSummary,
  SymbolTransactionSummary,
  Transaction,
} from '@shared/models/transaction.model';
import { AuthService } from '@shared/services/auth.service';
import { DividendService } from '@shared/services/dividend.service';
import { I18nService } from '@shared/services/i18n.service';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';
import { PortfolioService } from '@shared/services/portfolio.service';
import { PriceData, PriceService } from '@shared/services/price.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { convertCurrency, getAssetTypeLabel, getSymbolName } from '@shared/utils/format.utils';
import { NativePlatformService } from './native-platform.service';

@Injectable({
  providedIn: 'root',
})
export class MobileStateService {
  private readonly portfolioService = inject(PortfolioService);
  private readonly priceService = inject(PriceService);
  private readonly dividendService = inject(DividendService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly userSettings = inject(UserSettingsService);
  readonly localPortfolioService = inject(LocalPortfolioService);
  readonly i18n = inject(I18nService);
  readonly nativePlatform = inject(NativePlatformService);

  readonly tabs = ASSET_TABS;
  readonly activeTab = signal<AssetTab>(ASSET_TABS[0]);
  readonly holdingsSubTab = signal<HoldingsSubTab>('market');
  readonly analyticsSubTab = signal<AnalyticsSubTab>('overview');
  readonly selectedToolId = signal<ToolId>('avg-cost-calculator');
  readonly selectedHistorySymbol = signal<string>('');
  readonly activeFactsheetTarget = signal<FactsheetRequestTarget | null>(null);

  readonly isUserSettingsOpen = signal<boolean>(false);
  readonly isLocalPortfolioOpen = signal<boolean>(false);
  readonly isAuthModalManualOpen = signal<boolean>(false);
  readonly shouldShowAuthGate = computed<boolean>(
    () => this.authService.showAuthGate() || this.isAuthModalManualOpen()
  );

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly portfolioData = signal<PortfolioHoldingsResponse | null>(null);
  readonly dividendData = signal<PortfolioDividendResponse | null>(null);
  readonly dividendLoading = signal<boolean>(false);
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly pricesLoading = signal<boolean>(false);
  readonly cachedPvdPositions = signal<PortfolioPosition[]>([]);

  readonly displayCurrency = this.userSettings.displayCurrency;
  readonly exchangeRate = signal<number>(0);
  readonly theme = this.userSettings.theme;
  readonly privacyMode = this.userSettings.privacyMode;

  private prevCurrency: 'USD' | 'THB' | null = null;
  private prevSource: 'cloud' | 'local' | null = null;
  private hasLoadedInitial = false;
  private lastLocalTx: unknown = null;
  private lastLocalPrices: unknown = null;
  private lastLocalRate: number | null = null;
  private lastLocalLang: string | null = null;
  private readonly tabCache = new Map<
    string,
    { portfolioData: PortfolioHoldingsResponse; prices: Map<string, PriceData>; timestamp: number }
  >();

  readonly isClosedTab = computed(() => this.activeTab().id === 'closed-position');
  readonly isAllTab = computed(() => this.activeTab().id === 'all');
  readonly isPvdTab = computed(
    () => this.holdingsSubTab() === 'pvd' || this.activeTab().id === 'provident-fund'
  );
  readonly hasRate = computed(() => this.exchangeRate() > 0);

  readonly pvdPositions = computed<PortfolioPosition[]>(() => {
    const live = this.localizedPortfolioData()?.openPositions ?? [];
    const livePvd = live.filter((p) => p.assetType === 'provident-fund');
    if (livePvd.length > 0) return livePvd;
    const lang = this.i18n.lang();
    const pricesMap = this.prices();
    return this.cachedPvdPositions().map((p) => {
      const nameTh = p.nameTh || pricesMap.get(p.symbol)?.nameTh || '';
      return {
        ...p,
        nameTh,
        name: getSymbolName(p.symbol, p.name || '', lang, nameTh, p.assetType),
        assetTypeLabel: getAssetTypeLabel(p.assetType, p.symbol, lang),
      };
    });
  });

  readonly localizedPortfolioData = computed<PortfolioHoldingsResponse | null>(() => {
    const data = this.portfolioData();
    if (!data) return null;
    const lang = this.i18n.lang();
    const pricesMap = this.prices();
    return {
      ...data,
      openPositions: (data.openPositions || []).map((p) => {
        const nameTh = p.nameTh || pricesMap.get(p.symbol)?.nameTh || '';
        return {
          ...p,
          nameTh,
          name: getSymbolName(p.symbol, p.name || '', lang, nameTh, p.assetType),
          assetTypeLabel: getAssetTypeLabel(p.assetType, p.symbol, lang),
        };
      }),
      closedPositions: (data.closedPositions || []).map((c) => {
        const nameTh = c.nameTh || pricesMap.get(c.symbol)?.nameTh || '';
        return {
          ...c,
          nameTh,
          name: getSymbolName(c.symbol, c.name || '', lang, nameTh, c.assetType),
          assetTypeLabel: getAssetTypeLabel(c.assetType, c.symbol, lang),
        };
      }),
    };
  });

  readonly localizedDividendData = computed<PortfolioDividendResponse | null>(() => {
    const data = this.dividendData();
    if (!data) return null;
    const lang = this.i18n.lang();
    const pricesMap = this.prices();
    return {
      ...data,
      assetTypeSummaries: (data.assetTypeSummaries || []).map((a) => ({
        ...a,
        assetTypeLabel: getAssetTypeLabel(a.assetType, undefined, lang),
      })),
      symbolSummaries: (data.symbolSummaries || []).map((s) => {
        const nameTh = s.nameTh || pricesMap.get(s.symbol)?.nameTh || '';
        return {
          ...s,
          nameTh,
          name: getSymbolName(s.symbol, s.name || '', lang, nameTh, s.assetType),
          assetTypeLabel: getAssetTypeLabel(s.assetType, s.symbol, lang),
        };
      }),
      records: (data.records || []).map((r) => ({
        ...r,
        assetTypeLabel: getAssetTypeLabel(r.assetType, r.symbol, lang),
      })),
    };
  });

  readonly openSummaries = computed<SymbolSummary[]>(() => {
    const data = this.localizedPortfolioData();
    if (!data) return [];
    return data.openPositions.map((p) => ({
      symbol: p.symbol,
      displaySymbol: p.displaySymbol,
      name: p.name,
      totalShares: p.totalShares,
      totalCost: p.totalCost,
      averageCost: p.averageCost,
      currency: p.currency,
      assetType: p.assetType,
      employeeShares: p.employeeShares,
      employerShares: p.employerShares,
      pvdFundName: p.pvdFundName,
      lots: p.lots.map((l) => ({
        symbol: p.symbol,
        purchaseDate: l.purchaseDate,
        quantity: l.quantity,
        costBasis: l.costBasis,
        totalCost: l.totalCost,
        assetType: l.assetType,
      })),
    }));
  });

  readonly closedSummaries = computed<ClosedSymbolSummary[]>(() => {
    const data = this.localizedPortfolioData();
    if (!data) return [];
    return data.closedPositions.map((c) => ({
      symbol: c.symbol,
      displaySymbol: c.displaySymbol,
      name: c.name,
      totalShares: 0,
      closedShares: c.closedShares,
      totalCost: c.totalCost,
      totalProceeds: c.totalProceeds,
      realizedPL: c.realizedPL,
      realizedPLPercent: c.realizedPLPercent,
      averageBuyPrice: c.averageBuyPrice,
      averageSellPrice: c.averageSellPrice,
      currency: c.currency,
      assetType: c.assetType,
      lots: c.lots,
    }));
  });

  readonly transactionSummaries = computed<SymbolTransactionSummary[]>(
    () => this.portfolioData()?.transactionSummaries ?? []
  );

  readonly rawTransactions = computed<Transaction[]>(
    () => this.portfolioData()?.rawTransactions ?? []
  );

  readonly totalLots = computed<number>(() => {
    const open = this.portfolioData()?.openPositions ?? [];
    return open.reduce((acc, p) => acc + (p.lots?.length ?? 0), 0);
  });

  readonly tabCounts = computed<Record<string, number>>(() => {
    const data = this.portfolioData();
    if (!data) return {};
    const open = data.openPositions || [];
    const closed = data.closedPositions || [];
    const counts: Record<string, number> = {
      all: open.length,
      'closed-position': closed.length,
    };
    for (const pos of open) {
      const type = pos.assetType || 'us-stock';
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  });

  readonly totalCostConverted = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    const cost = this.isClosedTab()
      ? data.summary.closedInvested ??
        data.closedPositions.reduce((acc, c) => acc + c.totalCost, 0)
      : data.summary.openInvested ?? data.openPositions.reduce((acc, p) => acc + p.totalCost, 0);
    return convertCurrency(cost, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalHoldingConverted = computed<number>(() => {
    if (this.isClosedTab()) return 0;
    const data = this.portfolioData();
    if (!data) return 0;
    return convertCurrency(
      data.summary.totalValue || 0,
      data.currency,
      this.displayCurrency(),
      this.exchangeRate()
    );
  });

  readonly totalRealizedPLConverted = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    return convertCurrency(
      data.summary.totalRealizedPL || 0,
      data.currency,
      this.displayCurrency(),
      this.exchangeRate()
    );
  });

  readonly totalRealizedPLPercent = computed<number>(
    () => this.portfolioData()?.summary.totalRealizedPLPercent ?? 0
  );

  readonly totalPL = computed<number>(() => {
    if (this.isClosedTab()) return this.totalRealizedPLConverted();
    const data = this.portfolioData();
    if (!data) return 0;
    return convertCurrency(
      data.summary.totalUnrealizedPL || 0,
      data.currency,
      this.displayCurrency(),
      this.exchangeRate()
    );
  });

  readonly totalPLPercent = computed<number>(() => {
    if (this.isClosedTab()) return this.totalRealizedPLPercent();
    return this.portfolioData()?.summary.totalUnrealizedPLPercent ?? 0;
  });

  readonly secondaryCurrencyLabel = computed<'USD' | 'THB'>(() =>
    this.displayCurrency() === 'THB' ? 'USD' : 'THB'
  );

  readonly secondaryNetValue = computed<number | null>(() => {
    const rate = this.exchangeRate();
    if (!this.hasRate() || rate <= 0) return null;
    const primary =
      this.totalHoldingConverted() > 0 ? this.totalHoldingConverted() : this.totalCostConverted();
    return this.displayCurrency() === 'THB' ? primary / rate : primary * rate;
  });

  readonly loaderState = computed(() => {
    const tabLabel = this.getTabLabelText(this.activeTab());
    if (this.pricesLoading()) {
      return {
        tag: this.i18n.t('loading.tag.marketSync'),
        title: this.i18n.t('loading.titleTab', { tab: tabLabel }),
        subtitle: this.i18n.t('loading.sub.marketSync'),
      };
    }
    if (this.isAllTab()) {
      return {
        tag: this.i18n.t('loading.tag.fifoEngine'),
        title: this.i18n.t('loading.titleTab', { tab: tabLabel }),
        subtitle: this.i18n.t('loading.sub.allTab'),
      };
    }
    if (this.isClosedTab()) {
      return {
        tag: this.i18n.t('loading.tag.realizedLedger'),
        title: this.i18n.t('loading.titleTab', { tab: tabLabel }),
        subtitle: this.i18n.t('loading.sub.closedTab'),
      };
    }
    return {
      tag: this.i18n.t('loading.tag.snapshot'),
      title: this.i18n.t('loading.titleTab', { tab: tabLabel }),
      subtitle: this.i18n.t('loading.sub.default'),
    };
  });

  constructor() {
    void this.initMobileAuthAndStorage();
    this.syncInitialSourceIfReady();

    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.isAuthModalManualOpen.set(false);
      }
    });

    effect(() => {
      if (this.authService.initialized() && this.authService.pendingSettingsReopen()) {
        this.isUserSettingsOpen.set(true);
        this.authService.consumePendingSettingsReopen();
      }
    });

    effect(() => {
      const currentTheme = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.documentElement.classList.toggle('ion-palette-dark', currentTheme === 'dark');
      }
      void this.nativePlatform.syncStatusBar(currentTheme);
    });

    effect(() => {
      this.syncInitialSourceIfReady();
    });

    effect(() => {
      if (
        !this.authService.initialized() ||
        this.authService.showAuthGate() ||
        this.authService.activeDataSource() !== 'local'
      ) {
        return;
      }

      const tx = this.localPortfolioService.transactions();
      const pr = this.localPortfolioService.prices();
      const rt = this.localPortfolioService.exchangeRate();
      const ln = this.i18n.lang();

      if (
        this.hasLoadedInitial &&
        (tx !== this.lastLocalTx ||
          pr !== this.lastLocalPrices ||
          rt !== this.lastLocalRate ||
          ln !== this.lastLocalLang)
      ) {
        this.lastLocalTx = tx;
        this.lastLocalPrices = pr;
        this.lastLocalRate = rt;
        this.lastLocalLang = ln;
        untracked(() => this.applyLocalData(this.activeTab(), this.displayCurrency()));
      }
    });

    effect(() => {
      const data = this.portfolioData();
      if (!data) return;
      const pvdOnly = data.openPositions.filter((p) => p.assetType === 'provident-fund');
      if (pvdOnly.length > 0 || data.tabId === 'provident-fund' || data.tabId === 'all') {
        this.cachedPvdPositions.set(pvdOnly);
      }
    });

    effect(() => {
      const curr = this.displayCurrency();
      if (
        this.authService.initialized() &&
        !this.authService.showAuthGate() &&
        this.hasLoadedInitial &&
        this.prevCurrency !== null &&
        this.prevCurrency !== curr
      ) {
        this.prevCurrency = curr;
        untracked(() => this.syncCurrencyChange(curr));
      }
    });
  }

  private async initMobileAuthAndStorage(): Promise<void> {
    await Promise.all([this.authService.initialize(), this.localPortfolioService.initialize()]);
    await this.nativePlatform.hideSplashScreen();
  }

  private syncInitialSourceIfReady(): void {
    if (!this.authService.initialized() || this.authService.showAuthGate()) {
      this.loading.set(false);
      return;
    }

    const source = this.authService.activeDataSource();
    const curr = this.displayCurrency();

    if (!this.hasLoadedInitial || this.prevSource !== source) {
      this.prevSource = source;
      this.hasLoadedInitial = true;
      this.prevCurrency = curr;
      this.lastLocalTx = this.localPortfolioService.transactions();
      this.lastLocalPrices = this.localPortfolioService.prices();
      this.lastLocalRate = this.localPortfolioService.exchangeRate();
      this.lastLocalLang = this.i18n.lang();
      untracked(() => {
        this.tabCache.clear();
        this.loadTab(this.activeTab(), curr);
        this.loadDividendData(curr);
      });
    }
  }

  private applyLocalData(tab: AssetTab, currency: 'USD' | 'THB'): void {
    const lang = this.i18n.lang();
    const holdings = this.localPortfolioService.getHoldings(tab.id, currency, lang);
    const dividends = this.localPortfolioService.getDividends(currency, lang);
    this.error.set(null);
    this.portfolioData.set(holdings);
    this.dividendData.set(dividends);
    this.prices.set(new Map(this.localPortfolioService.prices()));
    this.exchangeRate.set(
      holdings.exchangeRate > 0 ? holdings.exchangeRate : this.localPortfolioService.exchangeRate()
    );
    this.loading.set(false);
    this.dividendLoading.set(false);
    this.pricesLoading.set(this.localPortfolioService.pricesLoading());
  }

  openUserSettings(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.isUserSettingsOpen.set(true);
  }

  closeUserSettings(): void {
    this.isUserSettingsOpen.set(false);
  }

  openLocalPortfolio(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.isLocalPortfolioOpen.set(true);
  }

  closeLocalPortfolio(): void {
    this.isLocalPortfolioOpen.set(false);
  }

  openAuthModal(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.isAuthModalManualOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalManualOpen.set(false);
  }

  onLocalPortfolioChanged(): void {
    if (this.authService.activeDataSource() === 'local') {
      this.applyLocalData(this.activeTab(), this.displayCurrency());
      if (this.localPortfolioService.hasTransactions()) {
        this.localPortfolioService.refreshMarketPrices().subscribe();
      }
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.tabCache.clear();
    this.portfolioData.set(null);
    this.dividendData.set(null);
    this.cachedPvdPositions.set([]);
    this.hasLoadedInitial = false;
    this.prevSource = null;
    this.isUserSettingsOpen.set(false);
    this.isLocalPortfolioOpen.set(false);
    this.isAuthModalManualOpen.set(false);
  }

  private getTabLabelText(tab: AssetTab): string {
    switch (tab.id) {
      case 'all':
        return this.i18n.t('tab.allHoldings');
      case 'us-stock':
        return this.i18n.t('tab.usStock');
      case 'thai-stock':
        return this.i18n.t('tab.thaiStock');
      case 'mutual-fund':
        return this.i18n.t('tab.mutualFund');
      case 'crypto':
        return this.i18n.t('tab.crypto');
      case 'bond':
        return this.i18n.t('tab.bond');
      case 'provident-fund':
        return this.i18n.t('tab.pvd');
      case 'closed-position':
        return this.i18n.t('tab.closed');
      default:
        return tab.label;
    }
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.userSettings.setTheme(theme);
  }

  toggleTheme(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.userSettings.toggleTheme();
  }

  setPrivacyMode(privacy: boolean): void {
    this.userSettings.setPrivacyMode(privacy);
  }

  togglePrivacyMode(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.userSettings.togglePrivacyMode();
  }

  toggleCurrency(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.userSettings.toggleCurrency();
  }

  toggleLang(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.userSettings.toggleLang();
  }

  selectTab(tab: AssetTab): void {
    if (this.activeTab().id === tab.id && this.portfolioData()) return;
    this.activeTab.set(tab);
    this.loadTab(tab, this.displayCurrency());
  }

  selectHoldingsSubTab(subTab: HoldingsSubTab): void {
    this.holdingsSubTab.set(subTab);
    if (subTab === 'pvd') {
      const pvdTab = ASSET_TABS.find((t) => t.id === 'provident-fund');
      if (pvdTab) this.selectTab(pvdTab);
      return;
    }
    if (this.activeTab().id === 'provident-fund') {
      this.selectTab(ASSET_TABS[0]);
    }
  }

  navigateToHoldings(pvd = false): void {
    void this.nativePlatform.triggerHapticSelection();
    this.selectHoldingsSubTab(pvd ? 'pvd' : 'market');
    void this.router.navigateByUrl('/holdings');
  }

  navigateToAnalytics(subTab: AnalyticsSubTab = 'overview'): void {
    void this.nativePlatform.triggerHapticSelection();
    this.analyticsSubTab.set(subTab);
    void this.router.navigateByUrl('/analytics');
  }

  navigateToTransactions(symbol = ''): void {
    void this.nativePlatform.triggerHapticSelection();
    this.selectedHistorySymbol.set(symbol);
    void this.router.navigateByUrl('/transactions');
  }

  navigateToTool(toolId: ToolId): void {
    void this.nativePlatform.triggerHapticSelection();
    this.selectedToolId.set(toolId);
    void this.router.navigateByUrl('/tools');
  }

  refresh(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    if (this.authService.activeDataSource() === 'local') {
      this.applyLocalData(this.activeTab(), this.displayCurrency());
      this.localPortfolioService.refreshMarketPrices().subscribe();
      return;
    }
    this.tabCache.delete(`${this.activeTab().id}::${this.displayCurrency()}`);
    this.loadTab(this.activeTab(), this.displayCurrency(), true);
    this.loadDividendData(this.displayCurrency());
  }

  loadTab(tab: AssetTab, currency: 'USD' | 'THB', forceRefresh = false): void {
    if (this.authService.activeDataSource() === 'local') {
      this.applyLocalData(tab, currency);
      if (this.localPortfolioService.hasTransactions()) {
        this.localPortfolioService.refreshMarketPrices().subscribe();
      }
      return;
    }

    const cacheKey = `${tab.id}::${currency}`;
    const cached = this.tabCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 60000) {
      this.portfolioData.set(cached.portfolioData);
      this.prices.set(cached.prices);
      this.loading.set(false);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.portfolioService.fetchHoldings(tab.id, currency).subscribe({
      next: (res) => {
        if (res.error) {
          this.error.set(res.error);
          this.loading.set(false);
          return;
        }
        this.portfolioData.set(res);
        if (res.exchangeRate > 0) {
          this.exchangeRate.set(res.exchangeRate);
        }
        this.loading.set(false);
        this.fetchMissingPrices(res, tab.id, currency);
      },
      error: (err) => {
        this.error.set(err?.message || 'Unable to load portfolio holdings.');
        this.loading.set(false);
      },
    });
  }

  private fetchMissingPrices(
    res: PortfolioHoldingsResponse,
    tabId: string,
    currency: 'USD' | 'THB'
  ): void {
    const positions = res.openPositions || [];
    if (positions.length === 0) return;

    this.pricesLoading.set(true);
    const summaries = positions.map((p) => ({ symbol: p.symbol, assetType: p.assetType }));
    this.priceService.fetchPricesAndRate(summaries).subscribe({
      next: ({ prices, rate }) => {
        this.prices.set(prices);
        if (rate > 0 && this.exchangeRate() <= 0) {
          this.exchangeRate.set(rate);
        }
        this.tabCache.set(`${tabId}::${currency}`, {
          portfolioData: res,
          prices,
          timestamp: Date.now(),
        });
        this.pricesLoading.set(false);
      },
      error: () => {
        this.pricesLoading.set(false);
      },
    });
  }

  loadDividendData(currency: 'USD' | 'THB' = this.displayCurrency()): void {
    if (this.authService.activeDataSource() === 'local') {
      this.dividendData.set(this.localPortfolioService.getDividends(currency, this.i18n.lang()));
      this.dividendLoading.set(false);
      return;
    }

    this.dividendLoading.set(true);
    this.dividendService.getDividendAnalytics(currency, 'all').subscribe({
      next: (res) => {
        if (!res.error) {
          this.dividendData.set(res);
        }
        this.dividendLoading.set(false);
      },
      error: () => {
        this.dividendLoading.set(false);
      },
    });
  }

  private syncCurrencyChange(currency: 'USD' | 'THB'): void {
    if (this.authService.activeDataSource() === 'local') {
      this.applyLocalData(this.activeTab(), currency);
      return;
    }

    if (this.portfolioData()) {
      this.portfolioService.fetchHoldings(this.activeTab().id, currency).subscribe({
        next: (res) => {
          if (!res.error) {
            this.portfolioData.set(res);
            if (res.exchangeRate > 0) {
              this.exchangeRate.set(res.exchangeRate);
            }
          }
        },
      });
    }
    if (this.dividendData()) {
      this.loadDividendData(currency);
    }
  }

  openFactsheetModal(target: FactsheetRequestTarget): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.activeFactsheetTarget.set(target);
  }

  closeFactsheetModal(): void {
    this.activeFactsheetTarget.set(null);
  }

  cx(amount: number, fromCurrency: string): number {
    return convertCurrency(amount, fromCurrency, this.displayCurrency(), this.exchangeRate());
  }

  dc(): string {
    return this.displayCurrency();
  }

  getClosedPositions(): ClosedPortfolioPosition[] {
    return this.localizedPortfolioData()?.closedPositions ?? [];
  }
}
