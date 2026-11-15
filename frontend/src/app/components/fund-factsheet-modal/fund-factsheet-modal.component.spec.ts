import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundFactsheetModalComponent } from './fund-factsheet-modal.component';
import { FundFactsheetResponse } from '../../models/factsheet.model';

describe('FundFactsheetModalComponent', () => {
  let fixture: ComponentFixture<FundFactsheetModalComponent>;
  let component: FundFactsheetModalComponent;
  let httpMock: HttpTestingController;

  const mockMutualFundFactsheet: FundFactsheetResponse = {
    symbol: 'K-USA',
    displaySymbol: 'K-USA',
    assetType: 'mutual-fund',
    projId: 'M0888_2560',
    fundName: 'K USA Equity Fund-A(A)',
    fundNameTh: 'กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A ชนิดสะสมมูลค่า',
    amcName: 'KASIKORN ASSET MANAGEMENT CO., LTD.',
    amcNameTh: 'บริษัทหลักทรัพย์จัดการกองทุน กสิกรไทย จำกัด',
    policyDesc: 'Foreign Equity',
    managementStyle: 'AN - Feeder Fund (Active Master)',
    investmentPolicyDesc: 'Invests in Morgan Stanley US Advantage Fund.',
    riskLevel: 'RS6',
    riskDescription: 'High Risk',
    benchmark: 'S&P 500 Total Return Net',
    dividendPolicy: 'N',
    inceptionDate: '2017-05-10',
    pdfUrl: 'https://sec.example/k-usa.pdf',
    amcUrl: 'https://kasikornasset.example/k-usa',
    asOfDate: '2026-09-30',
    fees: [
      {
        description: 'Management Fee',
        ceilingRate: '2.14%',
        actualRate: '1.605%',
      },
    ],
    performance: [
      {
        category: 'Fund Return',
        period: '1Y',
        value: 18.45,
      },
    ],
    statistics: {
      maxDrawdown: -21.3,
      sharpeRatio: 1.12,
      trackingError: 3.4,
      fxHedging: '78.5%',
      turnoverRatio: 14.2,
    },
    assetAllocation: [{ seq: 1, name: 'Foreign Equity', ratio: 96.5 }],
    topHoldings: [{ seq: 1, name: 'MS US Advantage', ratio: 96.5 }],
    tradeConditions: {
      minimumInitialSub: 500,
      minimumNextSub: 500,
      minimumRedempt: 500,
      currency: 'THB',
      subscriptionPeriod: '08:30 - 15:30',
      redemptionPeriod: '08:30 - 14:00',
      settlementPeriod: 'T+4',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundFactsheetModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FundFactsheetModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not render modal when target is null', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#fund-factsheet-modal')).toBeNull();
  });

  it('should fetch and render SEC factsheet sections and official PDF link', () => {
    fixture.componentRef.setInput('target', {
      symbol: 'K-USA',
      assetType: 'mutual-fund',
      displayName: 'K USA Equity Fund',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#factsheet-loading')).toBeTruthy();

    const req = httpMock.expectOne(
      '/api/backend/nav/factsheet?symbol=K-USA&asset_type=mutual-fund',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockMutualFundFactsheet);
    fixture.detectChanges();

    expect(el.querySelector('#fund-factsheet-modal')).toBeTruthy();
    expect(el.querySelector('#factsheet-fund-title')?.textContent?.trim()).toBe(
      'K USA Equity Fund-A(A)',
    );
    expect(el.querySelector('#factsheet-risk-badge')?.textContent?.trim()).toBe('RS6');
    expect(el.querySelector('#btn-factsheet-pdf')?.getAttribute('href')).toBe(
      'https://sec.example/k-usa.pdf',
    );
    expect(el.querySelector('#btn-factsheet-amc-url')?.getAttribute('href')).toBe(
      'https://kasikornasset.example/k-usa',
    );
    expect(el.querySelector('#factsheet-section-overview')?.textContent).toContain(
      'S&P 500 Total Return Net',
    );
    expect(el.querySelector('#factsheet-section-performance')?.textContent).toContain('18.45%');
    expect(el.querySelector('#factsheet-section-allocation')?.textContent).toContain('MS US Advantage');
    expect(el.querySelector('#factsheet-section-statistics')?.textContent).toContain('-21.30%');
    expect(el.querySelector('#factsheet-section-fees')?.textContent).toContain('1.605%');
  });

  it('should show error state and allow retry on failure', () => {
    fixture.componentRef.setInput('target', {
      symbol: 'ERRFUND',
      assetType: 'mutual-fund',
    });
    fixture.detectChanges();

    const req1 = httpMock.expectOne(
      '/api/backend/nav/factsheet?symbol=ERRFUND&asset_type=mutual-fund',
    );
    req1.flush('Server Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#factsheet-error')).toBeTruthy();

    const retryBtn = el.querySelector('#btn-retry-factsheet') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    const req2 = httpMock.expectOne(
      '/api/backend/nav/factsheet?symbol=ERRFUND&asset_type=mutual-fund',
    );
    req2.flush({ ...mockMutualFundFactsheet, symbol: 'ERRFUND', displaySymbol: 'ERRFUND' });
    fixture.detectChanges();

    expect(el.querySelector('#factsheet-error')).toBeNull();
    expect(el.querySelector('#factsheet-section-overview')).toBeTruthy();
  });

  it('should emit closeModal on close button click or escape key', () => {
    const closeSpy = vi.fn();
    component.closeModal.subscribe(closeSpy);

    fixture.componentRef.setInput('target', {
      symbol: 'PVDSP500',
      assetType: 'provident-fund',
      fundName: 'ไทยพาณิชย์ มาสเตอร์ฟันด์',
    });
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url === '/api/backend/nav/factsheet');
    req.flush({
      symbol: 'PVDSP500',
      displaySymbol: 'PVDSP500',
      assetType: 'provident-fund',
      fundName: 'SCB S&P500 PVD',
      fees: [],
      performance: [],
      assetAllocation: [],
      topHoldings: [],
    });
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('#btn-close-factsheet-modal') as HTMLButtonElement;
    closeBtn.click();
    expect(closeSpy).toHaveBeenCalledTimes(1);

    component.onEscapeKey();
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });
});
