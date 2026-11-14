import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PvdHoldingsComponent, parseRiskInfo } from './pvd-holdings.component';
import { PortfolioPosition } from '../../models/portfolio.model';

describe('PvdHoldingsComponent', () => {
  let component: PvdHoldingsComponent;
  let fixture: ComponentFixture<PvdHoldingsComponent>;

  const mockPvdPositions: PortfolioPosition[] = [
    {
      symbol: 'PVDSP500',
      displaySymbol: 'PVDSP500',
      name: 'นโยบายตราสารทุนต่างประเทศ หุ้นสหรัฐฯ',
      assetType: 'provident-fund',
      assetTypeLabel: 'Provident Fund',
      totalShares: 10000,
      totalCost: 140000,
      averageCost: 14,
      currentPrice: 14,
      holdingValue: 140000,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      currency: 'THB',
      originalCurrency: 'THB',
      hasPrice: true,
      lots: [],
      employeeShares: 5500,
      employerShares: 4500,
      employeeContribution: 60000,
      employeeEarnings: 17000,
      employerMatching: 50000,
      employerEarnings: 13000,
      pvdFundName: 'ไทยพาณิชย์ มาสเตอร์ฟันด์',
      policyName: 'ตราสารทุนต่างประเทศ',
      aimcType: 'US Equity',
      aimcDescription: 'กองทุนรวมตราสารทุนสหรัฐอเมริกา',
      riskLevel: 'RS6',
      objective: 'ลงทุนในกองทุนหลักต่างประเทศ S&P 500',
    },
    {
      symbol: 'PVDMPINC',
      displaySymbol: 'PVDMPINC',
      name: 'นโยบายตราสารหนี้ต่างประเทศ',
      assetType: 'provident-fund',
      assetTypeLabel: 'Provident Fund',
      totalShares: 5000,
      totalCost: 60000,
      averageCost: 12,
      currentPrice: 12,
      holdingValue: 60000,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      currency: 'THB',
      originalCurrency: 'THB',
      hasPrice: true,
      lots: [],
      employeeShares: 2500,
      employerShares: 2500,
      employeeContribution: 28000,
      employeeEarnings: 2000,
      employerMatching: 28000,
      employerEarnings: 2000,
      pvdFundName: 'ไทยพาณิชย์ มาสเตอร์ฟันด์',
      policyName: 'ตราสารหนี้ต่างประเทศ',
      aimcType: 'Foreign Fixed Income',
      aimcDescription: 'กองทุนรวมตราสารหนี้ต่างประเทศ',
      riskLevel: 'RS4',
      objective: 'สร้างผลตอบแทนสม่ำเสมอจากตราสารหนี้โลก',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PvdHoldingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PvdHoldingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('positions', mockPvdPositions);
    fixture.componentRef.setInput('displayCurrency', 'THB');
    fixture.componentRef.setInput('exchangeRate', 35);
    fixture.componentRef.setInput('hasRate', true);
    fixture.componentRef.setInput('privacyMode', false);
    fixture.detectChanges();
  });

  it('should render empty state when there are no PVD positions', () => {
    fixture.componentRef.setInput('positions', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#pvd-empty-state')).toBeTruthy();
    expect(el.querySelector('#pvd-hero-card')).toBeFalsy();
  });

  it('should filter out non-PVD positions and compute executive KPI totals', () => {
    const withStock: PortfolioPosition[] = [
      ...mockPvdPositions,
      {
        symbol: 'AAPL',
        displaySymbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'us-stock',
        assetTypeLabel: 'U.S. Stock',
        totalShares: 10,
        totalCost: 1500,
        averageCost: 150,
        currentPrice: 200,
        holdingValue: 2000,
        unrealizedPL: 500,
        unrealizedPLPercent: 33.33,
        currency: 'THB',
        originalCurrency: 'USD',
        hasPrice: true,
        lots: [],
      },
    ];
    fixture.componentRef.setInput('positions', withStock);
    fixture.detectChanges();

    const s = component.summary();
    expect(s.policyCount).toBe(2);
    expect(s.totalBalance).toBeCloseTo(200000, 2);
    expect(s.totalEmployeePrincipal).toBeCloseTo(88000, 2);
    expect(s.totalEmployeeEarnings).toBeCloseTo(19000, 2);
    expect(s.totalEmployeeValue).toBeCloseTo(107000, 2);
    expect(s.totalEmployerPrincipal).toBeCloseTo(78000, 2);
    expect(s.totalEmployerEarnings).toBeCloseTo(15000, 2);
    expect(s.totalEmployerValue).toBeCloseTo(93000, 2);
    expect(s.totalPrincipal).toBeCloseTo(166000, 2);
    expect(s.totalEarnings).toBeCloseTo(34000, 2);
    expect(s.returnPct).toBeCloseTo((34000 / 166000) * 100, 2);
    expect(s.masterFundNames).toEqual(['ไทยพาณิชย์ มาสเตอร์ฟันด์']);
  });

  it('should compute 4-segment split bar percentages summing to 100%', () => {
    const s = component.summary();
    const totalPct =
      s.splitBarPct.empPrincipal +
      s.splitBarPct.empEarnings +
      s.splitBarPct.emprPrincipal +
      s.splitBarPct.emprEarnings;
    expect(totalPct).toBeCloseTo(100, 4);
    expect(s.splitBarPct.empPrincipal).toBeCloseTo((88000 / 200000) * 100, 2);
    expect(s.splitBarPct.empEarnings).toBeCloseTo((19000 / 200000) * 100, 2);
    expect(s.splitBarPct.emprPrincipal).toBeCloseTo((78000 / 200000) * 100, 2);
    expect(s.splitBarPct.emprEarnings).toBeCloseTo((15000 / 200000) * 100, 2);
  });

  it('should compute policy allocation donut slices ordered by weight', () => {
    const slices = component.donutSlices();
    expect(slices.length).toBe(2);
    expect(slices[0].symbol).toBe('PVDSP500');
    expect(slices[0].weightPct).toBeCloseTo(70, 2);
    expect(slices[1].symbol).toBe('PVDMPINC');
    expect(slices[1].weightPct).toBeCloseTo(30, 2);
  });

  it('should compute weighted SEC risk score and distribution buckets', () => {
    // 70% RS6 (score 6) + 30% RS4 (score 4) => 4.2 + 1.2 = 5.4
    const s = component.summary();
    expect(s.weightedRiskScore).toBeCloseTo(5.4, 2);
    expect(s.weightedRiskInfo.code).toBe('RS5');
    expect(s.riskBuckets.length).toBe(2);
    expect(s.riskBuckets[0].code).toBe('RS4');
    expect(s.riskBuckets[0].weightPct).toBeCloseTo(30, 2);
    expect(s.riskBuckets[1].code).toBe('RS6');
    expect(s.riskBuckets[1].weightPct).toBeCloseTo(70, 2);

    expect(parseRiskInfo('RS8').tier).toBe('very-high');
    expect(parseRiskInfo('RS1').tier).toBe('low');
    expect(parseRiskInfo('').score).toBe(0);
  });

  it('should filter policies by search query and sort by different keys', () => {
    component.searchQuery.set('Fixed Income');
    expect(component.filteredPolicies().map((p) => p.symbol)).toEqual(['PVDMPINC']);

    component.clearSearch();
    expect(component.filteredPolicies().length).toBe(2);

    // Default sort: value desc => PVDSP500 (140k), PVDMPINC (60k)
    expect(component.filteredPolicies().map((p) => p.symbol)).toEqual(['PVDSP500', 'PVDMPINC']);

    // Toggle direction on value => asc
    component.setSort('value');
    expect(component.filteredPolicies().map((p) => p.symbol)).toEqual(['PVDMPINC', 'PVDSP500']);

    // Sort by return desc => PVDSP500 (~27.27%) > PVDMPINC (~7.14%)
    component.setSort('return');
    expect(component.filteredPolicies().map((p) => p.symbol)).toEqual(['PVDSP500', 'PVDMPINC']);

    // Sort by units asc after toggling
    component.setSort('units');
    component.setSort('units');
    expect(component.filteredPolicies().map((p) => p.symbol)).toEqual(['PVDMPINC', 'PVDSP500']);
  });

  it('should convert THB values to USD when displayCurrency changes', () => {
    fixture.componentRef.setInput('displayCurrency', 'USD');
    fixture.detectChanges();

    const s = component.summary();
    expect(s.totalBalance).toBeCloseTo(200000 / 35, 2);
    expect(s.totalPrincipal).toBeCloseTo(166000 / 35, 2);
    expect(component.currencySymbol()).toBe('$');
    expect(component.formatMoney(-100)).toBe('-$100.00');
  });

  it('should set data-privacy attribute when privacyMode is enabled and emit refresh', () => {
    fixture.componentRef.setInput('privacyMode', true);
    fixture.detectChanges();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.getAttribute('data-privacy')).toBe('true');

    const spy = vi.fn();
    component.refresh.subscribe(spy);
    const btn = hostEl.querySelector('#pvd-refresh-btn') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
