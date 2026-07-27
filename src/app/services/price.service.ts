import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';

export interface PriceData {
  symbol: string;
  name?: string;
  price: number;
  currency: string;
}

/** Maps internal .CRYPTO symbols to CoinGecko IDs */
const CRYPTO_COINGECKO_MAP: Record<string, { id: string; name: string }> = {
  'BTC.CRYPTO': { id: 'bitcoin', name: 'Bitcoin' },
  'PAXG.CRYPTO': { id: 'pax-gold', name: 'PAX Gold' },
};

@Injectable({
  providedIn: 'root',
})
export class PriceService {
  private readonly http = inject(HttpClient);

  /** Fetch prices for all symbols AND the USD/THB exchange rate in parallel */
  fetchPricesAndRate(symbols: string[]): Observable<{ prices: Map<string, PriceData>; rate: number }> {
    return forkJoin({
      prices: this.fetchPrices(symbols),
      rate: this.fetchExchangeRate(),
    });
  }

  /** Fetch the live USD→THB exchange rate from Yahoo Finance */
  fetchExchangeRate(): Observable<number> {
    const url = `/api/finance/v8/finance/chart/${encodeURIComponent('USDTHB=X')}?range=1d&interval=1d&includePrePost=false`;
    return this.http.get<any>(url).pipe(
      map((res) => res?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0),
      catchError(() => of(0)),
    );
  }

  fetchPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    if (symbols.length === 0) return of(new Map());

    const uniqueSymbols = [...new Set(symbols)];
    const stockSymbols = uniqueSymbols.filter((s) => !s.endsWith('.CRYPTO'));
    const cryptoSymbols = uniqueSymbols.filter((s) => s.endsWith('.CRYPTO'));

    const requests: Observable<Map<string, PriceData>>[] = [];

    if (stockSymbols.length > 0) {
      requests.push(this.fetchStockPrices(stockSymbols));
    }

    if (cryptoSymbols.length > 0) {
      requests.push(this.fetchCryptoPrices(cryptoSymbols));
    }

    if (requests.length === 0) return of(new Map());

    return forkJoin(requests).pipe(
      map((maps) => {
        const merged = new Map<string, PriceData>();
        for (const m of maps) {
          m.forEach((v, k) => merged.set(k, v));
        }
        return merged;
      }),
    );
  }

  /** Fetch stock prices from Yahoo Finance via proxy */
  private fetchStockPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const requests = symbols.map((symbol) => {
      const yahooSymbol = this.toYahooSymbol(symbol);
      const url = `/api/finance/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d&includePrePost=false`;

      return this.http.get<any>(url).pipe(
        map((res) => {
          const meta = res?.chart?.result?.[0]?.meta;
          return {
            symbol,
            name: meta?.shortName || meta?.longName || '',
            price: meta?.regularMarketPrice ?? 0,
            currency: meta?.currency ?? 'USD',
          } as PriceData;
        }),
        catchError(() => of({ symbol, name: '', price: 0, currency: '' } as PriceData)),
      );
    });

    return forkJoin(requests).pipe(
      map((results) => {
        const priceMap = new Map<string, PriceData>();
        for (const r of results) {
          if (r.price > 0) {
            priceMap.set(r.symbol, r);
          }
        }
        return priceMap;
      }),
    );
  }

  /**
   * Fetch crypto prices from CoinGecko in THB.
   * Uses a single batch request for all crypto symbols.
   */
  private fetchCryptoPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const ids = symbols
      .map((s) => CRYPTO_COINGECKO_MAP[s]?.id)
      .filter((id) => !!id);

    if (ids.length === 0) return of(new Map());

    const url = `/api/coingecko/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=thb`;

    return this.http.get<Record<string, { thb: number }>>(url).pipe(
      map((res) => {
        const priceMap = new Map<string, PriceData>();

        for (const symbol of symbols) {
          const gecko = CRYPTO_COINGECKO_MAP[symbol];
          if (gecko && res[gecko.id]?.thb) {
            priceMap.set(symbol, {
              symbol,
              name: gecko.name,
              price: res[gecko.id].thb,
              currency: 'THB',
            });
          }
        }

        return priceMap;
      }),
      catchError(() => of(new Map<string, PriceData>())),
    );
  }

  private toYahooSymbol(symbol: string): string {
    return symbol;
  }
}
