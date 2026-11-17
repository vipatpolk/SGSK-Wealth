import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { DividendService } from '@shared/services/dividend.service';
import { I18nService } from '@shared/services/i18n.service';
import { PortfolioService } from '@shared/services/portfolio.service';
import { PriceData, PriceService } from '@shared/services/price.service';
import { convertCurrency, getAssetTypeLabel, getSymbolName } from '@shared/utils/format.utils';
import { NativePlatformService } from './native-platform.service';

@Injectable({
  providedIn: 'root',
})
export class MobileStateService {
  private readonly portfolioService = inject(PortfolioService);
  private readonly priceService = inject(PriceService);
  private readonly dividendService = inject(DividendService);
  readonly i18n = inject(I18nService);
  readonly nativePlatform = inject(NativePlatformService);

  readonly tabs = ASSET_TABS;
  readonly activeTab = signal<AssetTab>(ASSET_TABS[0]);
  readonly holdingsSubTab = signal<HoldingsSubTab>('market');
  readonly analyticsSubTab = signal<AnalyticsSubTab>('overview');
  readonly selectedToolId = signal<ToolId>('avg-cost-calculator');
  readonly selectedHistorySymbol = signal<string>('');
  readonly activeFactsheetTarget = signal<FactsheetRequestTarget | null>(null);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly portfolioData = signal<PortfolioHoldingsResponse | null>(null);
  readonly dividendData = signal<PortfolioDividendResponse | null>(null);
  readonly dividendLoading = signal<boolean>(false);
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly pricesLoading = signal<boolean>(false);
  readonly cachedPvdPositions = signal<PortfolioPosition[]>([]);

  readonly displayCurrency = signal<'USD' | 'THB'>('THB');
  readonly exchangeRate = signal<number>(0);
  readonly theme = signal<'dark' | 'light'>('dark');
  readonly privacyMode = signal<boolean>(false);

  private prevCurrency: 'USD' | 'THB' | null = null;
  private readonly tabCache = new Map<
    string,
    { portfolioData: PortfolioHoldingsResponse; prices: Map<string, PriceData>; timestamp: number }
  >();

  readonly isClosedTab = computed(() => this.activeTab().id === 'closed-position');
  readonly isPvdTab = computed(
    () => this.holdingsSubTab() === 'pvd' || this.activeTab().id === 'provident-fund'
  );
  readonly hasRate = computed(() => this.exchangeRate() > 0);

  readonly pvdPositions = computed<PortfolioPosition[]>(() => {
    const live = this.portfolioData()?.openPositions ?? [];
    const livePvd = live.filter((p) => p.assetType === 'provident-fund');
    if (livePvd.length > 0) return livePvd;
    return this.cachedPvdPositions();
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

  readonly totalPL = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    const raw = this.isClosedTab()
      ? data.summary.totalRealizedPL || 0
      : data.summary.totalUnrealizedPL || 0;
    return convertCurrency(raw, data.currency, this.displayCurrency(), this.exchangeRate());
  });

  readonly totalPLPercent = computed<number>(() => {
    const data = this.portfolioData();
    if (!data) return 0;
    return this.isClosedTab()
      ? data.summary.totalRealizedPLPercent || 0
      : data.summary.totalUnrealizedPLPercent || 0;
  });

  constructor() {
    void this.initPreferences();
    this.loadTab(this.activeTab(), this.displayCurrency());
    this.loadDividendData(this.displayCurrency());
    this.prevCurrency = this.displayCurrency();

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
      if (this.prevCurrency !== null && this.prevCurrency !== curr) {
        this.prevCurrency = curr;
        untracked(() => this.syncCurrencyChange(curr));
      }
    });
  }

  private async initPreferences(): Promise<void> {
    const savedTheme = await this.nativePlatform.getPreference('sgsk_wealth_theme');
    this.setTheme(savedTheme === 'light' ? 'light' : 'dark');

    const savedPrivacy = await this.nativePlatform.getPreference('sgsk_wealth_privacy_mode');
    this.setPrivacyMode(savedPrivacy === 'true');

    await this.nativePlatform.hideSplashScreen();
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.theme.set(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('ion-palette-dark', theme === 'dark');
    }
    void this.nativePlatform.setPreference('sgsk_wealth_theme', theme);
    void this.nativePlatform.syncStatusBar(theme);
  }

  toggleTheme(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setPrivacyMode(privacy: boolean): void {
    this.privacyMode.set(privacy);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-privacy', privacy ? 'true' : 'false');
    }
    void this.nativePlatform.setPreference('sgsk_wealth_privacy_mode', privacy ? 'true' : 'false');
  }

  togglePrivacyMode(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.setPrivacyMode(!this.privacyMode());
  }

  toggleCurrency(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.displayCurrency.set(this.displayCurrency() === 'THB' ? 'USD' : 'THB');
  }

  toggleLang(): void {
    void this.nativePlatform.triggerHapticImpact('light');
    this.i18n.setLang(this.i18n.lang() === 'en' ? 'th' : 'en');
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

  refresh(): void {
    this.tabCache.delete(`${this.activeTab().id}::${this.displayCurrency()}`);
    this.loadTab(this.activeTab(), this.displayCurrency(), true);
    this.loadDividendData(this.displayCurrency());
  }

  loadTab(tab: AssetTab, currency: 'USD' | 'THB', forceRefresh = false): void {
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
