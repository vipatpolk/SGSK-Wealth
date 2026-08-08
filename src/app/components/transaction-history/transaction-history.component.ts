import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import {
  DecimalPipe,
  CurrencyPipe,
  DatePipe,
} from '@angular/common';
import { DateRangePickerComponent, DateRange } from '../date-range-picker/date-range-picker.component';
import {
  SymbolTransaction,
  SymbolTransactionSummary,
  SymbolSummary,
} from '../../models/transaction.model';
import { PriceData } from '../../services/price.service';
import {
  getQuantityFormat,
  displaySymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  resolveSymbolName,
  convertCurrency,
  getAssetType,
  getAssetTypeLabel,
  getAssetTypeClass,
} from '../../utils/format.utils';

export type TxTypeFilter = 'all' | 'buy' | 'sell';
export type SortOrder = 'desc' | 'asc';

@Component({
  selector: 'app-transaction-history',
  imports: [DecimalPipe, CurrencyPipe, DatePipe, DateRangePickerComponent],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.css',
})
export class TransactionHistoryComponent {
  /** Input transaction summaries per symbol */
  readonly transactionSummaries = input<SymbolTransactionSummary[]>([]);

  /** Input open position summaries (for current market value / NAV calculation) */
  readonly openSummaries = input<SymbolSummary[]>([]);

  /** Real-time market prices */
  readonly prices = input<Map<string, PriceData>>(new Map());

  /** Selected display currency ('USD' | 'THB') */
  readonly displayCurrency = input<'USD' | 'THB'>('THB');

  /** Exchange rate (USD -> THB) */
  readonly exchangeRate = input<number>(0);

  /** Currently selected symbol (or '' for unified all symbols view) */
  readonly selectedSymbol = input<string>('');

  /** Emitted when user selects a symbol or clicks back */
  readonly symbolSelected = output<string>();
  readonly backToHoldings = output<void>();

