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

export interface CryptoMeta {
  binanceSymbol: string;
  name: string;
  currency: string;
}

/** Maps cryptocurrency symbols to Binance TH symbols and metadata */
const CRYPTO_CONFIG_MAP: Record<string, CryptoMeta> = {
  BTC: { binanceSymbol: 'BTCTHB', name: 'Bitcoin', currency: 'THB' },
  ETH: { binanceSymbol: 'ETHTHB', name: 'Ethereum', currency: 'THB' },
  BNB: { binanceSymbol: 'BNBTHB', name: 'BNB', currency: 'THB' },
  ADA: { binanceSymbol: 'ADATHB', name: 'Cardano', currency: 'THB' },
  DOT: { binanceSymbol: 'DOTTHB', name: 'Polkadot', currency: 'THB' },
  PAXG: { binanceSymbol: 'PAXGUSDT', name: 'PAX Gold', currency: 'USD' },
  SOL: { binanceSymbol: 'SOLTHB', name: 'Solana', currency: 'THB' },
  XRP: { binanceSymbol: 'XRPTHB', name: 'Ripple', currency: 'THB' },
  DOGE: { binanceSymbol: 'DOGETHB', name: 'Dogecoin', currency: 'THB' },
  USDT: { binanceSymbol: 'USDTTHB', name: 'Tether', currency: 'THB' },
};

function getCryptoConfig(symbol: string): CryptoMeta | undefined {
  const base = symbol.toUpperCase().replace(/\.CRYPTO$/, '');
  return CRYPTO_CONFIG_MAP[base];
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
   * Fetch crypto prices from Binance TH.
   */
  private fetchCryptoPrices(symbols: string[]): Observable<Map<string, PriceData>> {
    const symbolConfigMap = new Map<string, CryptoMeta>();

    for (const s of symbols) {
      const config = getCryptoConfig(s);
      if (config) {
        symbolConfigMap.set(s, config);
      }
    }

    const binanceSymbols = [...new Set(Array.from(symbolConfigMap.values()).map((c) => c.binanceSymbol))];

    if (binanceSymbols.length === 0) {
      const fallbackMap = new Map<string, PriceData>();
      for (const s of symbols) {
        const config = getCryptoConfig(s);
        if (config) {
          fallbackMap.set(s, {
            symbol: s,
            name: config.name,
            price: 0,
            currency: config.currency,
          });
        }
      }
      return of(fallbackMap);
    }

    const url = `/api/binance/api/v1/ticker/price?symbols=${encodeURIComponent(JSON.stringify(binanceSymbols))}`;

    return this.http.get<Array<{ symbol: string; price: string }>>(url).pipe(
      map((res) => {
        const priceMap = new Map<string, PriceData>();

        for (const symbol of symbols) {
          const config = symbolConfigMap.get(symbol);
          if (config) {
            const found = res.find((r) => r.symbol === config.binanceSymbol);
            priceMap.set(symbol, {
              symbol,
              name: config.name,
              price: found && found.price ? parseFloat(found.price) : 0,
              currency: config.currency,
            });
          }
        }

        return priceMap;
      }),
      catchError(() => {
        const fallbackMap = new Map<string, PriceData>();
        for (const s of symbols) {
          const config = symbolConfigMap.get(s);
          if (config) {
            fallbackMap.set(s, {
              symbol: s,
              name: config.name,
              price: 0,
              currency: config.currency,
            });
          }
        }
        return of(fallbackMap);
      }),
    );
  }
}
