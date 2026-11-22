import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../config/api-config.token';
import {
  ApiResult,
  apiErr,
  apiOk,
  mapHttpErrorToApiFailure,
} from '../models/api-result.model';
import {
  PortfolioAllocationResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  TargetAllocation,
} from '../models/portfolio.model';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private get baseUrl(): string {
    return `${this.apiBaseUrl}/portfolio`;
  }

  fetchHoldings(
    tabId: string = 'all',
    currency: 'USD' | 'THB' = 'THB'
  ): Observable<ApiResult<PortfolioHoldingsResponse>> {
    return this.http
      .get<PortfolioHoldingsResponse>(
        `${this.baseUrl}/holdings?tab_id=${encodeURIComponent(tabId)}&currency=${encodeURIComponent(currency)}`
      )
      .pipe(
        map((res) =>
          res?.error
            ? apiErr('upstream', 502, res.error, true)
            : apiOk(res)
        ),
        catchError((err) =>
          of(mapHttpErrorToApiFailure(err, 'Failed to fetch portfolio holdings from backend.'))
        )
      );
  }

  fetchPerformance(
    timeframe: string = 'ALL',
    startDate: string = '',
    endDate: string = '',
    currency: 'USD' | 'THB' = 'THB'
  ): Observable<ApiResult<PortfolioPerformanceResponse>> {
    let url = `${this.baseUrl}/performance?timeframe=${encodeURIComponent(timeframe)}&currency=${encodeURIComponent(currency)}`;
    if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

    return this.http.get<PortfolioPerformanceResponse>(url).pipe(
      map((res) =>
        res?.error
          ? apiErr('upstream', 502, res.error, true)
          : apiOk(res)
      ),
      catchError((err) =>
        of(mapHttpErrorToApiFailure(err, 'Failed to fetch performance analytics from backend.'))
      )
    );
  }

  fetchAllocation(
    targetAllocation?: TargetAllocation,
    currency: 'USD' | 'THB' = 'THB'
  ): Observable<ApiResult<PortfolioAllocationResponse>> {
    const body = targetAllocation ? { targetAllocation } : {};
    return this.http
      .post<PortfolioAllocationResponse>(
        `${this.baseUrl}/allocation?currency=${encodeURIComponent(currency)}`,
        body
      )
      .pipe(
        map((res) =>
          res?.error
            ? apiErr('upstream', 502, res.error, true)
            : apiOk(res)
        ),
        catchError((err) =>
          of(mapHttpErrorToApiFailure(err, 'Failed to fetch allocation data from backend.'))
        )
      );
  }
}
