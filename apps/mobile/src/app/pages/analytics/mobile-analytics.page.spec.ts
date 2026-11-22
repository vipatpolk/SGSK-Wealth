import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileAnalyticsPage } from './mobile-analytics.page';

const MOCK_ANALYTICS_DATA: PortfolioHoldingsResponse = {
  tabId: 'all',
  currency: 'THB',
  exchangeRate: 35,
  error: null,
  openPositions: [
    {
      symbol: 'NVDA',
      displaySymbol: 'NVDA',
      name: 'NVIDIA Corp.',
      assetType: 'us-stock',
      assetTypeLabel: 'US Stock',
      currency: 'USD',
      originalCurrency: 'USD',
      totalShares: 10,
      averageCost: 100,
      totalCost: 1000,
      currentPrice: 130,
      holdingValue: 1300,
      unrealizedPL: 300,
      unrealizedPLPercent: 30,
      hasPrice: true,
      lots: [],
    },
  ],
  closedPositions: [],
  transactionSummaries: [],
  rawTransactions: [],
  summary: {
    totalInvested: 35000,
    openInvested: 35000,
    closedInvested: 0,
    totalValue: 45500,
    totalUnrealizedPL: 10500,
    totalUnrealizedPLPercent: 30,
    totalRealizedPL: 0,
    totalRealizedPLPercent: 0,
    totalReturn: 10500,
    totalReturnPercent: 30,
  },
};

describe('MobileAnalyticsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileAnalyticsPage],
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

  it('should render overview currency exposure and switch to performance summary', () => {
    const state = TestBed.inject(MobileStateService);
    state.loading.set(false);
    state.portfolioData.set(MOCK_ANALYTICS_DATA);

    const fixture = TestBed.createComponent(MobileAnalyticsPage);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-analytics-segment')).toBeTruthy();

    state.analyticsSubTab.set('allocation');
    fixture.detectChanges();
    expect(el.querySelector('#mobile-currency-exposure')).toBeTruthy();

    state.analyticsSubTab.set('performance');
    fixture.detectChanges();
    expect(el.querySelector('#mobile-performance-summary')).toBeTruthy();
  });
});
