import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KEY_VALUE_STORAGE_ADAPTER,
  KeyValueStorageAdapter,
} from '@shared/config/storage-adapter.token';
import { apiErr, apiOk } from '@shared/models/api-result.model';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { CloudPortfolioProvider } from '@shared/providers/cloud-portfolio.provider';
import { LocalPortfolioProvider } from '@shared/providers/local-portfolio.provider';
import { PortfolioSourceCoordinator } from '@shared/providers/portfolio-source.coordinator';
import { AuthService } from '@shared/services/auth.service';
import { DividendService } from '@shared/services/dividend.service';
import {
  LOCAL_TRANSACTIONS_STORAGE_KEY,
  LocalPortfolioService,
} from '@shared/services/local-portfolio.service';
import { PortfolioService } from '@shared/services/portfolio.service';

function createInMemoryStorageAdapter(initial: Record<string, string> = {}): {
  adapter: KeyValueStorageAdapter;
  backingMap: Map<string, string>;
} {
  const backingMap = new Map<string, string>(Object.entries(initial));
  const adapter: KeyValueStorageAdapter = {
    getItemSync: (key: string) => backingMap.get(key) ?? null,
    getItem: async (key: string) => backingMap.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      backingMap.set(key, value);
    },
    removeItem: async (key: string) => {
      backingMap.delete(key);
    },
  };
  return { adapter, backingMap };
}

