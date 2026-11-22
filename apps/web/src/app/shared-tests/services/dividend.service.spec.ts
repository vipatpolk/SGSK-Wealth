import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DividendService } from '@shared/services/dividend.service';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';

describe('DividendService', () => {
  let service: DividendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DividendService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DividendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dividend analytics with default params wrapped in ApiSuccess', () => {
    const mockResponse: PortfolioDividendResponse = {
      currency: 'THB',
      exchangeRate: 35.0,
      totalGrossDividends: 5000,
      totalNetDividends: 4500,
      totalWithholdingTax: 500,
      effectiveTaxRate: 10,
      projectedAnnualDividends: 6000,
      portfolioDividendYield: 5.5,
      portfolioYieldOnCost: 6.2,
      annualDividends: [],
      monthlyDividends: [],
      assetTypeSummaries: [],
      symbolSummaries: [],
      records: [],
      error: null,
    };

    service.getDividendAnalytics('THB', 'all').subscribe((res) => {
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.currency).toBe('THB');
        expect(res.data.totalNetDividends).toBe(4500);
      }
    });

    const req = httpMock.expectOne('/api/backend/portfolio/dividend?currency=THB&tab_id=all');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should map HTTP 403 and backend error strings to typed ApiFailure', () => {
    service.getDividendAnalytics('USD', 'all').subscribe((res) => {
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe('forbidden');
        expect(res.status).toBe(403);
      }
    });
    const forbiddenReq = httpMock.expectOne('/api/backend/portfolio/dividend?currency=USD&tab_id=all');
    forbiddenReq.flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    service.getDividendAnalytics('THB', 'all').subscribe((res) => {
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe('upstream');
        expect(res.message).toBe('SEC API failed');
      }
    });
    const upstreamReq = httpMock.expectOne('/api/backend/portfolio/dividend?currency=THB&tab_id=all');
    upstreamReq.flush({ error: 'SEC API failed' });
  });
});
