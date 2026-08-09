import { Component, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { DecimalPipe, CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ShareLotService, SheetResult } from './services/share-lot.service';
import { PriceService, PriceData } from './services/price.service';
import { SymbolSummary, ClosedSymbolSummary, ShareLot } from './models/transaction.model';
import { AssetTab, ASSET_TABS } from './config/asset.constants';
import { TransactionHistoryComponent } from './components/transaction-history/transaction-history.component';
import { HeaderComponent } from './components/header/header.component';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { FiltersComponent } from './components/filters/filters.component';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { AssetAllocationComponent } from './components/asset-allocation/asset-allocation.component';
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
  generateAssetTypeOptions,
} from './utils/format.utils';

export interface SymbolAutocompleteItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  color: string;
  assetType: string;
  assetTypeLabel: string;
  isClosed: boolean;
  totalShares: number;
  totalCost: number;
  currency: string;
  holdingValue?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  realizedPL?: number;
  realizedPLPercent?: number;
  hasPrice?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    DecimalPipe, CurrencyPipe, NgTemplateOutlet, TransactionHistoryComponent,
    HeaderComponent, TabBarComponent, SearchBarComponent, FiltersComponent, SummaryCardComponent, AssetAllocationComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  private readonly shareLotService = inject(ShareLotService);
  private readonly priceService = inject(PriceService);

  readonly tabs = ASSET_TABS;
  readonly activeTab = signal<AssetTab>(ASSET_TABS[0]);

  /** View Mode: Holdings / Positions vs Transactions History vs Allocation */
  readonly currentView = signal<'holdings' | 'transactions' | 'allocation'>('holdings');
  readonly selectedHistorySymbol = signal<string>('');

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly result = signal<SheetResult | null>(null);
  readonly prices = signal<Map<string, PriceData>>(new Map());
  readonly pricesLoading = signal(false);

  /** Per-tab cache to avoid redundant network requests on tab switch */
  private readonly tabCache = new Map<string, {
    result: SheetResult;
    prices: Map<string, PriceData>;
    exchangeRate: number;
    timestamp: number;
  }>();

  /** Currency conversion */
  readonly displayCurrency = signal<'USD' | 'THB'>('THB');
  readonly exchangeRate = signal<number>(0); // USD → THB rate

  /** Theme (dark/light) */
  readonly theme = signal<'dark' | 'light'>('dark');

  readonly expandedSymbols = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isSearchDropdownOpen = signal<boolean>(false);
  readonly searchActiveIndex = signal<number>(-1);

  readonly sortField = signal<string>('totalCost');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedClosedAssetType = signal<string>('all');

  readonly isTabDropdownOpen = signal<boolean>(false);
  readonly isMobileSortDropdownOpen = signal<boolean>(false);
  readonly isMobileFilterDropdownOpen = signal<boolean>(false);

  toggleTabDropdown(): void {
    this.isTabDropdownOpen.set(!this.isTabDropdownOpen());
  }

  toggleMobileSortDropdown(): void {
    this.isMobileSortDropdownOpen.set(!this.isMobileSortDropdownOpen());
  }

  toggleMobileFilterDropdown(): void {
    this.isMobileFilterDropdownOpen.set(!this.isMobileFilterDropdownOpen());
  }

  readonly isClosedTab = computed<boolean>(() => this.activeTab().id === 'closed-position');
  readonly isAllTab = computed<boolean>(() => this.activeTab().id === 'all');

  openTransactionHistory(symbol: string = ''): void {
    this.selectedHistorySymbol.set(symbol);
    this.currentView.set('transactions');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openHoldingsView(): void {
    this.currentView.set('holdings');
  }

  setView(view: 'holdings' | 'transactions' | 'allocation'): void {
    this.currentView.set(view);
    if (view === 'allocation') {
      this.selectTab(ASSET_TABS[0]);
    }
  }

  readonly closedAssetTypeOptions = computed(() => {
    const data = this.result();
    const list = data?.closedSummaries || [];
    return generateAssetTypeOptions(list);
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
        const holdingValInSummary = this.getHoldingValue(s);
        total += this.cx(holdingValInSummary, s.currency);
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
      const normCurrency = s.currency === 'USDT' ? 'USD' : s.currency;
      if (!this.hasRate() && normCurrency !== this.displayCurrency()) return sum;
      return sum + this.cx(valueGetter(s), s.currency);
    }, 0);
  }

  /** Convert an amount from `fromCurrency` to `toCurrency` using the exchange rate */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    return convertCurrency(amount, fromCurrency, toCurrency, this.exchangeRate());
  }

  /** Convert an amount from `fromCurrency` to the display currency */
  cx(amount: number, fromCurrency: string): number {
    return this.convertCurrency(amount, fromCurrency, this.displayCurrency());
  }

  dc(originalCurrency?: string): string {
    if (!this.hasRate() && originalCurrency) {
      return originalCurrency === 'USDT' ? 'USD' : originalCurrency;
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

  readonly autocompleteSuggestions = computed<SymbolAutocompleteItem[]>(() => {
    const data = this.result();
    if (!data) return [];

    const query = this.searchQuery().trim().toUpperCase();
    const isClosed = this.isClosedTab();
    const isAll = this.isAllTab();

    const items: SymbolAutocompleteItem[] = [];
    const seenSymbols = new Set<string>();

    // 1. Open positions
    if (!isClosed || isAll) {
      for (const s of data.summaries || []) {
        const displaySym = this.getDisplaySymbol(s.symbol);
        const name = this.getSymbolName(s.symbol);
        const type = getAssetType(s.assetType, s.symbol);
        const typeLabel = this.getAssetTypeLabel(s.assetType, s.symbol);

        const matches =
          !query ||
          s.symbol.toUpperCase().includes(query) ||
          displaySym.toUpperCase().includes(query) ||
          name.toUpperCase().includes(query) ||
          typeLabel.toUpperCase().includes(query);

        if (matches) {
          seenSymbols.add(s.symbol);
          const hasPrice = this.hasPriceData(s.symbol);
          const holdingVal = hasPrice ? this.getHoldingValue(s) : undefined;
          const pl = hasPrice ? this.getUnrealizedPL(s) : undefined;
          const plPercent = hasPrice ? this.getUnrealizedPLPercent(s) : undefined;

          items.push({
            symbol: s.symbol,
            displaySymbol: displaySym,
            name,
            color: this.getSymbolColor(s.symbol),
            assetType: type,
            assetTypeLabel: typeLabel,
            isClosed: false,
            totalShares: s.totalShares,
            totalCost: s.totalCost,
            currency: s.currency,
            holdingValue: holdingVal,
            unrealizedPL: pl,
            unrealizedPLPercent: plPercent,
            hasPrice,
          });
        }
      }
    }

    // 2. Closed positions
    if (isClosed || isAll) {
      for (const s of data.closedSummaries || []) {
        if (seenSymbols.has(s.symbol)) continue;

        const displaySym = this.getDisplaySymbol(s.symbol);
        const name = this.getSymbolName(s.symbol);
        const type = getAssetType(s.assetType, s.symbol);
        const typeLabel = this.getAssetTypeLabel(s.assetType, s.symbol);

        const matches =
          !query ||
          s.symbol.toUpperCase().includes(query) ||
          displaySym.toUpperCase().includes(query) ||
          name.toUpperCase().includes(query) ||
          typeLabel.toUpperCase().includes(query);

        if (matches) {
          items.push({
            symbol: s.symbol,
            displaySymbol: displaySym,
            name,
            color: this.getSymbolColor(s.symbol),
            assetType: type,
            assetTypeLabel: typeLabel,
            isClosed: true,
            totalShares: s.closedShares,
            totalCost: s.totalCost,
            currency: s.currency,
            realizedPL: s.realizedPL,
            realizedPLPercent: s.realizedPLPercent,
            hasPrice: false,
          });
        }
      }
    }

    // Sort suggestions: exact matches first, then starts-with, then name matches
    if (query) {
      items.sort((a, b) => {
        const aSym = a.symbol.toUpperCase();
        const bSym = b.symbol.toUpperCase();
        const aDisp = a.displaySymbol.toUpperCase();
        const bDisp = b.displaySymbol.toUpperCase();
        const aName = a.name.toUpperCase();
        const bName = b.name.toUpperCase();

        const aExact = aSym === query || aDisp === query;
        const bExact = bSym === query || bDisp === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aSym.startsWith(query) || aDisp.startsWith(query);
        const bStarts = bSym.startsWith(query) || bDisp.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aNameStarts = aName.startsWith(query);
        const bNameStarts = bName.startsWith(query);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        return 0;
      });
    }

    return items.slice(0, 10);
  });

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.isSearchDropdownOpen.set(true);
    this.searchActiveIndex.set(-1);
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
    this.isSearchDropdownOpen.set(true);
  }

  closeSearchDropdown(): void {
    this.isSearchDropdownOpen.set(false);
    this.isSearchFocused.set(false);
    this.searchActiveIndex.set(-1);
  }

  clearSearchQuery(inputEl?: HTMLInputElement): void {
    this.searchQuery.set('');
    this.searchActiveIndex.set(-1);
    this.isSearchDropdownOpen.set(true);
    if (inputEl) {
      inputEl.focus();
    }
  }

  selectAutocompleteItem(item: SymbolAutocompleteItem): void {
    this.searchQuery.set(item.displaySymbol || item.symbol);
    this.closeSearchDropdown();

    // Expand the selected symbol's card
    this.expandedSymbols.update((set) => {
      const next = new Set(set);
      next.add(item.symbol);
      return next;
    });

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const cardId = item.isClosed ? `closed-card-${item.symbol}` : `card-${item.symbol}`;
        const el = document.getElementById(cardId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const suggestions = this.autocompleteSuggestions();
    const isOpen = this.isSearchDropdownOpen();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        this.isSearchDropdownOpen.set(true);
        this.searchActiveIndex.set(0);
        return;
      }
      if (suggestions.length > 0) {
        const nextIndex = (this.searchActiveIndex() + 1) % suggestions.length;
        this.searchActiveIndex.set(nextIndex);
        this.scrollActiveSuggestionIntoView(nextIndex);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        this.isSearchDropdownOpen.set(true);
        this.searchActiveIndex.set(suggestions.length - 1);
        return;
      }
      if (suggestions.length > 0) {
        const nextIndex = this.searchActiveIndex() <= 0 ? suggestions.length - 1 : this.searchActiveIndex() - 1;
        this.searchActiveIndex.set(nextIndex);
        this.scrollActiveSuggestionIntoView(nextIndex);
      }
    } else if (event.key === 'Enter') {
      if (isOpen && this.searchActiveIndex() >= 0 && this.searchActiveIndex() < suggestions.length) {
        event.preventDefault();
        this.selectAutocompleteItem(suggestions[this.searchActiveIndex()]);
      } else {
        this.closeSearchDropdown();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearchDropdown();
    }
  }

  private scrollActiveSuggestionIntoView(index: number): void {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const itemEl = document.getElementById(`autocomplete-item-${index}`);
        if (itemEl) {
          itemEl.scrollIntoView({ block: 'nearest' });
        }
      }, 10);
    }
  }

  setClosedAssetTypeFilter(type: string): void {
    this.selectedClosedAssetType.set(type);
    this.isMobileFilterDropdownOpen.set(false);
  }

  setSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'symbol' ? 'asc' : 'desc');
    }
    this.isMobileSortDropdownOpen.set(false);
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  }

  selectTab(tab: AssetTab): void {
    this.isTabDropdownOpen.set(false);
    if (tab.id === this.activeTab().id) return;
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.closeSearchDropdown();
    this.selectedClosedAssetType.set('all');
    this.expandedSymbols.set(new Set());
    if (tab.id === 'closed-position') {
      this.sortField.set('realizedPL');
      this.sortDirection.set('desc');
    } else {
      this.sortField.set('totalCost');
      this.sortDirection.set('desc');
    }

    // Restore from cache if available (instant tab switch)
    const cached = this.tabCache.get(tab.id);
    if (cached) {
      this.error.set(null);
      this.result.set(cached.result);
      this.prices.set(cached.prices);
      if (cached.exchangeRate > 0) this.exchangeRate.set(cached.exchangeRate);
      this.loading.set(false);
      this.pricesLoading.set(false);
      return;
    }

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
        : this.shareLotService.fetchSheet(tab.id);

    obs.subscribe({
      next: (res) => {
        if (res.error) {
          this.error.set(res.error);
          this.loading.set(false);
        } else {
          this.result.set(res);
          this.fetchPricesForResult(tab.id, res);
        }
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load sheet data');
        this.loading.set(false);
      },
    });
  }

  private fetchPricesForResult(tabId: string, result: SheetResult): void {
    const seen = new Set<string>();
    const allSummaries: { symbol: string; assetType?: string }[] = [];

    const candidates = [
      ...(result.summaries || []),
      ...(result.closedSummaries || []),
      ...(result.transactionSummaries || []),
    ];

    for (const item of candidates) {
      if (item.symbol && !seen.has(item.symbol)) {
        seen.add(item.symbol);
        allSummaries.push({ symbol: item.symbol, assetType: item.assetType });
      }
    }

    if (allSummaries.length === 0) {
      this.priceService.fetchExchangeRate().subscribe({
        next: (rate) => {
          if (rate > 0) this.exchangeRate.set(rate);
          this.cacheTabData(tabId, result, new Map(), this.exchangeRate());
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
      return;
    }

    this.pricesLoading.set(true);
    this.priceService.fetchPricesAndRate(allSummaries).subscribe({
      next: ({ prices, rate }) => {
        this.prices.set(prices);
        if (rate > 0) this.exchangeRate.set(rate);
        this.cacheTabData(tabId, result, prices, this.exchangeRate());
        this.pricesLoading.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.pricesLoading.set(false);
        this.loading.set(false);
      },
    });
  }

  /** Store fetched data in per-tab cache */
  private cacheTabData(
    tabId: string,
    result: SheetResult,
    prices: Map<string, PriceData>,
    exchangeRate: number
  ): void {
    this.tabCache.set(tabId, {
      result,
      prices,
      exchangeRate,
      timestamp: Date.now(),
    });
  }

  refresh(): void {
    // Clear cache for the active tab so loadTab fetches fresh data
    this.tabCache.delete(this.activeTab().id);
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

  getCurrentPriceInSummaryCurrency(summary: SymbolSummary): number {
    const pd = this.prices().get(summary.symbol);
    if (!pd || pd.price <= 0) return 0;
    return this.convertCurrency(pd.price, pd.currency, summary.currency);
  }

  getCurrentPriceConverted(summary: SymbolSummary): number {
    const pd = this.prices().get(summary.symbol);
    if (!pd || pd.price <= 0) return 0;
    const target = this.dc(summary.currency);
    return this.convertCurrency(pd.price, pd.currency, target);
  }

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

  getHoldingValue(summary: SymbolSummary): number {
    const priceInSummary = this.getCurrentPriceInSummaryCurrency(summary);
    return summary.totalShares * priceInSummary;
  }

  getUnrealizedPL(summary: SymbolSummary): number {
    return this.getHoldingValue(summary) - summary.totalCost;
  }

  getUnrealizedPLPercent(summary: SymbolSummary): number {
    if (summary.totalCost === 0) return 0;
    return (this.getUnrealizedPL(summary) / summary.totalCost) * 100;
  }

  getLotHoldingValue(lot: ShareLot, summary: SymbolSummary): number {
    const priceInSummary = this.getCurrentPriceInSummaryCurrency(summary);
    return lot.quantity * priceInSummary;
  }

  getLotUnrealizedPL(lot: ShareLot, summary: SymbolSummary): number {
    return this.getLotHoldingValue(lot, summary) - lot.totalCost;
  }

  getLotUnrealizedPLPercent(lot: ShareLot, summary: SymbolSummary): number {
    if (lot.totalCost === 0) return 0;
    return (this.getLotUnrealizedPL(lot, summary) / lot.totalCost) * 100;
  }

  hasPriceData(symbol: string): boolean {
    return this.prices().has(symbol) && this.getCurrentPrice(symbol) > 0;
  }

  getQuantityFormat(symbol: string, assetType?: string): string {
    return getQuantityFormat(symbol, assetType);
  }

  getPriceFormat(symbol: string, assetType?: string): string {
    return getPriceFormat(symbol, assetType);
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
