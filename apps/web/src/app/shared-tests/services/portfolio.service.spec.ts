import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PortfolioService } from '@shared/services/portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortfolioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch holdings for a tab wrapped in ApiSuccess', () => {
    const mockResponse = {
      currency: 'THB' as const,
      exchangeRate: 35.0,
      tabId: 'us-stock',
      summary: {
        totalInvested: 1000,
        totalValue: 1200,
        openInvested: 1000,
        closedInvested: 0,
        totalUnrealizedPL: 200,
        totalUnrealizedPLPercent: 20,
        totalRealizedPL: 0,
        totalRealizedPLPercent: 0,
        totalReturn: 200,
        totalReturnPercent: 20,
      },
      openPositions: [],
      closedPositions: [],
      error: null,
    };

    service.fetchHoldings('us-stock', 'THB').subscribe((res) => {
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.tabId).toBe('us-stock');
        expect(res.data.summary.totalValue).toBe(1200);
      }
    });

    const req = httpMock.expectOne('/api/backend/portfolio/holdings?tab_id=us-stock&currency=THB');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch performance analytics wrapped in ApiSuccess', () => {
    service.fetchPerformance('YTD', '2024-01-01', '2024-12-31', 'USD').subscribe((res) => {
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.timeframe).toBe('YTD');
      }
    });

    const req = httpMock.expectOne(
      '/api/backend/portfolio/performance?timeframe=YTD&currency=USD&start_date=2024-01-01&end_date=2024-12-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ timeframe: 'YTD', currency: 'USD', summary: {}, error: null });
  });

  it('should fetch allocation recommendations wrapped in ApiSuccess', () => {
    service.fetchAllocation({ 'us-stock': 50, 'thai-stock': 50 }, 'THB').subscribe((res) => {
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.currency).toBe('THB');
      }
    });

    const req = httpMock.expectOne('/api/backend/portfolio/allocation?currency=THB');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ targetAllocation: { 'us-stock': 50, 'thai-stock': 50 } });
    req.flush({ currency: 'THB', totalPortfolioValue: 5000, recommendations: [], error: null });
  });

  it('should return typed ApiFailure for 401, 403, 503, network error, and backend error payloads', () => {
    const cases: {
      status: number;
      statusText: string;
      body: Record<string, string>;
      expectedKind: string;
    }[] = [
      { status: 401, statusText: 'Unauthorized', body: { detail: 'Expired token' }, expectedKind: 'unauthorized' },
      { status: 403, statusText: 'Forbidden', body: { detail: 'Owner required' }, expectedKind: 'forbidden' },
      { status: 503, statusText: 'Service Unavailable', body: { detail: 'Sheets down' }, expectedKind: 'upstream' },
    ];

    for (const c of cases) {
      service.fetchHoldings('all', 'THB').subscribe((res) => {
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.kind).toBe(c.expectedKind);
          expect(res.status).toBe(c.status);
        }
      });
      const req = httpMock.expectOne('/api/backend/portfolio/holdings?tab_id=all&currency=THB');
      req.flush(c.body, { status: c.status, statusText: c.statusText });
    }

    service.fetchPerformance('ALL', '', '', 'THB').subscribe((res) => {
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe('network');
      }
    });
    const netReq = httpMock.expectOne('/api/backend/portfolio/performance?timeframe=ALL&currency=THB');
    netReq.error(new ProgressEvent('error'));

    service.fetchAllocation(undefined, 'THB').subscribe((res) => {
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe('upstream');
        expect(res.message).toBe('Upstream sheet unavailable');
      }
    });
    const errBodyReq = httpMock.expectOne('/api/backend/portfolio/allocation?currency=THB');
    errBodyReq.flush({ error: 'Upstream sheet unavailable' });
  });
});
