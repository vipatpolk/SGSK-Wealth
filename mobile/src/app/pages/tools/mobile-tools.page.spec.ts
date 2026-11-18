import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileToolsPage } from './mobile-tools.page';

const MOCK_TOOLS_PORTFOLIO: PortfolioHoldingsResponse = {
  tabId: 'all',
  currency: 'THB',
  exchangeRate: 35,
  error: null,
  openPositions: [
    {
      symbol: 'AAPL',
      displaySymbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'us-stock',
      assetTypeLabel: 'US Stock',
      currency: 'USD',
      originalCurrency: 'USD',
      totalShares: 10,
      averageCost: 150,
      totalCost: 1500,
      currentPrice: 200,
      holdingValue: 2000,
      unrealizedPL: 500,
      unrealizedPLPercent: 33.33,
      hasPrice: true,
      lots: [],
    },
    {
      symbol: 'MSFT',
      displaySymbol: 'MSFT',
      name: 'Microsoft Corp.',
      assetType: 'us-stock',
      assetTypeLabel: 'US Stock',
      currency: 'USD',
      originalCurrency: 'USD',
      totalShares: 5,
      averageCost: 300,
      totalCost: 1500,
      currentPrice: 400,
      holdingValue: 2000,
      unrealizedPL: 500,
      unrealizedPLPercent: 33.33,
      hasPrice: true,
      lots: [],
    },
  ],
  closedPositions: [],
  transactionSummaries: [],
  rawTransactions: [],
  summary: {
    totalInvested: 105000,
    openInvested: 105000,
    closedInvested: 0,
    totalValue: 140000,
    totalUnrealizedPL: 35000,
    totalUnrealizedPLPercent: 33.33,
    totalRealizedPL: 0,
    totalRealizedPLPercent: 0,
    totalReturn: 35000,
    totalReturnPercent: 33.33,
  },
};

describe('MobileToolsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileToolsPage],
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

  it('should render Avg Cost Calculator by default with required E2E controls', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_TOOLS_PORTFOLIO);
    state.selectedToolId.set('avg-cost-calculator');

    const fixture = TestBed.createComponent(MobileToolsPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-tools-segment')).toBeTruthy();
    expect(el.querySelector('#mobile-avg-cost-card')).toBeTruthy();
    expect(el.querySelector('#mobile-sim-shares input')).toBeTruthy();
    expect(el.querySelector('#mobile-sim-price input')).toBeTruthy();
    expect(el.querySelector('#mobile-sim-run-btn')).toBeTruthy();
    expect(el.querySelector('#mobile-sim-result')).toBeTruthy();
  });

  it('should switch cleanly to Rebalance Planner and TVM Calculator panels', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_TOOLS_PORTFOLIO);

    const fixture = TestBed.createComponent(MobileToolsPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    state.selectedToolId.set('rebalance-planner');
    fixture.detectChanges();
    expect(el.querySelector('#mobile-rebalance-card')).toBeTruthy();
    expect(el.querySelector('#mobile-rebalance-result')).toBeTruthy();

    state.selectedToolId.set('tvm-calculator');
    fixture.detectChanges();
    expect(el.querySelector('#mobile-tvm-card')).toBeTruthy();
    expect(el.querySelector('#mobile-tvm-pv input')).toBeTruthy();
    expect(el.querySelector('#mobile-tvm-pmt input')).toBeTruthy();
    expect(el.querySelector('#mobile-tvm-rate input')).toBeTruthy();
    expect(el.querySelector('#mobile-tvm-years input')).toBeTruthy();
    expect(el.querySelector('#mobile-tvm-result')).toBeTruthy();
  });
});
