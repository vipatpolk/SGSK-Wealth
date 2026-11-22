import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../config/api-config.token';
import {
  ApiResult,
  apiErr,
  apiOk,
  mapHttpErrorToApiFailure,
} from '../models/api-result.model';
import { PortfolioDividendResponse } from '../models/dividend.model';

@Injectable({
  providedIn: 'root',
})
export class DividendService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private get apiUrl(): string {
    return `${this.apiBaseUrl}/portfolio/dividend`;
  }

  getDividendAnalytics(
    currency: 'USD' | 'THB' = 'THB',
    tabId: string = 'all'
  ): Observable<ApiResult<PortfolioDividendResponse>> {
    const params = new HttpParams()
      .set('currency', currency)
      .set('tab_id', tabId);

    return this.http.get<PortfolioDividendResponse>(this.apiUrl, { params }).pipe(
      map((res) =>
        res?.error
          ? apiErr('upstream', 502, res.error, true)
          : apiOk(res)
      ),
      catchError((err) =>
        of(mapHttpErrorToApiFailure(err, 'Failed to fetch dividend analytics from backend.'))
      )
    );
  }
}
