import { CurrencyPipe, DecimalPipe } from '@angular/common';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { DateRange, DateRangePickerComponent } from '@shared/components/date-range-picker/date-range-picker.component';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { SymbolTransaction, SymbolTransactionSummary } from '@shared/models/transaction.model';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import {
  displaySymbol,
  generateAssetTypeOptions,
  getAssetType,
  getAssetTypeClass,
  getAssetTypeLabel,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  resolveSymbolName,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

export type MobileTxTypeFilter = 'all' | 'buy' | 'sell' | 'exchange';

@Component({
  selector: 'app-mobile-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    LocalizedDatePipe,
    SymbolIconComponent,
    DateRangePickerComponent,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonButton,
    IonButtons,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
  ],
  templateUrl: './mobile-transactions.page.html',
  styleUrl: './mobile-transactions.page.css',
})
export class MobileTransactionsPage {
  readonly state = inject(MobileStateService);

  readonly query = signal<string>('');
  readonly typeFilter = signal<MobileTxTypeFilter>('all');
  readonly assetFilter = signal<string>('all');
  readonly sortOrder = signal<'desc' | 'asc'>('desc');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly pageLimit = signal<number>(30);

  readonly isSymbolSheetOpen = signal<boolean>(false);
  readonly sheetSearchQuery = signal<string>('');

  readonly getSymbolColorFn = getSymbolColor;
  readonly getAssetTypeClassFn = getAssetTypeClass;
  readonly displaySymbolFn = displaySymbol;
  readonly getQuantityFormatFn = getQuantityFormat;
  readonly getPriceFormatFn = getPriceFormat;

  readonly tradeSummaries = computed<SymbolTransactionSummary[]>(() =>
    this.state.transactionSummaries().filter(
      (s) => getAssetType(s.assetType, s.symbol) !== 'provident-fund'
    )
  );

  readonly assetTypeOptions = computed(() =>
    generateAssetTypeOptions(this.tradeSummaries(), this.state.i18n.lang())
  );

  readonly filteredSummaries = computed<SymbolTransactionSummary[]>(() => {
    const af = this.assetFilter();
    const all = this.tradeSummaries();
    return af === 'all' ? all : all.filter((s) => getAssetType(s.assetType, s.symbol) === af);
  });

  readonly availableSymbols = computed(() => {
    const pm = this.state.prices();
    const q = this.sheetSearchQuery().trim().toUpperCase();
    let list = [...this.filteredSummaries()];
    if (q) {
      list = list.filter((s) => {
        const nameEn = resolveSymbolName(s.symbol, pm, 'en', s.assetType).toUpperCase();
        const nameTh = resolveSymbolName(s.symbol, pm, 'th', s.assetType).toUpperCase();
        return (
          s.symbol.toUpperCase().includes(q) ||
          displaySymbol(s.symbol).toUpperCase().includes(q) ||
          nameEn.includes(q) ||
          nameTh.includes(q)
        );
      });
    }
    return list.sort((a, b) => {
      const aOpen = a.currentStatus === 'OPEN' ? 1 : 0;
      const bOpen = b.currentStatus === 'OPEN' ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return displaySymbol(a.symbol).localeCompare(displaySymbol(b.symbol));
    });
  });

  readonly activeSummary = computed<SymbolTransactionSummary | null>(() => {
    const sym = this.state.selectedHistorySymbol();
    if (!sym) return null;
    return this.tradeSummaries().find((s) => s.symbol === sym) ?? null;
  });

  readonly activeHoldingValueConverted = computed<number>(() => {
    const s = this.activeSummary();
    if (!s || s.netShares <= 0) return 0;
    const pd = this.state.prices().get(s.symbol);
    if (!pd || pd.price <= 0) return 0;
    return this.state.cx(s.netShares * pd.price, pd.currency || s.currency);
  });

  readonly activeUnrealizedPL = computed<number>(() => {
    const s = this.activeSummary();
    if (!s || s.netShares <= 0) return 0;
    const mkt = this.activeHoldingValueConverted();
    if (mkt <= 0) return 0;
    return mkt - this.state.cx(s.netInvested, s.currency);
  });

  readonly activeUnrealizedPLPct = computed<number>(() => {
    const s = this.activeSummary();
    if (!s || s.netInvested <= 0) return 0;
    const cost = this.state.cx(s.netInvested, s.currency);
    return cost !== 0 ? (this.activeUnrealizedPL() / cost) * 100 : 0;
  });

