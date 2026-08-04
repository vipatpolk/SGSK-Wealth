import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ShareLotService } from './share-lot.service';

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

  it('should parse CSV and calculate FIFO lots correctly, grouping only fully closed symbols under closedSummaries', async () => {
    const mockCsv = `Symbol,Date,Quantity,Price,Currency
AAPL,2024-01-01,10,150,USD
AAPL,2024-02-01,10,160,USD
AAPL,2024-03-01,-15,180,USD
TSLA,2024-01-10,5,200,USD
TSLA,2024-02-10,-5,250,USD
`;

    const promise = firstValueFrom(service.fetchSheet('1032243687'));
    const req = httpMock.expectOne((r) => r.url.includes('gid=1032243687'));
    expect(req.request.method).toBe('GET');
    req.flush(mockCsv);

    const result = await promise;
    expect(result.error).toBeNull();

    // AAPL has 5 remaining shares -> Open position only, NOT in closedSummaries
    expect(result.summaries.length).toBe(1);
    const openSummary = result.summaries[0];
    expect(openSummary.symbol).toBe('AAPL');
    expect(openSummary.totalShares).toBe(5);
    expect(openSummary.averageCost).toBe(160);
    expect(openSummary.totalCost).toBe(800);
    expect(openSummary.lots.length).toBe(1);
    expect(openSummary.lots[0].purchaseDate).toBe('2024-02-01');

    // TSLA has 0 remaining shares (fully closed) -> Closed position only
    expect(result.closedSummaries.length).toBe(1);
    const closedSummary = result.closedSummaries[0];
    expect(closedSummary.symbol).toBe('TSLA');
    expect(closedSummary.closedShares).toBe(5);
    expect(closedSummary.totalCost).toBe(1000);
    expect(closedSummary.totalProceeds).toBe(1250);
    expect(closedSummary.realizedPL).toBe(250);
    expect(closedSummary.realizedPLPercent).toBe(25);
    expect(closedSummary.lots.length).toBe(1);
  });

  it('should dynamically identify asset types from symbol suffixes when Type column is absent in Closed Position CSV', async () => {
    // CSV without Type column (5 columns: Symbol, Date, Quantity, Price, Currency)
    const mockCsv = `Symbol,Date,Quantity,Price,Price Currency
3BBIF.BK,2025-06-19,45.0000000,6.6000,THB
3BBIF.BK,2025-11-03,-45.0000000,6.7400,THB
QQQI,2025-09-18,1.4391767,54.4200,USD
QQQI,2025-10-31,-1.4391767,55.5317,USD
ES-GTECHSSF.BKFUND,2025-01-10,100.0,10.5000,THB
ES-GTECHSSF.BKFUND,2025-05-15,-100.0,11.2000,THB
BTC.CRYPTO,2025-02-01,0.01,2000000,THB
BTC.CRYPTO,2025-06-01,-0.01,2200000,THB
`;

    const promise = firstValueFrom(service.fetchSheet('273600915'));
    const req = httpMock.expectOne((r) => r.url.includes('gid=273600915'));
    req.flush(mockCsv);

    const result = await promise;
    expect(result.error).toBeNull();
    expect(result.closedSummaries.length).toBe(4);

    const thaiStock = result.closedSummaries.find((s) => s.symbol === '3BBIF.BK');
    expect(thaiStock).toBeDefined();
    expect(thaiStock?.assetType).toBe('thai-stock');

    const usStock = result.closedSummaries.find((s) => s.symbol === 'QQQI');
    expect(usStock).toBeDefined();
    expect(usStock?.assetType).toBe('us-stock');

    const fund = result.closedSummaries.find((s) => s.symbol === 'ES-GTECHSSF.BKFUND');
    expect(fund).toBeDefined();
    expect(fund?.assetType).toBe('mutual-fund');

    const crypto = result.closedSummaries.find((s) => s.symbol === 'BTC.CRYPTO');
    expect(crypto).toBeDefined();
    expect(crypto?.assetType).toBe('crypto');
  });

  it('should calculate complete transaction histories with running balance and realized P/L', async () => {
    const mockCsv = `Symbol,Date,Quantity,Price,Currency
AAPL,2024-01-01,10,150,USD
AAPL,2024-02-01,10,160,USD
AAPL,2024-03-01,-15,180,USD
TSLA,2024-01-10,5,200,USD
TSLA,2024-02-10,-5,250,USD
`;

    const promise = firstValueFrom(service.fetchSheet('1032243687'));
    const req = httpMock.expectOne((r) => r.url.includes('gid=1032243687'));
    req.flush(mockCsv);

    const result = await promise;
    expect(result.transactionSummaries).toBeDefined();
    expect(result.transactionSummaries?.length).toBe(2);

    const aapl = result.transactionSummaries?.find((s) => s.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl?.totalTransactions).toBe(3);
    expect(aapl?.buyCount).toBe(2);
    expect(aapl?.sellCount).toBe(1);
    expect(aapl?.totalBuyShares).toBe(20);
    expect(aapl?.totalSellShares).toBe(15);
    expect(aapl?.totalBuyAmount).toBe(3100); // 10*150 + 10*160 = 1500 + 1600 = 3100
    expect(aapl?.totalSellAmount).toBe(2700); // 15*180 = 2700
    expect(aapl?.netShares).toBe(5);
    expect(aapl?.netInvested).toBe(800); // 5 remaining from 2nd lot @ 160
    expect(aapl?.currentStatus).toBe('OPEN');
    // Realized PL on selling 15 shares (10 @ 150 + 5 @ 160): Proceeds 2700 - Cost (1500 + 800 = 2300) = 400
    expect(aapl?.realizedPL).toBe(400);

    const tx1 = aapl?.transactions[0];
    expect(tx1?.type).toBe('BUY');
    expect(tx1?.quantity).toBe(10);
    expect(tx1?.runningShares).toBe(10);
    expect(tx1?.runningTotalCost).toBe(1500);

    const tx2 = aapl?.transactions[1];
    expect(tx2?.type).toBe('BUY');
    expect(tx2?.quantity).toBe(10);
    expect(tx2?.runningShares).toBe(20);
    expect(tx2?.runningTotalCost).toBe(3100);

    const tx3 = aapl?.transactions[2];
    expect(tx3?.type).toBe('SELL');
    expect(tx3?.quantity).toBe(15);
    expect(tx3?.runningShares).toBe(5);
    expect(tx3?.runningTotalCost).toBe(800);
    expect(tx3?.realizedPL).toBe(400);

    const tsla = result.transactionSummaries?.find((s) => s.symbol === 'TSLA');
    expect(tsla).toBeDefined();
    expect(tsla?.currentStatus).toBe('CLOSED');
    expect(tsla?.netShares).toBe(0);
    expect(tsla?.netInvested).toBe(0);
    expect(tsla?.realizedPL).toBe(250);
  });

  it('should handle network errors gracefully', async () => {
    const promise = firstValueFrom(service.fetchSheet('invalid-gid'));
    const req = httpMock.expectOne((r) => r.url.includes('gid=invalid-gid'));
    req.error(new ProgressEvent('Network error'));

    const result = await promise;
    expect(result.error).toContain('Failed to fetch data');
    expect(result.summaries.length).toBe(0);
    expect(result.closedSummaries.length).toBe(0);
  });
});

