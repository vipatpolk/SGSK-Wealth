import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { DIVIDEND_ASSET_TYPES } from '@shared/config/asset.constants';
import {
  AssetTypeDividendSummary,
  DividendRecord,
  SymbolDividendSummary,
} from '@shared/models/dividend.model';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import {
  convertCurrency,
  displaySymbol,
  getAssetColor,
  getAssetTypeClass,
  getAssetTypeLabel,
  getSymbolName,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-dividends',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgClass,
    TranslatePipe,
    LocalizedDatePipe,
    SymbolIconComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSpinner,
  ],
  templateUrl: './mobile-dividends.page.html',
  styleUrl: './mobile-dividends.page.css',
})
export class MobileDividendsPage {
  readonly state = inject(MobileStateService);

  readonly selectedYear = signal<string>('all');
  readonly selectedAssetType = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly sortField = signal<'netDividends' | 'yoc' | 'currentYield' | 'projected' | 'name'>('netDividends');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedMonthKey = signal<string | null>(null);
  readonly pageLimit = signal<number>(20);

  readonly selectedHoldingLedger = signal<{
    symbol: string;
    displaySymbol: string;
    name: string;
    assetType: string;
    assetTypeLabel: string;
    records: DividendRecord[];
    totalGross: number;
    totalNet: number;
    totalWht: number;
  } | null>(null);

  readonly assetFilterTypes = DIVIDEND_ASSET_TYPES;
  readonly getAssetColorFn = (assetType?: string, symbol?: string): string =>
    getAssetColor(assetType, symbol, this.state.userSettings.resolvedTheme());
  readonly getAssetTypeClassFn = getAssetTypeClass;

  private cx(amount: number, fromCurrency?: string): number {
    if (!amount || amount === 0) return 0;
    const target = this.state.displayCurrency();
    const orig =
      (fromCurrency || target).toUpperCase() === 'USDT'
        ? 'USD'
        : (fromCurrency || target).toUpperCase();
    if (orig === target) return amount;
    const rate = this.state.exchangeRate();
    if (rate <= 0) return amount;
    return convertCurrency(amount, orig, target, rate);
  }

  readonly availableYears = computed(() => {
    const annual = this.state.localizedDividendData()?.annualDividends ?? [];
    return annual.map((a) => String(a.year)).sort((a, b) => Number(b) - Number(a));
  });

  readonly filteredRecords = computed(() => {
    const d = this.state.localizedDividendData();
    if (!d?.records) return [];

    const year = this.selectedYear();
    const at = this.selectedAssetType();
    const q = this.searchQuery().trim().toLowerCase();

    let recs = d.records;
    if (year !== 'all') {
      recs = recs.filter((r) => r.date.startsWith(year));
    }
    if (at !== 'all') {
      recs = recs.filter((r) => r.assetType === at);
    }
    if (q) {
      const symMap = new Map((d.symbolSummaries || []).map((s) => [s.symbol, s]));
      recs = recs.filter((r) => {
        const sym = symMap.get(r.symbol);
        return (
          r.symbol.toLowerCase().includes(q) ||
          (r.displaySymbol || '').toLowerCase().includes(q) ||
          (sym?.name || '').toLowerCase().includes(q) ||
          (sym?.nameTh || '').toLowerCase().includes(q)
        );
      });
    }

    return recs.map((r) => ({
      ...r,
      convertedNetAmount: this.cx(r.netAmount, r.currency),
      convertedGrossAmount: this.cx(r.grossAmount, r.currency),
      convertedWithholdingTax: this.cx(r.withholdingTax, r.currency),
    }));
  });

