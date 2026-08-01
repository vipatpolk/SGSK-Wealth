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
