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
});
