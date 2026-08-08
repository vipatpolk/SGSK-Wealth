import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionHistoryComponent } from './transaction-history.component';
import { SymbolTransactionSummary, SymbolSummary } from '../../models/transaction.model';

describe('TransactionHistoryComponent', () => {
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;

  const mockTransactionSummaries: SymbolTransactionSummary[] = [
    {
      symbol: 'TSLA',
      assetType: 'us-stock',
      currency: 'USD',
      totalTransactions: 2,
      buyCount: 1,
      sellCount: 1,
      totalBuyShares: 5,
      totalSellShares: 5,
      totalBuyAmount: 1000,
      totalSellAmount: 1250,
      averageBuyPrice: 200,
      averageSellPrice: 250,
      netShares: 0,
      netInvested: 0,
      currentStatus: 'CLOSED',
      realizedPL: 250,
      realizedPLPercent: 25,
      firstTradeDate: '2024-01-10',
      lastTradeDate: '2024-02-10',
      transactions: [
        {
          id: 'TSLA-2024-01-10-1',
          symbol: 'TSLA',
          date: '2024-01-10',
          type: 'BUY',
          quantity: 5,
          rawQuantity: 5,
          price: 200,
          totalAmount: 1000,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 5,
          runningTotalCost: 1000,
          runningAverageCost: 200,
        },
        {
          id: 'TSLA-2024-02-10-2',
          symbol: 'TSLA',
          date: '2024-02-10',
          type: 'SELL',
          quantity: 5,
          rawQuantity: -5,
          price: 250,
          totalAmount: 1250,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 0,
          runningTotalCost: 0,
          runningAverageCost: 0,
          realizedPL: 250,
          realizedPLPercent: 25,
        },
      ],
    },
    {
      symbol: 'AAPL',
      assetType: 'us-stock',
      currency: 'USD',
      totalTransactions: 3,
      buyCount: 2,
      sellCount: 1,
      totalBuyShares: 20,
      totalSellShares: 15,
      totalBuyAmount: 3100,
      totalSellAmount: 2700,
      averageBuyPrice: 155,
      averageSellPrice: 180,
      netShares: 5,
      netInvested: 800,
      currentStatus: 'OPEN',
      realizedPL: 400,
      realizedPLPercent: 21.05,
      firstTradeDate: '2024-01-01',
      lastTradeDate: '2024-03-01',
      transactions: [
        {
          id: 'AAPL-2024-01-01-1',
          symbol: 'AAPL',
          date: '2024-01-01',
          type: 'BUY',
          quantity: 10,
          rawQuantity: 10,
          price: 150,
          totalAmount: 1500,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 10,
          runningTotalCost: 1500,
          runningAverageCost: 150,
        },
        {
          id: 'AAPL-2024-02-01-2',
          symbol: 'AAPL',
          date: '2024-02-01',
          type: 'BUY',
          quantity: 10,
          rawQuantity: 10,
          price: 160,
          totalAmount: 1600,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 20,
          runningTotalCost: 3100,
          runningAverageCost: 155,
        },
        {
          id: 'AAPL-2024-03-01-3',
          symbol: 'AAPL',
          date: '2024-03-01',
          type: 'SELL',
          quantity: 15,
          rawQuantity: -15,
          price: 180,
          totalAmount: 2700,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 5,
          runningTotalCost: 800,
          runningAverageCost: 160,
          realizedPL: 400,
          realizedPLPercent: 21.05,
        },
      ],
    },
    {
      symbol: 'PTT.BK',
      assetType: 'thai-stock',
      currency: 'THB',
      totalTransactions: 1,
      buyCount: 1,
      sellCount: 0,
      totalBuyShares: 100,
      totalSellShares: 0,
      totalBuyAmount: 3400,
      totalSellAmount: 0,
      averageBuyPrice: 34,
      averageSellPrice: 0,
      netShares: 100,
      netInvested: 3400,
      currentStatus: 'OPEN',
      realizedPL: 0,
      realizedPLPercent: 0,
      firstTradeDate: '2024-01-15',
      lastTradeDate: '2024-01-15',
      transactions: [
        {
          id: 'PTT.BK-2024-01-15-1',
          symbol: 'PTT.BK',
          date: '2024-01-15',
          type: 'BUY',
          quantity: 100,
          rawQuantity: 100,
          price: 34,
          totalAmount: 3400,
          currency: 'THB',
          assetType: 'thai-stock',
          runningShares: 100,
          runningTotalCost: 3400,
          runningAverageCost: 34,
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transactionSummaries', mockTransactionSummaries);
    fixture.componentRef.setInput('displayCurrency', 'USD');
    fixture.componentRef.setInput('exchangeRate', 33);
    fixture.detectChanges();
  });

  it('should create component and default to all symbols feed', () => {
    expect(component).toBeTruthy();
    expect(component.currentSymbol()).toBe('');
    expect(component.activeSummary()).toBeNull();
  });

  it('should sort available symbols with OPEN positions first, then alphabetically', () => {
    const symbols = component.availableSymbols();
    expect(symbols.length).toBe(3);

    // AAPL (OPEN) and PTT.BK (OPEN) must come before TSLA (CLOSED)
    expect(symbols[0].currentStatus).toBe('OPEN');
    expect(symbols[1].currentStatus).toBe('OPEN');
    expect(symbols[2].currentStatus).toBe('CLOSED');
    expect(symbols[2].symbol).toBe('TSLA');

    // Alphabetical within OPEN: AAPL ('AAPL') vs PTT.BK ('PTT') -> 'AAPL' < 'PTT'
    expect(symbols[0].symbol).toBe('AAPL');
    expect(symbols[1].symbol).toBe('PTT.BK');
  });

  it('should filter transactions by BUY and SELL type filter', () => {
    // Default is all (3 AAPL + 2 TSLA + 1 PTT = 6 total)
    expect(component.filteredTransactions().length).toBe(6);

    // Filter by BUY
    component.typeFilter.set('buy');
    const buyTxs = component.filteredTransactions();
    expect(buyTxs.length).toBe(4);
    expect(buyTxs.every((t) => t.type === 'BUY')).toBe(true);

    // Filter by SELL
    component.typeFilter.set('sell');
    const sellTxs = component.filteredTransactions();
    expect(sellTxs.length).toBe(2);
    expect(sellTxs.every((t) => t.type === 'SELL')).toBe(true);
  });

  it('should filter by asset category tab and dropdown change', () => {
    component.setAssetFilter('thai-stock');
    expect(component.filteredSummaries().length).toBe(1);
    expect(component.filteredSummaries()[0].symbol).toBe('PTT.BK');

    component.setAssetFilter('us-stock');
    expect(component.filteredSummaries().length).toBe(2);

    const mockSelectEvent = {
      target: { value: 'all' },
    } as unknown as Event;
    component.onAssetTypeChange(mockSelectEvent);
    expect(component.filteredSummaries().length).toBe(3);
    expect(component.assetFilter()).toBe('all');
  });

  it('should select specific symbol and emit symbolSelected output', () => {
    const emitted: string[] = [];
    component.symbolSelected.subscribe((sym) => emitted.push(sym));

    component.selectSymbol('AAPL');
    expect(component.currentSymbol()).toBe('AAPL');
    expect(component.activeSummary()?.symbol).toBe('AAPL');
    expect(component.filteredTransactions().length).toBe(3);
    expect(emitted).toEqual(['AAPL']);

    component.clearSymbolSelection();
    expect(component.currentSymbol()).toBe('');
    expect(component.activeSummary()).toBeNull();
    expect(emitted).toEqual(['AAPL', '']);
  });

  it('should toggle sort order between descending and ascending', () => {
    expect(component.sortOrder()).toBe('desc');
    component.toggleSort();
    expect(component.sortOrder()).toBe('asc');
    component.toggleSort();
    expect(component.sortOrder()).toBe('desc');
  });

  it('should filter transactions by date range', () => {
    // Total transactions: 6 (dates: 2024-01-01, 2024-01-10, 2024-01-15, 2024-02-01, 2024-02-10, 2024-03-01)
    expect(component.filteredTransactions().length).toBe(6);

    // Filter start date
    component.startDate.set('2024-02-01');
    const startFiltered = component.filteredTransactions();
    // Expected on or after 2024-02-01: AAPL (2024-02-01), TSLA (2024-02-10), AAPL (2024-03-01) => 3 transactions
    expect(startFiltered.length).toBe(3);

    // Filter end date
    component.endDate.set('2024-02-15');
    const rangeFiltered = component.filteredTransactions();
    // Expected between 2024-02-01 and 2024-02-15: AAPL (2024-02-01), TSLA (2024-02-10) => 2 transactions
    expect(rangeFiltered.length).toBe(2);

    // Clear date range
    component.clearDateRange();
    expect(component.startDate()).toBe('');
    expect(component.endDate()).toBe('');
    expect(component.filteredTransactions().length).toBe(6);
  });

  it('should toggle and close symbol dropdown', () => {
    expect(component.isSymbolDropdownOpen()).toBe(false);
    component.toggleSymbolDropdown();
    expect(component.isSymbolDropdownOpen()).toBe(true);
    component.closeSymbolDropdown();
    expect(component.isSymbolDropdownOpen()).toBe(false);
  });

  it('should dynamically retrieve and display symbol names from prices map', () => {
    const pricesMap = new Map([
      ['AAPL', { symbol: 'AAPL', name: 'Apple Inc.', price: 175, currency: 'USD' }],
      ['TSLA', { symbol: 'TSLA', name: 'Tesla, Inc.', price: 200, currency: 'USD' }],
    ]);
    fixture.componentRef.setInput('prices', pricesMap);
    fixture.detectChanges();

    expect(component.getSymbolName('AAPL')).toBe('Apple Inc.');
    expect(component.getSymbolName('TSLA')).toBe('Tesla, Inc.');
    expect(component.getSymbolName('UNKNOWN')).toBe('');
  });

  it('should initialize pagination with default page size 50 and page 1', () => {
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(50);
    expect(component.pageSizeOptions).toEqual([10, 50, 100]);
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedTransactions().length).toBe(6);
    expect(component.startIndex()).toBe(1);
    expect(component.endIndex()).toBe(6);
  });

  it('should paginate transactions when page size is changed to 10 with multiple transactions', () => {
    // Generate a mock summary with 25 transactions
    const manyTxs = Array.from({ length: 25 }, (_, i) => ({
      id: `TX-${i + 1}`,
      symbol: 'AAPL',
      date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      type: (i % 2 === 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
      quantity: 10,
      rawQuantity: 10,
      price: 150 + i,
      totalAmount: (150 + i) * 10,
      currency: 'USD',
      assetType: 'us-stock',
      runningShares: 10,
      runningTotalCost: 1500,
      runningAverageCost: 150,
    }));

    const mockLargeSummary: SymbolTransactionSummary[] = [
      {
        symbol: 'AAPL',
        assetType: 'us-stock',
        currency: 'USD',
        totalTransactions: 25,
        buyCount: 13,
        sellCount: 12,
        totalBuyShares: 130,
        totalSellShares: 120,
        totalBuyAmount: 20000,
        totalSellAmount: 22000,
        averageBuyPrice: 150,
        averageSellPrice: 180,
        netShares: 10,
        netInvested: 1500,
        currentStatus: 'OPEN',
        realizedPL: 2000,
        realizedPLPercent: 10,
        firstTradeDate: '2024-01-01',
        lastTradeDate: '2024-01-25',
        transactions: manyTxs,
      },
    ];

    fixture.componentRef.setInput('transactionSummaries', mockLargeSummary);
    fixture.detectChanges();

    // Default page size is 50 -> 1 page of 25
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedTransactions().length).toBe(25);

    // Change page size to 10
    component.setPageSize(10);
    expect(component.pageSize()).toBe(10);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(3);
    expect(component.paginatedTransactions().length).toBe(10);
    expect(component.startIndex()).toBe(1);
    expect(component.endIndex()).toBe(10);

    // Page 2
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedTransactions().length).toBe(10);
    expect(component.startIndex()).toBe(11);
    expect(component.endIndex()).toBe(20);

    // Page 3 (last page with 5 items)
    component.nextPage();
    expect(component.currentPage()).toBe(3);
    expect(component.paginatedTransactions().length).toBe(5);
    expect(component.startIndex()).toBe(21);
    expect(component.endIndex()).toBe(25);

    // Should not exceed totalPages
    component.nextPage();
    expect(component.currentPage()).toBe(3);

    // Previous Page
    component.prevPage();
    expect(component.currentPage()).toBe(2);

    // First Page
    component.firstPage();
    expect(component.currentPage()).toBe(1);

    // Last Page
    component.lastPage();
    expect(component.currentPage()).toBe(3);
  });

  it('should reset current page to 1 when changing filters or page size', () => {
    component.currentPage.set(2);
    component.setPageSize(10);
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.setTypeFilter('buy');
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.setAssetFilter('thai-stock');
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.selectSymbol('TSLA');
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.clearSymbolSelection();
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.onDateRangeChange({ startDate: '2024-01-01', endDate: '2024-01-31' });
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.clearDateRange();
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(2);
    component.toggleSort();
    expect(component.currentPage()).toBe(1);
  });

  it('should generate appropriate displayed page numbers with ellipsis for many pages', () => {
    // 7 or fewer pages
    expect(component.displayedPageNumbers()).toEqual([1]);

    // Create component with 150 items and page size 10 -> 15 pages
    const mock150Txs = Array.from({ length: 150 }, (_, i) => ({
      id: `TX-${i + 1}`,
      symbol: 'AAPL',
      date: `2024-01-01`,
      type: 'BUY' as const,
      quantity: 1,
      rawQuantity: 1,
      price: 100,
      totalAmount: 100,
      currency: 'USD',
      assetType: 'us-stock',
      runningShares: i + 1,
      runningTotalCost: (i + 1) * 100,
      runningAverageCost: 100,
    }));

    fixture.componentRef.setInput('transactionSummaries', [
      {
        symbol: 'AAPL',
        assetType: 'us-stock',
        currency: 'USD',
        totalTransactions: 150,
        buyCount: 150,
        sellCount: 0,
        totalBuyShares: 150,
        totalSellShares: 0,
        totalBuyAmount: 15000,
        totalSellAmount: 0,
        averageBuyPrice: 100,
        averageSellPrice: 0,
        netShares: 150,
        netInvested: 15000,
        currentStatus: 'OPEN',
        realizedPL: 0,
        realizedPLPercent: 0,
        firstTradeDate: '2024-01-01',
        lastTradeDate: '2024-01-01',
        transactions: mock150Txs,
      },
    ]);
    component.setPageSize(10);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(15);

    // On page 1: [1, 2, 3, 4, 5, '...', 15]
    component.setPage(1);
    expect(component.displayedPageNumbers()).toEqual([1, 2, 3, 4, 5, '...', 15]);

    // On middle page 8: [1, '...', 7, 8, 9, '...', 15]
    component.setPage(8);
    expect(component.displayedPageNumbers()).toEqual([1, '...', 7, 8, 9, '...', 15]);

    // On near end page 14: [1, '...', 11, 12, 13, 14, 15]
    component.setPage(14);
    expect(component.displayedPageNumbers()).toEqual([1, '...', 11, 12, 13, 14, 15]);
  });

  it('should handle onPageSizeChange event from select element', () => {
    const mockEvent = {
      target: { value: '100' },
    } as unknown as Event;

    component.onPageSizeChange(mockEvent);
    expect(component.pageSize()).toBe(100);
  });
});


