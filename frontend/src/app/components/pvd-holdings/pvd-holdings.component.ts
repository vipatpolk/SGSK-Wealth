import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioPosition } from '../../models/portfolio.model';
import { SymbolIconComponent } from '../symbol-icon/symbol-icon.component';
import {
  convertCurrency,
  displaySymbol,
  getAssetType,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  getSymbolName,
} from '../../utils/format.utils';

export type PvdSortKey = 'value' | 'return' | 'principal' | 'units' | 'risk';

export type PvdRiskTier = 'low' | 'moderate' | 'high' | 'very-high' | 'unknown';

export interface PvdRiskInfo {
  code: string;
  score: number;
  label: string;
  tier: PvdRiskTier;
}

export interface PvdPolicyViewModel {
  position: PortfolioPosition;
  symbol: string;
  displaySymbol: string;
  name: string;
  assetType: string;
  color: string;
  totalShares: number;
  employeeShares: number;
  employerShares: number;
  currentPrice: number;
  averageCost: number;
  holdingValue: number;
  employeePrincipal: number;
  employeeEarnings: number;
  employeeTotal: number;
  employerPrincipal: number;
  employerEarnings: number;
  employerTotal: number;
  principal: number;
  earnings: number;
  returnPct: number;
  weightPct: number;
  pvdFundName: string;
  policyName: string;
  aimcType: string;
  aimcDescription: string;
  objective: string;
  risk: PvdRiskInfo;
}

export interface PvdDonutSlice {
  symbol: string;
  displaySymbol: string;
  name: string;
  color: string;
  holdingValue: number;
  weightPct: number;
  dashArray: string;
  dashOffset: string;
}

export interface PvdRiskBucket {
  score: number;
  code: string;
  weightPct: number;
  value: number;
  policyCount: number;
  tier: PvdRiskTier;
}

export interface PvdSummaryMetrics {
  totalBalance: number;
  totalEmployeePrincipal: number;
  totalEmployeeEarnings: number;
  totalEmployeeValue: number;
  totalEmployerPrincipal: number;
  totalEmployerEarnings: number;
  totalEmployerValue: number;
  totalPrincipal: number;
  totalEarnings: number;
  returnPct: number;
  employeeSharePct: number;
  employerSharePct: number;
  splitBarPct: {
    empPrincipal: number;
    empEarnings: number;
    emprPrincipal: number;
    emprEarnings: number;
  };
  policyCount: number;
  masterFundNames: string[];
  weightedRiskScore: number | null;
  weightedRiskInfo: PvdRiskInfo;
  riskBuckets: PvdRiskBucket[];
}

const DONUT_RADIUS = 82;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const RISK_SPECTRUM_MAP: Record<number, Omit<PvdRiskInfo, 'code' | 'score'>> = {
  1: { label: 'เสี่ยงต่ำ (Low)', tier: 'low' },
  2: { label: 'ปานกลางค่อนข้างต่ำ (Mod-Low)', tier: 'low' },
  3: { label: 'ปานกลางค่อนข้างต่ำ (Mod-Low)', tier: 'moderate' },
  4: { label: 'เสี่ยงปานกลาง (Moderate)', tier: 'moderate' },
  5: { label: 'ปานกลางค่อนข้างสูง (Mod-High)', tier: 'moderate' },
  6: { label: 'เสี่ยงสูง (High)', tier: 'high' },
  7: { label: 'เสี่ยงสูงมาก (Very High)', tier: 'very-high' },
  8: { label: 'เสี่ยงสูงมากเป็นพิเศษ (Ultra High)', tier: 'very-high' },
};

export function parseRiskInfo(riskLevel?: string | null): PvdRiskInfo {
  const normalized = (riskLevel || '').trim().toUpperCase();
  const match = normalized.match(/(\d)/);
  if (!match) {
    return { code: normalized || 'N/A', score: 0, label: 'ไม่ระบุ (Unrated)', tier: 'unknown' };
  }
  const score = Number(match[1]);
  const meta = RISK_SPECTRUM_MAP[score];
  if (!meta) {
    return { code: normalized, score: 0, label: 'ไม่ระบุ (Unrated)', tier: 'unknown' };
  }
  return {
    code: `RS${score}`,
    score,
    label: meta.label,
    tier: meta.tier,
  };
}

