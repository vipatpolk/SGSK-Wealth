import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
});
