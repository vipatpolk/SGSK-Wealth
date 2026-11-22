import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { KEY_VALUE_STORAGE_ADAPTER } from '../config/storage-adapter.token';
import {
  ApiFailure,
  ApiResult,
  apiOk,
  mapHttpErrorToApiFailure,
} from '../models/api-result.model';
import { PortfolioDividendResponse } from '../models/dividend.model';
import { LocalCsvImportResult, LocalTransaction } from '../models/local-portfolio.model';
import {
  PortfolioAllocationResponse,
  PortfolioHoldingsResponse,
  PortfolioPerformanceResponse,
  TargetAllocation,
} from '../models/portfolio.model';
import { AppLang } from './i18n.service';
import { PriceData, PriceService } from './price.service';
import {
  SAMPLE_LOCAL_TRANSACTIONS,
  buildLocalAllocationResponse,
  buildLocalDividendResponse,
  buildLocalHoldingsResponse,
  buildLocalPerformanceResponse,
  parseLocalTransactionsCsv,
} from '../utils/local-fifo.utils';

export const LOCAL_TRANSACTIONS_STORAGE_KEY = 'sgsk_wealth_local_transactions_v1';

@Injectable({
  providedIn: 'root',
})
export class LocalPortfolioService {
  private readonly priceService = inject(PriceService, { optional: true });
  private readonly storage = inject(KEY_VALUE_STORAGE_ADAPTER);

  readonly transactions = signal<LocalTransaction[]>(this.loadInitialFromStorage());
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly exchangeRate = signal<number>(0);
  readonly pricesLoading = signal<boolean>(false);
  readonly pricesError = signal<ApiFailure | null>(null);

  readonly hasTransactions = computed(() => this.transactions().length > 0);
  readonly transactionCount = computed(() => this.transactions().length);

  private hydrated = false;

  async initialize(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;

    try {
      const raw = await this.storage.getItem(LOCAL_TRANSACTIONS_STORAGE_KEY);
      if (raw) {
        const parsed = this.parseStoredArray(raw);
        if (parsed.length > 0 || this.transactions().length === 0) {
          this.transactions.set(parsed);
        }
      }
    } catch {
      // Keep synchronous storage snapshot
    }
  }

