import { Component, inject, signal, computed } from '@angular/core';
import { DecimalPipe, CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ShareLotService, SheetResult } from './services/share-lot.service';
import { PriceService, PriceData } from './services/price.service';
import { SymbolSummary, ClosedSymbolSummary } from './models/transaction.model';
import { AssetTab, ASSET_TABS } from './config/sheet.config';
import {
  getQuantityFormat,
  displaySymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  getAssetType,
  getAssetTypeLabel,
  getAssetTypeClass,
} from './utils/format.utils';

@Component({
  selector: 'app-root',
  imports: [DecimalPipe, CurrencyPipe, DatePipe, NgTemplateOutlet],
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

  /** Theme (dark/light) */
  readonly theme = signal<'dark' | 'light'>('dark');

  readonly expandedSymbols = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly sortField = signal<string>('totalCost');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedClosedAssetType = signal<string>('all');

  readonly isClosedTab = computed<boolean>(() => this.activeTab().id === 'closed-position');
  readonly isAllTab = computed<boolean>(() => this.activeTab().id === 'all');

  readonly closedAssetTypeOptions = computed(() => {
    const data = this.result();
    const list = data?.closedSummaries || [];

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

  readonly openSortOptions = [
    { field: 'symbol', label: 'Symbol' },
    { field: 'totalCost', label: 'Total Cost' },
    { field: 'avgCost', label: 'Avg Cost' },
    { field: 'holdingValue', label: 'Holding Value' },
    { field: 'pl', label: 'P/L %' },
  ];

  readonly closedSortOptions = [
    { field: 'symbol', label: 'Symbol' },
    { field: 'pl', label: 'Realized P/L %' },
    { field: 'realizedPL', label: 'Realized P/L $' },
    { field: 'totalCost', label: 'Total Cost' },
    { field: 'totalProceeds', label: 'Total Proceeds' },
    { field: 'closedShares', label: 'Closed Shares' },
  ];

  readonly sortOptions = computed(() => {
    return this.isClosedTab() ? this.closedSortOptions : this.openSortOptions;
  });

  readonly totalCostConverted = computed<number>(() => {
    const data = this.result();
    if (!data) return 0;
    if (this.isClosedTab()) {
      return this.sumConverted(this.filteredClosedSummaries(), s => s.totalCost);
    }
    return this.sumConverted(data.summaries, s => s.totalCost);
  });

  readonly totalProceedsConverted = computed<number>(() => {
    if (!this.result()) return 0;
    return this.sumConverted(this.filteredClosedSummaries(), s => s.totalProceeds);
  });

  readonly totalRealizedPLConverted = computed<number>(() => {
    if (!this.result()) return 0;
    return this.sumConverted(this.filteredClosedSummaries(), s => s.realizedPL);
  });

  readonly totalRealizedPLPercent = computed<number>(() => {
    if (!this.result()) return 0;
    const closedCost = this.sumConverted(this.filteredClosedSummaries(), s => s.totalCost);
    if (closedCost === 0) return 0;
    return (this.totalRealizedPLConverted() / closedCost) * 100;
  });

  readonly totalHoldingConverted = computed<number>(() => {
    const data = this.result();
    const priceMap = this.prices();
    if (!data || this.isClosedTab()) return 0;

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
    if (this.isClosedTab()) {
      return this.totalProceedsConverted() - this.totalCostConverted();
    }
    return this.totalHoldingConverted() - this.totalCostConverted();
  });

  readonly totalPLPercent = computed<number>(() => {
    const cost = this.totalCostConverted();
    if (cost === 0) return 0;
    return (this.totalPL() / cost) * 100;
  });

  readonly hasRate = computed<boolean>(() => this.exchangeRate() > 0);

  constructor() {
    this.initTheme();
    this.loadTab(this.activeTab());
  }

  private initTheme(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('sharelot_theme') as 'dark' | 'light' | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          this.setTheme(savedTheme);
        } else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
          this.setTheme('light');
        } else {
          this.setTheme('dark');
        }
      } catch {
        this.setTheme('dark');
      }
    }
  }

  toggleTheme(): void {
    const nextTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.theme.set(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('sharelot_theme', theme);
      } catch {
        // Ignore localStorage errors (e.g. incognito/sandboxed)
      }
    }
  }

  private sumConverted<T extends { currency: string }>(items: T[], valueGetter: (item: T) => number): number {
    return items.reduce((sum, s) => {
      if (!this.hasRate() && s.currency !== this.displayCurrency()) return sum;
      return sum + this.cx(valueGetter(s), s.currency);
    }, 0);
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

  readonly filteredSummaries = computed<SymbolSummary[]>(() => {
    const data = this.result();
    if (!data) return [];
    const query = this.searchQuery().trim().toUpperCase();
    let list = query
      ? data.summaries.filter((s) => s.symbol.toUpperCase().includes(query) || this.getSymbolName(s.symbol).toUpperCase().includes(query))
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
        default:
          va = this.cx(a.totalCost, a.currency);
          vb = this.cx(b.totalCost, b.currency);
          break;
      }

      return dir * ((va as number) - (vb as number));
    });

    return list;
  });

  readonly filteredClosedSummaries = computed<ClosedSymbolSummary[]>(() => {
    const data = this.result();
    if (!data || !data.closedSummaries) return [];

    let list = [...data.closedSummaries];

    // Filter by Asset Type on Closed Position tab
    const typeFilter = this.selectedClosedAssetType();
    if (this.isClosedTab() && typeFilter !== 'all') {
      list = list.filter((s) => getAssetType(s.assetType, s.symbol) === typeFilter);
    }

    const query = this.searchQuery().trim().toUpperCase();
    if (query) {
      list = list.filter((s) => s.symbol.toUpperCase().includes(query) || this.getSymbolName(s.symbol).toUpperCase().includes(query));
    }

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
          va = this.cx(a.averageBuyPrice, a.currency);
          vb = this.cx(b.averageBuyPrice, b.currency);
          break;
        case 'holdingValue':
        case 'totalProceeds':
          va = this.cx(a.totalProceeds, a.currency);
          vb = this.cx(b.totalProceeds, b.currency);
          break;
        case 'realizedPL':
          va = this.cx(a.realizedPL, a.currency);
          vb = this.cx(b.realizedPL, b.currency);
          break;
        case 'pl':
          va = a.realizedPLPercent;
          vb = b.realizedPLPercent;
          break;
        case 'totalShares':
        case 'closedShares':
          va = a.closedShares;
          vb = b.closedShares;
          break;
        default:
          va = this.cx(a.realizedPL, a.currency);
          vb = this.cx(b.realizedPL, b.currency);
          break;
      }

      return dir * ((va as number) - (vb as number));
    });

    return list;
  });

  setClosedAssetTypeFilter(type: string): void {
    this.selectedClosedAssetType.set(type);
  }

  setSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'symbol' ? 'asc' : 'desc');
    }
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  onSortDropdownChange(event: Event): void {
    const field = (event.target as HTMLSelectElement).value;
    this.sortField.set(field);
  }

  onClosedAssetTypeChange(event: Event): void {
    const type = (event.target as HTMLSelectElement).value;
    this.setClosedAssetTypeFilter(type);
  }

  selectTab(tab: AssetTab): void {
    if (tab.id === this.activeTab().id) return;
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.selectedClosedAssetType.set('all');
    this.expandedSymbols.set(new Set());
    if (tab.id === 'closed-position') {
      this.sortField.set('realizedPL');
      this.sortDirection.set('desc');
    } else {
      this.sortField.set('totalCost');
      this.sortDirection.set('desc');
    }
    this.loadTab(tab);
  }

  onTabDropdownChange(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;
    const tab = this.tabs.find((t) => t.id === selectedId);
    if (tab) {
      this.selectTab(tab);
    }
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
    const allSummaries: { symbol: string; assetType?: string }[] = [
      ...result.summaries,
      ...result.closedSummaries,
    ];

    if (allSummaries.length === 0) {
      this.priceService.fetchExchangeRate().subscribe((rate) => {
        if (rate > 0) this.exchangeRate.set(rate);
      });
      return;
    }

    this.pricesLoading.set(true);
    this.priceService.fetchPricesAndRate(allSummaries).subscribe(({ prices, rate }) => {
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
    const symbols = new Set<string>();
    if (!this.isClosedTab()) {
      data.summaries.forEach(s => symbols.add(s.symbol));
    }
    if (this.isClosedTab() || this.isAllTab()) {
      data.closedSummaries.forEach(s => symbols.add(s.symbol));
    }
    this.expandedSymbols.set(symbols);
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

  getAssetTypeLabel(assetType?: string, symbol?: string): string {
    return getAssetTypeLabel(assetType, symbol);
  }

  getAssetTypeClass(assetType?: string, symbol?: string): string {
    return getAssetTypeClass(assetType, symbol);
  }
}
