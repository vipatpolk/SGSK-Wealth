import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { NavService } from './nav.service';

describe('NavService', () => {
  let service: NavService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NavService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch NAV data via backend proxy', async () => {
    const symbols = ['SCBSFF.BKFUND', 'ES-GTECHSSF.BKFUND'];

    const promise = firstValueFrom(service.fetchFundNAVs(symbols));

    const req = httpMock.expectOne('/api/backend/nav/fetch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ symbols });

    req.flush({
      'SCBSFF.BKFUND': { symbol: 'SCBSFF.BKFUND', price: 15.5, currency: 'THB', name: 'SCBSFF' },
      'ES-GTECHSSF.BKFUND': { symbol: 'ES-GTECHSSF.BKFUND', price: 20.0, currency: 'THB', name: 'ES-GTECHSSF' },
    });

    const result = await promise;
    expect(result.size).toBe(2);

    const scbsff = result.get('SCBSFF.BKFUND');
    expect(scbsff?.price).toBe(15.5);

    const es = result.get('ES-GTECHSSF.BKFUND');
    expect(es?.price).toBe(20.0);
  });

  it('should split fund symbol requests exceeding maxBatchSize (75 symbols into 50 + 25)', async () => {
    const symbols = Array.from({ length: 75 }, (_, i) => `FUND${i}.BKFUND`);

    const promise = firstValueFrom(service.fetchFundNAVs(symbols));

    const reqs = httpMock.match('/api/backend/nav/fetch');
    expect(reqs.length).toBe(2);
    expect(reqs[0].request.body.symbols.length).toBe(50);
    expect(reqs[1].request.body.symbols.length).toBe(25);

    reqs[0].flush({
      'FUND0.BKFUND': { symbol: 'FUND0.BKFUND', price: 10.0, currency: 'THB', name: 'FUND0' },
    });
    reqs[1].flush({
      'FUND50.BKFUND': { symbol: 'FUND50.BKFUND', price: 20.0, currency: 'THB', name: 'FUND50' },
    });

    const result = await promise;
    expect(result.size).toBe(2);
    expect(result.get('FUND0.BKFUND')?.price).toBe(10.0);
    expect(result.get('FUND50.BKFUND')?.price).toBe(20.0);
  });
});
