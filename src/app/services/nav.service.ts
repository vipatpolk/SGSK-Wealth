import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError, delay, concatMap, from, toArray } from 'rxjs';
import { PriceData } from './price.service';

/** SEC Open API configuration */
const SEC_API_CONFIG = {
  /** Replace with your SEC Open Data subscription key */
  subscriptionKey: 'your_sec_subscription_key_here',
  baseUrl: '/api/sec/v2/fund/daily-info/nav',
};

/** Maps fund symbols to SEC proj_id values */
const FUND_PROJ_ID_MAP: Record<string, { projId: string; name: string }> = {
  'ES-GTECHSSF': { projId: 'M0499_2563', name: 'Eastspring Global Technology SSF' },
  'SCBGOLDH-SSF': { projId: 'M0856_2553', name: 'SCB GOLD THB HEDGED OPEN END FUND' },
  'UGSTAR-SSF-D': { projId: 'M0232_2563', name: 'United Global Stars Equity Fund' },
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

    const uniqueSymbols = [...new Set(symbols)].filter((s) => FUND_PROJ_ID_MAP[s]);
    if (uniqueSymbols.length === 0) return of(new Map());

    const headers = new HttpHeaders({
      'Ocp-Apim-Subscription-Key': SEC_API_CONFIG.subscriptionKey,
    });

    // Fetch NAVs sequentially with a small delay to respect rate limits (max 5 req/sec)
    return from(uniqueSymbols).pipe(
      concatMap((symbol) => {
        const fund = FUND_PROJ_ID_MAP[symbol];
        
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 14); // Fetch last 14 days to ensure we get a recent NAV
        const fmtDate = (d: Date) => d.toISOString().split('T')[0];
        
        const url = `${SEC_API_CONFIG.baseUrl}?proj_id=${encodeURIComponent(fund.projId)}&start_nav_date=${fmtDate(start)}&end_nav_date=${fmtDate(end)}`;

        return this.http.get<any>(url, { headers }).pipe(
          map((res) => {
            const data = res?.items ?? res; // Handle both {items: [...]} and [...] responses
            
            if (!data || !Array.isArray(data) || data.length === 0) {
              return { symbol, name: fund.name, price: 0, currency: 'THB' } as PriceData;
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
              symbol: latest.fund_class_name && latest.fund_class_name !== 'main' ? latest.fund_class_name : symbol,
              name: fund.name,
              price: typeof nav === 'string' ? parseFloat(nav) : nav,
              currency: 'THB',
            } as any;
          }),
          catchError((err) => {
            console.warn(`[NavService] Failed to fetch NAV for ${symbol}:`, err?.status);
            return of({ originalSymbol: symbol, symbol, name: fund.name, price: 0, currency: 'THB' } as any);
          }),
          delay(250), // 250ms delay between requests
        );
      }),
      toArray(),
      map((results) => {
        const priceMap = new Map<string, PriceData>();
        for (const r of results) {
          if (r.price > 0) {
            priceMap.set(r.originalSymbol, r as PriceData);
            delete r.originalSymbol;
          }
        }
        return priceMap;
      }),
    );
  }
}
