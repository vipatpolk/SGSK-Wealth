import { Component, inject, signal, computed } from '@angular/core';
import { DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ShareLotService, SheetResult } from './services/share-lot.service';
import { PriceService, PriceData } from './services/price.service';
import { SymbolSummary } from './models/transaction.model';
import { AssetTab, ASSET_TABS } from './config/sheet.config';
import { getQuantityFormat, displaySymbol, getPriceFormat, getSymbolColor, getSymbolName } from './utils/format.utils';

@Component({
  selector: 'app-root',
  imports: [DecimalPipe, CurrencyPipe, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly shareLotService = inject(ShareLotService);
  private readonly priceService = inject(PriceService);

  readonly tabs = ASSET_TABS;
  readonly activeTab = signal<AssetTab>(ASSET_TABS[0]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly result = signal<SheetResult | null>(null);
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly pricesLoading = signal(false);

  /** Currency conversion */
  readonly displayCurrency = signal<'USD' | 'THB'>('THB');
  readonly exchangeRate = signal<number>(0); // USD → THB rate

  expandedSymbols = signal<Set<string>>(new Set());
  searchQuery = signal('');
  sortField = signal<string>('totalCost');
  sortDirection = signal<'asc' | 'desc'>('desc');

  readonly sortOptions = [
    { field: 'symbol', label: 'Symbol' },
    { field: 'totalCost', label: 'Total Cost' },
    { field: 'avgCost', label: 'Avg Cost' },
    { field: 'holdingValue', label: 'Holding Value' },
    { field: 'pl', label: 'P/L %' },
  ];

  readonly totalCostConverted = computed<number>(() => {
    const data = this.result();
    if (!data) return 0;
    return data.summaries.reduce((sum, s) => {
      if (!this.hasRate() && s.currency !== this.displayCurrency()) return sum;
      return sum + this.cx(s.totalCost, s.currency);
    }, 0);
  });

  readonly totalHoldingConverted = computed<number>(() => {
    const data = this.result();
    const priceMap = this.prices();
    if (!data) return 0;

    let total = 0;
    for (const s of data.summaries) {
      const pd = priceMap.get(s.symbol);
      if (pd && pd.price > 0) {
        if (!this.hasRate() && s.currency !== this.displayCurrency()) continue;
        total += this.cx(s.totalShares * pd.price, s.currency);
      }
    }
    return total;
  });

  readonly totalPL = computed<number>(() => {
    return this.totalHoldingConverted() - this.totalCostConverted();
  });

  readonly totalPLPercent = computed<number>(() => {
    const cost = this.totalCostConverted();
    if (cost === 0) return 0;
    return (this.totalPL() / cost) * 100;
  });

  readonly hasRate = computed<boolean>(() => this.exchangeRate() > 0);

  constructor() {
    this.loadTab(this.activeTab());
  }

  /** Convert an amount from `fromCurrency` to the display currency */
  cx(amount: number, fromCurrency: string): number {
    const target = this.displayCurrency();
    if (fromCurrency === target) return amount;

    const rate = this.exchangeRate();
    if (rate <= 0) return amount;

    if (fromCurrency === 'USD' && target === 'THB') return amount * rate;
    if (fromCurrency === 'THB' && target === 'USD') return amount / rate;

    return amount;
  }

  dc(originalCurrency?: string): string {
    if (!this.hasRate() && originalCurrency) {
      return originalCurrency;
    }
    return this.displayCurrency();
  }

  get filteredSummaries(): SymbolSummary[] {
    const data = this.result();
    if (!data) return [];
    const query = this.searchQuery().toUpperCase();
    let list = query
      ? data.summaries.filter((s) => s.symbol.includes(query))
      : [...data.summaries];

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      switch (field) {
        case 'symbol':
          va = a.symbol;
          vb = b.symbol;
          return dir * (va < vb ? -1 : va > vb ? 1 : 0);
        case 'totalCost':
          va = this.cx(a.totalCost, a.currency);
          vb = this.cx(b.totalCost, b.currency);
          break;
        case 'avgCost':
          va = this.cx(a.averageCost, a.currency);
          vb = this.cx(b.averageCost, b.currency);
          break;
        case 'holdingValue':
          va = this.cx(this.getHoldingValue(a), a.currency);
          vb = this.cx(this.getHoldingValue(b), b.currency);
          break;
        case 'pl':
          va = this.getUnrealizedPLPercent(a);
          vb = this.getUnrealizedPLPercent(b);
          break;
      }

      return dir * ((va as number) - (vb as number));
    });

    return list;
  }

  setSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'symbol' ? 'asc' : 'desc');
    }
  }

  get isAllTab(): boolean {
    return this.activeTab().id === 'all';
  }

  selectTab(tab: AssetTab): void {
    if (tab.id === this.activeTab().id) return;
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.expandedSymbols.set(new Set());
    this.loadTab(tab);
  }

  loadTab(tab: AssetTab): void {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.prices.set(new Map());

    const obs =
      tab.id === 'all'
        ? this.shareLotService.fetchAllSheets()
        : this.shareLotService.fetchSheet(tab.sheetGid);

    obs.subscribe((res) => {
      if (res.error) {
        this.error.set(res.error);
        this.loading.set(false);
      } else {
        this.result.set(res);
        this.loading.set(false);
        this.fetchPricesForResult(res);
      }
    });
  }

  private fetchPricesForResult(result: SheetResult): void {
    if (result.summaries.length === 0) return;

    this.pricesLoading.set(true);
    this.priceService.fetchPricesAndRate(result.summaries).subscribe(({ prices, rate }) => {
      this.prices.set(prices);
      if (rate > 0) this.exchangeRate.set(rate);
      this.pricesLoading.set(false);
    });
  }

  refresh(): void {
    this.loadTab(this.activeTab());
  }

  toggleExpand(symbol: string): void {
    const current = new Set(this.expandedSymbols());
    if (current.has(symbol)) {
      current.delete(symbol);
    } else {
      current.add(symbol);
    }
    this.expandedSymbols.set(current);
  }

  isExpanded(symbol: string): boolean {
    return this.expandedSymbols().has(symbol);
  }

  expandAll(): void {
    const data = this.result();
    if (!data) return;
    const all = new Set(data.summaries.map((s) => s.symbol));
    this.expandedSymbols.set(all);
  }

  collapseAll(): void {
    this.expandedSymbols.set(new Set());
  }

  getCurrentPrice(symbol: string): number {
    return this.prices().get(symbol)?.price ?? 0;
  }

  getDisplaySymbol(symbol: string): string {
    const priceData = this.prices().get(symbol);
    if (priceData?.symbol && priceData.symbol !== symbol) {
      return priceData.symbol;
    }
    return displaySymbol(symbol);
  }

  getSymbolName(symbol: string): string {
    const rawName = this.prices().get(symbol)?.name || '';
    return getSymbolName(symbol, rawName);
  }

  getHoldingValue(summary: SymbolSummary): number {
    const price = this.getCurrentPrice(summary.symbol);
    return summary.totalShares * price;
  }

  getUnrealizedPL(summary: SymbolSummary): number {
    return this.getHoldingValue(summary) - summary.totalCost;
  }

  getUnrealizedPLPercent(summary: SymbolSummary): number {
    if (summary.totalCost === 0) return 0;
    return (this.getUnrealizedPL(summary) / summary.totalCost) * 100;
  }

  hasPriceData(symbol: string): boolean {
    return this.prices().has(symbol) && this.getCurrentPrice(symbol) > 0;
  }

  getQuantityFormat(symbol: string): string {
    return getQuantityFormat(symbol);
  }

  getPriceFormat(symbol: string): string {
    return getPriceFormat(symbol);
  }

  getSymbolColor(symbol: string): string {
    return getSymbolColor(symbol);
  }
}