  /** Local state */
  readonly currentSymbol = signal<string>('');
  readonly typeFilter = signal<TxTypeFilter>('all');
  readonly assetFilter = signal<string>('all');
  readonly sortOrder = signal<SortOrder>('desc');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly symbolSearchQuery = signal<string>('');
  readonly isSymbolDropdownOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.currentSymbol.set(this.selectedSymbol());
    });
  }

  selectSymbol(symbol: string): void {
    this.currentSymbol.set(symbol);
    this.symbolSelected.emit(symbol);
    this.isSymbolDropdownOpen.set(false);
    this.clearDateRange();
  }

  clearSymbolSelection(): void {
    this.currentSymbol.set('');
    this.symbolSelected.emit('');
    this.isSymbolDropdownOpen.set(false);
    this.clearDateRange();
  }

  clearDateRange(): void {
    this.startDate.set('');
    this.endDate.set('');
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
  }

  setAssetFilter(filter: string): void {
    this.assetFilter.set(filter);
  }

  onAssetTypeChange(event: Event): void {
    const type = (event.target as HTMLSelectElement).value;
    this.setAssetFilter(type);
  }

  toggleSymbolDropdown(): void {
    this.isSymbolDropdownOpen.set(!this.isSymbolDropdownOpen());
    if (this.isSymbolDropdownOpen()) {
      this.symbolSearchQuery.set('');
    }
  }

  closeSymbolDropdown(): void {
    this.isSymbolDropdownOpen.set(false);
  }

  readonly assetTypeOptions = computed(() => {
    const list = this.transactionSummaries();
    const countByType: Record<string, number> = {
      all: list.length,
      'us-stock': 0,
      'thai-stock': 0,
      crypto: 0,
      'mutual-fund': 0,
    };

    for (const item of list) {
      const type = getAssetType(item.assetType, item.symbol);
      if (countByType[type] !== undefined) {
        countByType[type]++;
      } else {
        countByType[type] = 1;
      }
    }

    return [
      { id: 'all', label: 'All Types', count: countByType['all'] },
      { id: 'us-stock', label: 'U.S. Stock', count: countByType['us-stock'] },
      { id: 'thai-stock', label: 'Thai Stock', count: countByType['thai-stock'] },
      { id: 'crypto', label: 'Cryptocurrency', count: countByType['crypto'] },
      { id: 'mutual-fund', label: 'Mutual Fund', count: countByType['mutual-fund'] },
    ].filter((opt) => opt.id === 'all' || opt.count > 0);
  });

  /** Matched summaries based on assetFilter */
  readonly filteredSummaries = computed<SymbolTransactionSummary[]>(() => {
    const assetFilter = this.assetFilter();
    const all = this.transactionSummaries();
    if (assetFilter === 'all') return all;
    return all.filter(
      (s) => getAssetType(s.assetType, s.symbol) === assetFilter
    );
  });

  /** All available symbols list for selector, sorted by Open position then by symbol */
  readonly availableSymbols = computed(() => {
    const list = this.filteredSummaries();
    const query = this.symbolSearchQuery().trim().toUpperCase();

    let filtered = [...list];
    if (query) {
      filtered = filtered.filter(
        (s) =>
          s.symbol.toUpperCase().includes(query) ||
          this.getDisplaySymbol(s.symbol).toUpperCase().includes(query) ||
          this.getSymbolName(s.symbol).toUpperCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      // 1. Open positions first
      const aIsOpen = a.currentStatus === 'OPEN' ? 1 : 0;
      const bIsOpen = b.currentStatus === 'OPEN' ? 1 : 0;
      if (aIsOpen !== bIsOpen) {
        return bIsOpen - aIsOpen;
      }
      // 2. Alphabetical by display symbol
      const symA = this.getDisplaySymbol(a.symbol).toUpperCase();
      const symB = this.getDisplaySymbol(b.symbol).toUpperCase();
      return symA.localeCompare(symB);
    });

    return filtered;
  });

  /** Selected symbol summary data */
  readonly activeSummary = computed<SymbolTransactionSummary | null>(() => {
    const sym = this.currentSymbol();
    if (!sym) return null;
    return this.transactionSummaries().find((s) => s.symbol === sym) || null;
  });

  /** Open summary for the active symbol (if open) */
  readonly activeOpenSummary = computed<SymbolSummary | null>(() => {
    const sym = this.currentSymbol();
    if (!sym) return null;
    return this.openSummaries().find((s) => s.symbol === sym) || null;
  });

  /** Filtered transactions for active symbol or unified feed */
  readonly filteredTransactions = computed<SymbolTransaction[]>(() => {
    const summary = this.activeSummary();
    let txs: SymbolTransaction[] = [];

    if (summary) {
      txs = [...summary.transactions];
    } else {
      // Unified all symbols feed
      txs = this.filteredSummaries().flatMap((s) => s.transactions);
    }

    // Filter by type (BUY / SELL)
    const type = this.typeFilter();
    if (type === 'buy') {
      txs = txs.filter((t) => t.type === 'BUY');
    } else if (type === 'sell') {
      txs = txs.filter((t) => t.type === 'SELL');
    }

    // Filter by date range (startDate <= date <= endDate)
    const start = this.startDate().trim();
    const end = this.endDate().trim();
    if (start) {
      txs = txs.filter((t) => (t.date ? t.date >= start : true));
    }
    if (end) {
      txs = txs.filter((t) => (t.date ? t.date <= end : true));
    }

    // Sort order
    const order = this.sortOrder();
    txs.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return order === 'desc' ? -cmp : cmp;
    });

    return txs;
  });

  /** Counts for type filter pills */
  readonly buyCount = computed<number>(() => {
    const summary = this.activeSummary();
    if (summary) return summary.buyCount;
    return this.filteredSummaries().reduce(
      (sum, s) => sum + s.buyCount,
      0
    );
  });

  readonly sellCount = computed<number>(() => {
    const summary = this.activeSummary();
    if (summary) return summary.sellCount;
    return this.filteredSummaries().reduce(
      (sum, s) => sum + s.sellCount,
      0
    );
  });

  readonly totalTxCount = computed<number>(() => {
    const summary = this.activeSummary();
    if (summary) return summary.totalTransactions;
    return this.filteredSummaries().reduce(
      (sum, s) => sum + s.totalTransactions,
      0
    );
  });

  /** Total realized P/L across all filtered symbols in display currency */
  readonly allSymbolsRealizedPL = computed<number>(() => {
    return this.filteredSummaries().reduce((sum, s) => {
      return sum + this.cx(s.realizedPL, s.currency);
    }, 0);
  });

  /** Total volume traded across all filtered symbols in display currency */
  readonly allSymbolsTradedVolume = computed<number>(() => {
    return this.filteredSummaries().reduce((sum, s) => {
      return sum + this.cx(s.totalBuyAmount + s.totalSellAmount, s.currency);
    }, 0);
  });

  /** Total open positions count in filtered feed */
  readonly allSymbolsOpenCount = computed<number>(() => {
    return this.filteredSummaries().filter((s) => s.currentStatus === 'OPEN').length;
  });

  /** Total closed positions count in filtered feed */
  readonly allSymbolsClosedCount = computed<number>(() => {
    return this.filteredSummaries().filter((s) => s.currentStatus === 'CLOSED').length;
  });

  /** Real-time market price for active symbol */
  readonly activeMarketPrice = computed<number>(() => {
    const sym = this.currentSymbol();
    if (!sym) return 0;
    return this.prices().get(sym)?.price ?? 0;
  });

  /** Holding value for active symbol in display currency */
  readonly activeHoldingValueConverted = computed<number>(() => {
    const summary = this.activeSummary();
    if (!summary || summary.netShares <= 0) return 0;
    const price = this.activeMarketPrice();
    if (price <= 0) return 0;
    const pd = this.prices().get(summary.symbol);
    const curr = pd?.currency || summary.currency;
    const rawVal = summary.netShares * price;
    return this.cx(rawVal, curr);
  });

  /** Unrealized P/L for active symbol */
  readonly activeUnrealizedPL = computed<number>(() => {
    const summary = this.activeSummary();
    if (!summary || summary.netShares <= 0) return 0;
    const mktVal = this.activeHoldingValueConverted();
    if (mktVal <= 0) return 0;
    const costBasis = this.cx(summary.netInvested, summary.currency);
    return mktVal - costBasis;
  });

  readonly activeUnrealizedPLPercent = computed<number>(() => {
    const summary = this.activeSummary();
    if (!summary || summary.netInvested <= 0) return 0;
    const pl = this.activeUnrealizedPL();
    const cost = this.cx(summary.netInvested, summary.currency);
    if (cost === 0) return 0;
    return (pl / cost) * 100;
  });

  /** Currency helpers */
  convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    return convertCurrency(amount, fromCurrency, toCurrency, this.exchangeRate());
  }

  cx(amount: number, fromCurrency: string): number {
    return this.convertCurrency(amount, fromCurrency, this.displayCurrency());
  }

  dc(originalCurrency?: string): string {
    if (this.exchangeRate() <= 0 && originalCurrency) {
      return originalCurrency === 'USDT' ? 'USD' : originalCurrency;
    }
    return this.displayCurrency();
  }

  /** Utility formatters */
  getDisplaySymbol(symbol: string): string {
    const priceData = this.prices().get(symbol);
    if (priceData?.symbol && priceData.symbol !== symbol) {
      return priceData.symbol;
    }
    return displaySymbol(symbol);
  }

  getSymbolName(symbol: string): string {
    return resolveSymbolName(symbol, this.prices());
  }

  getSymbolColor(symbol: string): string {
    return getSymbolColor(symbol);
  }

  getQuantityFormat(symbol: string, assetType?: string): string {
    return getQuantityFormat(symbol, assetType);
  }

  getPriceFormat(symbol: string, assetType?: string): string {
    return getPriceFormat(symbol, assetType);
  }

  getAssetTypeLabel(assetType?: string, symbol?: string): string {
    return getAssetTypeLabel(assetType, symbol);
  }

  getAssetTypeClass(assetType?: string, symbol?: string): string {
    return getAssetTypeClass(assetType, symbol);
  }

  toggleSort(): void {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
  }
}
