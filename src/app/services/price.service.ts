import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';
import { NavService } from './nav.service';
import { SymbolSummary } from '../models/transaction.model';

export interface PriceData {
  symbol: string;
  name?: string;
  price: number;
  currency: string;
}

/** Maps internal .CRYPTO symbols to Binance TH symbols */
const CRYPTO_BINANCE_MAP: Record<string, { symbol: string; name: string; currency: string }> = {
  'BTC.CRYPTO': { symbol: 'BTCTHB', name: 'Bitcoin', currency: 'THB' },
  'PAXG.CRYPTO': { symbol: 'PAXGUSDT', name: 'PAX Gold', currency: 'USD' },
};

@Injectable({
  providedIn: 'root',
})
export class PriceService {
  private readonly http = inject(HttpClient);
  private readonly navService = inject(NavService);

  /** Fetch prices for all symbols AND the USD/THB exchange rate in parallel */
  fetchPricesAndRate(summaries: { symbol: string; assetType?: string }[]): Observable<{ prices: Map<string, PriceData>; rate: number }> {
    return forkJoin({
      prices: this.fetchPrices(summaries),
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

  fetchPrices(summaries: { symbol: string; assetType?: string }[]): Observable<Map<string, PriceData>> {
    if (summaries.length === 0) return of(new Map());

    const stockSymbols = [...new Set(summaries.filter(s => s.assetType !== 'mutual-fund' && !s.symbol.endsWith('.CRYPTO')).map(s => s.symbol))];
    const cryptoSymbols = [...new Set(summaries.filter(s => s.assetType === 'crypto' || s.symbol.endsWith('.CRYPTO')).map(s => s.symbol))];
    const fundSymbols = [...new Set(summaries.filter(s => s.assetType === 'mutual-fund').map(s => s.symbol))];

    const requests: Observable<Map<string, PriceData>>[] = [];

    if (stockSymbols.length > 0) {
      requests.push(this.fetchStockPrices(stockSymbols));
    }

    if (cryptoSymbols.length > 0) {
      requests.push(this.fetchCryptoPrices(cryptoSymbols));
    }

    if (fundSymbols.length > 0) {
      requests.push(this.navService.fetchFundNAVs(fundSymbols));
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
      const url = `/api/finance/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d&includePrePost=false`;

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
          if (r.price > 0 || r.name) {
            priceMap.set(r.symbol, r);
          }
        }
        return priceMap;
      }),
    );
  }

  /**
   * Fetch crypto prices from Binance TH.
   */
  private fetchCryptoPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const binanceSymbols = symbols
      .map((s) => CRYPTO_BINANCE_MAP[s]?.symbol)
      .filter((s) => !!s);

    if (binanceSymbols.length === 0) return of(new Map());

    const url = `/api/binance/api/v1/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`;

    return this.http.get<Array<{ symbol: string; price: string }>>(url).pipe(
      map((res) => {
        const priceMap = new Map<string, PriceData>();

        for (const symbol of symbols) {
          const config = CRYPTO_BINANCE_MAP[symbol];
          if (config) {
            const found = res.find((r) => r.symbol === config.symbol);
            if (found && found.price) {
              priceMap.set(symbol, {
                symbol,
                name: config.name,
                price: parseFloat(found.price),
                currency: config.currency,
              });
            }
          }
        }

        return priceMap;
      }),
      catchError(() => of(new Map<string, PriceData>())),
    );
  }
}
