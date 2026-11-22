import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { PortfolioDataSource } from '../models/auth.model';
import { PortfolioDividendResponse } from '../models/dividend.model';
import {
  PortfolioAllocationResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  TargetAllocation,
} from '../models/portfolio.model';
import { AuthService } from '../services/auth.service';
import { AppLang, I18nService } from '../services/i18n.service';
import { LocalPortfolioService } from '../services/local-portfolio.service';
import { PriceData } from '../services/price.service';
import { CloudPortfolioProvider } from './cloud-portfolio.provider';
import { LocalPortfolioProvider } from './local-portfolio.provider';
import { PortfolioDataProvider, TabCacheEntry } from './portfolio-data.provider';

@Injectable({
  providedIn: 'root',
})
export class PortfolioSourceCoordinator {
  private readonly authService = inject(AuthService);
  private readonly cloudProvider = inject(CloudPortfolioProvider);
  private readonly localProvider = inject(LocalPortfolioProvider);
  private readonly localPortfolioService = inject(LocalPortfolioService);
  private readonly i18n = inject(I18nService);

  private readonly tabCache = new Map<string, TabCacheEntry>();
  private readonly refreshTick = signal(0);
  private lastObservedSource: PortfolioDataSource | null = null;

  readonly activeSource = this.authService.activeDataSource;

  readonly activeProvider = computed<PortfolioDataProvider>(() =>
    this.activeSource() === 'cloud' ? this.cloudProvider : this.localProvider
  );

  /**
   * Emits a new revision object whenever the active source, signed-in user,
   * or underlying local portfolio snapshot changes so analytics components
   * can react without inspecting `activeDataSource()` directly.
   */
  readonly dataRevision = computed(() => {
    const source = this.activeSource();
    const tick = this.refreshTick();
    if (source === 'local') {
      return {
        source,
        tick,
        txs: this.localPortfolioService.transactions(),
        prices: this.localPortfolioService.prices(),
        rate: this.localPortfolioService.exchangeRate(),
      };
    }
    return {
      source,
      tick,
      userId: this.authService.session()?.user?.id ?? null,
    };
  });

  constructor() {
    effect(() => {
      const currentSource = this.activeSource();
      if (this.lastObservedSource !== null && this.lastObservedSource !== currentSource) {
        // Section 3.2 invariant: never carry cached cloud data into local mode or vice versa
        this.tabCache.clear();
      }
      this.lastObservedSource = currentSource;
    });
  }

  getHoldings(
    tabId: string,
    currency: 'USD' | 'THB',
    lang: AppLang = this.i18n.lang()
  ): Observable<ApiResult<PortfolioHoldingsResponse>> {
    return this.activeProvider().getHoldings(tabId, currency, lang);
  }

  getPerformance(
    timeframe: string = 'ALL',
    startDate: string = '',
    endDate: string = '',
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = this.i18n.lang()
  ): Observable<ApiResult<PortfolioPerformanceResponse>> {
    return this.activeProvider().getPerformance(timeframe, startDate, endDate, currency, lang);
  }

  getAllocation(
    targetAllocation?: TargetAllocation,
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = this.i18n.lang()
  ): Observable<ApiResult<PortfolioAllocationResponse>> {
    return this.activeProvider().getAllocation(targetAllocation, currency, lang);
  }

  getDividends(
    currency: 'USD' | 'THB',
    tabId: string = 'all',
    lang: AppLang = this.i18n.lang()
  ): Observable<ApiResult<PortfolioDividendResponse>> {
    return this.activeProvider().getDividends(currency, tabId, lang);
  }

  refreshLocalPricesIfNeeded(): Observable<
    ApiResult<{ prices: Map<string, PriceData>; rate: number }> | null
  > {
    if (this.activeSource() !== 'local' || !this.localPortfolioService.hasTransactions()) {
      return of(null);
    }
    return this.localPortfolioService.refreshMarketPrices();
  }

  getCachedTab(
    tabId: string,
    currency: 'USD' | 'THB',
    ttlMs?: number
  ): TabCacheEntry | null {
    if (this.activeSource() !== 'cloud') {
      return null;
    }
    const entry = this.tabCache.get(this.cacheKey('cloud', tabId, currency));
    if (!entry) return null;
    if (ttlMs !== undefined && Date.now() - entry.timestamp >= ttlMs) {
      return null;
    }
    return entry;
  }

  setCachedTab(tabId: string, currency: 'USD' | 'THB', entry: TabCacheEntry): void {
    const source = this.activeSource();
    if (source !== 'cloud') {
      return;
    }
    this.tabCache.set(this.cacheKey(source, tabId, currency), entry);
  }

  invalidateTab(tabId: string, currency?: 'USD' | 'THB'): void {
    if (currency) {
      this.tabCache.delete(this.cacheKey(this.activeSource(), tabId, currency));
      return;
    }
    const prefix = `${this.activeSource()}::${tabId}::`;
    for (const key of this.tabCache.keys()) {
      if (key.startsWith(prefix)) {
        this.tabCache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.tabCache.clear();
  }

  cacheSize(): number {
    return this.tabCache.size;
  }

  notifyRefresh(): void {
    this.refreshTick.update((n) => n + 1);
  }

  resetForSignOut(): void {
    this.clearCache();
    this.refreshTick.update((n) => n + 1);
  }

  private cacheKey(source: PortfolioDataSource, tabId: string, currency: 'USD' | 'THB'): string {
    return `${source}::${tabId}::${currency}`;
  }
}
