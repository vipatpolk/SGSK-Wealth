import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { FundFactsheetResponse } from '../models/factsheet.model';
import { PriceData } from './price.service';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/backend/nav';
  private readonly factsheetCache = new Map<string, FundFactsheetResponse>();

  fetchFundNAVs(symbols: string[]): Observable<Map<string, PriceData>> {
    if (!symbols || symbols.length === 0) {
      return of(new Map<string, PriceData>());
    }

    const batchSize = environment.maxBatchSize || 50;
    const chunks: string[][] = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      chunks.push(symbols.slice(i, i + batchSize));
    }

    const requests$ = chunks.map((chunk) =>
      this.http.post<{ [key: string]: PriceData }>(`${this.baseUrl}/fetch`, { symbols: chunk })
    );

    return forkJoin(requests$).pipe(
      map((responses) => {
        const mergedMap = new Map<string, PriceData>();
        for (const resp of responses) {
          if (resp) {
            for (const key of Object.keys(resp)) {
              mergedMap.set(key, resp[key]);
            }
          }
        }
        return mergedMap;
      })
    );
  }

  fetchFundFactsheet(
    symbol: string,
    assetType = 'mutual-fund',
    fundName?: string,
    forceRefresh = false,
  ): Observable<FundFactsheetResponse> {
    const cleanSymbol = (symbol || '').trim();
    const cleanType = (assetType || 'mutual-fund').trim().toLowerCase();
    const cleanFundName = (fundName || '').trim();
    const cacheKey = `${cleanType}::${cleanSymbol.toUpperCase()}::${cleanFundName}`;

    if (!forceRefresh) {
      const cached = this.factsheetCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    let params = new HttpParams().set('symbol', cleanSymbol).set('asset_type', cleanType);
    if (cleanFundName) {
      params = params.set('fund_name', cleanFundName);
    }

    return this.http.get<FundFactsheetResponse>(`${this.baseUrl}/factsheet`, { params }).pipe(
      tap((res) => {
        if (res) {
          this.factsheetCache.set(cacheKey, res);
        }
      }),
    );
  }
}
