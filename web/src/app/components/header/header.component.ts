import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SheetResult } from '../../services/share-lot.service';
import { PortfolioHoldingsResponse } from '../../models/portfolio.model';
import { PortfolioDividendResponse } from '../../models/dividend.model';
import { AppView } from '../../config/asset.constants';
import { AppLang, I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);

  loading = input.required<boolean>();
  error = input.required<string | null>();
  result = input.required<SheetResult | null>();
  portfolioData = input<PortfolioHoldingsResponse | null>(null);
  dividendData = input<PortfolioDividendResponse | null>(null);
  hasRate = input.required<boolean>();
  exchangeRate = input.required<number>();
  currentView = input.required<AppView>();
  displayCurrency = input.required<string>();
  theme = input.required<string>();
  privacyMode = input<boolean>(false);
  lang = input<AppLang | undefined>(undefined);

  readonly activeLang = computed<AppLang>(() => this.lang() ?? this.i18n.lang());

  viewChange = output<AppView>();
  currencyChange = output<'USD' | 'THB'>();
  langChange = output<AppLang>();
  themeChange = output<void>();
  privacyChange = output<void>();

  selectLang(nextLang: AppLang): void {
    this.i18n.setLang(nextLang);
    this.langChange.emit(nextLang);
  }

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

  closeSideNav() {
    this.isViewDropdownOpen.set(false);
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.isViewDropdownOpen()) {
      this.closeSideNav();
    }
  }

  selectView(view: AppView) {
    this.viewChange.emit(view);
    this.closeSideNav();
  }
}
