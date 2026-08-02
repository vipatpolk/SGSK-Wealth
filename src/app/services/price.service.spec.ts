import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PriceService } from './price.service';

describe('PriceService', () => {
  let service: PriceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PriceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PriceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch stock prices using toYahooSymbol conversion for BRK.B -> BRK-B', async () => {
    const summaries = [
      { symbol: 'BRK.B', assetType: 'us-stock' },
      { symbol: 'AAPL', assetType: 'us-stock' },
      { symbol: 'PTT.BK', assetType: 'thai-stock' },
    ];

    const promise = firstValueFrom(service.fetchPrices(summaries));

    // BRK.B should be requested as BRK-B
    const brkReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/BRK-B'));
    expect(brkReq.request.method).toBe('GET');
    brkReq.flush({
      chart: {
        result: [
          {
            meta: {
              symbol: 'BRK-B',
              shortName: 'Berkshire Hathaway Inc. New',
              regularMarketPrice: 511.54,
              currency: 'USD',
            },
          },
        ],
      },
    });

    // AAPL should be requested as AAPL
    const aaplReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/AAPL'));
    aaplReq.flush({
      chart: {
        result: [
          {
            meta: {
              symbol: 'AAPL',
              shortName: 'Apple Inc.',
              regularMarketPrice: 240.5,
              currency: 'USD',
            },
          },
        ],
      },
    });

    // PTT.BK should keep .BK
    const pttReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/PTT.BK'));
    pttReq.flush({
      chart: {
        result: [
          {
            meta: {
              symbol: 'PTT.BK',
              shortName: 'PTT PCL',
              regularMarketPrice: 32.5,
              currency: 'THB',
            },
          },
        ],
      },
    });

    const prices = await promise;
    expect(prices.size).toBe(3);

    const brkData = prices.get('BRK.B');
    expect(brkData).toBeDefined();
    expect(brkData?.symbol).toBe('BRK.B');
    expect(brkData?.price).toBe(511.54);
    expect(brkData?.name).toBe('Berkshire Hathaway Inc. New');
    expect(brkData?.currency).toBe('USD');

    const aaplData = prices.get('AAPL');
    expect(aaplData).toBeDefined();
    expect(aaplData?.symbol).toBe('AAPL');
    expect(aaplData?.price).toBe(240.5);

    const pttData = prices.get('PTT.BK');
    expect(pttData).toBeDefined();
    expect(pttData?.symbol).toBe('PTT.BK');
    expect(pttData?.price).toBe(32.5);
  });

  it('should fetch live exchange rate for USDTHB=X', async () => {
    const promise = firstValueFrom(service.fetchExchangeRate());

    const req = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/USDTHB%3DX'));
    req.flush({
      chart: {
        result: [
          {
            meta: {
              symbol: 'USDTHB=X',
              regularMarketPrice: 34.25,
            },
          },
        ],
      },
    });

    const rate = await promise;
    expect(rate).toBe(34.25);
  });
});
