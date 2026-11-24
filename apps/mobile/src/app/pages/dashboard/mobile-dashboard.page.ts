import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/angular';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { SecondaryCurrencyComponent } from '@shared/components/secondary-currency/secondary-currency.component';
import { PortfolioPosition } from '@shared/models/portfolio.model';
import { ToolId } from '@shared/models/tools.model';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import {
  convertCurrency,
  displaySymbol,
  getAssetColor,
  getAssetType,
  getAssetTypeLabel,
  getQuantityFormat,
  getSymbolName,
  getUnitLabel,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

export interface MobileAssetAllocationItem {
  type: string;
  label: string;
  color: string;
  value: number;
  percentage: number;
  symbolCount: number;
  dashArray: string;
  dashOffset: number;
}

export interface MobileRecentTxItem {
  id: string;
  date: string;
  type: 'BUY' | 'SELL' | 'EX-IN' | 'EX-OUT';
  symbol: string;
  displaySymbol: string;
  name: string;
  assetType: string;
  quantity: number;
  price: number;
  totalAmount: number;
  currency: string;
}

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    LocalizedDatePipe,
    SymbolIconComponent,
    SecondaryCurrencyComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonSpinner,
  ],
  templateUrl: './mobile-dashboard.page.html',
  styleUrl: './mobile-dashboard.page.css',
})
export class MobileDashboardPage {
  readonly state = inject(MobileStateService);
  private readonly router = inject(Router);

  readonly displaySymbolFn = displaySymbol;
  readonly getQuantityFormat = getQuantityFormat;

  readonly openPositions = computed<PortfolioPosition[]>(
    () => this.state.localizedPortfolioData()?.openPositions ?? []
  );

  readonly closedPositions = computed(
    () => this.state.localizedPortfolioData()?.closedPositions ?? []
  );

