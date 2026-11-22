import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { ToolId } from '@shared/models/tools.model';
import { ApiFailure } from '@shared/models/api-result.model';
import { SheetResult } from '@shared/services/share-lot.service';
import { PriceData } from '@shared/services/price.service';
import { PortfolioSourceCoordinator } from '@shared/providers/portfolio-source.coordinator';
import {
  PortfolioHoldingsResponse,
  PortfolioPosition,
  ClosedPortfolioPosition,
  PortfolioHoldingLot,
} from '@shared/models/portfolio.model';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';
import {
  SymbolSummary,
  ClosedSymbolSummary,
  ShareLot,
  ClosedShareLot,
} from '@shared/models/transaction.model';
import { AssetTab, ASSET_TABS, AppView, AnalyticsSubTab, HoldingsSubTab } from '@shared/config/asset.constants';
import { FactsheetRequestTarget } from '@shared/models/factsheet.model';
import { AuthService } from '@shared/services/auth.service';
import { UserSettingsService } from '@shared/services/user-settings.service';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';
import { AppLang, I18nService } from '@shared/services/i18n.service';
import { SymbolAutocompleteItem } from '@app/features/search/symbol-autocomplete-item.model';
import { filterAndSortClosedPositions, filterAndSortOpenPositions } from '@sgsk-wealth/domain';
import {
  getQuantityFormat,
  displaySymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  resolveSymbolName,
  convertCurrency,
  getAssetTypeLabel,
  getAssetTypeClass,
  generateAssetTypeOptions,
} from '@shared/utils/format.utils';

@Injectable({ providedIn: 'root' })
export class AppStateFacade {
  readonly getSymbolColorFn = (symbol: string) => this.getSymbolColor(symbol);
  readonly getDisplaySymbolFn = (symbol: string) => this.getDisplaySymbol(symbol);
  readonly getSymbolNameFn = (symbol: string, rawName?: string) =>
    this.getSymbolName(symbol, rawName);
  readonly getAssetTypeClassFn = (assetType?: string, symbol?: string) =>
    this.getAssetTypeClass(assetType, symbol);
  readonly getAssetTypeLabelFn = (assetType?: string, symbol?: string) =>
    this.getAssetTypeLabel(assetType, symbol);
  readonly getQuantityFormatFn = (symbol: string, assetType?: string) =>
    this.getQuantityFormat(symbol, assetType);
  readonly getPriceFormatFn = (symbol: string, assetType?: string) =>
    this.getPriceFormat(symbol, assetType);
  readonly cxFn = (amount: number, fromCurrency: string) => this.cx(amount, fromCurrency);
  readonly dcFn = (originalCurrency?: string) => this.dc(originalCurrency);
  readonly getCurrentPriceConvertedFn = (summary: PortfolioPosition | SymbolSummary) =>
    this.getCurrentPriceConverted(summary);
  readonly getHoldingValueFn = (summary: PortfolioPosition | SymbolSummary) =>
    this.getHoldingValue(summary);
  readonly getUnrealizedPLFn = (summary: PortfolioPosition | SymbolSummary) =>
    this.getUnrealizedPL(summary);
  readonly getUnrealizedPLPercentFn = (summary: PortfolioPosition | SymbolSummary) =>
    this.getUnrealizedPLPercent(summary);
  readonly getLotHoldingValueFn = (
    lot: PortfolioHoldingLot | ShareLot,
    summary: PortfolioPosition | SymbolSummary,
  ) => this.getLotHoldingValue(lot, summary);
  readonly getLotUnrealizedPLFn = (
    lot: PortfolioHoldingLot | ShareLot,
    summary: PortfolioPosition | SymbolSummary,
  ) => this.getLotUnrealizedPL(lot, summary);
  readonly portfolioCoordinator = inject(PortfolioSourceCoordinator);
  readonly authService = inject(AuthService);
  readonly userSettings = inject(UserSettingsService);
  readonly localPortfolioService = inject(LocalPortfolioService);
  readonly i18n = inject(I18nService);

  readonly tabs = ASSET_TABS;
  readonly activeTab = signal<AssetTab>(ASSET_TABS[0]);

  /** View Mode: Dashboard vs Holdings / Positions vs Transactions History vs Allocation vs Dividends vs Tools */
  readonly currentView = signal<AppView>('dashboard');
  readonly analyticsSubTab = signal<AnalyticsSubTab>('overview');
  readonly holdingsSubTab = signal<HoldingsSubTab>('market');
  readonly cachedPvdPositions = signal<PortfolioPosition[]>([]);
  readonly selectedToolId = signal<ToolId>('avg-cost-calculator');
  readonly selectedHistorySymbol = signal<string>('');
  readonly activeFactsheetTarget = signal<FactsheetRequestTarget | null>(null);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly apiError = signal<ApiFailure | null>(null);
  readonly portfolioData = signal<PortfolioHoldingsResponse | null>(null);
  readonly dividendData = signal<PortfolioDividendResponse | null>(null);
  readonly dividendError = signal<ApiFailure | null>(null);
  readonly dividendLoading = signal<boolean>(false);
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly pricesLoading = signal(false);