@Component({
  selector: 'app-pvd-holdings',
  standalone: true,
  imports: [CommonModule, SymbolIconComponent],
  templateUrl: './pvd-holdings.component.html',
  styleUrl: './pvd-holdings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-privacy]': "privacyMode() ? 'true' : null",
  },
})
export class PvdHoldingsComponent {
  readonly positions = input.required<PortfolioPosition[]>();
  readonly displayCurrency = input.required<'USD' | 'THB'>();
  readonly exchangeRate = input.required<number>();
  readonly hasRate = input.required<boolean>();
  readonly privacyMode = input<boolean>(false);
  readonly pricesLoading = input<boolean>(false);

  readonly refresh = output<void>();

  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<PvdSortKey>('value');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly hoveredSliceSymbol = signal<string | null>(null);

  readonly riskLevelsScale = [1, 2, 3, 4, 5, 6, 7, 8] as const;

  readonly currencySymbol = computed<string>(() =>
    this.displayCurrency() === 'USD' ? '$' : '฿'
  );

  /** Normalized PVD sub-policy models in the active display currency */
  readonly policies = computed<PvdPolicyViewModel[]>(() => {
    const raw = this.positions().filter(
      (p) => getAssetType(p.assetType, p.symbol) === 'provident-fund'
    );
    if (raw.length === 0) return [];

    const draft = raw.map((pos) => {
      const fromCurrency = pos.currency || pos.originalCurrency || 'THB';
      const holdingValue = this.toDisplay(pos.holdingValue, fromCurrency);
      const totalCost = this.toDisplay(pos.totalCost, fromCurrency);
      const currentPrice = this.toDisplay(pos.currentPrice, fromCurrency);
      const averageCost = this.toDisplay(pos.averageCost, fromCurrency);

      const totalShares = Number(pos.totalShares ?? 0);
      const employeeShares = Number(pos.employeeShares ?? 0);
      const employerShares = Number(pos.employerShares ?? 0);

      const hasExplicitBreakdown =
        pos.employeeContribution != null ||
        pos.employerMatching != null ||
        pos.employeeEarnings != null ||
        pos.employerEarnings != null;

      let empPrincipal = 0;
      let empEarnings = 0;
      let emprPrincipal = 0;
      let emprEarnings = 0;

      if (hasExplicitBreakdown) {
        empPrincipal = this.toDisplay(pos.employeeContribution, fromCurrency);
        empEarnings = this.toDisplay(pos.employeeEarnings, fromCurrency);
        emprPrincipal = this.toDisplay(pos.employerMatching, fromCurrency);
        emprEarnings = this.toDisplay(pos.employerEarnings, fromCurrency);
      } else {
        const shareSum = employeeShares + employerShares;
        const empRatio = shareSum > 0 ? employeeShares / shareSum : 0.5;
        const fallbackEarnings = holdingValue - totalCost;
        empPrincipal = totalCost * empRatio;
        emprPrincipal = totalCost * (1 - empRatio);
        empEarnings = fallbackEarnings * empRatio;
        emprEarnings = fallbackEarnings * (1 - empRatio);
      }

      const principal = empPrincipal + emprPrincipal;
      const earnings = empEarnings + emprEarnings;
      const effectivePrincipal = principal > 0 ? principal : totalCost;
      const effectiveEarnings = hasExplicitBreakdown ? earnings : holdingValue - totalCost;
      const returnPct =
        effectivePrincipal > 0 ? (effectiveEarnings / effectivePrincipal) * 100 : 0;

      return {
        position: pos,
        symbol: pos.symbol,
        displaySymbol: pos.displaySymbol || displaySymbol(pos.symbol),
        name: getSymbolName(pos.symbol, pos.name || ''),
        assetType: getAssetType(pos.assetType, pos.symbol),
        color: getSymbolColor(pos.symbol),
        totalShares,
        employeeShares,
        employerShares,
        currentPrice,
        averageCost,
        holdingValue,
        employeePrincipal: empPrincipal,
        employeeEarnings: empEarnings,
        employeeTotal: empPrincipal + empEarnings,
        employerPrincipal: emprPrincipal,
        employerEarnings: emprEarnings,
        employerTotal: emprPrincipal + emprEarnings,
        principal: effectivePrincipal,
        earnings: effectiveEarnings,
        returnPct,
        weightPct: 0,
        pvdFundName: (pos.pvdFundName || '').trim(),
        policyName: (pos.policyName || '').trim(),
        aimcType: (pos.aimcType || '').trim(),
        aimcDescription: (pos.aimcDescription || '').trim(),
        objective: (pos.objective || '').trim(),
        risk: parseRiskInfo(pos.riskLevel),
      } satisfies PvdPolicyViewModel;
    });

    const totalBalance = draft.reduce((sum, item) => sum + item.holdingValue, 0);
    return draft.map((item) => ({
      ...item,
      weightPct: totalBalance > 0 ? (item.holdingValue / totalBalance) * 100 : 0,
    }));
  });

