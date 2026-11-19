import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import type { Session, SupabaseClient, UserIdentity } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api-config.token';
import { SUPABASE_CONFIG, SupabaseAppConfig } from '../config/supabase-config.token';
import {
  AuthActionResult,
  AuthMeResponse,
  AuthMode,
  ConnectedIdentity,
  PortfolioDataSource,
  UserProfile,
} from '../models/auth.model';

export const GUEST_MODE_STORAGE_KEY = 'sgsk_wealth_guest_mode';
export const AUTH_LINK_PENDING_KEY = 'sgsk_wealth_link_pending';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly config = inject(SUPABASE_CONFIG, { optional: true });
  private readonly http = inject(HttpClient, { optional: true });
  private readonly apiBaseUrl = inject(API_BASE_URL, { optional: true }) ?? '/api/backend';

  private client: SupabaseClient | null = null;
  private clientPromise: Promise<SupabaseClient> | null = null;
  private initPromise: Promise<void> | null = null;
  private authSubscription: { unsubscribe: () => void } | null = null;
  private appUrlCleanup: (() => void) | null = null;
  private pendingInitialUrl: string | null = null;
  private readonly handledAuthCodes = new Set<string>();
  private googleProviderEnabledCache: { enabled: boolean; checkedAt: number } | null = null;

  readonly isConfigured = Boolean(this.config?.url?.trim() && this.config?.publishableKey?.trim());

  readonly initialized = signal<boolean>(!this.isConfigured);
  readonly loading = signal<boolean>(false);
  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly profile = signal<UserProfile | null>(null);
  readonly identities = signal<ConnectedIdentity[]>([]);
  private rawIdentities: UserIdentity[] = [];
  readonly canViewCloudPortfolio = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  readonly authNotice = signal<string | null>(null);
  readonly pendingSettingsReopen = signal<boolean>(false);
  readonly isGuestDismissed = signal<boolean>(!this.isConfigured);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isGuest = computed(() => !this.isAuthenticated());
  readonly authMode = computed<AuthMode>(() =>
    this.isAuthenticated() ? 'authenticated' : 'guest'
  );
  /**
   * Phase 1 strictly displays Cloud (Google Sheets) when authorized owner is signed in,
   * and Local Portfolio otherwise (never exposes a local sandbox switch to the owner).
   */
  readonly activeDataSource = computed<PortfolioDataSource>(() =>
    this.isAuthenticated() && this.canViewCloudPortfolio() ? 'cloud' : 'local'
  );
  readonly showAuthGate = computed<boolean>(
    () => this.initialized() && !this.isAuthenticated() && !this.isGuestDismissed()
  );

  readonly hasGoogleLinked = computed(() =>
    this.identities().some((identity) => identity.provider === 'google')
  );
  readonly hasEmailIdentity = computed(() =>
    this.identities().some((identity) => identity.provider === 'email')
  );
  readonly canUnlinkGoogle = computed(
    () => this.hasGoogleLinked() && this.identities().length >= 2
  );

  readonly userEmail = computed(() => this.profile()?.email || this.user()?.email || '');
  readonly displayName = computed(() => {
    const profName = this.profile()?.displayName?.trim();
    if (profName) return profName;
    const meta = this.user()?.user_metadata;
    const metaName =
      (typeof meta?.['full_name'] === 'string' && meta['full_name'].trim()) ||
      (typeof meta?.['name'] === 'string' && meta['name'].trim()) ||
      '';
    if (metaName) return metaName;
    const email = this.userEmail();
    return email ? email.split('@')[0] : '';
  });
  readonly avatarUrl = computed<string | null>(() => {
    const profAvatar = this.profile()?.avatarUrl;
    if (profAvatar) return profAvatar;
    const meta = this.user()?.user_metadata;
    const metaAvatar =
      (typeof meta?.['avatar_url'] === 'string' && meta['avatar_url']) ||
      (typeof meta?.['picture'] === 'string' && meta['picture']) ||
      null;
    return metaAvatar;
  });

  constructor() {
    this.captureInitialCallbackUrl();
  }

  captureInitialCallbackUrl(url?: string): void {
    const candidate = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (!this.pendingInitialUrl && candidate && this.hasAuthCallbackParams(candidate)) {
      this.pendingInitialUrl = candidate;
    }
  }

  consumePendingSettingsReopen(): void {
    this.pendingSettingsReopen.set(false);
  }

  initialize(): Promise<void> {
    if (!this.isConfigured || !this.config) {
      this.initialized.set(true);
      return Promise.resolve();
    }
    if (!this.initPromise) {
      this.initPromise = this.performInitialize(this.config);
    }
    return this.initPromise;
  }

  private async performInitialize(cfg: SupabaseAppConfig): Promise<void> {
    this.loading.set(true);
    try {
      const client = await this.ensureClient(cfg);
      const guestFlag = await this.readStorageItem(GUEST_MODE_STORAGE_KEY);
      this.isGuestDismissed.set(guestFlag === 'true');

      const capturedWebUrl =
        this.pendingInitialUrl ?? (typeof window !== 'undefined' ? window.location.href : null);
      this.pendingInitialUrl = null;

      let callbackUrl: string | null = null;
      let usedWebUrl = false;
      if (capturedWebUrl && this.hasAuthCallbackParams(capturedWebUrl)) {
        callbackUrl = capturedWebUrl;
        usedWebUrl = true;
      } else if (cfg.getInitialAuthUrl) {
        const initialAppUrl = await cfg.getInitialAuthUrl().catch(() => null);
        if (initialAppUrl && this.hasAuthCallbackParams(initialAppUrl)) {
          callbackUrl = initialAppUrl;
        }
      }

      let callbackHandledSession = false;
      let callbackHadError = false;
      if (callbackUrl) {
        const cbResult = await this.handleAuthCallbackUrl(callbackUrl);
        callbackHandledSession = Boolean(cbResult.ok && this.session() !== null);
        callbackHadError = !cbResult.ok && Boolean(cbResult.error);
        if (usedWebUrl && typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, '', '/');
        }
      }

      if (!callbackHandledSession) {
        const { data, error } = await client.auth.getSession();
        if (error && !callbackHadError) {
          this.authError.set(
            this.formatAuthError(error.message, (error as { code?: string }).code)
          );
        }

        if (data.session) {
          await this.applyAuthenticatedSession(data.session, callbackHadError);
        } else {
          this.clearAuthenticatedState();
        }
      }

      const { data: subData } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          const sameToken = this.session()?.access_token === nextSession.access_token;
          this.session.set(nextSession);
          if (!sameToken) {
            void this.hydrateAuthenticatedDetails(nextSession);
          }
        } else {
          this.clearAuthenticatedState();
        }
      });
      this.authSubscription = subData.subscription;

      if (cfg.registerAppUrlOpen) {
        this.appUrlCleanup = await cfg.registerAppUrlOpen((url: string) => {
          if (this.hasAuthCallbackParams(url)) {
            void this.handleAuthCallbackUrl(url);
          }
        });
      }
    } catch (err) {
      this.authError.set(err instanceof Error ? err.message : 'Unable to initialize authentication.');
    } finally {
      this.initialized.set(true);
      this.loading.set(false);
    }
  }

  private async ensureClient(cfg: SupabaseAppConfig): Promise<SupabaseClient> {
    if (this.client) return this.client;
    if (this.clientPromise) return this.clientPromise;

    this.clientPromise = (async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const storageAdapter = cfg.storage
        ? {
            getItem: (key: string) => cfg.storage!.getItem(key),
            setItem: (key: string, value: string) => cfg.storage!.setItem(key, value),
            removeItem: (key: string) => cfg.storage!.removeItem(key),
          }
        : undefined;

      this.client = createClient(cfg.url, cfg.publishableKey, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: storageAdapter,
        },
      });
      return this.client;
    })();

    try {
      return await this.clientPromise;
    } finally {
      this.clientPromise = null;
    }
  }

  getSupabaseClient(): SupabaseClient | null {
    return this.client;
  }

  async getSupabaseClientAsync(): Promise<SupabaseClient | null> {
    if (!this.isConfigured || !this.config) return null;
    return this.ensureClient(this.config);
  }

  getAccessToken(): string | null {
    return this.session()?.access_token ?? null;
  }

  private hasAuthCallbackParams(url: string): boolean {
    if (!url) return false;
    return (
      url.includes('/auth/callback') ||
      /[?&#](code|error|error_code|error_description|access_token)=/.test(url)
    );
  }

  async handleAuthCallbackUrl(url: string): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config) {
      return { ok: false, error: 'Authentication is not configured.' };
    }
    const client = await this.ensureClient(this.config);

    let parsed: URL;
    try {
      parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
    } catch {
      return { ok: false, error: 'Invalid authentication callback URL.' };
    }

    const pendingLink = (await this.readStorageItem(AUTH_LINK_PENDING_KEY)) === 'true';
    const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);
    const errorCode =
      parsed.searchParams.get('error_code') ||
      hashParams.get('error_code') ||
      parsed.searchParams.get('error') ||
      hashParams.get('error');
    const errorDesc =
      parsed.searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      errorCode;

    if (errorDesc) {
      await this.closeAuthBrowserAndClearLinkFlag();
      return this.failAuthCallback(errorDesc, errorCode, pendingLink);
    }

    const code = parsed.searchParams.get('code') || hashParams.get('code');
    if (code) {
      if (this.handledAuthCodes.has(code)) {
        return { ok: true };
      }
      this.handledAuthCodes.add(code);

      const { data, error } = await client.auth.exchangeCodeForSession(code);
      await this.closeAuthBrowserAndClearLinkFlag();
      if (error) {
        return this.failAuthCallback(error.message, (error as { code?: string }).code, pendingLink);
      }
      return this.finishAuthCallbackSession(data.session, pendingLink);
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      await this.closeAuthBrowserAndClearLinkFlag();
      if (error) {
        return this.failAuthCallback(error.message, (error as { code?: string }).code, pendingLink);
      }
      return this.finishAuthCallbackSession(data.session, pendingLink);
    }

    return { ok: false };
  }

  private async closeAuthBrowserAndClearLinkFlag(): Promise<void> {
    await this.removeStorageItem(AUTH_LINK_PENDING_KEY);
    if (this.config?.closeExternalUrl) {
      await this.config.closeExternalUrl();
    }
  }

  private failAuthCallback(
    rawMessage: string,
    errorCode: string | null | undefined,
    pendingLink: boolean
  ): AuthActionResult {
    const formatted = this.formatAuthError(rawMessage, errorCode);
    this.authError.set(formatted);
    if (pendingLink) {
      this.pendingSettingsReopen.set(true);
    }
    return { ok: false, error: formatted };
  }

  private async finishAuthCallbackSession(
    session: Session | null,
    pendingLink: boolean
  ): Promise<AuthActionResult> {
    if (session) {
      await this.applyAuthenticatedSession(session);
    }
    if (pendingLink) {
      this.authNotice.set('Google account linked successfully.');
      this.pendingSettingsReopen.set(true);
      return { ok: true, linkedGoogle: true };
    }
    return { ok: true };
  }

  private async applyAuthenticatedSession(session: Session, preserveError = false): Promise<void> {
    this.session.set(session);
    if (!preserveError) {
      this.authError.set(null);
    }
    await this.hydrateAuthenticatedDetails(session);
  }

  private async hydrateAuthenticatedDetails(session: Session): Promise<void> {
    const [backendOk] = await Promise.all([
      this.refreshBackendAuthorization(session),
      this.refreshProfile(session),
      this.refreshIdentities(),
    ]);
    if (!backendOk && this.profile()?.canViewCloudPortfolio) {
      this.canViewCloudPortfolio.set(true);
    }
  }

  private async refreshBackendAuthorization(session: Session): Promise<boolean> {
    if (!this.http) {
      return false;
    }
    try {
      const me = await firstValueFrom(
        this.http.get<AuthMeResponse>(`${this.apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      );
      this.canViewCloudPortfolio.set(Boolean(me?.canViewCloudPortfolio));
      return true;
    } catch {
      // Backend /auth/me unreachable (e.g. outage); hydrateAuthenticatedDetails falls back to DB profile flag
      return false;
    }
  }

  private async refreshProfile(session: Session): Promise<void> {
    const client = this.client;
    if (!client) return;
    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('id, email, display_name, avatar_url, role, can_view_cloud_portfolio')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        const mapped: UserProfile = {
          id: String(data['id']),
          email: String(data['email'] ?? session.user.email ?? ''),
          displayName: typeof data['display_name'] === 'string' ? data['display_name'] : '',
          avatarUrl: typeof data['avatar_url'] === 'string' ? data['avatar_url'] : null,
          role: data['role'] === 'owner' ? 'owner' : 'user',
          canViewCloudPortfolio: Boolean(data['can_view_cloud_portfolio']),
        };
        this.profile.set(mapped);
        if (!this.http) {
          this.canViewCloudPortfolio.set(mapped.canViewCloudPortfolio);
        }
      }
    } catch {
      // Ignore transient profile read errors
    }
  }

  async refreshIdentities(): Promise<void> {
    const client = this.client;
    if (!client) {
      this.identities.set([]);
      this.rawIdentities = [];
      return;
    }
    try {
      const { data, error } = await client.auth.getUserIdentities();
      if (!error && data?.identities) {
        this.rawIdentities = data.identities;
        this.identities.set(
          data.identities.map((identity) => ({
            identityId: identity.identity_id,
            provider: identity.provider,
            email:
              typeof identity.identity_data?.['email'] === 'string'
                ? identity.identity_data['email']
                : null,
            createdAt: identity.created_at ?? null,
          }))
        );
      }
    } catch {
      // Fallback to session user identities if available
      const fallback = this.user()?.identities ?? [];
      this.rawIdentities = fallback;
      this.identities.set(
        fallback.map((identity) => ({
          identityId: identity.identity_id,
          provider: identity.provider,
          email:
            typeof identity.identity_data?.['email'] === 'string'
              ? identity.identity_data['email']
              : null,
          createdAt: identity.created_at ?? null,
        }))
      );
    }
  }

  private clearAuthenticatedState(): void {
    this.session.set(null);
    this.profile.set(null);
    this.identities.set([]);
    this.rawIdentities = [];
    this.canViewCloudPortfolio.set(false);
  }

  async signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config) {
      return { ok: false, error: 'Authentication is not configured.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);

    try {
      const client = await this.ensureClient(this.config);
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        this.authError.set(error.message);
        return { ok: false, error: error.message };
      }
      if (data.session) {
        await this.applyAuthenticatedSession(data.session);
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config) {
      return { ok: false, error: 'Authentication is not configured.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);

    try {
      const client = await this.ensureClient(this.config);
      const cleanName = displayName?.trim();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: this.config.redirectUrl,
          data: cleanName ? { full_name: cleanName } : undefined,
        },
      });
      if (error) {
        this.authError.set(error.message);
        return { ok: false, error: error.message };
      }
      if (data.session) {
        await this.applyAuthenticatedSession(data.session);
        return { ok: true };
      }
      this.authNotice.set('Check your email to confirm your account before signing in.');
      return { ok: true, requiresEmailConfirmation: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.';
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async sendPasswordReset(email: string): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config) {
      return { ok: false, error: 'Authentication is not configured.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);
    try {
      const client = await this.ensureClient(this.config);
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: this.config.redirectUrl,
      });
      if (error) {
        this.authError.set(error.message);
        return { ok: false, error: error.message };
      }
      this.authNotice.set('Password reset instructions sent to your email.');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link.';
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  private isEmbeddedElectronWebView(): boolean {
    if (this.config?.isNative || typeof navigator === 'undefined') {
      return false;
    }
    return /\bElectron\//i.test(navigator.userAgent || '');
  }

  private async checkGoogleProviderEnabled(cfg: SupabaseAppConfig): Promise<boolean | null> {
    if (
      this.googleProviderEnabledCache?.enabled &&
      Date.now() - this.googleProviderEnabledCache.checkedAt < 30_000
    ) {
      return true;
    }
    if (typeof fetch !== 'function') {
      return null;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;
    try {
      const baseUrl = cfg.url.trim().replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/auth/v1/settings`, {
        headers: { apikey: cfg.publishableKey },
        signal: controller?.signal,
      });
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as { external?: { google?: unknown } };
      if (typeof data?.external?.google === 'boolean') {
        if (data.external.google) {
          this.googleProviderEnabledCache = { enabled: true, checkedAt: Date.now() };
        }
        return data.external.google;
      }
      return null;
    } catch {
      return null;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async preflightGoogleAuth(cfg: SupabaseAppConfig): Promise<string | null> {
    if (this.isEmbeddedElectronWebView()) {
      return 'Google sign-in is blocked inside embedded IDE browsers (VS Code/Electron). Please open this app in Chrome, Edge, Firefox, or Safari.';
    }
    const googleEnabled = await this.checkGoogleProviderEnabled(cfg);
    if (googleEnabled === false) {
      return this.formatAuthError('provider is not enabled', 'provider_disabled');
    }
    return null;
  }

  private formatAuthError(rawMessage: string, errorCode?: string | null): string {
    const code = (errorCode || '').trim().toLowerCase();
    const msg = (rawMessage || '').trim();
    const lower = msg.toLowerCase();

    if (code === 'manual_linking_disabled' || lower.includes('manual linking is disabled')) {
      return 'Google account linking is disabled in Supabase Auth settings. Enable "Manual Linking" under Authentication -> Sign In / Providers in the Supabase Dashboard.';
    }
    if (
      code === 'provider_disabled' ||
      code === 'oauth_provider_not_supported' ||
      lower.includes('provider is not enabled')
    ) {
      return 'Google sign-in is not enabled on Supabase yet. Enable the Google provider with your Google OAuth Client ID and Secret in the Supabase Dashboard.';
    }
    if (
      code === 'identity_already_exists' ||
      lower.includes('identity is already linked') ||
      lower.includes('already linked to another user')
    ) {
      return 'This Google account is already linked to another user account.';
    }
    if (
      code === 'single_identity_not_deletable' ||
      lower.includes('at least 2 identities')
    ) {
      return 'Add an email password before unlinking Google so you are not locked out.';
    }
    if (code === 'access_denied' || lower === 'access_denied') {
      return 'Google authentication was cancelled.';
    }
    return msg || 'Authentication failed.';
  }

  async signInWithGoogle(): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config) {
      return { ok: false, error: 'Authentication is not configured.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);

    try {
      const preflightError = await this.preflightGoogleAuth(this.config);
      if (preflightError) {
        this.authError.set(preflightError);
        return { ok: false, error: preflightError };
      }

      const client = await this.ensureClient(this.config);
      const isNative = Boolean(this.config.isNative && this.config.openExternalUrl);
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.config.redirectUrl,
          skipBrowserRedirect: isNative,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        const formatted = this.formatAuthError(error.message, (error as { code?: string }).code);
        this.authError.set(formatted);
        return { ok: false, error: formatted };
      }
      if (isNative && data?.url && this.config.openExternalUrl) {
        await this.config.openExternalUrl(data.url);
      }
      return { ok: true };
    } catch (err) {
      const msg = this.formatAuthError(
        err instanceof Error ? err.message : 'Google sign-in failed.'
      );
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async linkGoogleAccount(): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config || !this.isAuthenticated()) {
      return { ok: false, error: 'You must be signed in to link a Google account.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);

    try {
      const preflightError = await this.preflightGoogleAuth(this.config);
      if (preflightError) {
        this.authError.set(preflightError);
        return { ok: false, error: preflightError };
      }

      await this.writeStorageItem(AUTH_LINK_PENDING_KEY, 'true');
      const client = await this.ensureClient(this.config);
      const isNative = Boolean(this.config.isNative && this.config.openExternalUrl);
      const { data, error } = await client.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: this.config.redirectUrl,
          skipBrowserRedirect: isNative,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        await this.removeStorageItem(AUTH_LINK_PENDING_KEY);
        const formatted = this.formatAuthError(error.message, (error as { code?: string }).code);
        this.authError.set(formatted);
        return { ok: false, error: formatted };
      }
      if (isNative && data?.url && this.config.openExternalUrl) {
        await this.config.openExternalUrl(data.url);
      }
      return { ok: true };
    } catch (err) {
      await this.removeStorageItem(AUTH_LINK_PENDING_KEY);
      const msg = this.formatAuthError(
        err instanceof Error ? err.message : 'Unable to link Google account.'
      );
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async unlinkGoogleAccount(): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config || !this.isAuthenticated()) {
      return { ok: false, error: 'You must be signed in to unlink an account.' };
    }
    if (!this.canUnlinkGoogle()) {
      return {
        ok: false,
        error: 'Add an email password before unlinking Google so you are not locked out.',
      };
    }
    const googleIdentity = this.rawIdentities.find((i) => i.provider === 'google');
    if (!googleIdentity) {
      return { ok: false, error: 'No Google identity is linked to this account.' };
    }

    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);

    try {
      const client = await this.ensureClient(this.config);
      const { error } = await client.auth.unlinkIdentity(googleIdentity);
      if (error) {
        const formatted = this.formatAuthError(error.message, (error as { code?: string }).code);
        this.authError.set(formatted);
        return { ok: false, error: formatted };
      }
      await this.refreshIdentities();
      this.authNotice.set('Google account unlinked.');
      return { ok: true };
    } catch (err) {
      const msg = this.formatAuthError(
        err instanceof Error ? err.message : 'Unable to unlink Google account.'
      );
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async setPassword(newPassword: string): Promise<AuthActionResult> {
    if (!this.isConfigured || !this.config || !this.isAuthenticated()) {
      return { ok: false, error: 'You must be signed in to update your password.' };
    }
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);
    try {
      const client = await this.ensureClient(this.config);
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        this.authError.set(error.message);
        return { ok: false, error: error.message };
      }
      await this.refreshIdentities();
      this.authNotice.set('Password saved. You can now sign in with Email & Password.');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update password.';
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async updateDisplayName(displayName: string): Promise<AuthActionResult> {
    const currentUser = this.user();
    if (!this.isConfigured || !this.client || !currentUser) {
      return { ok: false, error: 'You must be signed in to update your profile.' };
    }
    const cleanName = displayName.trim();
    this.loading.set(true);
    this.authError.set(null);
    try {
      const { error } = await this.client
        .from('user_profiles')
        .update({ display_name: cleanName })
        .eq('id', currentUser.id);
      if (error) {
        this.authError.set(error.message);
        return { ok: false, error: error.message };
      }
      const existing = this.profile();
      if (existing) {
        this.profile.set({ ...existing, displayName: cleanName });
      }
      this.authNotice.set('Profile updated.');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update profile.';
      this.authError.set(msg);
      return { ok: false, error: msg };
    } finally {
      this.loading.set(false);
    }
  }

  async continueAsGuest(): Promise<void> {
    this.authError.set(null);
    await this.writeStorageItem(GUEST_MODE_STORAGE_KEY, 'true');
    this.isGuestDismissed.set(true);
  }

  async signOut(): Promise<void> {
    this.loading.set(true);
    this.authError.set(null);
    this.authNotice.set(null);
    try {
      if (this.client) {
        await this.client.auth.signOut();
      }
    } finally {
      await this.removeStorageItem(GUEST_MODE_STORAGE_KEY);
      this.clearAuthenticatedState();
      this.isGuestDismissed.set(false);
      this.loading.set(false);
    }
  }

  clearMessages(): void {
    this.authError.set(null);
    this.authNotice.set(null);
  }

  private async readStorageItem(key: string): Promise<string | null> {
    try {
      if (this.config?.storage) {
        const val = await this.config.storage.getItem(key);
        if (val !== null) return val;
      }
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore storage read errors
    }
    return null;
  }

  private async writeStorageItem(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        localStorage.setItem(key, value);
      }
      if (this.config?.storage) {
        await this.config.storage.setItem(key, value);
      }
    } catch {
      // Ignore storage write errors
    }
  }

  private async removeStorageItem(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        localStorage.removeItem(key);
      }
      if (this.config?.storage) {
        await this.config.storage.removeItem(key);
      }
    } catch {
      // Ignore storage removal errors
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.appUrlCleanup?.();
  }
}
