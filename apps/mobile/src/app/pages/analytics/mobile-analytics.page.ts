import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular';
import { DateRange, DateRangePickerComponent } from '@shared/components/date-range-picker/date-range-picker.component';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { AnalyticsSubTab } from '@shared/config/asset.constants';
import {
  PortfolioAllocationResponse,
  PortfolioPerformanceResponse,
} from '@shared/models/portfolio.model';
import { ApiFailure } from '@shared/models/api-result.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PortfolioSourceCoordinator } from '@shared/providers/portfolio-source.coordinator';
import {
  convertCurrency,
  displaySymbol,
  getAssetColor,
  getAssetType,
  getAssetTypeLabel,
  getSymbolColor,
  resolveSymbolName,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    SymbolIconComponent,
    DateRangePickerComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
  ],
  templateUrl: './mobile-analytics.page.html',
  styleUrl: './mobile-analytics.page.css',
})
export class MobileAnalyticsPage {
  readonly state = inject(MobileStateService);
  private readonly portfolioCoordinator = inject(PortfolioSourceCoordinator);

  readonly timeframes = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const;
  readonly timeframe = signal<string>('ALL');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly performanceError = signal<ApiFailure | null>(null);
  readonly allocationError = signal<ApiFailure | null>(null);
  readonly apiError = computed<ApiFailure | null>(
    () => this.performanceError() ?? this.allocationError()
  );
  readonly error = computed<string | null>(() => {
    const err = this.apiError();
    if (!err) return null;
    return err.kind === 'unauthorized' ? this.state.i18n.t('app.error.sessionExpired') : err.message;
  });

  readonly performance = signal<PortfolioPerformanceResponse | null>(null);
  readonly allocation = signal<PortfolioAllocationResponse | null>(null);

  // Allocation drilldown state
  readonly selectedAssetType = signal<string | null>(null);
  readonly showAllHoldings = signal<boolean>(false);

  // Performance filter/sort state
  readonly perfSearchQuery = signal<string>('');
  readonly perfAssetFilter = signal<string>('all');
  readonly perfStatusFilter = signal<string>('all');
  readonly perfSortField = signal<string>('totalReturn');
  readonly perfSortDir = signal<'asc' | 'desc'>('desc');
  readonly showAllPerfSymbols = signal<boolean>(false);

  readonly getAssetColorFn = getAssetColor;

  constructor() {
    effect(() => {
      this.portfolioCoordinator.dataRevision();
      const currency = this.state.displayCurrency();
      const tf = this.timeframe();
      const s = this.startDate();
      const e = this.endDate();
      const effectiveTf = s || e ? 'CUSTOM' : tf;
      this.loadAnalytics(currency, effectiveTf, s, e);
    });
  }

  private cx(value: number, fromCurrency: string): number {
    if (!this.state.hasRate()) return value;
    return convertCurrency(
      value,
      fromCurrency,
      this.state.displayCurrency(),
      this.state.exchangeRate()
    );
  }