describe('PortfolioSourceCoordinator & KeyValueStorageAdapter (M3)', () => {
  let storageHarness: ReturnType<typeof createInMemoryStorageAdapter>;

  beforeEach(() => {
    storageHarness = createInMemoryStorageAdapter();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: KEY_VALUE_STORAGE_ADAPTER, useValue: storageHarness.adapter },
      ],
    });
  });

  it('persists and hydrates LocalPortfolioService exclusively via injected KeyValueStorageAdapter', async () => {
    const preseeded = [
      {
        id: 'tx-pre-1',
        symbol: 'AAPL',
        date: '2025-01-15',
        quantity: 10,
        price: 180,
        currency: 'USD',
        assetType: 'us-stock',
        txType: 'BUY',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      },
    ];
    storageHarness.backingMap.set(LOCAL_TRANSACTIONS_STORAGE_KEY, JSON.stringify(preseeded));

    const localPortfolio = TestBed.inject(LocalPortfolioService);
    expect(localPortfolio.transactions().length).toBe(1);
    expect(localPortfolio.transactions()[0].symbol).toBe('AAPL');

    localPortfolio.addTransaction({
      symbol: 'PTT.BK',
      date: '2025-02-01',
      quantity: 200,
      price: 35,
      currency: 'THB',
      assetType: 'thai-stock',
      txType: 'BUY',
    });

    const persistedRaw = storageHarness.backingMap.get(LOCAL_TRANSACTIONS_STORAGE_KEY);
    expect(persistedRaw).toBeTruthy();
    expect(JSON.parse(persistedRaw!)).toHaveLength(2);
  });

  it('routes Guest and Standard authenticated users to LocalPortfolioProvider and Owner users to CloudPortfolioProvider', async () => {
    const authService = TestBed.inject(AuthService);
    const portfolioService = TestBed.inject(PortfolioService);
    const dividendService = TestBed.inject(DividendService);
    const coordinator = TestBed.inject(PortfolioSourceCoordinator);
    const cloudProvider = TestBed.inject(CloudPortfolioProvider);
    const localProvider = TestBed.inject(LocalPortfolioProvider);

    const cloudHoldingsSpy = vi.spyOn(portfolioService, 'fetchHoldings').mockReturnValue(
      of(
        apiOk<PortfolioHoldingsResponse>({
          currency: 'THB',
          exchangeRate: 34.5,
          tabId: 'all',
          summary: {
            totalInvested: 1000,
            totalValue: 1250,
            openInvested: 1000,
            closedInvested: 0,
            totalUnrealizedPL: 250,
            totalUnrealizedPLPercent: 25,
            totalRealizedPL: 0,
            totalRealizedPLPercent: 0,
            totalReturn: 250,
            totalReturnPercent: 25,
          },
          openPositions: [],
          closedPositions: [],
          error: null,
        })
      )
    );
    const cloudDividendsSpy = vi.spyOn(dividendService, 'getDividendAnalytics').mockReturnValue(
      of(
        apiOk<PortfolioDividendResponse>({
          currency: 'THB',
          exchangeRate: 34.5,
          totalGrossDividends: 0,
          totalNetDividends: 0,
          totalWithholdingTax: 0,
          effectiveTaxRate: 0,
          projectedAnnualDividends: 0,
          portfolioDividendYield: 0,
          portfolioYieldOnCost: 0,
          annualDividends: [],
          monthlyDividends: [],
          assetTypeSummaries: [],
          symbolSummaries: [],
          records: [],
          error: null,
        })
      )
    );

    // 1. Guest user
    authService.session.set(null);
    authService.canViewCloudPortfolio.set(false);
    expect(coordinator.activeSource()).toBe('local');
    expect(coordinator.activeProvider()).toBe(localProvider);

    const guestRes = await firstValueFrom(coordinator.getHoldings('all', 'THB', 'en'));
    expect(guestRes.ok).toBe(true);
    expect(cloudHoldingsSpy).not.toHaveBeenCalled();

    // 2. Standard authenticated user (non-owner)
    authService.session.set({
      access_token: 'standard-tok',
      user: { id: 'std-1', email: 'standard@example.com' },
    } as any);
    authService.canViewCloudPortfolio.set(false);
    expect(coordinator.activeSource()).toBe('local');
    expect(coordinator.activeProvider()).toBe(localProvider);

    await firstValueFrom(coordinator.getDividends('THB', 'all', 'en'));
    expect(cloudDividendsSpy).not.toHaveBeenCalled();

    // 3. Owner user -> switches to CloudPortfolioProvider
    authService.canViewCloudPortfolio.set(true);
    expect(coordinator.activeSource()).toBe('cloud');
    expect(coordinator.activeProvider()).toBe(cloudProvider);

    const ownerRes = await firstValueFrom(coordinator.getHoldings('all', 'THB', 'en'));
    expect(ownerRes.ok).toBe(true);
    expect(cloudHoldingsSpy).toHaveBeenCalledTimes(1);
    await firstValueFrom(coordinator.getDividends('THB', 'all', 'en'));
    expect(cloudDividendsSpy).toHaveBeenCalledTimes(1);
  });

  it('clears cached cloud tab data on source transition and on signOut (cache isolation invariant)', () => {
    const authService = TestBed.inject(AuthService);
    const coordinator = TestBed.inject(PortfolioSourceCoordinator);

    authService.session.set({
      access_token: 'owner-tok',
      user: { id: 'owner-1', email: 'owner@example.com' },
    } as any);
    authService.canViewCloudPortfolio.set(true);
    TestBed.flushEffects();

    const cloudHoldings: PortfolioHoldingsResponse = {
      currency: 'THB',
      exchangeRate: 34.5,
      tabId: 'all',
      summary: {
        totalInvested: 5000,
        totalValue: 6000,
        openInvested: 5000,
        closedInvested: 0,
        totalUnrealizedPL: 1000,
        totalUnrealizedPLPercent: 20,
        totalRealizedPL: 0,
        totalRealizedPLPercent: 0,
        totalReturn: 1000,
        totalReturnPercent: 20,
      },
      openPositions: [],
      closedPositions: [],
      error: null,
    };

    coordinator.setCachedTab('all', 'THB', {
      portfolioData: cloudHoldings,
      prices: new Map(),
      timestamp: Date.now(),
    });
    expect(coordinator.cacheSize()).toBe(1);
    expect(coordinator.getCachedTab('all', 'THB')?.portfolioData.summary.totalValue).toBe(6000);

    // Switch cloud -> local
    authService.canViewCloudPortfolio.set(false);
    TestBed.flushEffects();

    expect(coordinator.activeSource()).toBe('local');
    expect(coordinator.cacheSize()).toBe(0);
    expect(coordinator.getCachedTab('all', 'THB')).toBeNull();

    // Switch back to cloud, populate, then resetForSignOut()
    authService.canViewCloudPortfolio.set(true);
    TestBed.flushEffects();
    coordinator.setCachedTab('all', 'THB', {
      portfolioData: cloudHoldings,
      prices: new Map(),
      timestamp: Date.now(),
    });
    expect(coordinator.cacheSize()).toBe(1);
    coordinator.resetForSignOut();
    expect(coordinator.cacheSize()).toBe(0);
  });

  it('computes real local performance & allocation via LocalPortfolioProvider and attaches pricesError warnings', async () => {
    const localPortfolio = TestBed.inject(LocalPortfolioService);
    const coordinator = TestBed.inject(PortfolioSourceCoordinator);

    localPortfolio.addTransaction({
      symbol: 'AAPL',
      date: '2025-01-10',
      quantity: 10,
      price: 100,
      currency: 'USD',
      assetType: 'us-stock',
      txType: 'BUY',
    });
    localPortfolio.prices.set(
      new Map([['AAPL', { symbol: 'AAPL', name: 'Apple Inc.', price: 150, currency: 'USD' }]])
    );
    localPortfolio.exchangeRate.set(35);
    localPortfolio.pricesError.set(apiErr('upstream', 503, 'Live quotes unavailable', true));

    const perfRes = await firstValueFrom(coordinator.getPerformance('ALL', '', '', 'USD', 'en'));
    expect(perfRes.ok).toBe(true);
    if (perfRes.ok) {
      expect(perfRes.data.symbolPerformance).toHaveLength(1);
      expect(perfRes.data.symbolPerformance[0].totalReturn).toBeCloseTo(500, 2);
      expect(perfRes.warnings).toEqual(['Live quotes unavailable']);
    }

    const allocRes = await firstValueFrom(
      coordinator.getAllocation(
        { 'us-stock': 100, 'thai-stock': 0, crypto: 0, 'mutual-fund': 0, bond: 0, 'provident-fund': 0 },
        'USD',
        'en'
      )
    );
    expect(allocRes.ok).toBe(true);
    if (allocRes.ok) {
      expect(allocRes.data.totalPortfolioValue).toBeCloseTo(1500, 2);
      expect(allocRes.data.currencyExposure.usdPercent).toBeCloseTo(100, 2);
      expect(allocRes.warnings).toEqual(['Live quotes unavailable']);
    }
  });
});
