import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';
import { NavService } from './nav.service';
import { toYahooSymbol } from '../utils/format.utils';

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
 * Dynamically resolves the standard currency for any quote asset string without hardcoded tables.
 * e.g. 'THB' -> 'THB', USD-family ('USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'USD', 'DAI', 'RLUSD') -> 'USD',
 * and any other fiat or crypto quote asset directly to its ticker (e.g. 'EUR', 'GBP', 'BTC').
 */
function resolveQuoteCurrency(quote: string): string {
  if (!quote) return '';
  const q = quote.toUpperCase();
  if (q === 'THB') return 'THB';
  if (q.includes('USD') || q === 'DAI') return 'USD';
  return q;
}

/**
 * Dynamically resolves the market price and quote currency from Binance TH tickers.
 * Matches any pair dynamically without any hardcoded coin dictionary or static quote lists.
 */
function resolveCryptoPrice(
  rawSymbol: string,
  tickers: BinanceTicker[]
): { price: number; currency: string } {
  const base = rawSymbol.toUpperCase().replace(/\.CRYPTO$/, '').trim();
  if (!base || !Array.isArray(tickers) || tickers.length === 0) {
    return { price: 0, currency: '' };
  }

  // Find all tickers matching this base asset dynamically
  const matches: Array<{ ticker: BinanceTicker; quote: string; currency: string; price: number }> = [];

  for (const t of tickers) {
    if (!t.symbol || !t.price) continue;
    const sym = t.symbol.toUpperCase();
    const price = parseFloat(t.price);
    if (isNaN(price) || price <= 0) continue;

    if (sym === base) {
      // Exact match (e.g. if the symbol itself is already a pair like USDTTHB)
      const quote = sym.endsWith('THB') ? 'THB' : (sym.includes('USD') ? 'USD' : '');
      matches.push({ ticker: t, quote, currency: quote ? resolveQuoteCurrency(quote) : '', price });
    } else if (sym.startsWith(base)) {
      const quote = sym.substring(base.length);
      matches.push({ ticker: t, quote, currency: resolveQuoteCurrency(quote), price });
    }
  }

  if (matches.length === 0) {
    return { price: 0, currency: '' };
  }

  // Dynamically select match: prefer direct THB pricing (local exchange primary fiat), then USD-family, then any pair
  const bestMatch =
    matches.find((m) => m.currency === 'THB') ||
    matches.find((m) => m.currency === 'USD') ||
    matches[0];

  return {
    price: bestMatch.price,
    currency: bestMatch.currency || 'USD',
  };
}

@Injectable({
  providedIn: 'root',
})
export class PriceService {
  private readonly http = inject(HttpClient);
  private readonly navService = inject(NavService);

  /** Fetch prices for all symbols AND the USD/THB exchange rate in parallel */
  fetchPricesAndRate(
    summaries: { symbol: string; assetType?: string }[],
  ): Observable<{ prices: Map<string, PriceData>; rate: number }> {
    return forkJoin({
      prices: this.fetchPrices(summaries),
      rate: this.fetchExchangeRate(),
    });
  }

  /** Fetch the live exchange rate dynamically from Yahoo Finance */
  fetchExchangeRate(fromCurrency: string = 'USD', toCurrency: string = 'THB'): Observable<number> {
    if (fromCurrency === toCurrency) {
      return of(1);
    }
    const pair = `${fromCurrency}${toCurrency}=X`;
    const url = `/api/finance/v8/finance/chart/${encodeURIComponent(pair)}?range=1d&interval=1d&includePrePost=false`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const meta = res?.chart?.result?.[0]?.meta;
        return meta?.regularMarketPrice ?? meta?.chartPreviousClose ?? meta?.previousClose ?? 0;
      }),
      catchError(() => of(0)),
    );
  }

  fetchPrices(summaries: { symbol: string; assetType?: string }[]): Observable<Map<string, PriceData>> {
    if (summaries.length === 0) return of(new Map());

    const isCrypto = (s: { symbol: string; assetType?: string }) =>
      s.assetType === 'crypto' || s.symbol.toUpperCase().endsWith('.CRYPTO');

    const isFund = (s: { symbol: string; assetType?: string }) =>
      s.assetType === 'mutual-fund' || s.symbol.toUpperCase().endsWith('.BKFUND');

    const stockSymbols = [...new Set(summaries.filter((s) => !isFund(s) && !isCrypto(s)).map((s) => s.symbol))];
    const cryptoSymbols = [...new Set(summaries.filter((s) => isCrypto(s)).map((s) => s.symbol))];
    const fundSymbols = [...new Set(summaries.filter((s) => isFund(s)).map((s) => s.symbol))];

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

  /** Fetch stock prices from Yahoo Finance dynamically via proxy */
  private fetchStockPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const requests = symbols.map((symbol) => {
      const yahooSymbol = toYahooSymbol(symbol);
      const url = `/api/finance/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d&includePrePost=false`;

      return this.http.get<any>(url).pipe(
        map((res) => {
          const meta = res?.chart?.result?.[0]?.meta;
          const price = meta?.regularMarketPrice ?? meta?.chartPreviousClose ?? meta?.previousClose ?? 0;
          return {
            symbol,
            name: meta?.longName || meta?.shortName || '',
            price,
            currency: meta?.currency || '',
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
            currency: '',
          });
        }
        return of(fallbackMap);
      }),
    );
  }
}
