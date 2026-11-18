import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';
import { resolveIonicMode } from './app.config';
import { MobileStateService } from './services/mobile-state.service';
import { NativePlatformService } from './services/native-platform.service';

describe('SGSK Wealth Mobile App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
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
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  it('should create the Ionic AppComponent with 6 bottom tabs and header controls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(el.querySelector('#mobile-header')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-bar')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dashboard')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-holdings')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-analytics')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dividends')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-transactions')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-tools')).toBeTruthy();
    expect(el.querySelector('#mobile-currency-toggle')).toBeTruthy();
    expect(el.querySelector('#mobile-lang-toggle')).toBeTruthy();
    expect(el.querySelector('#mobile-privacy-toggle')).toBeTruthy();
    expect(el.querySelector('#mobile-theme-toggle')).toBeTruthy();
    expect(el.querySelector('#mobile-refresh-btn')).toBeTruthy();
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
});
