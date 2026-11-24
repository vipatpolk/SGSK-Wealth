import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonRange, IonSelect, IonSelectOption } from '@ionic/angular';
import { KNOWN_ASSET_TYPES } from '@shared/config/asset.constants';
import { TranslationKey } from '@shared/i18n/en';
import {
  CompoundingFrequency,
  PaymentTiming,
  TvmCalculationResult,
  TvmSolveMode,
} from '@shared/models/tools.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SecondaryCurrencyComponent } from '@shared/components/secondary-currency/secondary-currency.component';
import { getAssetColor, getAssetType, getAssetTypeLabel } from '@shared/utils/format.utils';
import { calculateTVM, COMPOUNDING_FREQUENCIES } from '@shared/utils/tvm-calculator.utils';
import { MobileStateService } from '../../../services/mobile-state.service';
import { NativePlatformService } from '../../../services/native-platform.service';

export type PvSourceMode = 'portfolio' | 'invested' | 'custom';

export interface MobileAssetTypeOption {
  id: string;
  label: string;
  color: string;
  holdingValue: number;
  investedCost: number;
  count: number;
}

export interface MobileTvmChartPoint {
  year: number;
  x: number;
  yBalance: number;
  yInvested: number;
  balance: number;
  invested: number;
  interest: number;
  multiplier: number;
}

export interface MobileTvmGridLine {
  y: number;
  value: number;
  label: string;
}

export interface MobileTvmXAxisTick {
  x: number;
  year: number;
  label: string;
}

export interface MobileTvmGrowthChartData {
  points: MobileTvmChartPoint[];
  maxVal: number;
  pathTotalBalance: string;
  pathTotalBalanceArea: string;
  pathInvestedCapital: string;
  pathInvestedCapitalArea: string;
  gridLines: MobileTvmGridLine[];
  xTicks: MobileTvmXAxisTick[];
  svgWidth: number;
  svgHeight: number;
  padBottom: number;
}

