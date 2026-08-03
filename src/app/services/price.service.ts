import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';
import { NavService } from './nav.service';
import { toYahooSymbol, displaySymbol } from '../utils/format.utils';

export interface PriceData {
  symbol: string;
  name?: string;
  price: number;
  currency: string;
}

interface BinanceTicker {
  symbol: string;
  price: string;
}

/**
 * Dynamically resolves the market price and native quote currency from Binance TH tickers.
 * Matches available pairs (e.g. THB, USDT, USDC, FDUSD) dynamically without any hardcoded coin dictionary.
 */
function resolveCryptoPrice(
  rawSymbol: string,
  tickers: BinanceTicker[]
): { price: number; currency: string } {
  const base = rawSymbol.toUpperCase().replace(/\.CRYPTO$/, '').trim();
  if (!base) return { price: 0, currency: 'USD' };

  // Common quote preferences and their standard currency representation
  const quotePreferences: Array<{ quote: string; currency: string }> = [
    { quote: 'THB', currency: 'THB' },
    { quote: 'USDT', currency: 'USD' },
    { quote: 'USDC', currency: 'USD' },
    { quote: 'FDUSD', currency: 'USD' },
    { quote: 'BUSD', currency: 'USD' },
  ];

  // 1. Try matching preferred quote pairs (e.g. BTCTHB, PAXGUSDT, ADAUSDT)
  for (const pref of quotePreferences) {
    const targetSymbol = `${base}${pref.quote}`;
    const match = tickers.find((t) => t.symbol.toUpperCase() === targetSymbol);
    if (match && match.price) {
      return { price: parseFloat(match.price) || 0, currency: pref.currency };
    }
  }

  // 2. Direct exact match (e.g. if the symbol itself is a pair like USDTTHB)
  const exactMatch = tickers.find((t) => t.symbol.toUpperCase() === base);
  if (exactMatch && exactMatch.price) {
    const suffix = quotePreferences.find((p) => exactMatch.symbol.toUpperCase().endsWith(p.quote));
    return {
      price: parseFloat(exactMatch.price) || 0,
      currency: suffix ? suffix.currency : 'USD',
    };
  }

  // 3. Dynamic prefix match (for any other pair suffixes)
  const prefixMatch = tickers.find((t) => t.symbol.toUpperCase().startsWith(base));
  if (prefixMatch && prefixMatch.price) {
    const quote = prefixMatch.symbol.toUpperCase().substring(base.length);
    const suffix = quotePreferences.find((p) => quote.endsWith(p.quote));
    return {
      price: parseFloat(prefixMatch.price) || 0,
      currency: suffix ? suffix.currency : (quote === 'THB' ? 'THB' : 'USD'),
    };
  }

  return { price: 0, currency: 'USD' };
}

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

    const isCrypto = (s: { symbol: string; assetType?: string }) =>
      s.assetType === 'crypto' || s.symbol.endsWith('.CRYPTO');

    const isFund = (s: { symbol: string; assetType?: string }) =>
      s.assetType === 'mutual-fund';

    const stockSymbols = [...new Set(summaries.filter(s => !isFund(s) && !isCrypto(s)).map(s => s.symbol))];
    const cryptoSymbols = [...new Set(summaries.filter(s => isCrypto(s)).map(s => s.symbol))];
    const fundSymbols = [...new Set(summaries.filter(s => isFund(s)).map(s => s.symbol))];

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
      const yahooSymbol = toYahooSymbol(symbol);
      const url = `/api/finance/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d&includePrePost=false`;

      return this.http.get<any>(url).pipe(
        map((res) => {
          const meta = res?.chart?.result?.[0]?.meta;
          return {
            symbol,
            name: meta?.longName || meta?.shortName || '',
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
   * Fetch crypto prices and full names dynamically.
   * Prices come dynamically from Binance TH, and full asset names come dynamically from Yahoo Finance.
   */
  private fetchCryptoPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const binanceUrl = '/api/binance/api/v1/ticker/price';
    const binanceReq$ = this.http.get<BinanceTicker[]>(binanceUrl).pipe(
      catchError(() => of([] as BinanceTicker[])),
    );

    const nameRequests$ = forkJoin(
      symbols.map((symbol) => {
        const base = symbol.toUpperCase().replace(/\.CRYPTO$/, '').trim();
        const yahooSymbol = `${base}-USD`;
        const url = `/api/finance/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d&includePrePost=false`;

        return this.http.get<any>(url).pipe(
          map((res) => {
            const meta = res?.chart?.result?.[0]?.meta;
            return {
              symbol,
              name: meta?.longName || meta?.shortName || '',
            };
          }),
          catchError(() => of({ symbol, name: '' })),
        );
      }),
    );

    return forkJoin({ tickers: binanceReq$, names: nameRequests$ }).pipe(
      map(({ tickers, names }) => {
        const priceMap = new Map<string, PriceData>();
        const tickerList = Array.isArray(tickers) ? tickers : [];
        const nameMap = new Map<string, string>(names.map((n) => [n.symbol, n.name]));

        for (const symbol of symbols) {
          const resolved = resolveCryptoPrice(symbol, tickerList);
          const dynamicName = nameMap.get(symbol) || '';

          priceMap.set(symbol, {
            symbol,
            name: dynamicName,
            price: resolved.price,
            currency: resolved.currency,
          });
        }

        return priceMap;
      }),
      catchError(() => {
        const fallbackMap = new Map<string, PriceData>();
        for (const symbol of symbols) {
          fallbackMap.set(symbol, {
            symbol,
            name: '',
            price: 0,
            currency: 'USD',
          });
        }
        return of(fallbackMap);
      }),
    );
  }
}
