import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of, map, catchError, switchMap, mergeMap, from, toArray } from 'rxjs';
import { PriceData } from './price.service';

/** SEC Open API configuration */
const SEC_API_CONFIG = {
  /** Replace with your SEC Open Data subscription key */
  subscriptionKey: 'your_sec_subscription_key_here',
  baseUrl: '/api/sec/v2/fund',
};

/** Max concurrent SEC API requests (rate limit is 5 req/sec) */
const SEC_MAX_CONCURRENCY = 3;

export interface SecProfileItem {
  proj_id?: string;
  proj_name_en?: string;
  proj_name_th?: string;
  proj_abbr_name?: string;
  fund_class_name?: string;
}

export interface SecNavRecord {
  nav_date: string;
  last_val?: number | string;
  fund_class_name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch latest NAV for mutual fund symbols from SEC API.
   * Strips '.BKFUND' suffix before requesting SEC API endpoints.
   * Uses parallel requests (max 3 concurrent) for better performance.
   */
  fetchFundNAVs(symbols: string[]): Observable<Map<string, PriceData>> {
    if (SEC_API_CONFIG.subscriptionKey === 'YOUR_SEC_SUBSCRIPTION_KEY') {
      console.warn('[NavService] SEC subscription key not configured. Skipping NAV fetch.');
      return of(new Map());
    }

    const uniqueSymbols = [...new Set(symbols)];
    if (uniqueSymbols.length === 0) return of(new Map());

    const headers = new HttpHeaders({
      'Ocp-Apim-Subscription-Key': SEC_API_CONFIG.subscriptionKey,
    });

    // Fetch NAVs in parallel with concurrency limit to respect rate limits
    return from(uniqueSymbols).pipe(
      mergeMap((symbol) => this.fetchSingleFundNAV(symbol, headers), SEC_MAX_CONCURRENCY),
      toArray(),
      map((results) => {
        const priceMap = new Map<string, PriceData>();
        for (const r of results) {
          if (
            r.data.price > 0 ||
            (r.data.name && r.data.name !== r.originalSymbol && r.data.name !== r.data.symbol)
          ) {
            priceMap.set(r.originalSymbol, r.data);
          }
        }
        return priceMap;
      })
    );
  }

  /**
   * Fetch profile and NAV data for a single fund symbol.
   */
  private fetchSingleFundNAV(
    symbol: string,
    headers: HttpHeaders
  ): Observable<{ originalSymbol: string; data: PriceData }> {
    const cleanSymbol = symbol.replace(/\.BKFUND$/i, '').trim();
    const symUpper = cleanSymbol.toUpperCase();

    return this.fetchFundProfile(cleanSymbol, symUpper, headers).pipe(
      switchMap((profile) => {
        if (!profile || !profile.proj_id) {
          console.warn(`[NavService] Could not find profile for ${cleanSymbol}`);
          return of({
            originalSymbol: symbol,
            data: { symbol, name: cleanSymbol, price: 0, currency: 'THB' },
          });
        }

        const fund = {
          projId: profile.proj_id,
          name: profile.proj_name_en || profile.proj_name_th || cleanSymbol,
          targetClass: profile.fund_class_name,
        };

        return this.fetchFundNAVData(symbol, cleanSymbol, symUpper, fund, headers);
      }),
      catchError((err) => {
        console.warn(`[NavService] Failed to fetch profile data for ${cleanSymbol}:`, err?.status);
        return of({
          originalSymbol: symbol,
          data: { symbol, name: cleanSymbol, price: 0, currency: 'THB' },
        });
      })
    );
  }

