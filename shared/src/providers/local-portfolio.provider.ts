import { Injectable, inject, untracked } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResult, apiOk } from '../models/api-result.model';
import { PortfolioDataSource } from '../models/auth.model';
import { PortfolioDividendResponse } from '../models/dividend.model';
import {
  PortfolioAllocationResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  TargetAllocation,
} from '../models/portfolio.model';
import { AppLang } from '../services/i18n.service';
import { LocalPortfolioService } from '../services/local-portfolio.service';
import { PortfolioDataProvider } from './portfolio-data.provider';

@Injectable({
  providedIn: 'root',
})
export class LocalPortfolioProvider implements PortfolioDataProvider {
  readonly source: PortfolioDataSource = 'local';

  private readonly localPortfolio = inject(LocalPortfolioService);

  getHoldings(
    tabId: string,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioHoldingsResponse>> {
    return this.wrapLocal(() => this.localPortfolio.getHoldings(tabId, currency, lang));
  }

  getPerformance(
    timeframe: string,
    startDate: string,
    endDate: string,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioPerformanceResponse>> {
    return this.wrapLocal(() =>
      this.localPortfolio.getPerformance(timeframe, startDate, endDate, currency, lang)
    );
  }

  getAllocation(
    targetAllocation: TargetAllocation | undefined,
    currency: 'USD' | 'THB',
    lang: AppLang
  ): Observable<ApiResult<PortfolioAllocationResponse>> {
    return this.wrapLocal(() => this.localPortfolio.getAllocation(targetAllocation, currency, lang));
  }

  getDividends(
    currency: 'USD' | 'THB',
    _tabId: string,
    lang: AppLang
  ): Observable<ApiResult<PortfolioDividendResponse>> {
    return this.wrapLocal(() => this.localPortfolio.getDividends(currency, lang));
  }

  private wrapLocal<T>(compute: () => T): Observable<ApiResult<T>> {
    return untracked(() => {
      const data = compute();
      const pricesErr = this.localPortfolio.pricesError();
      const warnings = pricesErr ? [pricesErr.message] : undefined;
      return of(apiOk(data, warnings));
    });
  }
}
