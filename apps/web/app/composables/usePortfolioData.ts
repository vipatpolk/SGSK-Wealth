import type {
  PortfolioAllocationResponse,
  PortfolioDividendResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  PriceData,
  SymbolTransactionSummary,
} from '@sgsk-wealth/contracts';
import {
  buildLocalAllocationResponse,
  buildLocalDividendResponse,
  buildLocalHoldingsResponse,
  buildLocalPerformanceResponse,
  processLocalTransactionsFifo,
} from '@sgsk-wealth/domain';

export function usePortfolioData() {
  const { authState } = useAuth();
  const { settings } = useUserSettings();
  const { transactions } = useLocalPortfolio();
  const { request } = useApiClient();

  const exchangeRate = useState<number>('fx-usd-thb', () => 34.5);
  const hasRate = useState<boolean>('fx-has-rate', () => false);
  const activeTab = useState<string>('active-asset-tab', () => 'all');
  const loading = useState<boolean>('portfolio-loading', () => false);
  const errorMessage = useState<string | null>('portfolio-error', () => null);
  const isUnauthorizedError = useState<boolean>('portfolio-unauth-error', () => false);
  const pricesError = useState<boolean>('portfolio-prices-error', () => false);
  const pricesMap = useState<Map<string, PriceData>>('prices-map', () => new Map());

  const cloudHoldings = useState<PortfolioHoldingsResponse | null>('cloud-holdings', () => null);
  const cloudDividends = useState<PortfolioDividendResponse | null>('cloud-dividends', () => null);
  const cloudAllocation = useState<PortfolioAllocationResponse | null>('cloud-allocation', () => null);
  const cloudPerformance = useState<PortfolioPerformanceResponse | null>('cloud-performance', () => null);

  watch(
    [() => authState.value.portfolioSource, () => authState.value.accessToken],
    ([source, token]) => {
      cloudHoldings.value = null;
      cloudDividends.value = null;
      cloudAllocation.value = null;
      cloudPerformance.value = null;
      if (source === 'google_sheets' && token) {
        void refreshAll();
      }
    },
  );

  async function refreshExchangeRate() {
    try {
      const res = await request<{ rate: string | number }>('/price/exchange-rate', {
        query: { from_currency: 'USD', to_currency: 'THB' },
      });
      const parsed = Number(res.rate);
      if (Number.isFinite(parsed) && parsed > 0) {
        exchangeRate.value = parsed;
        hasRate.value = true;
      }
    } catch {
      // Keep cached/default rate when offline
    }
  }

  const holdings = computed<PortfolioHoldingsResponse>(() => {
    if (authState.value.portfolioSource === 'google_sheets' && cloudHoldings.value) {
      return cloudHoldings.value;
    }
    return buildLocalHoldingsResponse(
      transactions.value,
      activeTab.value,
      settings.value.currency,
      pricesMap.value,
      exchangeRate.value,
      settings.value.language,
    );
  });

  const transactionSummaries = computed<SymbolTransactionSummary[]>(() => {
    if (
      authState.value.portfolioSource === 'google_sheets' &&
      cloudHoldings.value?.transactionSummaries
    ) {
      return cloudHoldings.value.transactionSummaries;
    }
    return processLocalTransactionsFifo(transactions.value).transactionSummaries;
  });

  const dividends = computed<PortfolioDividendResponse>(() => {
    if (authState.value.portfolioSource === 'google_sheets' && cloudDividends.value) {
      return cloudDividends.value;
    }
    return buildLocalDividendResponse(
      transactions.value,
      settings.value.currency,
      pricesMap.value,
      exchangeRate.value,
      settings.value.language,
    );
  });

  async function refreshLocalPrices() {
    const { openSummaries } = processLocalTransactionsFifo(transactions.value);
    if (openSummaries.length === 0) {
      await refreshExchangeRate();
      return;
    }

    const seen = new Set<string>();
    const summaries: { symbol: string; assetType?: string }[] = [];
    for (const s of openSummaries) {
      if (!seen.has(s.symbol)) {
        seen.add(s.symbol);
        summaries.push({ symbol: s.symbol, assetType: s.assetType });
      }
    }

    const merged = new Map<string, PriceData>();
    let hadPriceFailure = false;
    for (let i = 0; i < summaries.length; i += 50) {
      const chunk = summaries.slice(i, i + 50);
      try {
        const resp = await request<{ prices?: Record<string, PriceData>; rate?: number }>(
          '/price/fetch-prices',
          {
            method: 'POST',
            body: { summaries: chunk },
          },
        );
        if (resp?.rate && Number(resp.rate) > 0) {
          exchangeRate.value = Number(resp.rate);
          hasRate.value = true;
        }
        if (resp?.prices) {
          for (const [k, v] of Object.entries(resp.prices)) {
            merged.set(k, v);
          }
        }
      } catch {
        hadPriceFailure = true;
      }
    }
    pricesError.value = hadPriceFailure;
    if (merged.size > 0) {
      pricesMap.value = merged;
    }
  }

  watch(
    () => transactions.value,
    () => {
      if (authState.value.portfolioSource === 'local') {
        void refreshLocalPrices();
      }
    },
  );

  const allocation = computed<PortfolioAllocationResponse>(() => {
    if (authState.value.portfolioSource === 'google_sheets' && cloudAllocation.value) {
      return cloudAllocation.value;
    }
    return buildLocalAllocationResponse(
      transactions.value,
      settings.value.targetAllocations,
      settings.value.currency,
      pricesMap.value,
      exchangeRate.value,
      settings.value.language,
    );
  });

  function getPerformance(timeframe = 'ALL', startDate = '', endDate = ''): PortfolioPerformanceResponse {
    if (authState.value.portfolioSource === 'google_sheets' && cloudPerformance.value) {
      return cloudPerformance.value;
    }
    return buildLocalPerformanceResponse(
      transactions.value,
      timeframe,
      startDate,
      endDate,
      settings.value.currency,
      pricesMap.value,
      exchangeRate.value,
      settings.value.language,
    );
  }

  async function refreshAll() {
    loading.value = true;
    errorMessage.value = null;
    isUnauthorizedError.value = false;
    try {
      if (authState.value.backendError) {
        await useAuth().refreshSession();
      }
      if (authState.value.backendError) {
        errorMessage.value = authState.value.backendError;
        return;
      }
      await refreshExchangeRate();
      if (authState.value.portfolioSource === 'google_sheets' && authState.value.accessToken) {
        const authOpts = {
          bearerToken: authState.value.accessToken,
          userId: authState.value.userId,
        };
        const curr = settings.value.currency;
        const tab = activeTab.value;
        const allocBody = settings.value.targetAllocations
          ? { targetAllocation: settings.value.targetAllocations }
          : {};
        const [h, d, a, p] = await Promise.all([
          request<PortfolioHoldingsResponse>('/portfolio/holdings', {
            ...authOpts,
            query: { tab_id: tab, currency: curr },
          }),
          request<PortfolioDividendResponse>('/portfolio/dividend', {
            ...authOpts,
            query: { tab_id: tab, currency: curr },
          }),
          request<PortfolioAllocationResponse>('/portfolio/allocation', {
            ...authOpts,
            method: 'POST',
            body: allocBody,
            query: { currency: curr },
          }),
          request<PortfolioPerformanceResponse>('/portfolio/performance', {
            ...authOpts,
            query: { timeframe: 'ALL', currency: curr },
          }),
        ]);
        cloudHoldings.value = h;
        cloudDividends.value = d;
        cloudAllocation.value = a;
        cloudPerformance.value = p;
        if (h.exchangeRate > 0) {
          exchangeRate.value = h.exchangeRate;
          hasRate.value = true;
        }
      } else {
        await refreshLocalPrices();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load portfolio data';
      errorMessage.value = msg;
      isUnauthorizedError.value = /401|unauthorized|expired/i.test(msg);
    } finally {
      loading.value = false;
    }
  }

  async function refreshPerformance(timeframe: string, startDate = '', endDate = '') {
    if (authState.value.portfolioSource !== 'google_sheets' || !authState.value.accessToken) return;
    try {
      cloudPerformance.value = await request<PortfolioPerformanceResponse>('/portfolio/performance', {
        bearerToken: authState.value.accessToken,
        userId: authState.value.userId,
        query: {
          timeframe,
          currency: settings.value.currency,
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        },
      });
    } catch {
      // Keep existing performance snapshot on transient error
    }
  }

  return {
    exchangeRate,
    hasRate,
    pricesMap,
    pricesError,
    activeTab,
    loading,
    errorMessage,
    isUnauthorizedError,
    holdings,
    transactionSummaries,
    dividends,
    allocation,
    getPerformance,
    refreshPerformance,
    refreshAll,
  };
}
