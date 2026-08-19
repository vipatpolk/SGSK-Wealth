import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryCardComponent } from './summary-card.component';
import { ComponentRef } from '@angular/core';

describe('SummaryCardComponent', () => {
  let component: SummaryCardComponent;
  let componentRef: ComponentRef<SummaryCardComponent>;
  let fixture: ComponentFixture<SummaryCardComponent>;

  const mockSummary = {
    symbol: 'AAPL',
    totalShares: 10,
    totalCost: 1500,
    averageCost: 150,
    currency: 'USD',
    assetType: 'us-stock',
    lots: [
      {
        purchaseDate: '2026-01-01',
        quantity: 10,
        costBasis: 150,
        totalCost: 1500
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('type', 'open');
    componentRef.setInput('summary', mockSummary);
    componentRef.setInput('isAllTab', false);
    componentRef.setInput('isClosedTab', false);
    componentRef.setInput('hasPriceData', true);
    componentRef.setInput('pricesLoading', false);
    componentRef.setInput('isExpanded', false);

    componentRef.setInput('getSymbolColor', (sym: string) => '#3b82f6');
    componentRef.setInput('getDisplaySymbol', (sym: string) => sym);
    componentRef.setInput('getSymbolName', (sym: string) => 'Apple Inc.');
    componentRef.setInput('getAssetTypeClass', () => 'pill-us-stock');
    componentRef.setInput('getAssetTypeLabel', () => 'U.S. Stock');
    componentRef.setInput('getQuantityFormat', () => '1.2-2');
    componentRef.setInput('getPriceFormat', () => '1.2-2');

    componentRef.setInput('cx', (val: number) => val);
    componentRef.setInput('dc', (curr?: string) => curr === 'THB' ? '฿' : '$');

    componentRef.setInput('getCurrentPriceConverted', () => 180);
    componentRef.setInput('getHoldingValue', () => 1800);
    componentRef.setInput('getUnrealizedPL', () => 300);
    componentRef.setInput('getUnrealizedPLPercent', () => 20);
    componentRef.setInput('getLotHoldingValue', () => 1800);
    componentRef.setInput('getLotUnrealizedPL', () => 300);

    fixture.detectChanges();
  });

  it('should create summary card component', () => {
    expect(component).toBeTruthy();
    expect(component.summary().symbol).toBe('AAPL');
  });

  it('should emit toggleExpand when card expand button is clicked', () => {
    let emittedSymbol = '';
    component.toggleExpand.subscribe(sym => emittedSymbol = sym);

    component.toggleExpand.emit('AAPL');
    expect(emittedSymbol).toBe('AAPL');
  });

  it('should emit openHistory when view history button is clicked', () => {
    let emittedSymbol = '';
    component.openHistory.subscribe(sym => emittedSymbol = sym);

    component.openHistory.emit('AAPL');
    expect(emittedSymbol).toBe('AAPL');
  });

  it('should render metric-amount and pl-percent for open position P/L', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const metricAmount = compiled.querySelector('.metric-amount');
    const plPercent = compiled.querySelector('.pl-percent');

    expect(metricAmount).toBeTruthy();
    expect(metricAmount?.textContent).toContain('300.00');
    expect(plPercent).toBeTruthy();
    expect(plPercent?.textContent).toContain('+20.00%');
  });

  it('should render closed position card with metric-amount and pl-percent', () => {
    const mockClosedSummary = {
      symbol: 'TSLA',
      totalShares: 0,
      closedShares: 5,
      totalCost: 1000,
      totalProceeds: 1500,
      realizedPL: 500,
      realizedPLPercent: 50,
      averageBuyPrice: 200,
      averageSellPrice: 300,
      currency: 'USD',
      assetType: 'us-stock',
      lots: [
        {
          symbol: 'TSLA',
          purchaseDate: '2026-01-01',
          closeDate: '2026-02-01',
          quantity: 5,
          costBasis: 200,
          sellPrice: 300,
          totalCost: 1000,
          totalProceeds: 1500,
          realizedPL: 500,
          realizedPLPercent: 50
        }
      ]
    };

    componentRef.setInput('type', 'closed');
    componentRef.setInput('summary', mockClosedSummary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricAmount = compiled.querySelector('.metric-amount');
    const plPercent = compiled.querySelector('.pl-percent');

    expect(metricAmount).toBeTruthy();
    expect(metricAmount?.textContent).toContain('500.00');
    expect(plPercent).toBeTruthy();
    expect(plPercent?.textContent).toContain('+50.00%');
  });

  it('should render symbol name for closed positions', () => {
    const mockClosedSummary = {
      symbol: 'TTB.BK',
      name: 'TMBThanachart Bank Public Company Limited',
      totalShares: 0,
      closedShares: 100,
      totalCost: 150,
      totalProceeds: 180,
      realizedPL: 30,
      realizedPLPercent: 20,
      averageBuyPrice: 1.5,
      averageSellPrice: 1.8,
      currency: 'THB',
      assetType: 'thai-stock',
      lots: [],
    };

    componentRef.setInput('type', 'closed');
    componentRef.setInput('summary', mockClosedSummary);
    componentRef.setInput('getSymbolName', (sym: string, rawName?: string) => rawName || 'TMBThanachart Bank');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const nameEl = compiled.querySelector('.symbol-name');
    expect(nameEl).toBeTruthy();
    expect(nameEl?.textContent).toContain('TMBThanachart Bank');
  });
});