  readonly allSymbolsRealizedPL = computed<number>(() =>
    this.filteredSummaries().reduce((sum, s) => sum + this.state.cx(s.realizedPL, s.currency), 0)
  );

  readonly allSymbolsTradedVolume = computed<number>(() =>
    this.filteredSummaries().reduce(
      (sum, s) => sum + this.state.cx(s.totalBuyAmount + s.totalSellAmount, s.currency),
      0
    )
  );

  readonly totalTxCount = computed<number>(() => {
    const active = this.activeSummary();
    if (active) return active.totalTransactions;
    return this.filteredSummaries().reduce((sum, s) => sum + s.totalTransactions, 0);
  });

  readonly baseTransactions = computed<SymbolTransaction[]>(() => {
    const active = this.activeSummary();
    let txs: SymbolTransaction[] = active
      ? [...active.transactions]
      : this.filteredSummaries().flatMap((s) => s.transactions);

    const start = this.startDate().trim();
    const end = this.endDate().trim();
    if (start) txs = txs.filter((t) => (t.date ? t.date >= start : true));
    if (end) txs = txs.filter((t) => (t.date ? t.date <= end : true));

    const q = this.query().trim().toUpperCase();
    if (q) {
      txs = txs.filter(
        (t) =>
          t.symbol.toUpperCase().includes(q) ||
          displaySymbol(t.symbol).toUpperCase().includes(q)
      );
    }

    return txs;
  });

  readonly buyCount = computed(() => this.baseTransactions().filter((t) => t.type === 'BUY').length);
  readonly sellCount = computed(() => this.baseTransactions().filter((t) => t.type === 'SELL').length);
  readonly exchangeCount = computed(
    () =>
      this.baseTransactions().filter(
        (t) =>
          t.type === 'EXCHANGE' ||
          t.type === 'EXCHANGE_IN' ||
          t.type === 'EXCHANGE_OUT' ||
          !!t.exchangeFrom ||
          !!t.exchangeTo
      ).length
  );

  readonly filteredTransactions = computed<SymbolTransaction[]>(() => {
    let txs = [...this.baseTransactions()];
    const tf = this.typeFilter();
    if (tf === 'buy') txs = txs.filter((t) => t.type === 'BUY');
    else if (tf === 'sell') txs = txs.filter((t) => t.type === 'SELL');
    else if (tf === 'exchange') {
      txs = txs.filter(
        (t) =>
          t.type === 'EXCHANGE' ||
          t.type === 'EXCHANGE_IN' ||
          t.type === 'EXCHANGE_OUT' ||
          !!t.exchangeFrom ||
          !!t.exchangeTo
      );
    }

    const order = this.sortOrder();
    txs.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return order === 'desc' ? -cmp : cmp;
    });
    return txs;
  });

  readonly visibleTransactions = computed(() =>
    this.filteredTransactions().slice(0, this.pageLimit())
  );

  getAssetLabel(assetType?: string, symbol?: string): string {
    return getAssetTypeLabel(assetType, symbol, this.state.i18n.lang());
  }

  getResolvedSymbolName(symbol: string, assetType?: string): string {
    return resolveSymbolName(symbol, this.state.prices(), this.state.i18n.lang(), assetType);
  }

  openSymbolSheet(): void {
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.sheetSearchQuery.set('');
    this.isSymbolSheetOpen.set(true);
  }

  closeSymbolSheet(): void {
    this.isSymbolSheetOpen.set(false);
  }

  selectSymbol(symbol: string): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.state.selectedHistorySymbol.set(symbol);
    this.query.set('');
    this.typeFilter.set('all');
    this.pageLimit.set(30);
    this.isSymbolSheetOpen.set(false);
  }

  clearSymbol(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.state.selectedHistorySymbol.set('');
    this.typeFilter.set('all');
    this.pageLimit.set(30);
    this.isSymbolSheetOpen.set(false);
  }

  onSearch(event: CustomEvent): void {
    const val = event.detail.value ?? '';
    this.query.set(val);
    this.pageLimit.set(30);
  }

  setTypeFilter(t: MobileTxTypeFilter): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.typeFilter.set(t);
    this.pageLimit.set(30);
  }

  onDateRangeChange(range: DateRange): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
    this.pageLimit.set(30);
  }

  toggleSortOrder(): void {
    void this.state.nativePlatform.triggerHapticSelection();
    this.sortOrder.update((o) => (o === 'desc' ? 'asc' : 'desc'));
  }

  loadMore(): void {
    this.pageLimit.update((n) => n + 30);
  }

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 450);
  }
}
