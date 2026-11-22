import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobileDividendsPage } from './mobile-dividends.page';

const MOCK_DIVIDEND_DATA: PortfolioDividendResponse = {
  currency: 'THB',
  exchangeRate: 35,
  totalGrossDividends: 10000,
  totalNetDividends: 9000,
  totalWithholdingTax: 1000,
  effectiveTaxRate: 10,
  projectedAnnualDividends: 12000,
  portfolioDividendYield: 4.5,
  portfolioYieldOnCost: 5.2,
  annualDividends: [
    {
      year: 2025,
      grossAmount: 10000,
      netAmount: 9000,
      withholdingTax: 1000,
      byAssetType: { 'thai-stock': 9000 },
      recordCount: 2,
      monthlyBreakdown: [
        {
          yearMonth: '2025-05',
          year: 2025,
          month: 5,
          grossAmount: 10000,
          netAmount: 9000,
          withholdingTax: 1000,
          byAssetType: { 'thai-stock': 9000 },
          recordCount: 1,
        },
      ],
    },
  ],
  monthlyDividends: [
    {
      yearMonth: '2025-05',
      year: 2025,
      month: 5,
      grossAmount: 10000,
      netAmount: 9000,
      withholdingTax: 1000,
      byAssetType: { 'thai-stock': 9000 },
      recordCount: 1,
    },
  ],
  assetTypeSummaries: [
    {
      assetType: 'thai-stock',
      assetTypeLabel: 'Thai Stock',
      totalGrossDividends: 10000,
      totalNetDividends: 9000,
      totalWithholdingTax: 1000,
      percentageOfTotal: 100,
      symbolCount: 1,
      recordCount: 1,
    },
  ],
  symbolSummaries: [
    {
      symbol: 'PTT.BK',
      displaySymbol: 'PTT',
      name: 'PTT PCL',
      assetType: 'thai-stock',
      assetTypeLabel: 'Thai Stock',
      currency: 'THB',
      totalGrossDividends: 10000,
      totalNetDividends: 9000,
      totalWithholdingTax: 1000,
      convertedNetDividends: 9000,
      convertedGrossDividends: 10000,
      convertedWithholdingTax: 1000,
      dividendCount: 1,
      firstDividendDate: '2025-05-01',
      lastDividendDate: '2025-05-01',
      currentShares: 1000,
      currentCostBasis: 30000,
      currentValue: 35000,
      trailingAnnualDPS: 2,
      currentYieldPercent: 5.7,
      yieldOnCostPercent: 6.6,
      projectedAnnualIncome: 2000,
      recentDistributions: [],
    },
  ],
  records: [
    {
      id: 'div-1',
      symbol: 'PTT.BK',
      displaySymbol: 'PTT',
      date: '2025-05-01',
      assetType: 'thai-stock',
      assetTypeLabel: 'Thai Stock',
      shares: 1000,
      dividendPerShare: 10,
      grossAmount: 10000,
      withholdingTax: 1000,
      withholdingTaxRate: 10,
      netAmount: 9000,
      currency: 'THB',
      convertedNetAmount: 9000,
      convertedGrossAmount: 10000,
      convertedWithholdingTax: 1000,
    },
  ],
  error: null,
};

describe('MobileDividendsPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileDividendsPage],
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

  it('should render hero, monthly stacked chart data, symbol yield cards, and payout ledger', () => {
    const state = TestBed.inject(MobileStateService);
    state.dividendLoading.set(false);
    state.dividendData.set(MOCK_DIVIDEND_DATA);

    const fixture = TestBed.createComponent(MobileDividendsPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#mobile-dividends-hero')).toBeTruthy();
    expect(el.querySelector('#mobile-dividend-symbols')).toBeTruthy();
    expect(el.querySelector('#mobile-dividend-ledger')).toBeTruthy();
    expect(fixture.componentInstance.monthlyChartData().length).toBeGreaterThan(0);
    expect(fixture.componentInstance.filteredSymbolSummaries().length).toBe(1);
  });
});