  /**
   * Fetch fund profile: try fund_class_name first, fallback to project_info.
   */
  private fetchFundProfile(
    cleanSymbol: string,
    symUpper: string,
    headers: HttpHeaders
  ): Observable<SecProfileItem | null> {
    return this.http
      .get<{ items?: SecProfileItem[] }>(
        `${SEC_API_CONFIG.baseUrl}/general-info/profiles?fund_class_name=${encodeURIComponent(cleanSymbol)}`,
        { headers, observe: 'response' }
      )
      .pipe(
        switchMap((res: HttpResponse<{ items?: SecProfileItem[] }>) => {
          const classItems: SecProfileItem[] = res.body?.items || [];
          const classMatch = classItems.find(
            (i) =>
              i.fund_class_name?.toUpperCase() === symUpper ||
              i.proj_abbr_name?.toUpperCase() === symUpper
          );

          if (classMatch) {
            return of(classMatch);
          }

          // Fallback to project_info query
          return this.http
            .get<{ items?: SecProfileItem[] }>(
              `${SEC_API_CONFIG.baseUrl}/general-info/profiles?project_info=${encodeURIComponent(cleanSymbol)}`,
              { headers }
            )
            .pipe(
              map((res2) => {
                const projItems: SecProfileItem[] = res2?.items || [];
                if (projItems.length === 0) return null;
                return (
                  projItems.find(
                    (i) =>
                      i.proj_abbr_name?.toUpperCase() === symUpper &&
                      i.fund_class_name === 'main'
                  ) ||
                  projItems.find((i) => i.fund_class_name?.toUpperCase() === symUpper) ||
                  projItems.find((i) => i.proj_abbr_name?.toUpperCase() === symUpper) ||
                  projItems[0]
                );
              }),
              catchError(() => of(null))
            );
        }),
        catchError(() => of(null))
      );
  }

  /**
   * Fetch NAV data for a resolved fund profile.
   */
  private fetchFundNAVData(
    symbol: string,
    cleanSymbol: string,
    symUpper: string,
    fund: { projId: string; name: string; targetClass?: string },
    headers: HttpHeaders
  ): Observable<{ originalSymbol: string; data: PriceData }> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const fmtDate = (d: Date) => d.toISOString().split('T')[0];

    const url = `${SEC_API_CONFIG.baseUrl}/daily-info/nav?proj_id=${encodeURIComponent(fund.projId)}&start_nav_date=${fmtDate(start)}&end_nav_date=${fmtDate(end)}`;

    return this.http.get<{ items?: SecNavRecord[] } | SecNavRecord[]>(url, { headers }).pipe(
      map((res) => {
        const data: SecNavRecord[] = Array.isArray(res) ? res : res?.items ?? [];

        if (!Array.isArray(data) || data.length === 0) {
          return {
            originalSymbol: symbol,
            data: { symbol, name: fund.name, price: 0, currency: 'THB' },
          };
        }

        // Filter by matching class name
        let filteredData = data.filter(
          (d) =>
            d.fund_class_name?.toUpperCase() === (fund.targetClass || cleanSymbol).toUpperCase()
        );
        if (filteredData.length === 0 && fund.targetClass !== 'main') {
          filteredData = data.filter((d) => d.fund_class_name?.toUpperCase() === symUpper);
        }
        if (filteredData.length === 0) {
          filteredData = data.filter((d) => d.fund_class_name === 'main');
        }
        if (filteredData.length === 0) {
          filteredData = data;
        }

        filteredData.sort(
          (a, b) => new Date(b.nav_date).getTime() - new Date(a.nav_date).getTime()
        );
        const latest = filteredData[0];
        const nav = latest?.last_val ?? 0;

        return {
          originalSymbol: symbol,
          data: {
            symbol: symbol,
            name: fund.name,
            price: typeof nav === 'string' ? parseFloat(nav) : nav,
            currency: 'THB',
          },
        };
      }),
      catchError((err) => {
        console.warn(`[NavService] Failed to fetch NAV for ${cleanSymbol}:`, err?.status);
        return of({
          originalSymbol: symbol,
          data: { symbol, name: fund.name, price: 0, currency: 'THB' },
        });
      })
    );
  }
}
