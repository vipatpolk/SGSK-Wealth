import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileDashboardPage } from './mobile-dashboard.page';

const MOCK_PORTFOLIO: PortfolioHoldingsResponse = {
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
      lots: [
        {
          purchaseDate: '2025-01-10',
          quantity: 10,
          costBasis: 150,
          totalCost: 1500,
          currentPrice: 200,
          holdingValue: 2000,
          unrealizedPL: 500,
          unrealizedPLPercent: 33.33,
          assetType: 'us-stock',
          currency: 'USD',
          originalCostBasis: 150,
          originalCurrency: 'USD',
        },
      ],
    },
    {
      symbol: 'SCB_PVD',
      displaySymbol: 'SCB PVD',
      name: 'SCB Provident',
      assetType: 'provident-fund',
      assetTypeLabel: 'PVD',
      currency: 'THB',
      originalCurrency: 'THB',
      totalShares: 500,
      averageCost: 10,
      totalCost: 5000,
      currentPrice: 11,
      holdingValue: 5500,
      unrealizedPL: 500,
      unrealizedPLPercent: 10,
      hasPrice: true,
      employeeContribution: 2500,
      employeeEarnings: 250,
      employerMatching: 2500,
      employerEarnings: 250,
      lots: [],
    },
  ],
  closedPositions: [],
  transactionSummaries: [],
  rawTransactions: [
    {
      symbol: 'AAPL',
      date: '2025-01-10',
      quantity: 10,
      price: 150,
      currency: 'USD',
      assetType: 'us-stock',
      txType: 'BUY',
    },
  ],
  summary: {
    totalInvested: 57500,
    openInvested: 57500,
    closedInvested: 0,
    totalValue: 75500,
    totalUnrealizedPL: 18000,
    totalUnrealizedPLPercent: 31.3,
    totalRealizedPL: 0,
    totalRealizedPLPercent: 0,
    totalReturn: 18000,
    totalReturnPercent: 31.3,
  },
};

describe('MobileDashboardPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileDashboardPage],
      providers: [
        provideIonicAngular({ mode: 'ios' }),
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  it('should render hero, allocation donut, movers, dividends, PVD summary, activity, and tools launchpad', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_PORTFOLIO);
    state.exchangeRate.set(35);

    const fixture = TestBed.createComponent(MobileDashboardPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-dashboard-hero')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-allocation')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-movers')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-dividends')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-pvd')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-activity')).toBeTruthy();
    expect(el.querySelector('#mobile-dashboard-tools')).toBeTruthy();
  });

  it('should navigate from dashboard quick chips and launchpad buttons', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_PORTFOLIO);

    const fixture = TestBed.createComponent(MobileDashboardPage);
    fixture.detectChanges();

    fixture.componentInstance.goToTool('rebalance-planner');
    expect(state.selectedToolId()).toBe('rebalance-planner');

    fixture.componentInstance.goToTransactions('AAPL');
    expect(state.selectedHistorySymbol()).toBe('AAPL');
  });
});
