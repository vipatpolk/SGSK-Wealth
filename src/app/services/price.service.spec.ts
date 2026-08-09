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

  it('should fetch prices and rate via backend proxy', async () => {
    const summaries = [
      { symbol: 'BRK.B', assetType: 'us-stock' },
      { symbol: 'BTC.CRYPTO', assetType: 'crypto' },
    ];

    const promise = firstValueFrom(service.fetchPricesAndRate(summaries));

    const req = httpMock.expectOne('/api/backend/price/fetch-prices');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ summaries });
    
    req.flush({
      prices: {
        'BRK.B': { symbol: 'BRK.B', price: 500, currency: 'USD', name: 'Berkshire' },
        'BTC.CRYPTO': { symbol: 'BTC.CRYPTO', price: 60000, currency: 'USD', name: 'Bitcoin' },
      },
      rate: 34.5
    });

    const result = await promise;
    expect(result.rate).toBe(34.5);
    expect(result.prices.size).toBe(2);

    const brkData = result.prices.get('BRK.B');
    expect(brkData?.price).toBe(500);

    const btcData = result.prices.get('BTC.CRYPTO');
    expect(btcData?.price).toBe(60000);
  });

  it('should fetch live exchange rate', async () => {
    const promise = firstValueFrom(service.fetchExchangeRate('USD', 'THB'));

    const req = httpMock.expectOne('/api/backend/price/exchange-rate?from_currency=USD&to_currency=THB');
    expect(req.request.method).toBe('GET');
    
    req.flush({ rate: 35.0 });

    const rate = await promise;
    expect(rate).toBe(35.0);
  });
});
