import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShareLotService } from '@shared/services/share-lot.service';

describe('ShareLotService', () => {
  let service: ShareLotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShareLotService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShareLotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch specific sheet data via backend proxy as ApiSuccess', async () => {
    const promise = firstValueFrom(service.fetchSheet('12345'));

    const req = httpMock.expectOne('/api/backend/share-lot/sheet/12345');
    expect(req.request.method).toBe('GET');

    req.flush({
      summaries: [],
      closedSummaries: [],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 0,
      totalLots: 0,
      error: null,
    });

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.error).toBeNull();
    }
  });

  it('should fetch all sheets data via backend proxy as ApiSuccess', async () => {
    const promise = firstValueFrom(service.fetchAllSheets());

    const req = httpMock.expectOne('/api/backend/share-lot/sheets');
    expect(req.request.method).toBe('GET');

    req.flush({
      summaries: [],
      closedSummaries: [],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 0,
      totalLots: 0,
      error: null,
    });

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.error).toBeNull();
    }
  });

  it('should map network errors, HTTP errors, and backend error strings to typed ApiFailure', async () => {
    const netPromise = firstValueFrom(service.fetchSheet('12345'));
    const netReq = httpMock.expectOne('/api/backend/share-lot/sheet/12345');
    netReq.error(new ProgressEvent('Network error'));
    const netResult = await netPromise;
    expect(netResult.ok).toBe(false);
    if (!netResult.ok) {
      expect(netResult.kind).toBe('network');
      expect(netResult.message).toBe('Failed to fetch data from backend.');
    }

    const unauthPromise = firstValueFrom(service.fetchAllSheets());
    const unauthReq = httpMock.expectOne('/api/backend/share-lot/sheets');
    unauthReq.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    const unauthResult = await unauthPromise;
    expect(unauthResult.ok).toBe(false);
    if (!unauthResult.ok) {
      expect(unauthResult.kind).toBe('unauthorized');
      expect(unauthResult.status).toBe(401);
    }

    const upstreamPromise = firstValueFrom(service.fetchSheet('us-stock'));
    const upstreamReq = httpMock.expectOne('/api/backend/share-lot/sheet/us-stock');
    upstreamReq.flush({ error: 'Sheet fetch timed out' });
    const upstreamResult = await upstreamPromise;
    expect(upstreamResult.ok).toBe(false);
    if (!upstreamResult.ok) {
      expect(upstreamResult.kind).toBe('upstream');
      expect(upstreamResult.message).toBe('Sheet fetch timed out');
    }
  });
});