  readonly summaryKPIs = computed(() => {
    const perf = this.performance();
    if (perf?.summary && (perf.summary.totalInvested > 0 || perf.summary.totalValue > 0)) {
      return {
        totalInvested: this.cx(perf.summary.totalInvested, perf.currency),
        totalCurrentValue: this.cx(perf.summary.totalValue, perf.currency),
        totalUnrealizedPL: this.cx(perf.summary.totalUnrealizedPL, perf.currency),
        totalUnrealizedPLPercent: perf.summary.totalUnrealizedPLPercent,
        totalRealizedPL: this.cx(perf.summary.totalRealizedPL, perf.currency),
        totalRealizedPLPercent: perf.summary.totalRealizedPLPercent,
        totalReturn: this.cx(perf.summary.totalReturn, perf.currency),
        totalReturnPercent: perf.summary.totalReturnPercent,
      };
    }

    let openInvested = 0;
    let openValue = 0;
    let closedInvested = 0;
    let closedRealized = 0;
    const pm = this.state.prices();

    for (const s of this.state.openSummaries()) {
      const pd = pm.get(s.symbol);
      openInvested += this.cx(s.totalCost, s.currency);
      openValue +=
        pd && pd.price > 0
          ? this.cx(s.totalShares * pd.price, pd.currency)
          : this.cx(s.totalShares * s.averageCost, s.currency);
    }

    for (const c of this.state.closedSummaries()) {
      for (const lot of c.lots) {
        const cur = lot.currency || c.currency;
        closedInvested += this.cx(lot.totalCost, cur);
        closedRealized += this.cx(lot.realizedPL, cur);
      }
    }

    const totalInvested = openInvested + closedInvested;
    const totalUnrealizedPL = openValue - openInvested;
    const totalUnrealizedPLPercent = openInvested > 0 ? (totalUnrealizedPL / openInvested) * 100 : 0;
    const totalRealizedPL = closedRealized;
    const totalRealizedPLPercent = closedInvested > 0 ? (totalRealizedPL / closedInvested) * 100 : 0;
    const totalReturn = totalRealizedPL + totalUnrealizedPL;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue: openValue,
      totalUnrealizedPL,
      totalUnrealizedPLPercent,
      totalRealizedPL,
      totalRealizedPLPercent,
      totalReturn,
      totalReturnPercent,
    };
  });

  // --- Allocation & Overview Donut ---
  readonly assetClassDistribution = computed(() => {
    const pm = this.state.prices();
    const typeMap = new Map<string, number>();
    const lang = this.state.i18n.lang();

    for (const s of this.state.openSummaries()) {
      const pd = pm.get(s.symbol);
      const val =
        pd && pd.price > 0
          ? this.cx(s.totalShares * pd.price, pd.currency)
          : this.cx(s.totalCost, s.currency);
      if (val > 0) {
        const type = getAssetType(s.assetType, s.symbol);
        typeMap.set(type, (typeMap.get(type) ?? 0) + val);
      }
    }

    const totalVal = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
    return Array.from(typeMap.entries())
      .map(([type, value]) => ({
        type,
        label: getAssetTypeLabel(type, undefined, lang),
        value,
        percentage: totalVal > 0 ? (value / totalVal) * 100 : 0,
        color: getAssetColor(type),
      }))
      .sort((a, b) => b.value - a.value);
  });

  readonly totalPortfolioValue = computed(() =>
    this.assetClassDistribution().reduce((acc, item) => acc + item.value, 0)
  );

  readonly selectedAssetLabel = computed(() => {
    const t = this.selectedAssetType();
    return t ? getAssetTypeLabel(t, undefined, this.state.i18n.lang()) : this.state.i18n.t('asset.allClasses');
  });

  readonly classHoldings = computed(() => {
    const selectedType = this.selectedAssetType();
    if (!selectedType) return [];
    const pm = this.state.prices();
    const lang = this.state.i18n.lang();
    const list = this.state
      .openSummaries()
      .filter((s) => getAssetType(s.assetType, s.symbol) === selectedType)
      .map((s) => {
        const pd = pm.get(s.symbol);
        const val =
          pd && pd.price > 0
            ? this.cx(s.totalShares * pd.price, pd.currency)
            : this.cx(s.totalCost, s.currency);
        const assetType = getAssetType(s.assetType, s.symbol);
        return {
          symbol: s.symbol,
          displaySymbol: displaySymbol(s.symbol),
          assetType,
          pvdFundName: s.pvdFundName,
          name: resolveSymbolName(s.symbol, pm, lang, assetType),
          shares: s.totalShares,
          value: val,
          color: getSymbolColor(s.symbol),
        };
      })
      .filter((h) => h.value > 0 || h.shares > 0)
      .sort((a, b) => b.value - a.value);

    const classTot = list.reduce((acc, h) => acc + h.value, 0);
    const portTot = this.totalPortfolioValue();
    return list.map((h) => ({
      ...h,
      classPercent: classTot > 0 ? (h.value / classTot) * 100 : 0,
      portfolioPercent: portTot > 0 ? (h.value / portTot) * 100 : 0,
    }));
  });

  readonly classTotalValue = computed(() =>
    this.classHoldings().reduce((sum, h) => sum + h.value, 0)
  );

  readonly donutSegments = computed(() => {
    const isAllocDrilldown = this.state.analyticsSubTab() === 'allocation' && !!this.selectedAssetType();
    let cumulative = 0;

    if (!isAllocDrilldown) {
      return this.assetClassDistribution().map((c) => {
        const pct = c.percentage;
        const offset = 100 - cumulative;
        cumulative += pct;
        return {
          key: c.type,
          label: c.label,
          actualPercent: pct,
          dashArray: `${Math.max(pct, 0.001)} ${100 - Math.max(pct, 0.001)}`,
          dashOffset: offset,
          color: c.color,
        };
      });
    }

    return this.classHoldings().map((h) => {
      const pct = h.classPercent;
      const offset = 100 - cumulative;
      cumulative += pct;
      return {
        key: h.symbol,
        label: h.displaySymbol,
        actualPercent: pct,
        dashArray: `${Math.max(pct, 0.001)} ${100 - Math.max(pct, 0.001)}`,
        dashOffset: offset,
        color: h.color,
      };
    });
  });

  readonly currencyExposure = computed(() => {
    const alloc = this.allocation();
    if (alloc?.currencyExposure && (alloc.currencyExposure.usd > 0 || alloc.currencyExposure.thb > 0)) {
      return {
        usd: this.cx(alloc.currencyExposure.usd, alloc.currency),
        thb: this.cx(alloc.currencyExposure.thb, alloc.currency),
        usdPercent: alloc.currencyExposure.usdPercent,
        thbPercent: alloc.currencyExposure.thbPercent,
      };
    }

    let usdVal = 0;
    let thbVal = 0;
    const pm = this.state.prices();
    for (const s of this.state.openSummaries()) {
      const pd = pm.get(s.symbol);
      const val =
        pd && pd.price > 0
          ? this.cx(s.totalShares * pd.price, pd.currency)
          : this.cx(s.totalCost, s.currency);
      const orig = (pd?.currency || s.currency) === 'USDT' ? 'USD' : pd?.currency || s.currency;
      if (orig === 'USD') usdVal += val;
      else if (orig === 'THB') thbVal += val;
    }
    const tot = usdVal + thbVal;
    return {
      usd: usdVal,
      thb: thbVal,
      usdPercent: tot > 0 ? (usdVal / tot) * 100 : 0,
      thbPercent: tot > 0 ? (thbVal / tot) * 100 : 0,
    };
  });

  readonly allConcentrationHoldings = computed(() => {
    const pm = this.state.prices();
    const tot = this.totalPortfolioValue();
    return this.state
      .openSummaries()
      .map((s) => {
        const pd = pm.get(s.symbol);
        const val =
          pd && pd.price > 0
            ? this.cx(s.totalShares * pd.price, pd.currency)
            : this.cx(s.totalCost, s.currency);
        return {
          symbol: s.symbol,
          displaySymbol: displaySymbol(s.symbol),
          assetType: getAssetType(s.assetType, s.symbol),
          pvdFundName: s.pvdFundName,
          value: val,
          percent: tot > 0 ? (val / tot) * 100 : 0,
          color: getSymbolColor(s.symbol),
        };
      })
      .filter((h) => h.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  readonly displayedConcentration = computed(() => {
    const all = this.allConcentrationHoldings();
    return this.showAllHoldings() ? all : all.slice(0, 5);
  });

  // --- Performance Attribution ---
  readonly assetTypePerformance = computed(() => {
    const perf = this.performance();
    const lang = this.state.i18n.lang();
    if (perf?.assetTypePerformance?.length) {
      return perf.assetTypePerformance.map((t) => ({
        type: t.assetType,
        label: getAssetTypeLabel(t.assetType, undefined, lang),
        totalReturnPercent: t.totalReturnPercent,
        color: getAssetColor(t.assetType),
      }));
    }
    return [];
  });

  readonly maxAbsReturnPercent = computed(() => {
    let max = 0;
    for (const t of this.assetTypePerformance()) {
      max = Math.max(max, Math.abs(t.totalReturnPercent));
    }
    return max === 0 ? 1 : max;
  });

  readonly symbolPerformanceList = computed(() => {
    const perf = this.performance();
    const lang = this.state.i18n.lang();
    const pm = this.state.prices();
    if (perf?.symbolPerformance?.length) {
      return perf.symbolPerformance.map((item) => {
        const assetType = getAssetType(item.assetType, item.symbol);
        const pd = pm.get(item.symbol);
        return {
          symbol: item.symbol,
          displaySymbol: item.displaySymbol || displaySymbol(item.symbol),
          name: resolveSymbolName(item.symbol, pm, lang, assetType) || item.name || item.symbol,
          assetType,
          assetTypeLabel: getAssetTypeLabel(assetType, item.symbol, lang),
          status: item.status,
          investedCost: this.cx(item.investedCost, perf.currency),
          currentValue: this.cx(item.currentValue, perf.currency),
          realizedPL: this.cx(item.realizedPL, perf.currency),
          unrealizedPL: this.cx(item.unrealizedPL, perf.currency),
          totalReturn: this.cx(item.totalReturn, perf.currency),
          totalReturnPercent: item.totalReturnPercent,
          color: getSymbolColor(item.symbol),
          pvdFundName: pd?.name ? undefined : undefined,
        };
      });
    }
    return [];
  });

  readonly topGainers = computed(() =>
    [...this.symbolPerformanceList()]
      .filter((i) => i.totalReturnPercent > 0)
      .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
      .slice(0, 4)
  );

  readonly topLosers = computed(() =>
    [...this.symbolPerformanceList()]
      .filter((i) => i.totalReturnPercent < 0)
      .sort((a, b) => a.totalReturnPercent - b.totalReturnPercent)
      .slice(0, 4)
  );

  readonly perfAssetOptions = computed(() => {
    const lang = this.state.i18n.lang();
    const types = new Set(this.symbolPerformanceList().map((s) => s.assetType));
    return [
      { value: 'all', label: this.state.i18n.t('asset.all') },
      ...Array.from(types)
        .sort()
        .map((t) => ({ value: t, label: getAssetTypeLabel(t, undefined, lang) })),
    ];
  });

  readonly filteredSymbolPerformance = computed(() => {
    const q = this.perfSearchQuery().trim().toLowerCase();
    const typeF = this.perfAssetFilter();
    const statusF = this.perfStatusFilter();
    const field = this.perfSortField();
    const dir = this.perfSortDir() === 'asc' ? 1 : -1;

    const filtered = this.symbolPerformanceList().filter((item) => {
      if (typeF !== 'all' && item.assetType !== typeF) return false;
      if (statusF !== 'all' && item.status.toLowerCase() !== statusF) return false;
      if (q) {
        return (
          item.symbol.toLowerCase().includes(q) ||
          item.displaySymbol.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
        );
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (field === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
      if (field === 'totalReturnAmount') return dir * (a.totalReturn - b.totalReturn);
      if (field === 'investedCost') return dir * (a.investedCost - b.investedCost);
      if (field === 'currentValue') return dir * (a.currentValue - b.currentValue);
      if (field === 'realizedPL') return dir * (a.realizedPL - b.realizedPL);
      if (field === 'unrealizedPL') return dir * (a.unrealizedPL - b.unrealizedPL);
      return dir * (a.totalReturnPercent - b.totalReturnPercent);
    });

    return this.showAllPerfSymbols() ? filtered : filtered.slice(0, 10);
  });

  onRefresh(event: CustomEvent): void {
    const curr = this.state.displayCurrency();
    const s = this.startDate();
    const e = this.endDate();
    this.loadAnalytics(curr, s || e ? 'CUSTOM' : this.timeframe(), s, e);
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 450);
  }

  onSegmentChange(event: CustomEvent): void {
    const next = (event.detail.value as AnalyticsSubTab) || 'overview';
    void this.state.nativePlatform.triggerHapticSelection();
    this.state.analyticsSubTab.set(next);
  }

  selectAssetType(type: string | null): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.selectedAssetType.update((curr) => (curr === type ? null : type));
  }

  setTimeframe(tf: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.startDate.set('');
    this.endDate.set('');
    this.timeframe.set(tf);
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
  }

  togglePerfSortDir(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.perfSortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  retryLoad(): void {
    const s = this.startDate();
    const e = this.endDate();
    const effectiveTf = s || e ? 'CUSTOM' : this.timeframe();
    this.loadAnalytics(this.state.displayCurrency(), effectiveTf, s, e);
  }

  private loadAnalytics(currency: 'USD' | 'THB', tf: string, start: string, end: string): void {
    const lang = this.state.i18n.lang();
    this.loading.set(true);
    this.performanceError.set(null);
    this.allocationError.set(null);
    this.portfolioCoordinator.getPerformance(tf, start, end, currency, lang).subscribe({
      next: (res) => {
        if (res.ok) {
          this.performanceError.set(null);
          this.performance.set(res.data);
        } else {
          this.performanceError.set(res);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.portfolioCoordinator.getAllocation(undefined, currency, lang).subscribe({
      next: (res) => {
        if (res.ok) {
          this.allocationError.set(null);
          this.allocation.set(res.data);
        } else {
          this.allocationError.set(res);
        }
      },
    });
  }
}
