import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPABASE_CONFIG, SupabaseAppConfig } from '@shared/config/supabase-config.token';
import {
  AUTH_LINK_PENDING_KEY,
  AuthService,
  GUEST_MODE_STORAGE_KEY,
} from '@shared/services/auth.service';
import { I18nService } from '@shared/services/i18n.service';
import {
  LOCAL_TRANSACTIONS_STORAGE_KEY,
  LocalPortfolioService,
} from '@shared/services/local-portfolio.service';
import {
  CURRENCY_STORAGE_KEY,
  PRIVACY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  UserSettingsService,
} from '@shared/services/user-settings.service';

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  vi.stubGlobal('localStorage', mockStorage);
  return mockStorage;
}

describe('User System Shared Services', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('AuthService', () => {
    it('defaults to initialized local guest mode when SUPABASE_CONFIG is omitted', async () => {
      TestBed.configureTestingModule({});
      const auth = TestBed.inject(AuthService);

      await auth.initialize();
      expect(auth.initialized()).toBe(true);
      expect(auth.isConfigured).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.activeDataSource()).toBe('local');
    });

    it('computes activeDataSource and canUnlinkGoogle from session & identities', async () => {
      TestBed.configureTestingModule({});
      const auth = TestBed.inject(AuthService);

      expect(auth.activeDataSource()).toBe('local');
      expect(auth.canUnlinkGoogle()).toBe(false);

      auth.session.set({
        access_token: 'tok-1',
        user: { id: 'u-1', email: 'vipatpolk@gmail.com' },
      } as any);
      auth.canViewCloudPortfolio.set(true);
      expect(auth.activeDataSource()).toBe('cloud');
      expect(auth.displayName()).toBe('vipatpolk');

      auth.identities.set([{ identityId: 'id-g', provider: 'google', email: 'v@g.com', createdAt: null }]);
      expect(auth.hasGoogleLinked()).toBe(true);
      expect(auth.canUnlinkGoogle()).toBe(false);

      auth.identities.set([
        { identityId: 'id-g', provider: 'google', email: 'v@g.com', createdAt: null },
        { identityId: 'id-e', provider: 'email', email: 'v@g.com', createdAt: null },
      ]);
      expect(auth.canUnlinkGoogle()).toBe(true);

      localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
      await auth.signOut();
      expect(auth.isAuthenticated()).toBe(false);
    });

    function createConfiguredAuth(overrides: Partial<SupabaseAppConfig> = {}) {
      const mockAuth = {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/auth' }, error: null }),
        linkIdentity: vi.fn().mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/link' }, error: null }),
        unlinkIdentity: vi.fn().mockResolvedValue({ data: null, error: null }),
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUserIdentities: vi.fn().mockResolvedValue({ data: { identities: [] }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockClient = {
        auth: mockAuth,
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      const config: SupabaseAppConfig = {
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_test',
        redirectUrl: 'http://localhost:4200/auth/callback',
        ...overrides,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: SUPABASE_CONFIG, useValue: config }],
      });
      const auth = TestBed.inject(AuthService);
      vi.spyOn(auth as unknown as { ensureClient: () => Promise<unknown> }, 'ensureClient').mockResolvedValue(mockClient);
      return { auth, mockAuth, mockClient, config };
    }

    it('blocks Google Sign-In and Link when /auth/v1/settings reports google disabled without redirecting', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ external: { google: false, email: true } }),
        })
      );
      const { auth, mockAuth } = createConfiguredAuth();

      const signInRes = await auth.signInWithGoogle();
      expect(signInRes.ok).toBe(false);
      expect(signInRes.error).toContain('Google sign-in is not enabled on Supabase');
      expect(mockAuth.signInWithOAuth).not.toHaveBeenCalled();

      auth.session.set({
        access_token: 'tok-1',
        user: { id: 'u-1', email: 'vipatpolk@gmail.com' },
      } as any);
      const linkRes = await auth.linkGoogleAccount();
      expect(linkRes.ok).toBe(false);
      expect(linkRes.error).toContain('Google sign-in is not enabled on Supabase');
      expect(mockAuth.linkIdentity).not.toHaveBeenCalled();
      expect(localStorage.getItem(AUTH_LINK_PENDING_KEY)).toBeNull();
    });

    it('blocks web Google Sign-In inside embedded Electron browsers with actionable guidance', async () => {
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Code/1.147.0 Electron/43.8.9 Safari/537.36'
      );
      const { auth, mockAuth } = createConfiguredAuth({ isNative: false });

      const res = await auth.signInWithGoogle();
      expect(res.ok).toBe(false);
      expect(res.error).toContain('embedded IDE browsers');
      expect(mockAuth.signInWithOAuth).not.toHaveBeenCalled();
    });

    it('passes prompt=select_account and uses openExternalUrl with skipBrowserRedirect on native', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ external: { google: true, email: true } }),
        })
      );
      const openExternalUrl = vi.fn().mockResolvedValue(undefined);
      const { auth, mockAuth } = createConfiguredAuth({
        isNative: true,
        redirectUrl: 'com.sgsk.wealth.mobile://auth/callback',
        openExternalUrl,
      });

      const res = await auth.signInWithGoogle();
      expect(res.ok).toBe(true);
      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'com.sgsk.wealth.mobile://auth/callback',
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });
      expect(openExternalUrl).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth');
    });

    it('maps manual_linking_disabled to friendly message and clears pending link flag', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ external: { google: true, email: true } }),
        })
      );
      const { auth, mockAuth } = createConfiguredAuth();
      auth.session.set({
        access_token: 'tok-1',
        user: { id: 'u-1', email: 'vipatpolk@gmail.com' },
      } as any);
      mockAuth.linkIdentity.mockResolvedValue({
        data: null,
        error: { message: 'Manual linking is disabled', code: 'manual_linking_disabled' },
      });

      const res = await auth.linkGoogleAccount();
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Manual Linking');
      expect(localStorage.getItem(AUTH_LINK_PENDING_KEY)).toBeNull();
    });

    it('preserves link callback error on existing session, deduplicates PKCE codes, and handles cold-start URLs', async () => {
      const closeExternalUrl = vi.fn().mockResolvedValue(undefined);
      const existingSession = {
        access_token: 'existing-tok',
        user: { id: 'u-1', email: 'vipatpolk@gmail.com' },
      } as any;
      const getInitialAuthUrl = vi
        .fn()
        .mockResolvedValue(
          'com.sgsk.wealth.mobile://auth/callback?error=access_denied&error_description=User+denied+access'
        );

      const { auth, mockAuth } = createConfiguredAuth({
        isNative: true,
        closeExternalUrl,
        getInitialAuthUrl,
      });
      localStorage.setItem(AUTH_LINK_PENDING_KEY, 'true');
      mockAuth.getSession.mockResolvedValue({ data: { session: existingSession }, error: null });

      await auth.initialize();

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.authError()).toBe('Google authentication was cancelled.');
      expect(auth.pendingSettingsReopen()).toBe(true);
      expect(closeExternalUrl).toHaveBeenCalled();
      expect(localStorage.getItem(AUTH_LINK_PENDING_KEY)).toBeNull();

      auth.consumePendingSettingsReopen();
      expect(auth.pendingSettingsReopen()).toBe(false);

      // Now test successful PKCE link callback & deduplication
      localStorage.setItem(AUTH_LINK_PENDING_KEY, 'true');
      mockAuth.exchangeCodeForSession.mockResolvedValue({
        data: { session: existingSession },
        error: null,
      });

      const first = await auth.handleAuthCallbackUrl(
        'com.sgsk.wealth.mobile://auth/callback?code=pkce-code-123'
      );
      const duplicate = await auth.handleAuthCallbackUrl(
        'com.sgsk.wealth.mobile://auth/callback?code=pkce-code-123'
      );

      expect(first).toEqual({ ok: true, linkedGoogle: true });
      expect(duplicate).toEqual({ ok: true });
      expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
      expect(auth.authNotice()).toBe('Google account linked successfully.');
      expect(auth.pendingSettingsReopen()).toBe(true);
    });
  });

  describe('UserSettingsService', () => {
    it('updates currency, language, theme, and privacy DOM attributes and persists locally', () => {
      TestBed.configureTestingModule({});
      const settings = TestBed.inject(UserSettingsService);
      const i18n = TestBed.inject(I18nService);

      settings.setCurrency('USD', false);
      expect(settings.displayCurrency()).toBe('USD');
      expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('USD');

      settings.setLang('th', false);
      expect(i18n.lang()).toBe('th');

      settings.setTheme('light', false);
      expect(settings.theme()).toBe('light');
      expect(settings.resolvedTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

      // System theme resolves from prefers-color-scheme and reacts live
      let changeListener: ((ev: MediaQueryListEvent) => void) | undefined;
      let prefersDark = false;
      vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
        get matches() {
          return prefersDark;
        },
        media: '(prefers-color-scheme: dark)',
        addEventListener: (_ev: string, cb: (ev: MediaQueryListEvent) => void) => {
          changeListener = cb;
        },
        removeEventListener: vi.fn(),
      })));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const systemSettings = TestBed.inject(UserSettingsService);
      systemSettings.setTheme('system', false);
      expect(systemSettings.theme()).toBe('system');
      expect(systemSettings.resolvedTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('system');

      prefersDark = true;
      changeListener?.({ matches: true } as MediaQueryListEvent);
      expect(systemSettings.resolvedTheme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      systemSettings.toggleTheme();
      expect(systemSettings.theme()).toBe('light');
      expect(systemSettings.resolvedTheme()).toBe('light');

      settings.setPrivacyMode(true, false);
      expect(settings.privacyMode()).toBe(true);
      expect(document.documentElement.getAttribute('data-privacy')).toBe('true');
      expect(localStorage.getItem(PRIVACY_STORAGE_KEY)).toBe('true');
    });
  });

  describe('LocalPortfolioService', () => {
    it('supports add, update, delete, CSV export/import, and sample loading', () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(LocalPortfolioService);

      const created = service.addTransaction({
        symbol: 'aapl',
        date: '2025-02-01',
        quantity: 5,
        price: 190,
        currency: 'USD',
        assetType: 'us-stock',
        txType: 'BUY',
      });
      expect(created.symbol).toBe('AAPL');
      expect(service.transactionCount()).toBe(1);
      expect(localStorage.getItem(LOCAL_TRANSACTIONS_STORAGE_KEY)).toContain('AAPL');

      service.updateTransaction(created.id, { quantity: 10 });
      expect(service.transactions()[0].quantity).toBe(10);

      const holdings = service.getHoldings('all', 'USD', 'en');
      expect(holdings.openPositions.length).toBe(1);
      expect(holdings.openPositions[0].totalShares).toBe(10);

      const csv = service.exportCsv();
      expect(csv).toContain('AAPL');

      service.deleteTransaction(created.id);
      expect(service.transactionCount()).toBe(0);

      service.loadSamplePortfolio();
      expect(service.transactionCount()).toBeGreaterThan(3);

      service.clearAll();
      expect(service.transactionCount()).toBe(0);
    });

    it('preserves local transactions and cached prices when refreshMarketPrices fails', async () => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const service = TestBed.inject(LocalPortfolioService);
      const httpMock = TestBed.inject(HttpTestingController);

      service.addTransaction({
        symbol: 'AAPL',
        date: '2025-02-01',
        quantity: 5,
        price: 190,
        currency: 'USD',
        assetType: 'us-stock',
        txType: 'BUY',
      });
      service.prices.set(
        new Map([['AAPL', { symbol: 'AAPL', price: 210, currency: 'USD' }]])
      );

      const promise = firstValueFrom(service.refreshMarketPrices());
      const req = httpMock.expectOne('/api/backend/price/fetch-prices');
      req.flush({ detail: 'Quote service down' }, { status: 503, statusText: 'Service Unavailable' });

      const result = await promise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe('upstream');
      }
      expect(service.pricesError()?.kind).toBe('upstream');
      expect(service.prices().get('AAPL')?.price).toBe(210);
      expect(service.transactionCount()).toBe(1);

      httpMock.verify();
      service.clearAll();
    });
  });
});