  readonly filteredSymbolSummaries = computed<SymbolDividendSummary[]>(() => {
    const d = this.state.localizedDividendData();
    if (!d?.symbolSummaries) return [];

    const year = this.selectedYear();
    const at = this.selectedAssetType();
    const q = this.searchQuery().trim().toLowerCase();
    const recs = this.filteredRecords();

    const symNet = new Map<string, number>();
    const symGross = new Map<string, number>();
    const symWht = new Map<string, number>();
    for (const r of recs) {
      symNet.set(r.symbol, (symNet.get(r.symbol) ?? 0) + r.convertedNetAmount);
      symGross.set(r.symbol, (symGross.get(r.symbol) ?? 0) + r.convertedGrossAmount);
      symWht.set(r.symbol, (symWht.get(r.symbol) ?? 0) + r.convertedWithholdingTax);
    }

    const list: SymbolDividendSummary[] = [];
    for (const s of d.symbolSummaries) {
      if (at !== 'all' && s.assetType !== at) continue;
      if (q) {
        const match =
          s.symbol.toLowerCase().includes(q) ||
          (s.displaySymbol || '').toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.nameTh || '').toLowerCase().includes(q);
        if (!match) continue;
      }

      const convCost = this.cx(s.currentCostBasis || 0, d.currency);
      const convVal = this.cx(s.currentValue || 0, d.currency);
      const convProj =
        s.projectedAnnualIncome != null && s.projectedAnnualIncome > 0
          ? this.cx(s.projectedAnnualIncome, d.currency)
          : this.cx((s.currentShares || 0) * (s.trailingAnnualDPS || 0), s.currency);
      const convGross = this.cx(s.convertedGrossDividends ?? s.totalGrossDividends ?? 0, d.currency);
      const convNet = this.cx(s.convertedNetDividends ?? s.totalNetDividends ?? 0, d.currency);
      const convWht = this.cx(s.convertedWithholdingTax ?? s.totalWithholdingTax ?? 0, d.currency);
      const symYoc = convCost > 0 ? (convProj / convCost) * 100 : s.yieldOnCostPercent || 0;
      const symYield = convVal > 0 ? (convProj / convVal) * 100 : s.currentYieldPercent || 0;

      if (year !== 'all') {
        const net = symNet.get(s.symbol) ?? 0;
        if (net <= 0) continue;
        list.push({
          ...s,
          currentCostBasis: convCost,
          currentValue: convVal,
          projectedAnnualIncome: convProj,
          yieldOnCostPercent: symYoc,
          currentYieldPercent: symYield,
          convertedNetDividends: net,
          convertedGrossDividends: symGross.get(s.symbol) ?? 0,
          convertedWithholdingTax: symWht.get(s.symbol) ?? 0,
        });
      } else {
        list.push({
          ...s,
          currentCostBasis: convCost,
          currentValue: convVal,
          projectedAnnualIncome: convProj,
          yieldOnCostPercent: symYoc,
          currentYieldPercent: symYield,
          convertedNetDividends: convNet,
          convertedGrossDividends: convGross,
          convertedWithholdingTax: convWht,
        });
      }
    }

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (field === 'yoc') return (a.yieldOnCostPercent - b.yieldOnCostPercent) * dir;
      if (field === 'currentYield') return (a.currentYieldPercent - b.currentYieldPercent) * dir;
      if (field === 'projected') return (a.projectedAnnualIncome - b.projectedAnnualIncome) * dir;
      if (field === 'name') return a.displaySymbol.localeCompare(b.displaySymbol) * dir;
      return (a.convertedNetDividends - b.convertedNetDividends) * dir;
    });
  });

  readonly activeNetTotal = computed(() =>
    this.filteredRecords().reduce((acc, r) => acc + r.convertedNetAmount, 0)
  );
  readonly activeGrossTotal = computed(() =>
    this.filteredRecords().reduce((acc, r) => acc + r.convertedGrossAmount, 0)
  );
  readonly activeWhtTotal = computed(() =>
    this.filteredRecords().reduce((acc, r) => acc + r.convertedWithholdingTax, 0)
  );
  readonly activeProjectedAnnualDividends = computed(() =>
    this.filteredSymbolSummaries().reduce((acc, s) => acc + (s.projectedAnnualIncome || 0), 0)
  );

  readonly activeYieldOnCost = computed(() => {
    const list = this.filteredSymbolSummaries();
    const totalCost = list.reduce((acc, s) => acc + (s.currentCostBasis || 0), 0);
    const totalProj = list.reduce((acc, s) => acc + (s.projectedAnnualIncome || 0), 0);
    if (this.selectedAssetType() === 'all' && !this.searchQuery().trim() && this.selectedYear() === 'all') {
      return this.state.dividendData()?.portfolioYieldOnCost || (totalCost > 0 ? (totalProj / totalCost) * 100 : 0);
    }
    return totalCost > 0 ? (totalProj / totalCost) * 100 : 0;
  });

  readonly activeMarketYield = computed(() => {
    const list = this.filteredSymbolSummaries();
    const totalVal = list.reduce((acc, s) => acc + (s.currentValue || 0), 0);
    const totalProj = list.reduce((acc, s) => acc + (s.projectedAnnualIncome || 0), 0);
    if (this.selectedAssetType() === 'all' && !this.searchQuery().trim() && this.selectedYear() === 'all') {
      return this.state.dividendData()?.portfolioDividendYield || (totalVal > 0 ? (totalProj / totalVal) * 100 : 0);
    }
    return totalVal > 0 ? (totalProj / totalVal) * 100 : 0;
  });

  readonly activeEffectiveTaxRate = computed(() => {
    const gross = this.activeGrossTotal();
    const wht = this.activeWhtTotal();
    return gross > 0 ? (wht / gross) * 100 : this.state.dividendData()?.effectiveTaxRate || 0;
  });

  readonly activeAssetTypeSummaries = computed<AssetTypeDividendSummary[]>(() => {
    const lang = this.state.i18n.lang();
    const d = this.state.localizedDividendData();
    const recs = this.filteredRecords();
    const totalNet = this.activeNetTotal();

    const map: Record<string, { gross: number; net: number; wht: number; symbols: Set<string>; count: number }> =
      Object.fromEntries(
        DIVIDEND_ASSET_TYPES.map((at) => [
          at,
          { gross: 0, net: 0, wht: 0, symbols: new Set<string>(), count: 0 },
        ])
      );

    for (const r of recs) {
      if (map[r.assetType]) {
        map[r.assetType].gross += r.convertedGrossAmount;
        map[r.assetType].net += r.convertedNetAmount;
        map[r.assetType].wht += r.convertedWithholdingTax;
        map[r.assetType].symbols.add(r.symbol);
        map[r.assetType].count += 1;
      }
    }

    const costMap = new Map<string, number>();
    const valMap = new Map<string, number>();
    const projMap = new Map<string, number>();

    for (const s of d?.symbolSummaries ?? []) {
      const at = s.assetType;
      const convCost = this.cx(s.currentCostBasis || 0, d?.currency);
      const convVal = this.cx(s.currentValue || 0, d?.currency);
      const convProj =
        s.projectedAnnualIncome != null && s.projectedAnnualIncome > 0
          ? this.cx(s.projectedAnnualIncome, d?.currency)
          : this.cx((s.currentShares || 0) * (s.trailingAnnualDPS || 0), s.currency);
      costMap.set(at, (costMap.get(at) ?? 0) + convCost);
      valMap.set(at, (valMap.get(at) ?? 0) + convVal);
      projMap.set(at, (projMap.get(at) ?? 0) + convProj);
      if (map[at] && (s.currentShares || 0) > 0) {
        map[at].symbols.add(s.symbol);
      }
    }

    return DIVIDEND_ASSET_TYPES.map((atKey) => {
      const totalCostBasis = costMap.get(atKey) ?? 0;
      const currentValue = valMap.get(atKey) ?? 0;
      const projectedAnnualDividends = projMap.get(atKey) ?? 0;
      return {
        assetType: atKey,
        assetTypeLabel: getAssetTypeLabel(atKey, undefined, lang),
        totalGrossDividends: map[atKey]?.gross ?? 0,
        totalNetDividends: map[atKey]?.net ?? 0,
        totalWithholdingTax: map[atKey]?.wht ?? 0,
        percentageOfTotal: totalNet > 0 && map[atKey] ? (map[atKey].net / totalNet) * 100 : 0,
        symbolCount: map[atKey]?.symbols.size ?? 0,
        recordCount: map[atKey]?.count ?? 0,
        totalCostBasis,
        currentValue,
        projectedAnnualDividends,
        yieldOnCostPercent: totalCostBasis > 0 ? (projectedAnnualDividends / totalCostBasis) * 100 : 0,
        currentYieldPercent: currentValue > 0 ? (projectedAnnualDividends / currentValue) * 100 : 0,
      };
    });
  });

  readonly monthlyChartData = computed(() => {
    const recs = this.filteredRecords();
    if (recs.length === 0) return [];

    const monthMap = new Map<
      string,
      {
        yearMonth: string;
        netAmount: number;
        usAmount: number;
        thaiAmount: number;
        fundAmount: number;
        bondAmount: number;
      }
    >();

    for (const r of recs) {
      const ym = r.date.slice(0, 7);
      if (!monthMap.has(ym)) {
        monthMap.set(ym, {
          yearMonth: ym,
          netAmount: 0,
          usAmount: 0,
          thaiAmount: 0,
          fundAmount: 0,
          bondAmount: 0,
        });
      }
      const entry = monthMap.get(ym)!;
      entry.netAmount += r.convertedNetAmount;
      if (r.assetType === 'us-stock') entry.usAmount += r.convertedNetAmount;
      else if (r.assetType === 'thai-stock') entry.thaiAmount += r.convertedNetAmount;
      else if (r.assetType === 'mutual-fund') entry.fundAmount += r.convertedNetAmount;
      else if (r.assetType === 'bond') entry.bondAmount += r.convertedNetAmount;
    }

    const sorted = Array.from(monthMap.values()).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    const maxVal = Math.max(...sorted.map((m) => m.netAmount), 1);

    return sorted.map((m) => ({
      ...m,
      percentHeight: Math.max(12, Math.round((m.netAmount / maxVal) * 100)),
      usPercent: m.netAmount > 0 ? (m.usAmount / m.netAmount) * 100 : 0,
      thaiPercent: m.netAmount > 0 ? (m.thaiAmount / m.netAmount) * 100 : 0,
      fundPercent: m.netAmount > 0 ? (m.fundAmount / m.netAmount) * 100 : 0,
      bondPercent: m.netAmount > 0 ? (m.bondAmount / m.netAmount) * 100 : 0,
    }));
  });

  readonly selectedMonthData = computed(() => {
    const data = this.monthlyChartData();
    if (data.length === 0) return null;
    const key = this.selectedMonthKey();
    return (key ? data.find((m) => m.yearMonth === key) : null) ?? data[data.length - 1];
  });

  readonly visibleRecords = computed(() => this.filteredRecords().slice(0, this.pageLimit()));

  getAssetLabel(at: string): string {
    return getAssetTypeLabel(at, undefined, this.state.i18n.lang());
  }

  getDisplaySymbol(sym: string): string {
    return displaySymbol(sym);
  }

  getHoldingRecordsCount(symbol: string): number {
    return this.filteredRecords().filter((r) => r.symbol === symbol).length;
  }

  setYear(yr: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.selectedYear.set(yr);
    this.pageLimit.set(20);
  }

  setAssetType(at: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.selectedAssetType.set(at);
    this.pageLimit.set(20);
  }

  setSort(field: 'netDividends' | 'yoc' | 'currentYield' | 'projected' | 'name'): void {
    void this.state.nativePlatform.triggerHapticSelection();
    if (this.sortField() === field) {
      this.sortDirection.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'name' ? 'asc' : 'desc');
    }
  }

  selectMonth(yearMonth: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.selectedMonthKey.set(yearMonth);
  }

  openHoldingLedger(summary: SymbolDividendSummary): void {
    void this.state.nativePlatform.triggerHapticImpact('light');
    const lang = this.state.i18n.lang();
    const records = this.filteredRecords().filter((r) => r.symbol === summary.symbol);
    this.selectedHoldingLedger.set({
      symbol: summary.symbol,
      displaySymbol: summary.displaySymbol || displaySymbol(summary.symbol),
      name: getSymbolName(summary.symbol, summary.name || '', lang, summary.nameTh || '', summary.assetType),
      assetType: summary.assetType,
      assetTypeLabel: getAssetTypeLabel(summary.assetType, summary.symbol, lang),
      records,
      totalGross: records.reduce((a, r) => a + r.convertedGrossAmount, 0),
      totalNet: records.reduce((a, r) => a + r.convertedNetAmount, 0),
      totalWht: records.reduce((a, r) => a + r.convertedWithholdingTax, 0),
    });
  }

  closeHoldingLedger(): void {
    this.selectedHoldingLedger.set(null);
  }

  loadMoreRecords(): void {
    this.pageLimit.update((n) => n + 20);
  }

  onRefresh(event: CustomEvent): void {
    this.state.loadDividendData(this.state.displayCurrency());
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 450);
  }
}
