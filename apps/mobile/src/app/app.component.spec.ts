import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { AuthService } from '@shared/services/auth.service';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { resolveIonicMode } from './app.config';
import { MobileAuthModalComponent } from './modals/auth-modal/mobile-auth-modal.component';
import { MobileStateService } from './services/mobile-state.service';
import { NativePlatformService } from './services/native-platform.service';

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, String(value)),
  } as Storage);
}

describe('SGSK Wealth Mobile App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    installMemoryLocalStorage();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideIonicAngular({ mode: 'ios' }),
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    const authService = TestBed.inject(AuthService);
    authService.session.set(null);
    authService.canViewCloudPortfolio.set(false);
    authService.initialized.set(true);
    authService.isGuestDismissed.set(true);
  });

  afterEach(() => {
    httpMock.match(() => true);
    TestBed.inject(LocalPortfolioService).clearAll();
    vi.unstubAllGlobals();
  });

  it('should create the Ionic AppComponent with 6 bottom tabs, top-bar currency/lang/privacy controls, and user menu button', () => {
    const state = TestBed.inject(MobileStateService);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(el.querySelector('#mobile-header')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-bar')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dashboard svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-holdings svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-analytics svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dividends svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-transactions svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-tools svg.nav-icon-svg')).toBeTruthy();

    const currencyBtn = el.querySelector('#mobile-currency-toggle') as HTMLButtonElement;
    const langBtn = el.querySelector('#mobile-lang-toggle') as HTMLButtonElement;
    expect(currencyBtn).toBeTruthy();
    expect(langBtn).toBeTruthy();
    expect(el.querySelector('#mobile-theme-toggle')).toBeNull();
    expect(el.querySelector('#mobile-privacy-toggle svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-refresh-btn svg.nav-icon-svg')).toBeTruthy();
    expect(el.querySelector('#mobile-user-menu-btn')).toBeTruthy();
    expect(el.querySelector('#mobile-local-banner')).toBeTruthy();

    currencyBtn.click();
    expect(state.displayCurrency()).toBe('USD');
    langBtn.click();
    expect(state.i18n.lang()).toBe('th');
  });

  it('should open user settings, auth gate, and local portfolio modals cleanly and hide local banner for owner', () => {
    const state = TestBed.inject(MobileStateService);
    const auth = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    state.openUserSettings();
    expect(state.isUserSettingsOpen()).toBe(true);
    state.closeUserSettings();
    expect(state.isUserSettingsOpen()).toBe(false);

    state.openLocalPortfolio();
    expect(state.isLocalPortfolioOpen()).toBe(true);
    state.closeLocalPortfolio();
    expect(state.isLocalPortfolioOpen()).toBe(false);

    auth.isGuestDismissed.set(false);
    expect(state.shouldShowAuthGate()).toBe(true);

    auth.session.set({
      access_token: 'owner-tok',
      user: { id: 'o1', email: 'vipatpolk@gmail.com' },
    } as any);
    auth.canViewCloudPortfolio.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#mobile-local-banner')).toBeNull();
  });

  it('should resolve platform-adaptive Ionic mode dynamically', () => {
    expect(resolveIonicMode('android', '', '')).toBe('md');
    expect(resolveIonicMode('ios', '', '')).toBe('ios');
    expect(resolveIonicMode('web', '', '')).toBe('ios');
    expect(resolveIonicMode('web', '?ionic:mode=md', '')).toBe('md');
    expect(resolveIonicMode('web', '?ionic:mode=ios', 'Android')).toBe('ios');
    expect(resolveIonicMode('web', '', 'Mozilla/5.0 (Linux; Android 15)')).toBe('md');
  });

  it('should toggle currency, theme, privacy mode, language and deep-link helpers via MobileStateService', () => {
    const state = TestBed.inject(MobileStateService);
    expect(state.displayCurrency()).toBe('THB');
    state.toggleCurrency();
    expect(state.displayCurrency()).toBe('USD');

    expect(state.theme()).toBe('dark');
    state.toggleTheme();
    expect(state.theme()).toBe('light');

    expect(state.privacyMode()).toBe(false);
    state.togglePrivacyMode();
    expect(state.privacyMode()).toBe(true);

    expect(state.i18n.lang()).toBe('en');
    state.toggleLang();
    expect(state.i18n.lang()).toBe('th');

    state.navigateToHoldings(true);
    expect(state.holdingsSubTab()).toBe('pvd');
    state.navigateToAnalytics('performance');
    expect(state.analyticsSubTab()).toBe('performance');
    state.navigateToTransactions('AAPL');
    expect(state.selectedHistorySymbol()).toBe('AAPL');
    state.navigateToTool('tvm-calculator');
    expect(state.selectedToolId()).toBe('tvm-calculator');
  });

  it('should resolve the browser API base URL in non-native environment', () => {
    const nativePlatform = TestBed.inject(NativePlatformService);
    expect(nativePlatform.getPlatform()).toBe('web');
    expect(nativePlatform.resolveApiBaseUrl()).toBe('/api/backend');
  });

  it('should reopen user settings on pendingSettingsReopen and safely handle native auth helpers on web', async () => {
    const state = TestBed.inject(MobileStateService);
    const auth = TestBed.inject(AuthService);
    const nativePlatform = TestBed.inject(NativePlatformService);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(state.isUserSettingsOpen()).toBe(false);
    auth.pendingSettingsReopen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(state.isUserSettingsOpen()).toBe(true);
    expect(auth.pendingSettingsReopen()).toBe(false);

    expect(await nativePlatform.getInitialAuthUrl()).toBeNull();
    await expect(nativePlatform.closeExternalAuthUrl()).resolves.toBeUndefined();
  });

  it('should switch language between EN and TH inside MobileAuthModalComponent', () => {
    const authFixture = TestBed.createComponent(MobileAuthModalComponent);
    const authModal = authFixture.componentInstance;
    const state = TestBed.inject(MobileStateService);

    authModal.setLanguage('th');
    expect(authModal.i18n.lang()).toBe('th');
    expect(state.i18n.lang()).toBe('th');

    authModal.setLanguage('en');
    expect(authModal.i18n.lang()).toBe('en');
    expect(state.i18n.lang()).toBe('en');
  });
});
