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

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch latest NAV for mutual fund symbols from SEC API.
   * Falls back gracefully if the API key is not configured.
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
        // Step 1: Fetch profile dynamically
        return this.http.get<any>(`${SEC_API_CONFIG.baseUrl}/general-info/profiles?fund_class_name=${encodeURIComponent(symbol)}`, { headers, observe: 'response' }).pipe(
          concatMap((res: HttpResponse<any>) => {
            // If 204 No Content, fallback to project_info
            if (res.status === 204 || !res.body || !res.body.items || res.body.items.length === 0) {
              return this.http.get<any>(`${SEC_API_CONFIG.baseUrl}/general-info/profiles?project_info=${encodeURIComponent(symbol)}`, { headers }).pipe(
                map(res2 => res2?.items?.[0])
              );
            }
            return of(res.body?.items?.[0]);
          }),
          concatMap((profile) => {
            if (!profile || !profile.proj_id) {
              console.warn(`[NavService] Could not find profile for ${symbol}`);
              return of({ originalSymbol: symbol, data: { symbol, name: symbol, price: 0, currency: 'THB' } });
            }
            
            const fund = {
              projId: profile.proj_id,
              name: profile.proj_name_en || profile.proj_name_th || symbol
            };
            
            // Step 2: Fetch NAV using dynamically obtained proj_id
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 14); // Fetch last 14 days to ensure we get a recent NAV
            const fmtDate = (d: Date) => d.toISOString().split('T')[0];
            
            const url = `${SEC_API_CONFIG.baseUrl}/daily-info/nav?proj_id=${encodeURIComponent(fund.projId)}&start_nav_date=${fmtDate(start)}&end_nav_date=${fmtDate(end)}`;

            return this.http.get<any>(url, { headers }).pipe(
              map((res) => {
                const data = res?.items ?? res; // Handle both {items: [...]} and [...] responses
                
                if (!data || !Array.isArray(data) || data.length === 0) {
                  return { originalSymbol: symbol, data: { symbol, name: fund.name, price: 0, currency: 'THB' } };
                }
                
                // Filter by class name if there are multiple classes (matches the symbol)
                let filteredData = data.filter((d: any) => d.fund_class_name === symbol);
                if (filteredData.length === 0) {
                  filteredData = data; // Fallback for single-class funds like 'main'
                }
                
                // Sort by nav_date descending to get the latest
                filteredData.sort((a, b) => new Date(b.nav_date).getTime() - new Date(a.nav_date).getTime());
                const latest = filteredData[0];
                const nav = latest.last_val ?? 0;
                
                return {
                  originalSymbol: symbol,
                  data: {
                    symbol: latest.fund_class_name && latest.fund_class_name !== 'main' ? latest.fund_class_name : symbol,
                    name: fund.name,
                    price: typeof nav === 'string' ? parseFloat(nav) : nav,
                    currency: 'THB',
                  },
                };
              }),
              catchError((err) => {
                console.warn(`[NavService] Failed to fetch NAV for ${symbol}:`, err?.status);
                return of({ originalSymbol: symbol, data: { symbol, name: fund.name, price: 0, currency: 'THB' } });
              })
            );
          }),
          catchError((err) => {
            console.warn(`[NavService] Failed to fetch profile data for ${symbol}:`, err?.status);
            return of({ originalSymbol: symbol, data: { symbol, name: symbol, price: 0, currency: 'THB' } });
          }),
          delay(250) // 250ms delay between requests
        );
      }),
      toArray(),
      map((results) => {
        const priceMap = new Map<string, PriceData>();
        for (const r of results) {
          if (r.data.price > 0) {
            priceMap.set(r.originalSymbol, r.data);
          }
        }
        return priceMap;
      })
    );
  }
}
