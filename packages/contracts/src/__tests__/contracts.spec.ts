import { describe, expect, it } from 'vitest';
import {
  AuthMeResponse,
  PortfolioAllocationResponse,
  PortfolioDividendResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  SheetResult,
  apiErr,
  apiOk,
  isHttpErrorLike,
  mapHttpErrorToApiFailure,
} from '../index';

describe('@sgsk-wealth/contracts', () => {
  describe('ApiResult helpers and HTTP error mapping', () => {
    it('constructs success and failure envelopes deterministically', () => {
      const ok = apiOk({ count: 3 }, ['partial quotes']);
      expect(ok).toEqual({ ok: true, data: { count: 3 }, warnings: ['partial quotes'] });

      const cleanOk = apiOk({ count: 3 });
      expect(cleanOk).toEqual({ ok: true, data: { count: 3 } });

      const err = apiErr('forbidden', 403, 'Owner role required', false);
      expect(err).toEqual({
        ok: false,
        kind: 'forbidden',
        status: 403,
        message: 'Owner role required',
        retryable: false,
      });
    });

    it('maps structural HttpErrorLike responses without framework dependencies', () => {
      expect(isHttpErrorLike({ status: 401 })).toBe(true);
      expect(isHttpErrorLike(new Error('boom'))).toBe(false);
      expect(isHttpErrorLike(null)).toBe(false);

      expect(
        mapHttpErrorToApiFailure({ status: 401, error: { detail: 'Session expired' } })
      ).toEqual({
        ok: false,
        kind: 'unauthorized',
        status: 401,
        message: 'Session expired',
        retryable: false,
      });

      expect(
        mapHttpErrorToApiFailure({ status: 403, error: { error: 'Forbidden resource' } })
      ).toEqual({
        ok: false,
        kind: 'forbidden',
        status: 403,
        message: 'Forbidden resource',
        retryable: false,
      });

      expect(
        mapHttpErrorToApiFailure({ status: 422, error: { message: 'Invalid currency' } })
      ).toEqual({
        ok: false,
        kind: 'validation',
        status: 422,
        message: 'Invalid currency',
        retryable: false,
      });

      expect(mapHttpErrorToApiFailure({ status: 429, message: 'Too Many Requests' })).toEqual({
        ok: false,
        kind: 'rate_limited',
        status: 429,
        message: 'Too Many Requests',
        retryable: true,
      });

      expect(mapHttpErrorToApiFailure({ status: 503, error: 'Upstream unavailable' })).toEqual({
        ok: false,
        kind: 'upstream',
        status: 503,
        message: 'Upstream unavailable',
        retryable: true,
      });

      expect(mapHttpErrorToApiFailure({ status: 0 }, 'Network unreachable')).toEqual({
        ok: false,
        kind: 'network',
        status: 0,
        message: 'Network unreachable',
        retryable: true,
      });

      expect(mapHttpErrorToApiFailure({ status: 500, message: 'Internal Server Error' })).toEqual({
        ok: false,
        kind: 'unknown',
        status: 500,
        message: 'Internal Server Error',
        retryable: true,
      });

      expect(mapHttpErrorToApiFailure(new Error('Unexpected failure'))).toEqual({
        ok: false,
        kind: 'unknown',
        status: 0,
        message: 'Unexpected failure',
        retryable: true,
      });
    });
  });

  describe('Rust backend serde(rename_all = "camelCase") JSON contracts', () => {
    it('accepts serialized AuthMeResponse JSON payload', () => {
      const json = JSON.stringify({
        authenticated: true,
        userId: 'usr-123',
        email: 'owner@example.com',
        role: 'owner',
        providers: ['google'],
        canViewCloudPortfolio: true,
        portfolioSource: 'google_sheets',
      });
      const parsed = JSON.parse(json) as AuthMeResponse;
      expect(parsed.authenticated).toBe(true);
      expect(parsed.canViewCloudPortfolio).toBe(true);
      expect(parsed.portfolioSource).toBe('google_sheets');
    });

    it('accepts serialized PortfolioHoldingsResponse JSON payload', () => {
      const json = JSON.stringify({
        currency: 'THB',
        exchangeRate: 34.5,
        tabId: 'all',
        summary: {
          totalInvested: 1000,
          totalValue: 1200,
          openInvested: 1000,
          closedInvested: 0,
          totalUnrealizedPL: 200,
          totalUnrealizedPLPercent: 20,
          totalRealizedPL: 0,
          totalRealizedPLPercent: 0,
          totalReturn: 200,
          totalReturnPercent: 20,
        },
        openPositions: [],
        closedPositions: [],
        error: null,
      });
      const parsed = JSON.parse(json) as PortfolioHoldingsResponse;
      expect(parsed.tabId).toBe('all');
      expect(parsed.summary.totalUnrealizedPL).toBe(200);
      expect(parsed.error).toBeNull();
    });

    it('accepts serialized PortfolioPerformanceResponse JSON payload', () => {
      const json = JSON.stringify({
        timeframe: 'ALL',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'USD',
        exchangeRate: 34.5,
        summary: {
          totalInvested: 100,
          totalValue: 110,
          openInvested: 100,
          closedInvested: 0,
          totalUnrealizedPL: 10,
          totalUnrealizedPLPercent: 10,
          totalRealizedPL: 0,
          totalRealizedPLPercent: 0,
          totalReturn: 10,
          totalReturnPercent: 10,
        },
        assetTypePerformance: [],
        topGainers: [],
        topLosers: [],
        symbolPerformance: [],
        error: null,
      });
      const parsed = JSON.parse(json) as PortfolioPerformanceResponse;
      expect(parsed.timeframe).toBe('ALL');
      expect(parsed.symbolPerformance).toEqual([]);
    });

    it('accepts serialized PortfolioAllocationResponse JSON payload', () => {
      const json = JSON.stringify({
        currency: 'THB',
        exchangeRate: 34.5,
        totalPortfolioValue: 50000,
        recommendations: [
          {
            assetType: 'us-stock',
            label: 'U.S. Stock',
            currentValue: 20000,
            actualPercent: 40,
            targetPercent: 50,
            rebalanceAmount: 5000,
            deviationPercent: -10,
            action: 'BUY',
          },
        ],
        currencyExposure: { usd: 20000, thb: 30000, usdPercent: 40, thbPercent: 60 },
        holdingsConcentration: [],
        error: null,
      });
      const parsed = JSON.parse(json) as PortfolioAllocationResponse;
      expect(parsed.totalPortfolioValue).toBe(50000);
      expect(parsed.recommendations[0].action).toBe('BUY');
    });

    it('accepts serialized PortfolioDividendResponse JSON payload', () => {
      const json = JSON.stringify({
        currency: 'USD',
        exchangeRate: 34.5,
        totalGrossDividends: 100,
        totalNetDividends: 85,
        totalWithholdingTax: 15,
        effectiveTaxRate: 15,
        projectedAnnualDividends: 85,
        portfolioDividendYield: 2.5,
        portfolioYieldOnCost: 3.0,
        annualDividends: [],
        monthlyDividends: [],
        assetTypeSummaries: [],
        symbolSummaries: [],
        records: [],
        error: null,
      });
      const parsed = JSON.parse(json) as PortfolioDividendResponse;
      expect(parsed.effectiveTaxRate).toBe(15);
      expect(parsed.records).toEqual([]);
    });

    it('accepts serialized SheetResult JSON payload with totalRealizedPLByCurrency rename', () => {
      const json = JSON.stringify({
        summaries: [],
        closedSummaries: [],
        totalCostByCurrency: { USD: 1000 },
        totalProceedsByCurrency: { USD: 0 },
        totalRealizedPLByCurrency: { USD: 0 },
        totalSymbols: 1,
        totalLots: 1,
        error: null,
        isClosed: false,
      });
      const parsed = JSON.parse(json) as SheetResult;
      expect(parsed.totalRealizedPLByCurrency['USD']).toBe(0);
      expect(parsed.isClosed).toBe(false);
    });
  });
});