  /** Portfolio-wide PVD summary KPIs, 4-segment breakdown, and SEC weighted risk */
  readonly summary = computed<PvdSummaryMetrics>(() => {
    const list = this.policies();
    const totalBalance = list.reduce((s, p) => s + p.holdingValue, 0);
    const totalEmployeePrincipal = list.reduce((s, p) => s + p.employeePrincipal, 0);
    const totalEmployeeEarnings = list.reduce((s, p) => s + p.employeeEarnings, 0);
    const totalEmployeeValue = totalEmployeePrincipal + totalEmployeeEarnings;
    const totalEmployerPrincipal = list.reduce((s, p) => s + p.employerPrincipal, 0);
    const totalEmployerEarnings = list.reduce((s, p) => s + p.employerEarnings, 0);
    const totalEmployerValue = totalEmployerPrincipal + totalEmployerEarnings;
    const totalPrincipal = totalEmployeePrincipal + totalEmployerPrincipal;
    const totalEarnings = totalEmployeeEarnings + totalEmployerEarnings;
    const returnPct = totalPrincipal > 0 ? (totalEarnings / totalPrincipal) * 100 : 0;

    const combinedBreakdown = totalEmployeeValue + totalEmployerValue;
    const employeeSharePct =
      combinedBreakdown > 0 ? (totalEmployeeValue / combinedBreakdown) * 100 : 0;
    const employerSharePct =
      combinedBreakdown > 0 ? (totalEmployerValue / combinedBreakdown) * 100 : 0;

    const mEmpP = Math.max(totalEmployeePrincipal, 0);
    const mEmpE = Math.max(totalEmployeeEarnings, 0);
    const mEmprP = Math.max(totalEmployerPrincipal, 0);
    const mEmprE = Math.max(totalEmployerEarnings, 0);
    const barDenom = mEmpP + mEmpE + mEmprP + mEmprE;

    const splitBarPct = {
      empPrincipal: barDenom > 0 ? (mEmpP / barDenom) * 100 : 0,
      empEarnings: barDenom > 0 ? (mEmpE / barDenom) * 100 : 0,
      emprPrincipal: barDenom > 0 ? (mEmprP / barDenom) * 100 : 0,
      emprEarnings: barDenom > 0 ? (mEmprE / barDenom) * 100 : 0,
    };

    const masterFundNames = Array.from(
      new Set(list.map((p) => p.pvdFundName).filter((n) => n.length > 0))
    );

    const ratedPolicies = list.filter((p) => p.risk.score > 0 && p.holdingValue > 0);
    const ratedTotal = ratedPolicies.reduce((s, p) => s + p.holdingValue, 0);
    const weightedRiskScore =
      ratedTotal > 0
        ? ratedPolicies.reduce((s, p) => s + p.risk.score * p.holdingValue, 0) / ratedTotal
        : null;
    const weightedRiskInfo =
      weightedRiskScore !== null
        ? parseRiskInfo(`RS${Math.min(8, Math.max(1, Math.round(weightedRiskScore)))}`)
        : parseRiskInfo(undefined);

    const bucketMap = new Map<number, PvdRiskBucket>();
    for (const p of list) {
      if (p.risk.score <= 0) continue;
      const existing = bucketMap.get(p.risk.score);
      if (existing) {
        existing.value += p.holdingValue;
        existing.weightPct += p.weightPct;
        existing.policyCount += 1;
      } else {
        bucketMap.set(p.risk.score, {
          score: p.risk.score,
          code: p.risk.code,
          weightPct: p.weightPct,
          value: p.holdingValue,
          policyCount: 1,
          tier: p.risk.tier,
        });
      }
    }
    const riskBuckets = Array.from(bucketMap.values()).sort((a, b) => a.score - b.score);

    return {
      totalBalance,
      totalEmployeePrincipal,
      totalEmployeeEarnings,
      totalEmployeeValue,
      totalEmployerPrincipal,
      totalEmployerEarnings,
      totalEmployerValue,
      totalPrincipal,
      totalEarnings,
      returnPct,
      employeeSharePct,
      employerSharePct,
      splitBarPct,
      policyCount: list.length,
      masterFundNames,
      weightedRiskScore,
      weightedRiskInfo,
      riskBuckets,
    };
  });

