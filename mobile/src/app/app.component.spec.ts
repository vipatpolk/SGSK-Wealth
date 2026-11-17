import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AppComponent } from './app.component';
import { MobileStateService } from './services/mobile-state.service';
import { NativePlatformService } from './services/native-platform.service';

describe('SGSK Wealth Mobile App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideIonicAngular({ mode: 'ios' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  it('should create the Ionic AppComponent with 5 bottom tabs', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance).toBeTruthy();
    expect(el.querySelector('#mobile-tab-bar')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dashboard')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-holdings')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-analytics')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-dividends')).toBeTruthy();
    expect(el.querySelector('#mobile-tab-tools')).toBeTruthy();
  });

  it('should toggle currency, theme, privacy mode, and language via MobileStateService', () => {
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
  });

  it('should resolve web API base URL in non-native browser environment', () => {
    const nativePlatform = TestBed.inject(NativePlatformService);
    expect(nativePlatform.getPlatform()).toBe('web');
    expect(nativePlatform.resolveApiBaseUrl()).toBe('/api/backend');
  });
});
