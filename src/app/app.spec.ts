import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ShareLot');
  });

  it('should have closed position tab in tabs list', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const closedTab = app.tabs.find((t) => t.id === 'closed-position');
    expect(closedTab).toBeDefined();
    expect(closedTab?.label).toBe('Closed Position');
  });

  it('should select tab and update active tab', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const closedTab = app.tabs.find((t) => t.id === 'closed-position')!;

    app.selectTab(closedTab);

    expect(app.activeTab().id).toBe('closed-position');
  });

  it('should toggle between dark and light themes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setTheme('dark');
    expect(app.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    app.toggleTheme();
    expect(app.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    app.toggleTheme();
    expect(app.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should handle sort dropdown change and sort direction toggle on mobile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setSort('symbol');
    expect(app.sortField()).toBe('symbol');

    // For 'symbol', default direction is asc, toggle to desc
    expect(app.sortDirection()).toBe('asc');
    app.toggleSortDirection();
    expect(app.sortDirection()).toBe('desc');
    app.toggleSortDirection();
    expect(app.sortDirection()).toBe('asc');
  });

  it('should handle asset filter dropdown change on mobile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setClosedAssetTypeFilter('crypto');
    expect(app.selectedClosedAssetType()).toBe('crypto');
  });

  it('should filter closed summaries by asset type', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Switch to closed position tab
    const closedTab = app.tabs.find((t) => t.id === 'closed-position')!;
    app.activeTab.set(closedTab);

    // Set mock result
    app.result.set({
      summaries: [],
      closedSummaries: [
        {
          symbol: 'AAPL',
          totalShares: 0,
          closedShares: 10,
          totalCost: 1500,
          totalProceeds: 1800,
          realizedPL: 300,
          realizedPLPercent: 20,
          averageBuyPrice: 150,
          averageSellPrice: 180,
          currency: 'USD',
          assetType: 'us-stock',
          lots: [],
        },
        {
          symbol: 'TISCO.BK',
          totalShares: 0,
          closedShares: 100,
          totalCost: 10000,
          totalProceeds: 11000,
          realizedPL: 1000,
          realizedPLPercent: 10,
          averageBuyPrice: 100,
          averageSellPrice: 110,
          currency: 'THB',
          assetType: 'thai-stock',
          lots: [],
        },
        {
          symbol: 'ES-GTECHSSF.BKFUND',
          totalShares: 0,
          closedShares: 500,
          totalCost: 5000,
          totalProceeds: 5500,
          realizedPL: 500,
          realizedPLPercent: 10,
          averageBuyPrice: 10,
          averageSellPrice: 11,
          currency: 'THB',
          assetType: 'mutual-fund',
          lots: [],
        },
      ],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 3,
      totalLots: 0,
      error: null,
    });

    // Default 'all'
    expect(app.filteredClosedSummaries().length).toBe(3);
    expect(app.closedAssetTypeOptions().find((o) => o.id === 'all')?.count).toBe(3);
    expect(app.closedAssetTypeOptions().find((o) => o.id === 'mutual-fund')?.count).toBe(1);

    // Filter by mutual-fund
    app.setClosedAssetTypeFilter('mutual-fund');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('ES-GTECHSSF.BKFUND');

    // Filter by us-stock
    app.setClosedAssetTypeFilter('us-stock');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('AAPL');

    // Filter by thai-stock
    app.setClosedAssetTypeFilter('thai-stock');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('TISCO.BK');
  });

  it('should correctly calculate holding value and P/L for crypto paired with USDT when transactions are in THB', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Set exchange rate: 1 USD = 33.0 THB
    app.exchangeRate.set(33.0);
    app.displayCurrency.set('THB');

    // Price data for PAXG.CRYPTO is in USD (USDT pair from Binance TH: price $4,000 USD)
    const priceMap = new Map();
    priceMap.set('PAXG.CRYPTO', {
      symbol: 'PAXG.CRYPTO',
      name: 'PAX Gold',
      price: 4000,
      currency: 'USD',
    });
    app.prices.set(priceMap);

    // Summary has transactions in THB: 0.01 shares bought at 130,000 THB each = 1,300 THB totalCost
    const paxgSummary = {
      symbol: 'PAXG.CRYPTO',
      totalShares: 0.01,
      totalCost: 1300,
      averageCost: 130000,
      currency: 'THB',
      assetType: 'crypto',
      lots: [
        {
          symbol: 'PAXG.CRYPTO',
          purchaseDate: '2026-01-01',
          quantity: 0.01,
          costBasis: 130000,
          totalCost: 1300,
          assetType: 'crypto',
        },
      ],
    };

    app.result.set({
      summaries: [paxgSummary],
      closedSummaries: [],
      totalCostByCurrency: { THB: 1300 },
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 1,
      totalLots: 1,
      error: null,
    });

    // 1. Current Price in summary currency (THB): 4000 USD * 33 = 132,000 THB
    expect(app.getCurrentPriceInSummaryCurrency(paxgSummary)).toBe(132000);

    // 2. Current Price converted to display currency (THB): 132,000 THB
    expect(app.getCurrentPriceConverted(paxgSummary)).toBe(132000);

    // 3. Holding Value in summary currency (THB): 0.01 * 132,000 = 1,320 THB
    expect(app.getHoldingValue(paxgSummary)).toBe(1320);

    // 4. Unrealized P/L in summary currency (THB): 1,320 - 1,300 = +20 THB
    expect(app.getUnrealizedPL(paxgSummary)).toBe(20);
    expect(app.getUnrealizedPLPercent(paxgSummary)).toBeCloseTo(1.538, 2);

    // 5. Lot holding value & P/L
    expect(app.getLotHoldingValue(paxgSummary.lots[0], paxgSummary)).toBe(1320);
    expect(app.getLotUnrealizedPL(paxgSummary.lots[0], paxgSummary)).toBe(20);
    expect(app.getLotUnrealizedPLPercent(paxgSummary.lots[0], paxgSummary)).toBeCloseTo(1.538, 2);

    // 6. Portfolio Totals in THB
    expect(app.totalHoldingConverted()).toBe(1320);
    expect(app.totalCostConverted()).toBe(1300);
    expect(app.totalPL()).toBe(20);

    // 7. Toggle display currency to USD
    app.displayCurrency.set('USD');
    // Price converted to USD display currency: $4,000
    expect(app.getCurrentPriceConverted(paxgSummary)).toBe(4000);
    // Holding converted to USD: 1320 / 33 = $40
    expect(app.cx(app.getHoldingValue(paxgSummary), paxgSummary.currency)).toBe(40);
    // Total holding in USD: $40
    expect(app.totalHoldingConverted()).toBeCloseTo(40, 2);
    // Total cost in USD: 1300 / 33 = $39.39
    expect(app.totalCostConverted()).toBeCloseTo(39.3939, 2);
    // Total P/L in USD: 20 / 33 = $0.606
    expect(app.totalPL()).toBeCloseTo(0.606, 2);
  });

  it('should format display symbols correctly stripping .BKFUND, .BK, and .CRYPTO suffixes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.getDisplaySymbol('ES-GTECHSSF.BKFUND')).toBe('ES-GTECHSSF');
    expect(app.getDisplaySymbol('SCBSFF.BKFUND')).toBe('SCBSFF');
    expect(app.getDisplaySymbol('PTT.BK')).toBe('PTT');
    expect(app.getDisplaySymbol('BTC.CRYPTO')).toBe('BTC');
    expect(app.getDisplaySymbol('AAPL')).toBe('AAPL');
  });

  it('should provide autocomplete suggestions and handle item selection and keyboard navigation', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.result.set({
      summaries: [
        {
          symbol: 'NVDA',
          totalShares: 10,
          totalCost: 1000,
          averageCost: 100,
          currency: 'USD',
          assetType: 'us-stock',
          lots: [],
        },
        {
          symbol: 'BTC.CRYPTO',
          totalShares: 0.5,
          totalCost: 30000,
          averageCost: 60000,
          currency: 'USD',
          assetType: 'crypto',
          lots: [],
        },
      ],
      closedSummaries: [
        {
          symbol: 'AAPL',
          totalShares: 0,
          closedShares: 20,
          totalCost: 3000,
          totalProceeds: 3600,
          averageBuyPrice: 150,
          averageSellPrice: 180,
          realizedPL: 600,
          realizedPLPercent: 20,
          currency: 'USD',
          assetType: 'us-stock',
          lots: [],
        },
      ],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 3,
      totalLots: 3,
      error: null,
    });

    // 1. Initial state when query is empty on All tab -> suggests all available symbols
    expect(app.autocompleteSuggestions().length).toBe(3);

    // 2. Filter by search query 'NV'
    app.onSearchInput('NV');
    expect(app.isSearchDropdownOpen()).toBe(true);
    const nvMatches = app.autocompleteSuggestions();
    expect(nvMatches.length).toBe(1);
    expect(nvMatches[0].symbol).toBe('NVDA');
    expect(nvMatches[0].displaySymbol).toBe('NVDA');

    // 3. Filter by search query 'BTC'
    app.onSearchInput('BTC');
    const btcMatches = app.autocompleteSuggestions();
    expect(btcMatches.length).toBe(1);
    expect(btcMatches[0].displaySymbol).toBe('BTC');

    // 4. Keyboard navigation (ArrowDown, ArrowUp, Enter)
    app.onSearchInput('');
    expect(app.searchActiveIndex()).toBe(-1);

    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    app.onSearchKeydown(downEvent);
    expect(app.searchActiveIndex()).toBe(0);

    app.onSearchKeydown(downEvent);
    expect(app.searchActiveIndex()).toBe(1);

    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    app.onSearchKeydown(upEvent);
    expect(app.searchActiveIndex()).toBe(0);

    // 5. Selecting an autocomplete item
    const selectedItem = app.autocompleteSuggestions()[0];
    app.selectAutocompleteItem(selectedItem);
    expect(app.searchQuery()).toBe(selectedItem.displaySymbol);
    expect(app.isSearchDropdownOpen()).toBe(false);
    expect(app.isExpanded(selectedItem.symbol)).toBe(true);

    // 6. Clear search query
    app.clearSearchQuery();
    expect(app.searchQuery()).toBe('');
    expect(app.searchActiveIndex()).toBe(-1);

    // 7. Escape key closes dropdown
    app.onSearchFocus();
    expect(app.isSearchDropdownOpen()).toBe(true);
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    app.onSearchKeydown(escEvent);
    expect(app.isSearchDropdownOpen()).toBe(false);
  });
});

