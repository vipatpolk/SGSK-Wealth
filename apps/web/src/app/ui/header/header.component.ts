import { Component, ElementRef, input, output, signal, computed, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '@shared/services/auth.service';
import { SheetResult } from '@shared/services/share-lot.service';
import { PortfolioHoldingsResponse } from '@shared/models/portfolio.model';
import { PortfolioDividendResponse } from '@shared/models/dividend.model';
import { AppView } from '@shared/config/asset.constants';
import { AppLang, I18nService } from '@shared/services/i18n.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { TranslationKey } from '@shared/i18n/en';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  loading = input.required<boolean>();
  error = input.required<string | null>();
  result = input.required<SheetResult | null>();
  portfolioData = input<PortfolioHoldingsResponse | null>(null);
  dividendData = input<PortfolioDividendResponse | null>(null);
  hasRate = input.required<boolean>();
  exchangeRate = input.required<number>();
  currentView = input.required<AppView>();
  displayCurrency = input<string>('THB');
  privacyMode = input<boolean>(false);
  lang = input<AppLang | undefined>(undefined);
  sidebarCollapsed = input<boolean>(false);

  readonly activeLang = computed<AppLang>(() => this.lang() ?? this.i18n.lang());

  readonly activeViewLabelKey = computed<TranslationKey>(() => {
    switch (this.currentView()) {
      case 'dashboard':
        return 'nav.dashboard';
      case 'holdings':
        return 'nav.holdings';
      case 'analytics':
      case 'allocation':
      case 'performance':
        return 'nav.analytics';
      case 'dividends':
        return 'nav.dividends';
      case 'transactions':
        return 'nav.transactions';
      case 'tools':
        return 'nav.tools';
      default:
        return 'nav.dashboard';
    }
  });

  viewChange = output<AppView>();
  currencyChange = output<'THB' | 'USD'>();
  langChange = output<AppLang>();
  privacyChange = output<void>();
  openUserSettings = output<void>();
  openLocalPortfolio = output<void>();
  openSignIn = output<void>();
  signOut = output<void>();
  sidebarCollapseToggle = output<void>();

  readonly userInitial = computed(() => {
    const label = this.authService.displayName().trim() || this.authService.userEmail() || 'G';
    return label.charAt(0).toUpperCase();
  });

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
  isUserMenuOpen = signal(false);

  toggleViewDropdown() {
    this.isViewDropdownOpen.update(v => !v);
    if (this.isViewDropdownOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  closeSideNav() {
    this.isViewDropdownOpen.set(false);
  }

  toggleUserMenu(event?: MouseEvent) {
    event?.stopPropagation();
    this.isUserMenuOpen.update(v => !v);
    if (this.isUserMenuOpen()) {
      this.isViewDropdownOpen.set(false);
    }
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  triggerOpenSettings() {
    this.closeUserMenu();
    this.openUserSettings.emit();
  }

  triggerOpenLocalPortfolio() {
    this.closeUserMenu();
    this.openLocalPortfolio.emit();
  }

  triggerOpenSignIn() {
    this.closeUserMenu();
    this.openSignIn.emit();
  }

  triggerSignOut() {
    this.closeUserMenu();
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isUserMenuOpen()) return;
    const target = event.target as Node | null;
    const menuWrapper = this.elementRef.nativeElement.querySelector('.user-menu-wrapper');
    if (menuWrapper && target && !menuWrapper.contains(target)) {
      this.closeUserMenu();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.isViewDropdownOpen()) {
      this.closeSideNav();
    }
    if (this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }

  selectView(view: AppView) {
    this.viewChange.emit(view);
    this.closeSideNav();
  }
}
