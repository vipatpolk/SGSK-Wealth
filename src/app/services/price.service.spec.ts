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

  it('should fetch cryptocurrency prices with THB and USDT pairs and dynamic names correctly', async () => {
    const summaries = [
      { symbol: 'BTC.CRYPTO', assetType: 'crypto' },
      { symbol: 'PAXG.CRYPTO', assetType: 'crypto' },
      { symbol: 'ADA.CRYPTO', assetType: 'crypto' },
    ];

    const promise = firstValueFrom(service.fetchPrices(summaries));

    const req = httpMock.expectOne((r) => r.url.includes('/api/binance/api/v1/ticker/price'));
    expect(req.request.method).toBe('GET');
    req.flush([
      { symbol: 'BTCTHB', price: '2083532.00' },
      { symbol: 'PAXGUSDT', price: '4048.51' },
      { symbol: 'ADAUSDT', price: '0.1865' },
    ]);

    const btcNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/BTC-USD'));
    btcNameReq.flush({
      chart: { result: [{ meta: { longName: 'Bitcoin USD' } }] },
    });

    const paxgNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/PAXG-USD'));
    paxgNameReq.flush({
      chart: { result: [{ meta: { longName: 'PAX Gold USD' } }] },
    });

    const adaNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/ADA-USD'));
    adaNameReq.flush({
      chart: { result: [{ meta: { longName: 'Cardano USD' } }] },
    });

    const prices = await promise;
    expect(prices.size).toBe(3);

    const btc = prices.get('BTC.CRYPTO');
    expect(btc).toBeDefined();
    expect(btc?.price).toBe(2083532);
    expect(btc?.currency).toBe('THB');
    expect(btc?.name).toBe('Bitcoin USD');

    const paxg = prices.get('PAXG.CRYPTO');
    expect(paxg).toBeDefined();
    expect(paxg?.price).toBe(4048.51);
    expect(paxg?.currency).toBe('USD');
    expect(paxg?.name).toBe('PAX Gold USD');

    const ada = prices.get('ADA.CRYPTO');
    expect(ada).toBeDefined();
    expect(ada?.price).toBe(0.1865);
    expect(ada?.currency).toBe('USD');
    expect(ada?.name).toBe('Cardano USD');
  });

  it('should dynamically discover any arbitrary new crypto pairs and quote currencies without hardcoded mappings', async () => {
    const summaries = [
      { symbol: 'SUI.CRYPTO', assetType: 'crypto' },
      { symbol: 'SOL.CRYPTO', assetType: 'crypto' },
      { symbol: 'USDC_TOKEN.CRYPTO', assetType: 'crypto' },
    ];

    const promise = firstValueFrom(service.fetchPrices(summaries));

    const req = httpMock.expectOne((r) => r.url.includes('/api/binance/api/v1/ticker/price'));
    req.flush([
      { symbol: 'SUIUSDT', price: '3.45' },
      { symbol: 'SOLTHB', price: '4500.00' },
      { symbol: 'USDC_TOKENUSDC', price: '1.00' },
    ]);

    const suiNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/SUI-USD'));
    suiNameReq.flush({ chart: { result: [{ meta: { longName: 'Sui USD' } }] } });

    const solNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/SOL-USD'));
    solNameReq.flush({ chart: { result: [{ meta: { longName: 'Solana USD' } }] } });

    const usdcNameReq = httpMock.expectOne((r) => r.url.includes('/api/finance/v8/finance/chart/USDC_TOKEN-USD'));
    usdcNameReq.flush({ chart: { result: [{ meta: { longName: 'USD Coin USD' } }] } });

    const prices = await promise;
    expect(prices.size).toBe(3);

    const sui = prices.get('SUI.CRYPTO');
    expect(sui?.price).toBe(3.45);
    expect(sui?.currency).toBe('USD');
    expect(sui?.name).toBe('Sui USD');

    const sol = prices.get('SOL.CRYPTO');
    expect(sol?.price).toBe(4500);
    expect(sol?.currency).toBe('THB');
    expect(sol?.name).toBe('Solana USD');

    const usdcToken = prices.get('USDC_TOKEN.CRYPTO');
    expect(usdcToken?.price).toBe(1);
    expect(usdcToken?.currency).toBe('USD');
    expect(usdcToken?.name).toBe('USD Coin USD');
  });
});
