import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of, map, catchError, delay, concatMap, from, toArray } from 'rxjs';
import { PriceData } from './price.service';

/** SEC Open API configuration */
const SEC_API_CONFIG = {
  /** Replace with your SEC Open Data subscription key */
  subscriptionKey: 'your_sec_subscription_key_here',
  baseUrl: '/api/sec/v2/fund',
};

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

    // Fetch NAVs sequentially with a small delay to respect rate limits (max 5 req/sec)
    return from(uniqueSymbols).pipe(
      concatMap((symbol) => {
        const cleanSymbol = symbol.replace(/\.BKFUND$/i, '').trim();
        const symUpper = cleanSymbol.toUpperCase();

        // Step 1: Fetch profile dynamically using clean symbol
        return this.http
          .get<{ items?: SecProfileItem[] }>(
            `${SEC_API_CONFIG.baseUrl}/general-info/profiles?fund_class_name=${encodeURIComponent(cleanSymbol)}`,
            { headers, observe: 'response' }
          )
          .pipe(
            concatMap((res: HttpResponse<{ items?: SecProfileItem[] }>) => {
              const classItems: SecProfileItem[] = res.body?.items || [];
              // Check if any returned item is an exact match for this clean symbol
              const classMatch = classItems.find(
                (i) =>
                  i.fund_class_name?.toUpperCase() === symUpper ||
                  i.proj_abbr_name?.toUpperCase() === symUpper
              );

              if (classMatch) {
                return of(classMatch);
              }

              // If no exact match or 204 No Content, fallback to project_info query
              return this.http
                .get<{ items?: SecProfileItem[] }>(
                  `${SEC_API_CONFIG.baseUrl}/general-info/profiles?project_info=${encodeURIComponent(cleanSymbol)}`,
                  { headers }
                )
                .pipe(
                  map((res2) => {
                    const projItems: SecProfileItem[] = res2?.items || [];
                    if (projItems.length === 0) return null;
                    // Prioritize exact matches
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
            concatMap((profile) => {
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

              // Step 2: Fetch NAV using dynamically obtained proj_id
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30); // Fetch last 30 days to ensure recent NAV across weekends & holidays
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
                    filteredData = data; // Fallback
                  }

                  // Sort by nav_date descending to get the latest
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
            }),
            catchError((err) => {
              console.warn(`[NavService] Failed to fetch profile data for ${cleanSymbol}:`, err?.status);
              return of({
                originalSymbol: symbol,
                data: { symbol, name: cleanSymbol, price: 0, currency: 'THB' },
              });
            }),
            delay(250) // 250ms delay between requests
          );
      }),
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
}
