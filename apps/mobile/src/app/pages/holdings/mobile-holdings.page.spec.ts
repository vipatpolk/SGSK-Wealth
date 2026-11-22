import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileHoldingsPage } from './mobile-holdings.page';

const MOCK_HOLDINGS: PortfolioHoldingsResponse = {
  tabId: 'all',
  currency: 'THB',
  exchangeRate: 35,
  error: null,
  openPositions: [
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
      lots: [
        {
          purchaseDate: '2025-02-01',
          quantity: 5,
          costBasis: 300,
          totalCost: 1500,
          currentPrice: 400,
          holdingValue: 2000,
          unrealizedPL: 500,
          unrealizedPLPercent: 33.33,
          assetType: 'us-stock',
          currency: 'USD',
          originalCostBasis: 300,
          originalCurrency: 'USD',
        },
      ],
    },
  ],
  closedPositions: [
    {
      symbol: 'TSLA',
      displaySymbol: 'TSLA',
      name: 'Tesla Inc.',
      assetType: 'us-stock',
      assetTypeLabel: 'US Stock',
      currency: 'USD',
      originalCurrency: 'USD',
      totalShares: 0,
      closedShares: 2,
      totalCost: 400,
      totalProceeds: 500,
      realizedPL: 100,
      realizedPLPercent: 25,
      averageBuyPrice: 200,
      averageSellPrice: 250,
      lots: [],
    },
  ],
  transactionSummaries: [],
  rawTransactions: [],
  summary: {
    totalInvested: 66500,
    openInvested: 52500,
    closedInvested: 14000,
    totalValue: 70000,
    totalUnrealizedPL: 17500,
    totalUnrealizedPLPercent: 33.33,
    totalRealizedPL: 3500,
    totalRealizedPLPercent: 25,
    totalReturn: 21000,
    totalReturnPercent: 31.5,
  },
};

describe('MobileHoldingsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileHoldingsPage],
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

  it('should render Market/PVD segment, asset chips, hero, and position lot cards', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_HOLDINGS);

    const fixture = TestBed.createComponent(MobileHoldingsPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-holdings-segment')).toBeTruthy();
    expect(el.querySelector('#mobile-segment-market')).toBeTruthy();
    expect(el.querySelector('#mobile-segment-pvd')).toBeTruthy();
    expect(el.querySelector('#mobile-holdings-hero')).toBeTruthy();
    expect(el.querySelector('[data-symbol-lots="MSFT"]')).toBeTruthy();
  });

  it('should filter positions by search query and toggle expanded FIFO lots', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_HOLDINGS);

    const fixture = TestBed.createComponent(MobileHoldingsPage);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.filteredOpen().length).toBe(1);

    comp.toggleExpand('MSFT');
    expect(comp.isExpanded('MSFT')).toBe(true);

    comp.searchQuery.set('NO_MATCH');
    expect(comp.filteredOpen().length).toBe(0);
  });
});