  readonly netPortfolioValue = computed<number>(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    const raw = data.summary?.totalValue || data.summary?.openInvested || 0;
    return this.cx(raw, data.currency);
  });

  readonly secondaryNetValue = computed<number | null>(() => {
    const rate = this.state.exchangeRate();
    if (!this.state.hasRate() || rate <= 0) return null;
    const net = this.netPortfolioValue();
    return this.state.displayCurrency() === 'THB' ? net / rate : net * rate;
  });

  readonly secondaryCurrencyLabel = computed<'USD' | 'THB'>(() =>
    this.state.displayCurrency() === 'THB' ? 'USD' : 'THB'
  );

  readonly totalInvested = computed<number>(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    const raw = data.summary?.openInvested ?? data.summary?.totalInvested ?? 0;
    return this.cx(raw, data.currency);
  });

  readonly unrealizedPL = computed<number>(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    return this.cx(data.summary?.totalUnrealizedPL ?? 0, data.currency);
  });

  readonly unrealizedPLPercent = computed<number>(
    () => this.state.portfolioData()?.summary?.totalUnrealizedPLPercent ?? 0
  );

  readonly realizedPL = computed<number>(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    return this.cx(data.summary?.totalRealizedPL ?? 0, data.currency);
  });

  readonly realizedPLPercent = computed<number>(
    () => this.state.portfolioData()?.summary?.totalRealizedPLPercent ?? 0
  );

  readonly totalReturn = computed<number>(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    const raw =
      data.summary?.totalReturn ??
      (data.summary?.totalUnrealizedPL ?? 0) + (data.summary?.totalRealizedPL ?? 0);
    return this.cx(raw, data.currency);
  });

  readonly totalReturnPercent = computed<number>(
    () => this.state.portfolioData()?.summary?.totalReturnPercent ?? 0
  );

  readonly totalLotsCount = computed<number>(() =>
    this.openPositions().reduce((acc, p) => acc + (p.lots?.length ?? 0), 0)
  );

  readonly assetAllocationList = computed<MobileAssetAllocationItem[]>(() => {
    const positions = this.openPositions();
    if (positions.length === 0) return [];

    const lang = this.state.i18n.lang();
    const order = ['us-stock', 'thai-stock', 'crypto', 'mutual-fund', 'bond', 'provident-fund'];
    const map = new Map<string, { value: number; count: number }>();

    for (const pos of positions) {
      const type = pos.assetType || getAssetType(pos.symbol);
      const val = this.cx(pos.holdingValue || pos.totalCost || 0, pos.currency || 'USD');
      const curr = map.get(type) ?? { value: 0, count: 0 };
      map.set(type, { value: curr.value + val, count: curr.count + 1 });
    }

    const totalVal = Array.from(map.values()).reduce((sum, item) => sum + item.value, 0);
    if (totalVal <= 0) return [];

    const circumference = 251.327; // 2 * pi * 40
    let cumulativePercent = 0;
    const result: MobileAssetAllocationItem[] = [];

    const sortedTypes = Array.from(map.keys()).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });

    for (const type of sortedTypes) {
      const item = map.get(type)!;
      const pct = (item.value / totalVal) * 100;
      const dashLength = (pct / 100) * circumference;
      const dashOffset = -(cumulativePercent / 100) * circumference;
      cumulativePercent += pct;

      result.push({
        type,
        label: getAssetTypeLabel(type, undefined, lang),
        color: getAssetColor(type, undefined, this.state.userSettings.resolvedTheme()),
        value: item.value,
        percentage: pct,
        symbolCount: item.count,
        dashArray: `${dashLength} ${circumference}`,
        dashOffset,
      });
    }

    return result;
  });

  readonly topGainers = computed<PortfolioPosition[]>(() => {
    return [...this.openPositions()]
      .filter((p) => (p.unrealizedPLPercent || 0) > 0)
      .sort((a, b) => (b.unrealizedPLPercent || 0) - (a.unrealizedPLPercent || 0))
      .slice(0, 4);
  });

  readonly topLosers = computed<PortfolioPosition[]>(() => {
    return [...this.openPositions()]
      .filter((p) => (p.unrealizedPLPercent || 0) < 0)
      .sort((a, b) => (a.unrealizedPLPercent || 0) - (b.unrealizedPLPercent || 0))
      .slice(0, 4);
  });

  readonly winningPositionsCount = computed<number>(
    () => this.openPositions().filter((p) => (p.unrealizedPL || 0) > 0).length
  );

  readonly losingPositionsCount = computed<number>(
    () => this.openPositions().filter((p) => (p.unrealizedPL || 0) < 0).length
  );

  readonly annualProjectedDividendConverted = computed<number>(() => {
    const div = this.state.dividendData();
    if (!div) return 0;
    return this.cx(div.projectedAnnualDividends || 0, div.currency || 'THB');
  });

  readonly portfolioYieldOnCost = computed<number>(
    () => this.state.dividendData()?.portfolioYieldOnCost ?? 0
  );

  readonly portfolioCurrentYield = computed<number>(
    () => this.state.dividendData()?.portfolioDividendYield ?? 0
  );

  readonly dividendPayingCount = computed<number>(
    () => this.state.dividendData()?.symbolSummaries?.length ?? 0
  );

  readonly pvdPositions = computed<PortfolioPosition[]>(() =>
    this.openPositions().filter((p) => getAssetType(p.assetType, p.symbol) === 'provident-fund')
  );

  readonly hasPvd = computed<boolean>(() => this.pvdPositions().length > 0);

  readonly pvdFundNames = computed<string[]>(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const pos of this.pvdPositions()) {
      const fn = (pos.pvdFundName || '').trim();
      if (fn && !seen.has(fn)) {
        seen.add(fn);
        names.push(fn);
      }
    }
    return names;
  });

  readonly pvdTotalValue = computed<number>(() =>
    this.pvdPositions().reduce(
      (acc, pos) => acc + this.cx(pos.holdingValue || pos.totalCost, pos.currency),
      0
    )
  );

  readonly pvdEmployeeContribution = computed<number>(() =>
    this.pvdPositions().reduce((acc, pos) => acc + (pos.employeeContribution || 0), 0)
  );

  readonly pvdEmployerMatching = computed<number>(() =>
    this.pvdPositions().reduce((acc, pos) => acc + (pos.employerMatching || 0), 0)
  );

  readonly recentTransactions = computed<MobileRecentTxItem[]>(() => {
    const data = this.state.portfolioData();
    if (!data) return [];

    const lang = this.state.i18n.lang();
    const pricesMap = this.state.prices();
    const items: MobileRecentTxItem[] = [];

    const hasValidSummaries = data.transactionSummaries?.some(
      (s) => getAssetType(s.assetType, s.symbol) !== 'provident-fund'
    );

    if (data.transactionSummaries && data.transactionSummaries.length > 0 && hasValidSummaries) {
      for (const sum of data.transactionSummaries) {
        if (getAssetType(sum.assetType, sum.symbol) === 'provident-fund') continue;
        for (const tx of sum.transactions || []) {
          const assetType = tx.assetType || sum.assetType;
          const symbol = tx.symbol || sum.symbol;
          if (getAssetType(assetType, symbol) === 'provident-fund') continue;
          if (!tx.quantity || tx.quantity <= 0 || !tx.date) continue;

          let t: 'BUY' | 'SELL' | 'EX-IN' | 'EX-OUT' = 'BUY';
          if (tx.type === 'SELL') t = 'SELL';
          else if (tx.type === 'EXCHANGE_IN' || tx.type === 'EXCHANGE') t = 'EX-IN';
          else if (tx.type === 'EXCHANGE_OUT') t = 'EX-OUT';
          else if (tx.type === 'BUY') t = 'BUY';
          else continue;

          const pd = pricesMap.get(symbol);
          items.push({
            id: tx.id || `tx-${symbol}-${tx.date}-${tx.quantity}`,
            date: tx.date,
            type: t,
            symbol,
            displaySymbol: displaySymbol(symbol),
            name: getSymbolName(symbol, pd?.name || '', lang, pd?.nameTh || '', assetType),
            assetType,
            quantity: tx.quantity,
            price: this.cx(tx.price, tx.currency || 'USD'),
            totalAmount: this.cx(tx.totalAmount || tx.quantity * tx.price, tx.currency || 'USD'),
            currency: this.state.displayCurrency(),
          });
        }
      }
    } else if (data.rawTransactions && data.rawTransactions.length > 0) {
      data.rawTransactions.forEach((tx, idx) => {
        if (getAssetType(tx.assetType, tx.symbol) === 'provident-fund') return;
        if (!tx.quantity || tx.quantity <= 0 || !tx.date) return;

        let t: 'BUY' | 'SELL' | 'EX-IN' | 'EX-OUT' = 'BUY';
        const rawType = (tx.txType || 'BUY').toUpperCase();
        if (rawType.includes('SELL')) t = 'SELL';
        else if (rawType.includes('IN') || rawType === 'EXCHANGE') t = 'EX-IN';
        else if (rawType.includes('OUT')) t = 'EX-OUT';
        else if (rawType.includes('BUY')) t = 'BUY';
        else return;

        const pd = pricesMap.get(tx.symbol);
        items.push({
          id: `raw-${idx}-${tx.symbol}-${tx.date}`,
          date: tx.date,
          type: t,
          symbol: tx.symbol,
          displaySymbol: displaySymbol(tx.symbol),
          name: getSymbolName(tx.symbol, pd?.name || '', lang, pd?.nameTh || '', tx.assetType),
          assetType: tx.assetType,
          quantity: tx.quantity,
          price: this.cx(tx.price, tx.currency || 'USD'),
          totalAmount: this.cx(tx.quantity * tx.price, tx.currency || 'USD'),
          currency: this.state.displayCurrency(),
        });
      });
    }

    return [...items]
      .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
      .slice(0, 5);
  });

  private cx(value: number, fromCurrency: string): number {
    if (!this.state.hasRate()) return value;
    return convertCurrency(
      value,
      fromCurrency,
      this.state.displayCurrency(),
      this.state.exchangeRate()
    );
  }

  convertedPrice(pos: PortfolioPosition): number {
    return this.cx(pos.currentPrice || 0, pos.currency || 'USD');
  }

  getUnitText(symbol?: string, assetType?: string): string {
    return getUnitLabel(symbol, assetType, this.state.i18n.lang());
  }

  getTxTypeLabel(type: 'BUY' | 'SELL' | 'EX-IN' | 'EX-OUT'): string {
    switch (type) {
      case 'BUY':
        return this.state.i18n.t('common.buy');
      case 'SELL':
        return this.state.i18n.t('common.sell');
      case 'EX-IN':
        return this.state.i18n.t('common.exIn');
      case 'EX-OUT':
        return this.state.i18n.t('common.exOut');
    }
  }

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 450);
  }

  goToHoldings(pvd = false): void {
    this.state.navigateToHoldings(pvd);
  }

  goToAnalytics(subTab: 'overview' | 'allocation' | 'performance' = 'overview'): void {
    this.state.navigateToAnalytics(subTab);
  }

  goToDividends(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    void this.router.navigateByUrl('/dividends');
  }

  goToTransactions(symbol = ''): void {
    this.state.navigateToTransactions(symbol);
  }

  goToTool(toolId: ToolId): void {
    this.state.navigateToTool(toolId);
  }

  openFactsheet(event: Event, pos: PortfolioPosition): void {
    event.stopPropagation();
    this.state.openFactsheetModal({
      symbol: pos.symbol,
      assetType: pos.assetType || 'provident-fund',
      fundName: pos.pvdFundName || undefined,
      displayName: pos.name || pos.policyName || displaySymbol(pos.symbol),
      displayNameTh: pos.nameTh || undefined,
    });
  }
}