@Component({
  selector: 'app-mobile-tvm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, FormsModule, TranslatePipe, SecondaryCurrencyComponent, IonRange, IonSelect, IonSelectOption],
  templateUrl: './mobile-tvm.component.html',
  styleUrl: './mobile-tvm.component.css',
})
export class MobileTvmComponent {
  readonly state = inject(MobileStateService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly compoundingFrequencies = COMPOUNDING_FREQUENCIES;
  readonly solveModes: { id: TvmSolveMode; key: TranslationKey }[] = [
    { id: 'FV', key: 'tools.tvm.modeFV' },
    { id: 'PMT', key: 'tools.tvm.modePMT' },
    { id: 'PV', key: 'tools.tvm.modePV' },
    { id: 'N', key: 'tools.tvm.modeN' },
    { id: 'RATE', key: 'tools.tvm.modeRATE' },
  ];

  readonly solveMode = signal<TvmSolveMode>('FV');
  readonly pvSource = signal<PvSourceMode>('portfolio');
  readonly selectedAssetTypes = signal<Set<string>>(new Set(['all']));
  readonly customPresentValue = signal<number>(100000);
  readonly payment = signal<number>(10000);
  readonly annualRatePct = signal<number>(8);
  readonly years = signal<number>(15);
  readonly compounding = signal<CompoundingFrequency>('monthly');
  readonly paymentTiming = signal<PaymentTiming>('end');
  readonly targetFutureValue = signal<number>(1000000);

  readonly isAreaChartMode = signal<boolean>(true);
  readonly hoveredPoint = signal<MobileTvmChartPoint | null>(null);
  readonly isScheduleExpanded = signal<boolean>(false);

  constructor() {
    effect(() => {
      const mktVal = this.portfolioMarketValue();
      if (mktVal > 0 && this.customPresentValue() === 100000) {
        this.customPresentValue.set(Math.round(mktVal));
      }
    });
  }

  private readonly openPositions = computed(
    () => this.state.localizedPortfolioData()?.openPositions ?? []
  );

  readonly portfolioMarketValue = computed<number>(() => {
    const summary = this.state.localizedPortfolioData()?.summary;
    const positions = this.openPositions();
    const serverCurr = positions[0]?.currency || 'THB';
    if (summary && typeof summary.totalValue === 'number' && summary.totalValue > 0) {
      return this.state.cx(summary.totalValue, serverCurr);
    }
    if (positions.length > 0) {
      return positions.reduce((acc, p) => acc + this.state.cx(p.holdingValue || p.totalCost || 0, p.currency), 0);
    }
    return 0;
  });

  readonly portfolioInvestedCost = computed<number>(() => {
    const summary = this.state.localizedPortfolioData()?.summary;
    const positions = this.openPositions();
    const serverCurr = positions[0]?.currency || 'THB';
    if (summary && typeof summary.openInvested === 'number' && summary.openInvested > 0) {
      return this.state.cx(summary.openInvested, serverCurr);
    }
    if (positions.length > 0) {
      return positions.reduce((acc, p) => acc + this.state.cx(p.totalCost || 0, p.currency), 0);
    }
    return 0;
  });

  readonly assetTypeOptions = computed<MobileAssetTypeOption[]>(() => {
    const positions = this.openPositions();
    const lang = this.state.i18n.lang();
    if (!positions.length) return [];

    const typeMap = new Map<string, { holdingValue: number; investedCost: number; count: number }>();
    for (const p of positions) {
      const key = getAssetType(p.assetType, p.symbol);
      const cur = typeMap.get(key) || { holdingValue: 0, investedCost: 0, count: 0 };
      cur.holdingValue += this.state.cx(p.holdingValue || p.totalCost || 0, p.currency);
      cur.investedCost += this.state.cx(p.totalCost || 0, p.currency);
      cur.count += 1;
      typeMap.set(key, cur);
    }

    const result: MobileAssetTypeOption[] = [];
    for (const key of KNOWN_ASSET_TYPES) {
      const data = typeMap.get(key);
      if (data) {
        result.push({
          id: key,
          label: getAssetTypeLabel(key, undefined, lang),
          color: getAssetColor(key),
          holdingValue: data.holdingValue,
          investedCost: data.investedCost,
          count: data.count,
        });
        typeMap.delete(key);
      }
    }
    for (const [key, data] of typeMap.entries()) {
      result.push({
        id: key,
        label: getAssetTypeLabel(key, undefined, lang),
        color: getAssetColor(key),
        holdingValue: data.holdingValue,
        investedCost: data.investedCost,
        count: data.count,
      });
    }
    return result;
  });

  readonly selectedAssetTypesValue = computed<number>(() => {
    const selected = this.selectedAssetTypes();
    const source = this.pvSource();
    const positions = this.openPositions();
    if (!positions.length || selected.has('all')) {
      return source === 'invested' ? this.portfolioInvestedCost() : this.portfolioMarketValue();
    }
    let sum = 0;
    for (const p of positions) {
      const key = getAssetType(p.assetType, p.symbol);
      if (selected.has(key)) {
        const val = source === 'invested' ? p.totalCost || 0 : p.holdingValue || p.totalCost || 0;
        sum += this.state.cx(val, p.currency);
      }
    }
    return sum;
  });

  readonly effectivePresentValue = computed<number>(() => {
    if (this.pvSource() === 'custom') {
      return Math.max(0, this.customPresentValue());
    }
    const assetVal = this.selectedAssetTypesValue();
    return assetVal > 0 ? assetVal : Math.max(0, this.customPresentValue());
  });

  readonly calculationResult = computed<TvmCalculationResult>(() =>
    calculateTVM({
      mode: this.solveMode(),
      presentValue: this.effectivePresentValue(),
      payment: Math.max(0, this.payment()),
      annualRatePct: Math.max(0, this.annualRatePct()),
      years: Math.max(0, this.years()),
      compounding: this.compounding(),
      timing: this.paymentTiming(),
      targetFutureValue: Math.max(0, this.targetFutureValue()),
    })
  );

  readonly principalPercent = computed<number>(() => {
    const res = this.calculationResult();
    return res.futureValue > 0 ? Math.min(100, Math.max(0, (res.totalPrincipal / res.futureValue) * 100)) : 0;
  });

  readonly contributionsPercent = computed<number>(() => {
    const res = this.calculationResult();
    return res.futureValue > 0 ? Math.min(100, Math.max(0, (res.totalContributions / res.futureValue) * 100)) : 0;
  });

  readonly interestPercent = computed<number>(() => {
    const res = this.calculationResult();
    return res.futureValue > 0 ? Math.min(100, Math.max(0, (res.totalInterestEarned / res.futureValue) * 100)) : 0;
  });

  readonly activeCompoundingLabel = computed<string>(() => {
    this.state.i18n.lang();
    return this.state.i18n.t(`tools.tvm.freq.${this.compounding()}` as TranslationKey);
  });

  readonly growthChartData = computed<MobileTvmGrowthChartData>(() => {
    const res = this.calculationResult();
    const schedule = res.schedule || [];
    const svgWidth = 800;
    const svgHeight = 240;
    const padLeft = 60;
    const padRight = 18;
    const padTop = 18;
    const padBottom = 30;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;
    const baseY = padTop + plotHeight;

    if (!res.isValid || schedule.length === 0 || res.years <= 0) {
      return {
        points: [],
        maxVal: 0,
        pathTotalBalance: '',
        pathTotalBalanceArea: '',
        pathInvestedCapital: '',
        pathInvestedCapitalArea: '',
        gridLines: [],
        xTicks: [],
        svgWidth,
        svgHeight,
        padBottom,
      };
    }

    const numYears = schedule.length;
    const maxVal = Math.max(1, res.futureValue, res.totalInvested) * 1.08;
    const scaleX = (yr: number) => padLeft + (yr / numYears) * plotWidth;
    const scaleY = (val: number) => baseY - (Math.max(0, val) / maxVal) * plotHeight;

    const points: MobileTvmChartPoint[] = [
      {
        year: 0,
        x: scaleX(0),
        yBalance: scaleY(res.presentValue),
        yInvested: scaleY(res.presentValue),
        balance: res.presentValue,
        invested: res.presentValue,
        interest: 0,
        multiplier: 1.0,
      },
    ];

    for (const entry of schedule) {
      const balance = entry.endBalance;
      const invested = entry.totalContributionsToDate;
      points.push({
        year: entry.year,
        x: scaleX(entry.year),
        yBalance: scaleY(balance),
        yInvested: scaleY(invested),
        balance,
        invested,
        interest: Math.max(0, balance - invested),
        multiplier: invested > 0 ? balance / invested : 1.0,
      });
    }

    const pathTotalBalance = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yBalance.toFixed(1)}`)
      .join(' ');
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    const pathTotalBalanceArea = `${pathTotalBalance} L ${lastPt.x.toFixed(1)},${baseY.toFixed(1)} L ${firstPt.x.toFixed(1)},${baseY.toFixed(1)} Z`;

    const pathInvestedCapital = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yInvested.toFixed(1)}`)
      .join(' ');
    const pathInvestedCapitalArea = `${pathInvestedCapital} L ${lastPt.x.toFixed(1)},${baseY.toFixed(1)} L ${firstPt.x.toFixed(1)},${baseY.toFixed(1)} Z`;

    const gridLines: MobileTvmGridLine[] = [0, 0.25, 0.5, 0.75, 1.0].map((pct) => {
      const val = maxVal * pct;
      return { y: scaleY(val), value: val, label: this.formatCompactCurrency(val) };
    });

    const tickStep = numYears > 15 ? 5 : numYears > 8 ? 2 : 1;
    const xTicks: MobileTvmXAxisTick[] = [];
    this.state.i18n.lang();
    for (let yr = 0; yr <= numYears; yr += tickStep) {
      xTicks.push({
        x: scaleX(yr),
        year: yr,
        label: yr === 0 ? this.state.i18n.t('tools.tvm.startTick') : this.state.i18n.t('tools.tvm.yrTick', { year: yr }),
      });
    }
    if (xTicks[xTicks.length - 1].year !== numYears) {
      xTicks.push({
        x: scaleX(numYears),
        year: numYears,
        label: this.state.i18n.t('tools.tvm.yrTick', { year: numYears }),
      });
    }

    return {
      points,
      maxVal,
      pathTotalBalance,
      pathTotalBalanceArea,
      pathInvestedCapital,
      pathInvestedCapitalArea,
      gridLines,
      xTicks,
      svgWidth,
      svgHeight,
      padBottom,
    };
  });

  private formatCompactCurrency(val: number): string {
    if (val <= 0) return '0';
    if (val >= 1e6) return (val / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(0) + 'k';
    return val.toFixed(0);
  }

  setSolveMode(mode: TvmSolveMode): void {
    this.solveMode.set(mode);
    void this.nativePlatform.triggerHapticSelection();
  }

  setPvSource(source: PvSourceMode): void {
    this.pvSource.set(source);
    if (source === 'portfolio' && this.portfolioMarketValue() > 0) {
      this.customPresentValue.set(Math.round(this.selectedAssetTypesValue() || this.portfolioMarketValue()));
    } else if (source === 'invested' && this.portfolioInvestedCost() > 0) {
      this.customPresentValue.set(Math.round(this.selectedAssetTypesValue() || this.portfolioInvestedCost()));
    }
    void this.nativePlatform.triggerHapticSelection();
  }

  toggleAssetType(typeId: string): void {
    if (typeId === 'all') {
      this.selectedAssetTypes.set(new Set(['all']));
      if (this.pvSource() === 'custom') this.pvSource.set('portfolio');
      void this.nativePlatform.triggerHapticSelection();
      return;
    }

    this.selectedAssetTypes.update((current) => {
      const next = new Set(current);
      if (next.has('all')) {
        next.clear();
        next.add(typeId);
      } else if (next.has(typeId)) {
        next.delete(typeId);
        if (next.size === 0) next.add('all');
      } else {
        next.add(typeId);
      }
      return next;
    });
    if (this.pvSource() === 'custom') this.pvSource.set('portfolio');
    void this.nativePlatform.triggerHapticSelection();
  }

  isAssetTypeSelected(typeId: string): boolean {
    return this.selectedAssetTypes().has(typeId);
  }

  onPvInput(val: number | string): void {
    this.pvSource.set('custom');
    this.customPresentValue.set(Math.max(0, Number(val) || 0));
  }

  onPmtInput(val: number | string): void {
    this.payment.set(Math.max(0, Number(val) || 0));
  }

  onRateInput(val: number | string): void {
    this.annualRatePct.set(Math.max(0, Number(val) || 0));
  }

  onYearsInput(val: number | string): void {
    this.years.set(Math.min(50, Math.max(1, Number(val) || 1)));
  }

  onYearsRangeChange(event: CustomEvent): void {
    const val = Number(event.detail?.value);
    if (!Number.isNaN(val) && val >= 1) {
      this.years.set(val);
    }
  }

  setCompounding(freq: CompoundingFrequency): void {
    if (freq) this.compounding.set(freq);
    void this.nativePlatform.triggerHapticSelection();
  }

  setPaymentTiming(timing: PaymentTiming): void {
    this.paymentTiming.set(timing);
    void this.nativePlatform.triggerHapticSelection();
  }

  setAnnualRate(rate: number): void {
    this.annualRatePct.set(rate);
    void this.nativePlatform.triggerHapticSelection();
  }

  setYears(yr: number): void {
    this.years.set(yr);
    void this.nativePlatform.triggerHapticSelection();
  }

  setHoveredPoint(pt: MobileTvmChartPoint | null): void {
    this.hoveredPoint.set(this.hoveredPoint()?.year === pt?.year ? null : pt);
    if (pt) void this.nativePlatform.triggerHapticSelection();
  }

  toggleAreaChartMode(): void {
    this.isAreaChartMode.update((v) => !v);
    void this.nativePlatform.triggerHapticSelection();
  }

  toggleSchedule(): void {
    this.isScheduleExpanded.update((v) => !v);
    void this.nativePlatform.triggerHapticSelection();
  }

  compoundingUnitLabel(): string {
    return this.state.i18n.t(`tools.tvm.unit.${this.compounding()}` as TranslationKey);
  }

  tvmErrorMessage(res: TvmCalculationResult): string {
    if (res.errorKey) {
      return this.state.i18n.t(res.errorKey as TranslationKey, res.errorParams);
    }
    return res.errorMessage || this.state.i18n.t('tools.tvm.unableSolve');
  }
}
