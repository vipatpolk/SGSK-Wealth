import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileTransactionsPage } from './mobile-transactions.page';

const MOCK_TX_PORTFOLIO: PortfolioHoldingsResponse = {
  tabId: 'all',
  currency: 'THB',
  exchangeRate: 35,
  error: null,
  openPositions: [],
  closedPositions: [],
  transactionSummaries: [
    {
      symbol: 'AAPL',
      assetType: 'us-stock',
      currency: 'USD',
      totalTransactions: 2,
      buyCount: 2,
      sellCount: 0,
      totalBuyShares: 10,
      totalSellShares: 0,
      totalBuyAmount: 1500,
      totalSellAmount: 0,
      averageBuyPrice: 150,
      averageSellPrice: 0,
      netShares: 10,
      netInvested: 1500,
      currentStatus: 'OPEN',
      realizedPL: 0,
      realizedPLPercent: 0,
      firstTradeDate: '2025-01-01',
      lastTradeDate: '2025-02-01',
      transactions: [
        {
          id: 't1',
          symbol: 'AAPL',
          date: '2025-01-01',
          type: 'BUY',
          quantity: 5,
          rawQuantity: 5,
          price: 140,
          totalAmount: 700,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 5,
          runningTotalCost: 700,
          runningAverageCost: 140,
        },
        {
          id: 't2',
          symbol: 'AAPL',
          date: '2025-02-01',
          type: 'BUY',
          quantity: 5,
          rawQuantity: 5,
          price: 160,
          totalAmount: 800,
          currency: 'USD',
          assetType: 'us-stock',
          runningShares: 10,
          runningTotalCost: 1500,
          runningAverageCost: 150,
        },
      ],
    },
  ],
  rawTransactions: [],
  summary: {
    totalInvested: 52500,
    openInvested: 52500,
    closedInvested: 0,
    totalValue: 70000,
    totalUnrealizedPL: 17500,
    totalUnrealizedPLPercent: 33.33,
    totalRealizedPL: 0,
    totalRealizedPLPercent: 0,
    totalReturn: 17500,
    totalReturnPercent: 33.33,
  },
};

describe('MobileTransactionsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTransactionsPage],
      providers: [
        provideIonicAngular({ mode: 'ios' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  it('should render transaction list and support filtering/sorting by symbol', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_TX_PORTFOLIO);
    state.selectedHistorySymbol.set('AAPL');

    const fixture = TestBed.createComponent(MobileTransactionsPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-tx-list')).toBeTruthy();
    expect(fixture.componentInstance.filteredTransactions().length).toBe(2);

    fixture.componentInstance.typeFilter.set('sell');
    expect(fixture.componentInstance.filteredTransactions().length).toBe(0);
  });
});