  /** Currency conversion */
  readonly displayCurrency = this.userSettings.displayCurrency;
  readonly exchangeRate = signal<number>(0);

  /** Theme (dark/light) */
  readonly theme = this.userSettings.theme;

  /** Privacy Mode (Hide sensitive amounts & shares) */
  readonly privacyMode = this.userSettings.privacyMode;

  private static readonly SIDEBAR_COLLAPSED_STORAGE_KEY = 'sgsk_wealth_sidebar_collapsed';
  readonly isSidebarCollapsed = signal<boolean>(this.readInitialSidebarCollapsed());

  private readInitialSidebarCollapsed(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(AppStateFacade.SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
    return false;
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AppStateFacade.SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-sidebar-collapsed', String(collapsed));
      }
    } catch {
      // Ignore storage/DOM errors
    }
  }

  toggleSidebarCollapsed(): void {
    this.setSidebarCollapsed(!this.isSidebarCollapsed());
  }

  readonly isUserSettingsOpen = signal<boolean>(false);
  readonly isLocalPortfolioModalOpen = signal<boolean>(false);
  readonly isAuthScreenManualOpen = signal<boolean>(false);
  readonly shouldShowAuthScreen = computed<boolean>(
    () => this.authService.showAuthGate() || this.isAuthScreenManualOpen(),
  );

  readonly expandedSymbols = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isSearchDropdownOpen = signal<boolean>(false);
  readonly searchActiveIndex = signal<number>(-1);

  readonly sortField = signal<string>('totalCost');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedClosedAssetType = signal<string>('all');

  readonly isTabDropdownOpen = signal<boolean>(false);
  readonly isMobileSortDropdownOpen = signal<boolean>(false);
  readonly isMobileFilterDropdownOpen = signal<boolean>(false);

  toggleTabDropdown(): void {
    this.isTabDropdownOpen.set(!this.isTabDropdownOpen());
  }

  toggleMobileSortDropdown(): void {
    this.isMobileSortDropdownOpen.set(!this.isMobileSortDropdownOpen());
  }

  toggleMobileFilterDropdown(): void {
    this.isMobileFilterDropdownOpen.set(!this.isMobileFilterDropdownOpen());
  }

  readonly isClosedTab = computed<boolean>(() => this.activeTab().id === 'closed-position');
  readonly isAllTab = computed<boolean>(() => this.activeTab().id === 'all');
  readonly isPvdTab = computed<boolean>(
    () => this.holdingsSubTab() === 'pvd' || this.activeTab().id === 'provident-fund'
  );
  readonly pvdPositions = computed<PortfolioPosition[]>(() => {
    const live = this.portfolioData()?.openPositions ?? [];
    const livePvd = live.filter((p) => p.assetType === 'provident-fund');
    if (livePvd.length > 0) {
      return livePvd;
    }
    return this.cachedPvdPositions();
  });

  private readonly syncPvdCache = effect(() => {
    const data = this.portfolioData();
    if (!data) return;
    const pvdOnly = data.openPositions.filter((p) => p.assetType === 'provident-fund');
    if (pvdOnly.length > 0 || data.tabId === 'provident-fund' || data.tabId === 'all') {
      this.cachedPvdPositions.set(pvdOnly);
    }
  });

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

  openTransactionHistory(symbol: string = ''): void {
    this.selectedHistorySymbol.set(symbol);
    this.currentView.set('transactions');
    if (this.activeTab().id !== 'all') {
      this.selectTab(ASSET_TABS[0]);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openDashboardView(): void {
    this.setView('dashboard');
  }

  openHoldingsView(): void {
    this.setView('holdings');
  }

  openPvdHoldingsView(): void {
    this.currentView.set('holdings');
    this.selectHoldingsSubTab('pvd');
  }

  selectHoldingsSubTab(subTab: HoldingsSubTab): void {
    this.holdingsSubTab.set(subTab);
    if (subTab === 'pvd') {
      const pvdTab = ASSET_TABS.find((t) => t.id === 'provident-fund');
      if (pvdTab) {
        this.selectTab(pvdTab);
      }
      return;
    }
    if (this.activeTab().id === 'provident-fund') {
      this.selectTab(ASSET_TABS[0]);
    }
  }

  navigateToTool(toolId: ToolId): void {
    this.selectedToolId.set(toolId);
    this.setView('tools');
  }

  openFactsheetModal(target: FactsheetRequestTarget): void {
    this.activeFactsheetTarget.set(target);
  }

  closeFactsheetModal(): void {
    this.activeFactsheetTarget.set(null);
  }

  setView(view: AppView, subTab?: AnalyticsSubTab): void {
    if (view === 'allocation') {
      this.currentView.set('analytics');
      this.analyticsSubTab.set('allocation');
    } else if (view === 'performance') {
      this.currentView.set('analytics');
      this.analyticsSubTab.set('performance');
    } else if (view === 'analytics') {
      this.currentView.set('analytics');
      if (subTab) {
        this.analyticsSubTab.set(subTab);
      }
    } else {
      this.currentView.set(view);
    }

    if (view !== 'holdings') {
      if (view === 'transactions') {
        this.selectedHistorySymbol.set('');
      }
      this.selectTab(ASSET_TABS[0]);
    }
    if (view === 'dividends' || view === 'dashboard') {
      this.loadDividendData();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Adapter for result signal to maintain backward compatibility with components */
  readonly result = computed<SheetResult | null>(() => {
    const data = this.localizedPortfolioData();
    if (!data) return null;

    const summaries: SymbolSummary[] = data.openPositions.map((p) => ({
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

    const closedSummaries: ClosedSymbolSummary[] = data.closedPositions.map((c) => ({
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

    return {
      summaries,
      closedSummaries,
      transactionSummaries: data.transactionSummaries,
      rawTransactions: data.rawTransactions,
      totalCostByCurrency: { [data.currency]: data.summary.totalInvested },
      totalProceedsByCurrency: { [data.currency]: data.summary.totalValue },
      totalRealizedPLByCurrency: { [data.currency]: data.summary.totalRealizedPL },
      totalSymbols: summaries.length + closedSummaries.length,
      totalLots: summaries.reduce((acc, s) => acc + s.lots.length, 0),
      error: data.error,
      isClosed: this.isClosedTab(),
    };
  });

  readonly closedAssetTypeOptions = computed(() => {
    const data = this.portfolioData();
    const list = data?.closedPositions || [];
    return generateAssetTypeOptions(list, this.i18n.lang());
  });

  readonly sortOptions = computed(() => {
    this.i18n.lang();
    if (this.isClosedTab()) {
      return [
        { field: 'symbol', label: this.i18n.t('common.symbol') },
        { field: 'pl', label: this.i18n.t('holdings.sort.realizedPlPct') },
        { field: 'realizedPL', label: this.i18n.t('holdings.sort.realizedPlAmt') },
        { field: 'totalCost', label: this.i18n.t('common.totalCost') },
        { field: 'totalProceeds', label: this.i18n.t('summary.totalProceeds') },
        { field: 'closedShares', label: this.i18n.t('holdings.sort.closedShares') },
      ];
    }
    return [
      { field: 'symbol', label: this.i18n.t('common.symbol') },
      { field: 'totalCost', label: this.i18n.t('common.totalCost') },
      { field: 'avgCost', label: this.i18n.t('common.avgCost') },
      { field: 'holdingValue', label: this.i18n.t('summary.holdingValue') },
      { field: 'pl', label: this.i18n.t('holdings.sort.plPctShort') },
    ];
  });

  readonly totalCostConverted = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    const target = this.displayCurrency();
    const serverCurr = data.currency;
    const rate = this.exchangeRate();

    let cost = 0;
    if (this.isClosedTab()) {
      cost =
        data.summary.closedInvested ??
        data.closedPositions.reduce((acc, c) => acc + c.totalCost, 0);
    } else {
      cost =
        data.summary.openInvested ?? data.openPositions.reduce((acc, p) => acc + p.totalCost, 0);
    }
    return convertCurrency(cost, serverCurr, target, rate);
  });

  readonly totalProceedsConverted = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    const proceeds = data.closedPositions.reduce((acc, c) => acc + c.totalProceeds, 0);
    return convertCurrency(proceeds, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalRealizedPLConverted = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    const pl = data.summary.totalRealizedPL || 0;
    return convertCurrency(pl, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalRealizedPLPercent = computed<number>(() => {
    return this.portfolioData()?.summary.totalRealizedPLPercent || 0;
  });

  readonly totalHoldingConverted = computed<number>(() => {
    if (this.isClosedTab()) return 0;
    const data = this.portfolioData();
    if (!data) return 0;
    const val = data.summary.totalValue || 0;
    return convertCurrency(val, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalPL = computed<number>(() => {
    if (this.isClosedTab()) {
      return this.totalRealizedPLConverted();
    }
    const data = this.portfolioData();
    if (!data) return 0;
    const pl = data.summary.totalUnrealizedPL || 0;
    return convertCurrency(pl, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalPLPercent = computed<number>(() => {
    if (this.isClosedTab()) {
      return this.totalRealizedPLPercent();
    }
    return this.portfolioData()?.summary.totalUnrealizedPLPercent || 0;
  });

  readonly hasRate = computed<boolean>(() => this.exchangeRate() > 0);

  private prevCurrency: 'USD' | 'THB' | null = null;
  private prevSource: 'cloud' | 'local' | null = null;
  private hasLoadedInitial = false;
  private lastLocalTx: unknown = null;
  private lastLocalPrices: unknown = null;
  private lastLocalRate: number | null = null;
  private lastLocalLang: string | null = null;

  private syncInitialSourceIfReady(): void {
    if (!this.authService.initialized() || this.authService.showAuthGate()) {
      this.loading.set(false);
      return;
    }

    const source = this.portfolioCoordinator.activeSource();
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
        this.portfolioCoordinator.clearCache();
        this.loadTab(this.activeTab(), curr);
        this.loadDividendData(curr);
      });
    }
  }

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-sidebar-collapsed',
        String(this.isSidebarCollapsed()),
      );
    }
    void this.authService.initialize();
    void this.localPortfolioService.initialize();

    this.syncInitialSourceIfReady();

    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.isAuthScreenManualOpen.set(false);
      }
    });

    effect(() => {
      if (this.authService.initialized() && this.authService.pendingSettingsReopen()) {
        this.isUserSettingsOpen.set(true);
        this.authService.consumePendingSettingsReopen();
      }
    });

    effect(() => {
      this.syncInitialSourceIfReady();
    });

    effect(() => {
      if (
        !this.authService.initialized() ||
        this.authService.showAuthGate() ||
        this.portfolioCoordinator.activeSource() !== 'local'
      ) {
        return;
      }

      // Reactive dependencies for local portfolio recomputation
      const tx = this.localPortfolioService.transactions();
      const pr = this.localPortfolioService.prices();
      const rt = this.localPortfolioService.exchangeRate();
      const ln = this.i18n.lang();

      if (
        this.hasLoadedInitial &&
        (tx !== this.lastLocalTx || pr !== this.lastLocalPrices || rt !== this.lastLocalRate || ln !== this.lastLocalLang)
      ) {
        this.lastLocalTx = tx;
        this.lastLocalPrices = pr;
        this.lastLocalRate = rt;
        this.lastLocalLang = ln;
        untracked(() => {
          this.applyLocalData(this.activeTab(), this.displayCurrency());
        });
      }
    });

    // Seamless, non-blocking background synchronization on currency toggle
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
        untracked(() => {
          this.syncCurrencyChange(curr);
        });
      }
    });
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
    this.isUserSettingsOpen.set(true);
  }

  closeUserSettings(): void {
    this.isUserSettingsOpen.set(false);
  }

  openLocalPortfolioModal(): void {
    this.isLocalPortfolioModalOpen.set(true);
  }

  closeLocalPortfolioModal(): void {
    this.isLocalPortfolioModalOpen.set(false);
  }

  onLocalPortfolioChanged(): void {
    if (this.portfolioCoordinator.activeSource() === 'local') {
      this.applyLocalData(this.activeTab(), this.displayCurrency());
      this.portfolioCoordinator.refreshLocalPricesIfNeeded().subscribe();
    }
  }

  openAuthScreen(): void {
    this.isAuthScreenManualOpen.set(true);
  }

  closeAuthScreen(): void {
    this.isAuthScreenManualOpen.set(false);
  }

  async onSignOut(): Promise<void> {
    await this.authService.signOut();
    this.portfolioCoordinator.resetForSignOut();
    this.portfolioData.set(null);
    this.dividendData.set(null);
    this.error.set(null);
    this.apiError.set(null);
    this.dividendError.set(null);
    this.hasLoadedInitial = false;
    this.prevSource = null;
    this.isUserSettingsOpen.set(false);
    this.isLocalPortfolioModalOpen.set(false);
    this.isAuthScreenManualOpen.set(false);
  }

  private syncCurrencyChange(currency: 'USD' | 'THB'): void {
    untracked(() => {
      if (this.portfolioData()) {
        this.portfolioCoordinator.getHoldings(this.activeTab().id, currency, this.i18n.lang()).subscribe({
          next: (res) => {
            if (res.ok) {
              this.apiError.set(null);
              this.error.set(null);
              this.portfolioData.set(res.data);
              if (res.data.exchangeRate > 0) {
                this.exchangeRate.set(res.data.exchangeRate);
              }
            } else {
              this.apiError.set(res);
              this.error.set(
                res.kind === 'unauthorized' ? this.i18n.t('app.error.sessionExpired') : res.message
              );
            }
          },
        });
      }

      if (this.dividendData()) {
        this.loadDividendData(currency);
      }
    });
  }

  setCurrency(currency: 'THB' | 'USD'): void {
    this.userSettings.setCurrency(currency);
  }

  setLang(lang: AppLang): void {
    this.userSettings.setLang(lang);
  }

  toggleTheme(): void {
    this.userSettings.toggleTheme();
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.userSettings.setTheme(theme);
  }

  togglePrivacyMode(): void {
    this.userSettings.togglePrivacyMode();
  }

  setPrivacyMode(privacy: boolean): void {
    this.userSettings.setPrivacyMode(privacy);
  }

  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    return convertCurrency(amount, fromCurrency, toCurrency, this.exchangeRate());
  }

  cx(amount: number, fromCurrency: string): number {
    return this.convertCurrency(amount, fromCurrency, this.displayCurrency());
  }

  dc(originalCurrency?: string): string {
    return this.displayCurrency();
  }

  readonly filteredSummaries = computed<PortfolioPosition[]>(() => {
    const data = this.localizedPortfolioData();
    if (!data) return [];
    const rawOpen = this.portfolioData()?.openPositions || [];
    const rawNameBySymbol = new Map(rawOpen.map((p) => [p.symbol, p.name || '']));
    return filterAndSortOpenPositions(
      data.openPositions,
      rawNameBySymbol,
      this.searchQuery(),
      this.sortField(),
      this.sortDirection(),
    );
  });

  readonly filteredClosedSummaries = computed<ClosedPortfolioPosition[]>(() => {
    const data = this.localizedPortfolioData();
    if (!data || !data.closedPositions) return [];
    const rawClosed = this.portfolioData()?.closedPositions || [];
    const rawNameBySymbol = new Map(rawClosed.map((c) => [c.symbol, c.name || '']));
    return filterAndSortClosedPositions(
      data.closedPositions,
      rawNameBySymbol,
      this.isClosedTab(),
      this.selectedClosedAssetType(),
      this.searchQuery(),
      this.sortField(),
      this.sortDirection(),
    );
  });

  readonly autocompleteSuggestions = computed<SymbolAutocompleteItem[]>(() => {
    const data = this.localizedPortfolioData();
    if (!data) return [];
    const rawData = this.portfolioData();
    const rawOpenName = new Map((rawData?.openPositions || []).map((p) => [p.symbol, p.name || '']));
    const rawClosedName = new Map((rawData?.closedPositions || []).map((c) => [c.symbol, c.name || '']));

    const query = this.searchQuery().trim().toUpperCase();
    const isClosed = this.isClosedTab();
    const isAll = this.isAllTab();

    const items: SymbolAutocompleteItem[] = [];
    const seenSymbols = new Set<string>();

    if (!isClosed || isAll) {
      for (const s of data.openPositions || []) {
        const displaySym = s.displaySymbol || this.getDisplaySymbol(s.symbol);
        const name = s.name || this.getSymbolName(s.symbol);
        const rawEnName = rawOpenName.get(s.symbol) || '';
        const type = s.assetType;
        const typeLabel = s.assetTypeLabel || this.getAssetTypeLabel(type, s.symbol) || '';

        const matches =
          !query ||
          s.symbol.toUpperCase().includes(query) ||
          displaySym.toUpperCase().includes(query) ||
          name.toUpperCase().includes(query) ||
          (s.nameTh || '').toUpperCase().includes(query) ||
          rawEnName.toUpperCase().includes(query) ||
          typeLabel.toUpperCase().includes(query);

        if (matches) {
          seenSymbols.add(s.symbol);
          items.push({
            symbol: s.symbol,
            displaySymbol: displaySym,
            name,
            color: this.getSymbolColor(s.symbol),
            assetType: type,
            assetTypeLabel: typeLabel,
            isClosed: false,
            totalShares: s.totalShares,
            totalCost: s.totalCost,
            currency: s.currency,
            holdingValue: s.holdingValue,
            unrealizedPL: s.unrealizedPL,
            unrealizedPLPercent: s.unrealizedPLPercent,
            hasPrice: s.hasPrice,
          });
        }
      }
    }

    if (isClosed || isAll) {
      for (const s of data.closedPositions || []) {
        if (seenSymbols.has(s.symbol)) continue;

        const displaySym = s.displaySymbol || this.getDisplaySymbol(s.symbol);
        const name = s.name || this.getSymbolName(s.symbol);
        const rawEnName = rawClosedName.get(s.symbol) || '';
        const type = s.assetType;
        const typeLabel = s.assetTypeLabel || this.getAssetTypeLabel(type, s.symbol) || '';

        const matches =
          !query ||
          s.symbol.toUpperCase().includes(query) ||
          displaySym.toUpperCase().includes(query) ||
          name.toUpperCase().includes(query) ||
          (s.nameTh || '').toUpperCase().includes(query) ||
          rawEnName.toUpperCase().includes(query) ||
          typeLabel.toUpperCase().includes(query);

        if (matches) {
          items.push({
            symbol: s.symbol,
            displaySymbol: displaySym,
            name,
            color: this.getSymbolColor(s.symbol),
            assetType: type,
            assetTypeLabel: typeLabel,
            isClosed: true,
            totalShares: s.closedShares,
            totalCost: s.totalCost,
            currency: s.currency,
            realizedPL: s.realizedPL,
            realizedPLPercent: s.realizedPLPercent,
            hasPrice: false,
          });
        }
      }
    }

    if (query) {
      items.sort((a, b) => {
        const aSym = a.symbol.toUpperCase();
        const bSym = b.symbol.toUpperCase();
        const aDisp = a.displaySymbol.toUpperCase();
        const bDisp = b.displaySymbol.toUpperCase();

        const aExact = aSym === query || aDisp === query;
        const bExact = bSym === query || bDisp === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aSym.startsWith(query) || aDisp.startsWith(query);
        const bStarts = bSym.startsWith(query) || bDisp.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return items.slice(0, 10);
  });

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.isSearchDropdownOpen.set(true);
    this.searchActiveIndex.set(-1);
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
    this.isSearchDropdownOpen.set(true);
  }

  closeSearchDropdown(): void {
    this.isSearchDropdownOpen.set(false);
    this.isSearchFocused.set(false);
    this.searchActiveIndex.set(-1);
  }

  clearSearchQuery(inputEl?: HTMLInputElement): void {
    this.searchQuery.set('');
    this.searchActiveIndex.set(-1);
    this.isSearchDropdownOpen.set(true);
    if (inputEl) {
      inputEl.focus();
    }
  }

  selectAutocompleteItem(item: SymbolAutocompleteItem): void {
    this.searchQuery.set(item.displaySymbol || item.symbol);
    this.closeSearchDropdown();

    this.expandedSymbols.update((set) => {
      const next = new Set(set);
      next.add(item.symbol);
      return next;
    });

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const cardId = item.isClosed ? `closed-card-${item.symbol}` : `card-${item.symbol}`;
        const el = document.getElementById(cardId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const suggestions = this.autocompleteSuggestions();
    const isOpen = this.isSearchDropdownOpen();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        this.isSearchDropdownOpen.set(true);
        this.searchActiveIndex.set(0);
        return;
      }
      if (suggestions.length > 0) {
        const nextIndex = (this.searchActiveIndex() + 1) % suggestions.length;
        this.searchActiveIndex.set(nextIndex);
        this.scrollActiveSuggestionIntoView(nextIndex);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        this.isSearchDropdownOpen.set(true);
        this.searchActiveIndex.set(suggestions.length - 1);
        return;
      }
      if (suggestions.length > 0) {
        const nextIndex =
          this.searchActiveIndex() <= 0 ? suggestions.length - 1 : this.searchActiveIndex() - 1;
        this.searchActiveIndex.set(nextIndex);
        this.scrollActiveSuggestionIntoView(nextIndex);
      }
    } else if (event.key === 'Enter') {
      if (
        isOpen &&
        this.searchActiveIndex() >= 0 &&
        this.searchActiveIndex() < suggestions.length
      ) {
        event.preventDefault();
        this.selectAutocompleteItem(suggestions[this.searchActiveIndex()]);
      } else {
        this.closeSearchDropdown();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearchDropdown();
    }
  }

  private scrollActiveSuggestionIntoView(index: number): void {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const itemEl = document.getElementById(`autocomplete-item-${index}`);
        if (itemEl) {
          itemEl.scrollIntoView({ block: 'nearest' });
        }
      }, 10);
    }
  }

  setClosedAssetTypeFilter(type: string): void {
    this.selectedClosedAssetType.set(type);
    this.isMobileFilterDropdownOpen.set(false);
  }

  setSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'symbol' ? 'asc' : 'desc');
    }
    this.isMobileSortDropdownOpen.set(false);
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  selectTab(tab: AssetTab): void {
    this.isTabDropdownOpen.set(false);
    this.holdingsSubTab.set(tab.id === 'provident-fund' ? 'pvd' : 'market');
    if (tab.id === this.activeTab().id) return;
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.closeSearchDropdown();
    this.selectedClosedAssetType.set('all');
    this.expandedSymbols.set(new Set());
    if (tab.id === 'closed-position') {
      this.sortField.set('realizedPL');
      this.sortDirection.set('desc');
    } else {
      this.sortField.set('totalCost');
      this.sortDirection.set('desc');
    }

    const cached = this.portfolioCoordinator.getCachedTab(tab.id, this.displayCurrency());
    if (cached) {
      this.error.set(null);
      this.apiError.set(null);
      this.portfolioData.set(cached.portfolioData);
      this.prices.set(cached.prices);
      if (cached.portfolioData.exchangeRate > 0) {
        this.exchangeRate.set(cached.portfolioData.exchangeRate);
      }
      this.loading.set(false);
      this.pricesLoading.set(false);
      return;
    }

    this.loadTab(tab, this.displayCurrency());
  }

  loadTab(tab: AssetTab, currency: 'USD' | 'THB' = this.displayCurrency()): void {
    const isCloud = this.portfolioCoordinator.activeSource() === 'cloud';
    if (isCloud) {
      this.loading.set(true);
      this.error.set(null);
      this.apiError.set(null);
      if (this.portfolioData()?.tabId !== tab.id) {
        this.portfolioData.set(null);
      }
    }

    this.portfolioCoordinator.getHoldings(tab.id, currency, this.i18n.lang()).subscribe({
      next: (res) => {
        if (!res.ok) {
          this.apiError.set(res);
          this.error.set(
            res.kind === 'unauthorized' ? this.i18n.t('app.error.sessionExpired') : res.message
          );
          this.loading.set(false);
          return;
        }
        const payload = res.data;
        this.apiError.set(null);
        this.error.set(null);
        this.portfolioData.set(payload);
        if (payload.exchangeRate > 0) {
          this.exchangeRate.set(payload.exchangeRate);
        }

        if (isCloud) {
          const pMap = this.extractPricesFromHoldings(payload);
          this.prices.set(pMap);
          this.portfolioCoordinator.setCachedTab(tab.id, currency, {
            portfolioData: payload,
            prices: pMap,
            timestamp: Date.now(),
          });
          this.pricesLoading.set(false);
        } else {
          this.prices.set(new Map(this.localPortfolioService.prices()));
          if (payload.exchangeRate <= 0) {
            this.exchangeRate.set(this.localPortfolioService.exchangeRate());
          }
          this.pricesLoading.set(this.localPortfolioService.pricesLoading());
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || this.i18n.t('app.error.failedPortfolio'));
        this.loading.set(false);
      },
    });

    this.portfolioCoordinator.refreshLocalPricesIfNeeded().subscribe();
  }

  private extractPricesFromHoldings(payload: PortfolioHoldingsResponse): Map<string, PriceData> {
    const pMap = new Map<string, PriceData>();
    for (const pos of payload.openPositions || []) {
      pMap.set(pos.symbol, {
        symbol: pos.symbol,
        name: pos.name,
        nameTh: pos.nameTh || '',
        price: pos.currentPrice,
        currency: pos.currency,
      });
    }
    for (const pos of payload.closedPositions || []) {
      const existing = pMap.get(pos.symbol);
      if (!existing || !existing.name || (!existing.nameTh && pos.nameTh)) {
        pMap.set(pos.symbol, {
          symbol: pos.symbol,
          name: pos.name || existing?.name || '',
          nameTh: pos.nameTh || existing?.nameTh || '',
          price: existing?.price ?? 0,
          currency: pos.currency || existing?.currency || '',
        });
      }
    }
    return pMap;
  }

  loadDividendData(currency: 'USD' | 'THB' = this.displayCurrency()): void {
    const isCloud = this.portfolioCoordinator.activeSource() === 'cloud';
    if (isCloud && !this.dividendData()) {
      this.dividendLoading.set(true);
    }
    this.portfolioCoordinator.getDividends(currency, 'all', this.i18n.lang()).subscribe({
      next: (res) => {
        if (res.ok) {
          this.dividendError.set(null);
          this.dividendData.set(res.data);
        } else {
          this.dividendError.set(res);
        }
        this.dividendLoading.set(false);
      },
      error: () => {
        this.dividendLoading.set(false);
      },
    });
  }

  refresh(): void {
    this.portfolioCoordinator.invalidateTab(this.activeTab().id);
    this.loadTab(this.activeTab(), this.displayCurrency());
    this.loadDividendData(this.displayCurrency());
  }

  toggleExpand(symbol: string): void {
    const current = new Set(this.expandedSymbols());
    if (current.has(symbol)) {
      current.delete(symbol);
    } else {
      current.add(symbol);
    }
    this.expandedSymbols.set(current);
  }

  isExpanded(symbol: string): boolean {
    return this.expandedSymbols().has(symbol);
  }

  expandAll(): void {
    const data = this.portfolioData();
    if (!data) return;
    const symbols = new Set<string>();
    if (!this.isClosedTab()) {
      data.openPositions.forEach((s) => symbols.add(s.symbol));
    }
    if (this.isClosedTab() || this.isAllTab()) {
      data.closedPositions.forEach((s) => symbols.add(s.symbol));
    }
    this.expandedSymbols.set(symbols);
  }

  collapseAll(): void {
    this.expandedSymbols.set(new Set());
  }

  getCurrentPrice(symbol: string): number {
    return this.prices().get(symbol)?.price ?? 0;
  }

  getCurrentPriceConverted(summary: PortfolioPosition | SymbolSummary): number {
    if ('currentPrice' in summary && summary.currentPrice) {
      return convertCurrency(
        summary.currentPrice,
        summary.currency,
        this.displayCurrency(),
        this.exchangeRate(),
      );
    }
    const pd = this.prices().get(summary.symbol);
    const price = pd?.price ?? 0;
    const curr = pd?.currency || summary.currency;
    return convertCurrency(price, curr, this.displayCurrency(), this.exchangeRate());
  }

  readonly symbolNameMap = computed<Map<string, string>>(() => {
    const lang = this.i18n.lang();
    const map = new Map<string, string>();
    const prices = this.prices();
    for (const [sym, pd] of prices.entries()) {
      const resolved = getSymbolName(sym, pd.name || '', lang, pd.nameTh || '');
      if (resolved) map.set(sym, resolved);
    }
    const data = this.portfolioData();
    if (data) {
      for (const p of data.openPositions || []) {
        const resolved = getSymbolName(p.symbol, p.name || '', lang, p.nameTh || '', p.assetType);
        if (resolved) map.set(p.symbol, resolved);
      }
      for (const c of data.closedPositions || []) {
        if (!map.has(c.symbol)) {
          const resolved = getSymbolName(c.symbol, c.name || '', lang, c.nameTh || '', c.assetType);
          if (resolved) map.set(c.symbol, resolved);
        }
      }
    }
    const divData = this.dividendData();
    if (divData) {
      for (const s of divData.symbolSummaries || []) {
        if (!map.has(s.symbol)) {
          const resolved = getSymbolName(s.symbol, s.name || '', lang, s.nameTh || '', s.assetType);
          if (resolved) map.set(s.symbol, resolved);
        }
      }
    }
    return map;
  });

  getDisplaySymbol(symbol: string): string {
    return displaySymbol(symbol);
  }

  getSymbolName(symbol: string, rawName?: string): string {
    const lang = this.i18n.lang();
    const mapped = this.symbolNameMap().get(symbol);
    const pd = this.prices().get(symbol);
    if (lang === 'th' && mapped) {
      return mapped;
    }
    if (rawName) {
      return getSymbolName(symbol, rawName, lang, pd?.nameTh || '');
    }
    return mapped || resolveSymbolName(symbol, this.prices(), lang);
  }

  getHoldingValue(summary: PortfolioPosition | SymbolSummary): number {
    if ('holdingValue' in summary && summary.holdingValue) {
      return convertCurrency(
        summary.holdingValue,
        summary.currency,
        this.displayCurrency(),
        this.exchangeRate(),
      );
    }
    const price = this.getCurrentPriceConverted(summary);
    return summary.totalShares * price;
  }

  getUnrealizedPL(summary: PortfolioPosition | SymbolSummary): number {
    if ('unrealizedPL' in summary && summary.unrealizedPL !== undefined) {
      return convertCurrency(
        summary.unrealizedPL,
        summary.currency,
        this.displayCurrency(),
        this.exchangeRate(),
      );
    }
    const cost = convertCurrency(
      summary.totalCost,
      summary.currency,
      this.displayCurrency(),
      this.exchangeRate(),
    );
    return this.getHoldingValue(summary) - cost;
  }

  getUnrealizedPLPercent(summary: PortfolioPosition | SymbolSummary): number {
    if ('unrealizedPLPercent' in summary && summary.unrealizedPLPercent !== undefined) {
      return summary.unrealizedPLPercent;
    }
    const cost = convertCurrency(
      summary.totalCost,
      summary.currency,
      this.displayCurrency(),
      this.exchangeRate(),
    );
    if (cost === 0) return 0;
    return (this.getUnrealizedPL(summary) / cost) * 100;
  }

  getLotHoldingValue(
    lot: PortfolioHoldingLot | ShareLot,
    summary: PortfolioPosition | SymbolSummary,
  ): number {
    if ('holdingValue' in lot && lot.holdingValue) {
      const lotCurr = ('currency' in lot ? lot.currency : summary.currency) || summary.currency;
      return convertCurrency(
        lot.holdingValue,
        lotCurr,
        this.displayCurrency(),
        this.exchangeRate(),
      );
    }
    const price = this.getCurrentPriceConverted(summary);
    return lot.quantity * price;
  }

  getLotUnrealizedPL(
    lot: PortfolioHoldingLot | ShareLot,
    summary: PortfolioPosition | SymbolSummary,
  ): number {
    if ('unrealizedPL' in lot && lot.unrealizedPL !== undefined) {
      const lotCurr = ('currency' in lot ? lot.currency : summary.currency) || summary.currency;
      return convertCurrency(
        lot.unrealizedPL,
        lotCurr,
        this.displayCurrency(),
        this.exchangeRate(),
      );
    }
    const lotCurr = ('currency' in lot ? lot.currency : summary.currency) || summary.currency;
    const lotCost = convertCurrency(
      lot.totalCost,
      lotCurr,
      this.displayCurrency(),
      this.exchangeRate(),
    );
    return this.getLotHoldingValue(lot, summary) - lotCost;
  }

  getLotUnrealizedPLPercent(
    lot: PortfolioHoldingLot | ShareLot,
    summary: PortfolioPosition | SymbolSummary,
  ): number {
    if ('unrealizedPLPercent' in lot && lot.unrealizedPLPercent !== undefined) {
      return lot.unrealizedPLPercent;
    }
    const lotCurr = ('currency' in lot ? lot.currency : summary.currency) || summary.currency;
    const lotCost = convertCurrency(
      lot.totalCost,
      lotCurr,
      this.displayCurrency(),
      this.exchangeRate(),
    );
    if (lotCost === 0) return 0;
    return (this.getLotUnrealizedPL(lot, summary) / lotCost) * 100;
  }

  hasPriceData(symbol: string): boolean {
    const data = this.portfolioData();
    if (data) {
      const pos = data.openPositions.find((p) => p.symbol === symbol);
      if (pos) return pos.hasPrice;
    }
    return this.prices().has(symbol) && this.getCurrentPrice(symbol) > 0;
  }

  getQuantityFormat(symbol: string, assetType?: string): string {
    return getQuantityFormat(symbol, assetType);
  }

  getPriceFormat(symbol: string, assetType?: string): string {
    return getPriceFormat(symbol, assetType);
  }

  getSymbolColor(symbol: string): string {
    return getSymbolColor(symbol);
  }

  getAssetTypeLabel(assetType?: string, symbol?: string): string {
    return getAssetTypeLabel(assetType, symbol, this.i18n.lang());
  }

  getAssetTypeClass(assetType?: string, symbol?: string): string {
    return getAssetTypeClass(assetType, symbol);
  }
}
