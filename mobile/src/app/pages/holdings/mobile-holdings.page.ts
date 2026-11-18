import { CurrencyPipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
} from '@ionic/angular';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { AssetTab, HoldingsSubTab } from '@shared/config/asset.constants';
import { ClosedPortfolioPosition, PortfolioPosition } from '@shared/models/portfolio.model';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import {
  generateAssetTypeOptions,
  getAssetType,
  getAssetTypeClass,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  getUnitLabel,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';
import { MobilePvdHoldingsComponent } from './components/mobile-pvd-holdings.component';

@Component({
  selector: 'app-mobile-holdings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgTemplateOutlet,
    TranslatePipe,
    LocalizedDatePipe,
    SymbolIconComponent,
    MobilePvdHoldingsComponent,
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
  ],
  templateUrl: './mobile-holdings.page.html',
  styleUrl: './mobile-holdings.page.css',
})
export class MobileHoldingsPage {
  readonly state = inject(MobileStateService);

  readonly searchQuery = signal<string>('');
  readonly sortField = signal<string>('totalCost');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly selectedClosedAssetType = signal<string>('all');
  readonly expandedSymbols = signal<Set<string>>(new Set());

  readonly getSymbolColorFn = getSymbolColor;
  readonly getAssetTypeClassFn = getAssetTypeClass;

  readonly marketTabs = computed(() =>
    this.state.tabs.filter((t) => t.id !== 'provident-fund')
  );

  readonly closedAssetTypeOptions = computed(() => {
    const list = this.state.portfolioData()?.closedPositions ?? [];
    return generateAssetTypeOptions(list, this.state.i18n.lang());
  });

  readonly sortOptions = computed(() => {
    this.state.i18n.lang();
    if (this.state.isClosedTab()) {
      return [
        { field: 'symbol', label: this.state.i18n.t('common.symbol') },
        { field: 'pl', label: this.state.i18n.t('holdings.sort.realizedPlPct') },
        { field: 'realizedPL', label: this.state.i18n.t('holdings.sort.realizedPlAmt') },
        { field: 'totalCost', label: this.state.i18n.t('common.totalCost') },
        { field: 'totalProceeds', label: this.state.i18n.t('summary.totalProceeds') },
        { field: 'closedShares', label: this.state.i18n.t('holdings.sort.closedShares') },
      ];
    }
    return [
      { field: 'symbol', label: this.state.i18n.t('common.symbol') },
      { field: 'totalCost', label: this.state.i18n.t('common.totalCost') },
      { field: 'avgCost', label: this.state.i18n.t('common.avgCost') },
      { field: 'holdingValue', label: this.state.i18n.t('summary.holdingValue') },
      { field: 'pl', label: this.state.i18n.t('holdings.sort.plPctShort') },
    ];
  });

