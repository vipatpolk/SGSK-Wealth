import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ShareLot');
  });

  it('should have closed position tab in tabs list', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const closedTab = app.tabs.find((t) => t.id === 'closed-position');
    expect(closedTab).toBeDefined();
    expect(closedTab?.sheetGid).toBe('273600915');
  });

  it('should handle tab dropdown change on mobile select', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const mockEvent = {
      target: { value: 'closed-position' },
    } as unknown as Event;

    app.onTabDropdownChange(mockEvent);

    expect(app.activeTab().id).toBe('closed-position');
  });

  it('should toggle between dark and light themes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setTheme('dark');
    expect(app.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    app.toggleTheme();
    expect(app.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    app.toggleTheme();
    expect(app.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should handle sort dropdown change and sort direction toggle on mobile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    const mockEvent = {
      target: { value: 'symbol' },
    } as unknown as Event;

    app.onSortDropdownChange(mockEvent);
    expect(app.sortField()).toBe('symbol');

    // Default direction is desc, toggle to asc
    app.toggleSortDirection();
    expect(app.sortDirection()).toBe('asc');
    app.toggleSortDirection();
    expect(app.sortDirection()).toBe('desc');
  });

  it('should handle asset filter dropdown change on mobile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    const mockEvent = {
      target: { value: 'crypto' },
    } as unknown as Event;

    app.onClosedAssetTypeChange(mockEvent);
    expect(app.selectedClosedAssetType()).toBe('crypto');
  });

  it('should filter closed summaries by asset type', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Switch to closed position tab
    const closedTab = app.tabs.find((t) => t.id === 'closed-position')!;
    app.activeTab.set(closedTab);

    // Set mock result
    app.result.set({
      summaries: [],
      closedSummaries: [
        {
          symbol: 'AAPL',
          totalShares: 0,
          closedShares: 10,
          totalCost: 1500,
          totalProceeds: 1800,
          realizedPL: 300,
          realizedPLPercent: 20,
          averageBuyPrice: 150,
          averageSellPrice: 180,
          currency: 'USD',
          assetType: 'us-stock',
          lots: [],
        },
        {
          symbol: 'TISCO.BK',
          totalShares: 0,
          closedShares: 100,
          totalCost: 10000,
          totalProceeds: 11000,
          realizedPL: 1000,
          realizedPLPercent: 10,
          averageBuyPrice: 100,
          averageSellPrice: 110,
          currency: 'THB',
          assetType: 'thai-stock',
          lots: [],
        },
        {
          symbol: 'tsp3-balancer',
          totalShares: 0,
          closedShares: 500,
          totalCost: 5000,
          totalProceeds: 5500,
          realizedPL: 500,
          realizedPLPercent: 10,
          averageBuyPrice: 10,
          averageSellPrice: 11,
          currency: 'THB',
          assetType: 'mutual-fund',
          lots: [],
        },
      ],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 3,
      totalLots: 0,
      error: null,
    });

    // Default 'all'
    expect(app.filteredClosedSummaries().length).toBe(3);
    expect(app.closedAssetTypeOptions().find((o) => o.id === 'all')?.count).toBe(3);
    expect(app.closedAssetTypeOptions().find((o) => o.id === 'mutual-fund')?.count).toBe(1);

    // Filter by mutual-fund
    app.setClosedAssetTypeFilter('mutual-fund');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('tsp3-balancer');

    // Filter by us-stock
    app.setClosedAssetTypeFilter('us-stock');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('AAPL');

    // Filter by thai-stock
    app.setClosedAssetTypeFilter('thai-stock');
    expect(app.filteredClosedSummaries().length).toBe(1);
    expect(app.filteredClosedSummaries()[0].symbol).toBe('TISCO.BK');
  });
});

