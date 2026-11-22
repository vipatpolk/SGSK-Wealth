import { Observable } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { PortfolioDataSource } from '../models/auth.model';
import { PortfolioDividendResponse } from '../models/dividend.model';
import {
  PortfolioAllocationResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  TargetAllocation,
} from '../models/portfolio.model';
import { AppLang } from '../services/i18n.service';
import { PriceData } from '../services/price.service';

export interface TabCacheEntry {
  portfolioData: PortfolioHoldingsResponse;
  prices: Map<string, PriceData>;
  timestamp: number;
}

export interface PortfolioDataProvider {
  readonly source: PortfolioDataSource;

  getHoldings(
    tabId: string,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioHoldingsResponse>>;

  getPerformance(
    timeframe: string,
    startDate: string,
    endDate: string,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioPerformanceResponse>>;

  getAllocation(
    targetAllocation: TargetAllocation | undefined,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioAllocationResponse>>;

  getDividends(
    currency: 'USD' | 'THB',
    tabId: string,
    lang: AppLang
  ): Observable<ApiResult<PortfolioDividendResponse>>;
}
