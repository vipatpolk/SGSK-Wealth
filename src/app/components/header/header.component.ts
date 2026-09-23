import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { SheetResult } from '../../services/share-lot.service';
import { PortfolioHoldingsResponse } from '../../models/portfolio.model';
import { PortfolioDividendResponse } from '../../models/dividend.model';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  loading = input.required<boolean>();
  error = input.required<string | null>();
  result = input.required<SheetResult | null>();
  portfolioData = input<PortfolioHoldingsResponse | null>(null);
  dividendData = input<PortfolioDividendResponse | null>(null);
  totalCostConverted = input.required<number>();
  totalProceedsConverted = input.required<number>();
  totalPL = input.required<number>();
  totalPLPercent = input.required<number>();
  isClosedTab = input.required<boolean>();
  isAllTab = input.required<boolean>();
  isProvidentFundTab = input<boolean>(false);
  totalHoldingConverted = input.required<number>();
  totalRealizedPLConverted = input.required<number>();
  totalRealizedPLPercent = input.required<number>();
  hasRate = input.required<boolean>();
  exchangeRate = input.required<number>();
  currentView = input.required<'holdings' | 'transactions' | 'allocation' | 'performance' | 'dividends' | 'tools'>();
  displayCurrency = input.required<string>();
  theme = input.required<string>();
  privacyMode = input<boolean>(false);

  viewChange = output<'holdings' | 'transactions' | 'allocation' | 'performance' | 'dividends' | 'tools'>();
  currencyChange = output<'USD' | 'THB'>();
  themeChange = output<void>();
  privacyChange = output<void>();

  // Page-specific computed meta stats
  readonly openPositions = computed(() => this.portfolioData()?.openPositions || []);
  readonly gainersCount = computed(() => this.openPositions().filter(p => (p.unrealizedPL || 0) > 0).length);
  readonly losersCount = computed(() => this.openPositions().filter(p => (p.unrealizedPL || 0) < 0).length);
  readonly distinctAssetClassesCount = computed(() => {
    const types = new Set(this.openPositions().map(p => p.assetType));
    return types.size > 0 ? types.size : 3;
  });
  readonly totalTransactionsCount = computed(() => {
    return this.portfolioData()?.rawTransactions?.length ||
           this.result()?.rawTransactions?.length ||
           this.result()?.transactionSummaries?.length || 0;
  });
  readonly dividendPayingAssetsCount = computed(() => {
    return this.dividendData()?.symbolSummaries?.length || 0;
  });
  readonly dividendDistributionsCount = computed(() => {
    return this.dividendData()?.records?.length || 0;
  });
  readonly dividendYOC = computed(() => {
    return this.dividendData()?.portfolioYieldOnCost || 0;
  });

  dc(originalCurrency?: string): string {
    if (!this.hasRate() && originalCurrency) {
      return originalCurrency === 'USDT' ? 'USD' : originalCurrency;
    }
    return this.displayCurrency();
  }

  isViewDropdownOpen = signal(false);

  toggleViewDropdown() {
    this.isViewDropdownOpen.update(v => !v);
  }

  selectView(view: 'holdings' | 'transactions' | 'allocation' | 'performance' | 'dividends' | 'tools') {
    this.viewChange.emit(view);
    this.isViewDropdownOpen.set(false);
  }
}
