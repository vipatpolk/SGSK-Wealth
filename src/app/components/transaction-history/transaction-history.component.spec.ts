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

  it('should filter by asset category tab', () => {
    component.setAssetFilter('thai-stock');
    expect(component.filteredSummaries().length).toBe(1);
    expect(component.filteredSummaries()[0].symbol).toBe('PTT.BK');

    component.setAssetFilter('us-stock');
    expect(component.filteredSummaries().length).toBe(2);

    component.setAssetFilter('all');
    expect(component.filteredSummaries().length).toBe(3);
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

  it('should filter transactions by search query', () => {
    component.searchQuery.set('TSLA');
    expect(component.filteredTransactions().length).toBe(2);

    component.searchQuery.set('2024-01-01');
    expect(component.filteredTransactions().length).toBe(1);
    expect(component.filteredTransactions()[0].symbol).toBe('AAPL');
  });

  it('should toggle and close symbol dropdown', () => {
    expect(component.isSymbolDropdownOpen()).toBe(false);
    component.toggleSymbolDropdown();
    expect(component.isSymbolDropdownOpen()).toBe(true);
    component.closeSymbolDropdown();
    expect(component.isSymbolDropdownOpen()).toBe(false);
  });
});
