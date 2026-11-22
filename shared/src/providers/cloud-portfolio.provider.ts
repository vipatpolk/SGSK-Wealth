import { Injectable, inject } from '@angular/core';
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
import { DividendService } from '../services/dividend.service';
import { AppLang } from '../services/i18n.service';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioDataProvider } from './portfolio-data.provider';

@Injectable({
  providedIn: 'root',
})
export class CloudPortfolioProvider implements PortfolioDataProvider {
  readonly source: PortfolioDataSource = 'cloud';

  private readonly portfolioService = inject(PortfolioService);
  private readonly dividendService = inject(DividendService);

  getHoldings(
    tabId: string,
    currency: 'USD' | 'THB',
    _lang: AppLang
  ): Observable<ApiResult<PortfolioHoldingsResponse>> {
    return this.portfolioService.fetchHoldings(tabId, currency);
  }

  getPerformance(
    timeframe: string,
    startDate: string,
    endDate: string,
    currency: 'USD' | 'THB',
    _lang: AppLang
  ): Observable<ApiResult<PortfolioPerformanceResponse>> {
    return this.portfolioService.fetchPerformance(timeframe, startDate, endDate, currency);
  }

  getAllocation(
    targetAllocation: TargetAllocation | undefined,
    currency: 'USD' | 'THB',
    _lang: AppLang
  ): Observable<ApiResult<PortfolioAllocationResponse>> {
    return this.portfolioService.fetchAllocation(targetAllocation, currency);
  }

  getDividends(
    currency: 'USD' | 'THB',
    tabId: string,
    _lang: AppLang
  ): Observable<ApiResult<PortfolioDividendResponse>> {
    return this.dividendService.getDividendAnalytics(currency, tabId);
  }
}