  readonly filteredOpen = computed<PortfolioPosition[]>(() => {
    const list = this.state.localizedPortfolioData()?.openPositions ?? [];
    const q = this.searchQuery().trim().toUpperCase();
    const filtered = q
      ? list.filter(
          (p) =>
            p.symbol.toUpperCase().includes(q) ||
            p.displaySymbol.toUpperCase().includes(q) ||
            p.name.toUpperCase().includes(q) ||
            (p.nameTh || '').toUpperCase().includes(q)
        )
      : [...list];

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return filtered.sort((a, b) => {
      if (field === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
      if (field === 'avgCost') return dir * (a.averageCost - b.averageCost);
      if (field === 'holdingValue') return dir * (a.holdingValue - b.holdingValue);
      if (field === 'pl') return dir * (a.unrealizedPLPercent - b.unrealizedPLPercent);
      return dir * (a.totalCost - b.totalCost);
    });
  });

  readonly filteredClosed = computed<ClosedPortfolioPosition[]>(() => {
    let list = [...this.state.getClosedPositions()];
    const typeFilter = this.selectedClosedAssetType();
    if (this.state.isClosedTab() && typeFilter !== 'all') {
      list = list.filter((c) => getAssetType(c.assetType, c.symbol) === typeFilter);
    }
    const q = this.searchQuery().trim().toUpperCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.symbol.toUpperCase().includes(q) ||
          p.displaySymbol.toUpperCase().includes(q) ||
          p.name.toUpperCase().includes(q) ||
          (p.nameTh || '').toUpperCase().includes(q)
      );
    }

    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (field === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
      if (field === 'pl') return dir * (a.realizedPLPercent - b.realizedPLPercent);
      if (field === 'realizedPL') return dir * (a.realizedPL - b.realizedPL);
      if (field === 'totalProceeds') return dir * (a.totalProceeds - b.totalProceeds);
      if (field === 'closedShares') return dir * (a.closedShares - b.closedShares);
      return dir * (a.totalCost - b.totalCost);
    });
  });

  readonly allExpanded = computed<boolean>(() => {
    const open = this.filteredOpen();
    if (open.length === 0) return false;
    const set = this.expandedSymbols();
    return open.every((p) => set.has(p.symbol));
  });

  getTabLabel(tab: AssetTab): string {
    switch (tab.id) {
      case 'all':
        return this.state.i18n.t('tab.allHoldings');
      case 'us-stock':
        return this.state.i18n.t('tab.usStock');
      case 'thai-stock':
        return this.state.i18n.t('tab.thaiStock');
      case 'mutual-fund':
        return this.state.i18n.t('tab.mutualFund');
      case 'crypto':
        return this.state.i18n.t('tab.crypto');
      case 'bond':
        return this.state.i18n.t('tab.bond');
      case 'provident-fund':
        return this.state.i18n.t('tab.pvd');
      case 'closed-position':
        return this.state.i18n.t('tab.closed');
      default:
        return tab.label;
    }
  }

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 450);
  }

  onSubTabChange(event: CustomEvent): void {
    const next = (event.detail.value as HoldingsSubTab) || 'market';
    void this.state.nativePlatform.triggerHapticSelection();
    this.state.selectHoldingsSubTab(next);
  }

  selectAssetTab(tab: AssetTab): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.state.selectTab(tab);
  }

  toggleSortDirection(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  toggleExpand(symbol: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    const next = new Set(this.expandedSymbols());
    if (next.has(symbol)) {
      next.delete(symbol);
    } else {
      next.add(symbol);
    }
    this.expandedSymbols.set(next);
  }

  toggleExpandAll(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    if (this.allExpanded()) {
      this.expandedSymbols.set(new Set());
    } else {
      this.expandedSymbols.set(new Set(this.filteredOpen().map((p) => p.symbol)));
    }
  }

  isExpanded(symbol: string): boolean {
    return this.expandedSymbols().has(symbol);
  }

  canViewFactsheet(pos: PortfolioPosition): boolean {
    const t = getAssetType(pos.assetType, pos.symbol);
    return t === 'mutual-fund' || t === 'provident-fund';
  }

  qtyFmt(symbol: string, assetType: string): string {
    return getQuantityFormat(symbol, assetType);
  }

  priceFmt(symbol: string, assetType: string): string {
    return getPriceFormat(symbol, assetType);
  }

  getUnitText(symbol: string, assetType: string): string {
    return getUnitLabel(symbol, assetType, this.state.i18n.lang());
  }

  openHistory(event: Event, symbol: string): void {
    event.stopPropagation();
    this.state.navigateToTransactions(symbol);
  }

  openFactsheet(event: Event, pos: PortfolioPosition): void {
    event.stopPropagation();
    this.state.openFactsheetModal({
      symbol: pos.symbol,
      assetType: pos.assetType,
      fundName: pos.pvdFundName || pos.name,
      displayName: pos.name,
      displayNameTh: pos.nameTh,
    });
  }
}
