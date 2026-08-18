import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { ComponentRef } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let componentRef: ComponentRef<HeaderComponent>;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('loading', false);
    componentRef.setInput('error', null);
    componentRef.setInput('result', null);
    componentRef.setInput('totalCostConverted', 10000);
    componentRef.setInput('totalProceedsConverted', 0);
    componentRef.setInput('totalPL', 2500);
    componentRef.setInput('totalPLPercent', 25.0);
    componentRef.setInput('isClosedTab', false);
    componentRef.setInput('isAllTab', false);
    componentRef.setInput('totalHoldingConverted', 12500);
    componentRef.setInput('totalRealizedPLConverted', 0);
    componentRef.setInput('totalRealizedPLPercent', 0);
    componentRef.setInput('hasRate', true);
    componentRef.setInput('exchangeRate', 35.0);
    componentRef.setInput('currentView', 'holdings');
    componentRef.setInput('displayCurrency', 'USD');
    componentRef.setInput('theme', 'dark');

    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile view dropdown state', () => {
    expect(component.isViewDropdownOpen()).toBe(false);
    component.toggleViewDropdown();
    expect(component.isViewDropdownOpen()).toBe(true);
  });

  it('should emit viewChange output and close dropdown when selecting view', () => {
    let emittedView = '';
    component.viewChange.subscribe(v => emittedView = v);

    component.toggleViewDropdown();
    component.selectView('allocation');

    expect(emittedView).toBe('allocation');
    expect(component.isViewDropdownOpen()).toBe(false);
  });

  it('should emit viewChange output and close dropdown when selecting performance view', () => {
    let emittedView = '';
    component.viewChange.subscribe(v => emittedView = v);

    component.toggleViewDropdown();
    component.selectView('performance');

    expect(emittedView).toBe('performance');
    expect(component.isViewDropdownOpen()).toBe(false);
  });

  it('should format currency sign correctly via dc helper', () => {
    expect(component.dc('USD')).toBe('USD');
  });

  it('should render page-specific meta stats for holdings view', () => {
    componentRef.setInput('result', { totalSymbols: 5, totalLots: 12, error: null } as any);
    componentRef.setInput('currentView', 'holdings');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Symbols');
    expect(metaStats?.textContent).toContain('5');
    expect(metaStats?.textContent).toContain('Lots');
    expect(metaStats?.textContent).toContain('12');
  });

  it('should render page-specific meta stats for dividends view', () => {
    componentRef.setInput('result', { totalSymbols: 5, totalLots: 12, error: null } as any);
    componentRef.setInput('dividendData', {
      symbolSummaries: [{ symbol: 'AAPL' }, { symbol: 'MSFT' }],
      records: [{ id: '1' }, { id: '2' }, { id: '3' }],
      portfolioYieldOnCost: 4.85
    } as any);
    componentRef.setInput('currentView', 'dividends');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Assets');
    expect(metaStats?.textContent).toContain('2');
    expect(metaStats?.textContent).toContain('Payouts');
    expect(metaStats?.textContent).toContain('3');
    expect(metaStats?.textContent).toContain('YOC');
    expect(metaStats?.textContent).toContain('4.85%');
  });

  it('should render page-specific meta stats for allocation view', () => {
    componentRef.setInput('result', { totalSymbols: 5, totalLots: 12, error: null } as any);
    componentRef.setInput('portfolioData', {
      openPositions: [
        { symbol: 'AAPL', assetType: 'us-stock', unrealizedPL: 500 },
        { symbol: 'SCB.BK', assetType: 'thai-stock', unrealizedPL: -200 }
      ]
    } as any);
    componentRef.setInput('currentView', 'allocation');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Classes');
    expect(metaStats?.textContent).toContain('2');
    expect(metaStats?.textContent).toContain('Holdings');
    expect(metaStats?.textContent).toContain('2');
  });

  it('should render page-specific meta stats for transactions view', () => {
    componentRef.setInput('result', {
      totalSymbols: 5,
      totalLots: 12,
      rawTransactions: [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }, { id: 'tx-4' }],
      error: null
    } as any);
    componentRef.setInput('currentView', 'transactions');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Total Tx');
    expect(metaStats?.textContent).toContain('4');
    expect(metaStats?.textContent).toContain('Symbols');
    expect(metaStats?.textContent).toContain('5');
  });

  it('should render page-specific meta stats for performance view', () => {
    componentRef.setInput('result', { totalSymbols: 5, totalLots: 12, error: null } as any);
    componentRef.setInput('portfolioData', {
      openPositions: [
        { symbol: 'AAPL', unrealizedPL: 500 },
        { symbol: 'NVDA', unrealizedPL: 1200 },
        { symbol: 'SCB.BK', unrealizedPL: -200 }
      ]
    } as any);
    componentRef.setInput('currentView', 'performance');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Gainers');
    expect(metaStats?.textContent).toContain('2');
    expect(metaStats?.textContent).toContain('Losers');
    expect(metaStats?.textContent).toContain('1');
  });

  it('should emit viewChange output and close dropdown when selecting tools view', () => {
    let emittedView = '';
    component.viewChange.subscribe((v) => (emittedView = v));

    component.toggleViewDropdown();
    component.selectView('tools');

    expect(emittedView).toBe('tools');
    expect(component.isViewDropdownOpen()).toBe(false);
  });

  it('should render page-specific meta stats for tools view', () => {
    componentRef.setInput('result', { totalSymbols: 5, totalLots: 12, error: null } as any);
    componentRef.setInput('currentView', 'tools');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaStats = compiled.querySelector('.header-meta-stats');
    expect(metaStats?.textContent).toContain('Tool');
    expect(metaStats?.textContent).toContain('Avg Cost');
    expect(metaStats?.textContent).toContain('Mode');
    expect(metaStats?.textContent).toContain('Simulator');
  });

  it('should emit privacyChange output when privacy toggle button is clicked', () => {
    let privacyToggled = false;
    component.privacyChange.subscribe(() => privacyToggled = true);

    const button = fixture.nativeElement.querySelector('#privacy-toggle-btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();

    expect(privacyToggled).toBe(true);
  });

  it('should reflect privacy-active class when privacyMode is true', () => {
    componentRef.setInput('privacyMode', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('#privacy-toggle-btn') as HTMLButtonElement;
    expect(button.classList.contains('privacy-active')).toBe(true);
    expect(button.getAttribute('title')).toContain('Show sensitive');
  });
});
