import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { PortfolioPosition } from '@shared/models/portfolio.model';
import { beforeEach, describe, expect, it } from 'vitest';
import { MobilePvdHoldingsComponent } from './mobile-pvd-holdings.component';

const MOCK_PVD_POSITIONS: PortfolioPosition[] = [
  {
    symbol: 'K-PVD-EQ',
    displaySymbol: 'K-PVD-EQ',
    name: 'Global Equity PVD',
    nameTh: 'กองทุนหุ้นโลก',
    assetType: 'provident-fund',
    assetTypeLabel: 'PVD',
    currency: 'THB',
    originalCurrency: 'THB',
    totalShares: 1000,
    averageCost: 10,
    totalCost: 10000,
    currentPrice: 12,
    holdingValue: 12000,
    unrealizedPL: 2000,
    unrealizedPLPercent: 20,
    hasPrice: true,
    riskLevel: '6',
    employeeShares: 500,
    employerShares: 500,
    employeeContribution: 5000,
    employeeEarnings: 1000,
    employerMatching: 5000,
    employerEarnings: 1000,
    lots: [],
  },
];

describe('MobilePvdHoldingsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilePvdHoldingsComponent],
      providers: [provideIonicAngular({ mode: 'ios' })],
    }).compileComponents();
  });

  it('should compute executive KPIs, split totals, policy donut, and SEC risk spectrum', () => {
    const fixture = TestBed.createComponent(MobilePvdHoldingsComponent);
    const ref: ComponentRef<MobilePvdHoldingsComponent> = fixture.componentRef;
    ref.setInput('positions', MOCK_PVD_POSITIONS);
    ref.setInput('displayCurrency', 'THB');
    ref.setInput('exchangeRate', 35);
    ref.setInput('hasRate', true);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    const sum = comp.summary();
    expect(sum.totalBalance).toBe(12000);
    expect(sum.totalPrincipal).toBe(10000);
    expect(sum.totalEarnings).toBe(2000);
    expect(comp.donutSlices().length).toBe(1);
    expect(sum.weightedRiskScore).toBe(6);
    expect(sum.splitBarPct.empPrincipal).toBeCloseTo(41.66, 1);
  });
});