  addTransaction(
    input: Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): LocalTransaction {
    const now = new Date().toISOString();
    const record: LocalTransaction = {
      ...input,
      symbol: input.symbol.trim().toUpperCase(),
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const next = [...this.transactions(), record];
    this.saveTransactions(next);
    return record;
  }

  updateTransaction(
    id: string,
    patch: Partial<Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>>
  ): void {
    const now = new Date().toISOString();
    const next = this.transactions().map((tx) =>
      tx.id === id
        ? {
            ...tx,
            ...patch,
            symbol: (patch.symbol ?? tx.symbol).trim().toUpperCase(),
            updatedAt: now,
          }
        : tx
    );
    this.saveTransactions(next);
  }

  deleteTransaction(id: string): void {
    const next = this.transactions().filter((tx) => tx.id !== id);
    this.saveTransactions(next);
  }

  importCsv(csvText: string, defaultAssetType = 'us-stock'): LocalCsvImportResult {
    const parsed = parseLocalTransactionsCsv(csvText, defaultAssetType);
    if (parsed.length === 0) {
      return {
        importedCount: 0,
        skippedCount: 0,
        error: 'No valid transaction rows found. Expected Symbol, Date, Quantity, Price, Currency.',
      };
    }

    const now = new Date().toISOString();
    const created: LocalTransaction[] = parsed.map((item) => ({
      ...item,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    }));

    this.saveTransactions([...this.transactions(), ...created]);
    return { importedCount: created.length, skippedCount: 0 };
  }

  exportCsv(): string {
    const headers = ['Symbol', 'Date', 'Quantity', 'Price', 'Currency', 'Asset Type', 'Transaction Type', 'Fee', 'Note'];
    const escape = (val: string | number | undefined): string => {
      const s = String(val ?? '');
      return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = this.transactions().map((tx) =>
      [
        tx.symbol,
        tx.date,
        tx.quantity,
        tx.price,
        tx.currency,
        tx.assetType,
        tx.txType || (tx.quantity < 0 ? 'SELL' : 'BUY'),
        tx.fee ?? '',
        tx.note ?? '',
      ]
        .map(escape)
        .join(',')
    );
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }

  exportJson(): string {
    return JSON.stringify(this.transactions(), null, 2);
  }

  loadSamplePortfolio(): void {
    const now = new Date().toISOString();
    const records: LocalTransaction[] = SAMPLE_LOCAL_TRANSACTIONS.map((tx) => ({
      ...tx,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    this.saveTransactions(records);
  }

  clearAll(): void {
    this.saveTransactions([]);
    this.prices.set(new Map());
    this.pricesError.set(null);
  }

  getHoldings(
    tabId: string = 'all',
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = 'en'
  ): PortfolioHoldingsResponse {
    return buildLocalHoldingsResponse(
      this.transactions(),
      tabId,
      currency,
      this.prices(),
      this.exchangeRate(),
      lang
    );
  }

  getDividends(
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = 'en'
  ): PortfolioDividendResponse {
    return buildLocalDividendResponse(
      this.transactions(),
      currency,
      this.prices(),
      this.exchangeRate(),
      lang
    );
  }

  getPerformance(
    timeframe: string = 'ALL',
    startDate: string = '',
    endDate: string = '',
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = 'en'
  ): PortfolioPerformanceResponse {
    return buildLocalPerformanceResponse(
      this.transactions(),
      timeframe,
      startDate,
      endDate,
      currency,
      this.prices(),
      this.exchangeRate(),
      lang
    );
  }

  getAllocation(
    targetAllocation?: TargetAllocation,
    currency: 'USD' | 'THB' = 'THB',
    lang: AppLang = 'en'
  ): PortfolioAllocationResponse {
    return buildLocalAllocationResponse(
      this.transactions(),
      targetAllocation,
      currency,
      this.prices(),
      this.exchangeRate(),
      lang
    );
  }

  refreshMarketPrices(): Observable<ApiResult<{ prices: Map<string, PriceData>; rate: number }>> {
    if (!this.priceService) {
      this.pricesError.set(null);
      return of(apiOk({ prices: this.prices(), rate: this.exchangeRate() }));
    }

    const unique = new Map<string, string>();
    for (const tx of this.transactions()) {
      const sym = tx.symbol.trim().toUpperCase();
      if (sym && !unique.has(sym)) {
        unique.set(sym, tx.assetType);
      }
    }

    if (unique.size === 0) {
      return this.priceService.fetchExchangeRate('USD', 'THB').pipe(
        map((rate) => {
          if (rate > 0) this.exchangeRate.set(rate);
          this.pricesError.set(null);
          return apiOk({ prices: new Map<string, PriceData>(), rate: this.exchangeRate() });
        }),
        catchError((err) => {
          const failure = mapHttpErrorToApiFailure(err, 'Failed to refresh FX exchange rate.');
          this.pricesError.set(failure);
          return of(failure);
        })
      );
    }

    this.pricesLoading.set(true);
    const summaries = Array.from(unique.entries()).map(([symbol, assetType]) => ({
      symbol,
      assetType,
    }));

    return this.priceService.fetchPricesAndRate(summaries).pipe(
      map(({ prices, rate }) => {
        this.prices.set(prices);
        if (rate > 0) {
          this.exchangeRate.set(rate);
        }
        this.pricesError.set(null);
        this.pricesLoading.set(false);
        return apiOk({ prices, rate: this.exchangeRate() });
      }),
      catchError((err) => {
        const failure = mapHttpErrorToApiFailure(err, 'Failed to refresh live market prices.');
        this.pricesError.set(failure);
        this.pricesLoading.set(false);
        return of(failure);
      })
    );
  }

  private saveTransactions(list: LocalTransaction[]): void {
    this.transactions.set(list);
    const serialized = JSON.stringify(list);
    try {
      void this.storage.setItem(LOCAL_TRANSACTIONS_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage write errors
    }
  }

  private loadInitialFromStorage(): LocalTransaction[] {
    try {
      const raw = this.storage.getItemSync?.(LOCAL_TRANSACTIONS_STORAGE_KEY) ?? null;
      if (raw) {
        return this.parseStoredArray(raw);
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  }

  private parseStoredArray(raw: string): LocalTransaction[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) =>
          item &&
          typeof item.symbol === 'string' &&
          typeof item.date === 'string' &&
          typeof item.quantity === 'number' &&
          typeof item.price === 'number'
      ) as LocalTransaction[];
    } catch {
      return [];
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