  /** SVG Donut geometry ordered descending by weight */
  readonly donutSlices = computed<PvdDonutSlice[]>(() => {
    const sorted = [...this.policies()]
      .filter((p) => p.weightPct > 0)
      .sort((a, b) => b.holdingValue - a.holdingValue);

    let cumulativePct = 0;
    const useGap = sorted.length > 1;

    return sorted.map((p) => {
      const rawArc = (p.weightPct / 100) * DONUT_CIRCUMFERENCE;
      const gap = useGap && rawArc > 5 ? 2.5 : 0;
      const dashLen = Math.max(rawArc - gap, 0.5);
      const offset = -((cumulativePct / 100) * DONUT_CIRCUMFERENCE);
      cumulativePct += p.weightPct;

      return {
        symbol: p.symbol,
        displaySymbol: p.displaySymbol,
        name: p.name,
        color: p.color,
        holdingValue: p.holdingValue,
        weightPct: p.weightPct,
        dashArray: `${dashLen.toFixed(2)} ${DONUT_CIRCUMFERENCE.toFixed(2)}`,
        dashOffset: offset.toFixed(2),
      };
    });
  });

  /** Active hovered slice details for center label */
  readonly activeHoveredSlice = computed<PvdDonutSlice | null>(() => {
    const sym = this.hoveredSliceSymbol();
    if (!sym) return null;
    return this.donutSlices().find((s) => s.symbol === sym) ?? null;
  });

  /** Search-filtered and sorted sub-policy cards */
  readonly filteredPolicies = computed<PvdPolicyViewModel[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const key = this.sortBy();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    const filtered = q
      ? this.policies().filter(
          (p) =>
            p.symbol.toLowerCase().includes(q) ||
            p.displaySymbol.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.pvdFundName.toLowerCase().includes(q) ||
            p.policyName.toLowerCase().includes(q) ||
            p.aimcType.toLowerCase().includes(q) ||
            p.aimcDescription.toLowerCase().includes(q) ||
            p.risk.code.toLowerCase().includes(q)
        )
      : [...this.policies()];

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case 'value':
          cmp = a.holdingValue - b.holdingValue;
          break;
        case 'return':
          cmp = a.returnPct - b.returnPct;
          break;
        case 'principal':
          cmp = a.principal - b.principal;
          break;
        case 'units':
          cmp = a.totalShares - b.totalShares;
          break;
        case 'risk':
          cmp = a.risk.score - b.risk.score;
          break;
      }
      if (cmp === 0) return a.symbol.localeCompare(b.symbol);
      return cmp * dir;
    });

    return filtered;
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  setSort(key: PvdSortKey): void {
    if (this.sortBy() === key) {
      this.sortDir.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      this.sortBy.set(key);
      this.sortDir.set('desc');
    }
  }

  setHoveredSlice(symbol: string | null): void {
    this.hoveredSliceSymbol.set(symbol);
  }

  isRiskLevelCovered(lvl: number): boolean {
    return this.summary().riskBuckets.some((b) => b.score === lvl);
  }

  isWeightedRiskLevel(lvl: number): boolean {
    const score = this.summary().weightedRiskScore;
    return score !== null && Math.round(score) === lvl;
  }

  formatMoney(value: number, signed = false): string {
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const cur = this.currencySymbol();
    if (value < 0) {
      return `-${cur}${formatted}`;
    }
    if (signed && value > 0) {
      return `+${cur}${formatted}`;
    }
    return `${cur}${formatted}`;
  }

  formatSignedPct(pct: number): string {
    const abs = Math.abs(pct).toFixed(2);
    if (pct > 0) return `+${abs}%`;
    if (pct < 0) return `-${abs}%`;
    return '0.00%';
  }

  getUnitFormat(): string {
    return getQuantityFormat('', 'provident-fund');
  }

  getNavFormat(): string {
    return getPriceFormat('', 'provident-fund');
  }

  private toDisplay(amount: number | undefined | null, fromCurrency: string): number {
    const numeric = Number(amount ?? 0);
    if (!Number.isFinite(numeric)) return 0;
    const from = (fromCurrency || 'THB').toUpperCase();
    const to = this.displayCurrency().toUpperCase();
    if (from === to) return numeric;
    const rate = this.exchangeRate();
    if (rate > 0 && (this.hasRate() || rate !== 1)) {
      return convertCurrency(numeric, from, to, rate);
    }
    return numeric;
  }
}
