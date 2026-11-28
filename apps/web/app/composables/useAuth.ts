import { createClient, type SupabaseClient, type UserIdentity } from '@supabase/supabase-js';

export interface AuthSessionState {
  initialized: boolean;
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  canViewCloudPortfolio: boolean;
  portfolioSource: 'google_sheets' | 'local';
  accessToken: string | null;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  showAuthModal: boolean;
  identities: UserIdentity[];
  hasEmailIdentity: boolean;
  hasGoogleLinked: boolean;
  canUnlinkGoogle: boolean;
  pendingSettingsReopen: boolean;
  backendError: string | null;
}

const GUEST_MODE_STORAGE_KEY = 'sgsk_guest_mode';
const AUTH_LINK_PENDING_KEY = 'sgsk_auth_link_pending';

function isGuestModePreferred(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setGuestModePreferred(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy errors
  }
}

function resolveAuthRedirectUrl(): string | undefined {
  if (useNativePlatform().isNative()) {
    return 'com.sgsk.wealth.mobile://auth/callback';
  }
  return typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
}

let supabaseInstance: SupabaseClient | null = null;
let authListenerBound = false;

export function useAuth() {
  const config = useRuntimeConfig();
  const { request } = useApiClient();

  const authState = useState<AuthSessionState>('auth-session', () => ({
    initialized: false,
    authenticated: false,
    userId: null,
    email: null,
    displayName: 'Guest',
    avatarUrl: null,
    role: 'guest',
    canViewCloudPortfolio: false,
    portfolioSource: 'local',
    accessToken: null,
    loading: false,
    authError: null,
    authNotice: null,
    showAuthModal: false,
    identities: [],
    hasEmailIdentity: false,
    hasGoogleLinked: false,
    canUnlinkGoogle: false,
    pendingSettingsReopen: false,
    backendError: null,
  }));

  function getSupabaseClient(): SupabaseClient | null {
    if (supabaseInstance) return supabaseInstance;
    const url = String(config.public.supabaseUrl || '').trim();
    const key = String(config.public.supabaseAnonKey || '').trim();
    if (!url || !key) return null;
    supabaseInstance = createClient(url, key);
    if (!authListenerBound && typeof window !== 'undefined') {
      authListenerBound = true;
      supabaseInstance.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          void refreshSession();
        } else if (event === 'SIGNED_OUT') {
          authState.value = {
            ...authState.value,
            initialized: true,
            authenticated: false,
            userId: null,
            email: null,
            displayName: 'Guest',
            avatarUrl: null,
            role: 'guest',
            canViewCloudPortfolio: false,
            portfolioSource: 'local',
            accessToken: null,
            identities: [],
            hasEmailIdentity: false,
            hasGoogleLinked: false,
            canUnlinkGoogle: false,
          };
        }
      });
    }
    return supabaseInstance;
  }

  function applyIdentities(identities: UserIdentity[]) {
    const hasEmailIdentity = identities.some((i) => i.provider === 'email');
    const hasGoogleLinked = identities.some((i) => i.provider === 'google');
    authState.value.identities = identities;
    authState.value.hasEmailIdentity = hasEmailIdentity;
    authState.value.hasGoogleLinked = hasGoogleLinked;
    authState.value.canUnlinkGoogle = hasGoogleLinked && hasEmailIdentity;
  }

  async function refreshIdentities() {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data } = await client.auth.getUserIdentities();
      applyIdentities(data?.identities ?? []);
    } catch {
      // Ignore identity lookup failures
    }
  }

  async function refreshSession() {
    const client = getSupabaseClient();
    let token: string | null = null;
    let userId: string | null = null;
    let email: string | null = null;
    let displayName = 'Guest';
    let avatarUrl: string | null = null;

    try {
      if (client) {
        try {
          const { data } = await client.auth.getSession();
          const user = data.session?.user;
          token = data.session?.access_token ?? null;
          userId = user?.id ?? null;
          email = user?.email ?? null;
          displayName =
            (user?.user_metadata?.full_name as string) ||
            (user?.user_metadata?.name as string) ||
            email?.split('@')[0] ||
            'Guest';
          avatarUrl =
            (user?.user_metadata?.avatar_url as string) ||
            (user?.user_metadata?.picture as string) ||
            null;

          if (userId) {
            try {
              const { data: prof } = await client
                .from('user_profiles')
                .select('display_name, avatar_url, role')
                .eq('id', userId)
                .maybeSingle();
              if (prof?.display_name) displayName = prof.display_name;
              if (prof?.avatar_url) avatarUrl = prof.avatar_url;
            } catch {
              // Fallback to user_metadata
            }
            await refreshIdentities();
          } else {
            applyIdentities([]);
          }
        } catch {
          applyIdentities([]);
        }
      }

      try {
        const me = await request<{
          authenticated: boolean;
          userId: string | null;
          role: string;
          canViewCloudPortfolio: boolean;
          portfolioSource: 'google_sheets' | 'local';
        }>('/auth/me', {
          bearerToken: token,
          userId,
        });

        if (!me || typeof me.authenticated !== 'boolean') {
          throw new Error('Invalid /auth/me response');
        }

        const authenticated = me.authenticated;
        authState.value = {
          ...authState.value,
          initialized: true,
          authenticated,
          userId: me.userId ?? userId,
          email,
          displayName: authenticated ? displayName : 'Guest',
          avatarUrl,
          role: me.role,
          canViewCloudPortfolio: me.canViewCloudPortfolio,
          portfolioSource: me.portfolioSource,
          accessToken: token,
          showAuthModal: !authenticated && !isGuestModePreferred(),
          backendError: null,
        };
      } catch (err) {
        const authenticated = Boolean(token);
        authState.value = {
          ...authState.value,
          initialized: true,
          authenticated,
          userId,
          email,
          displayName: token ? displayName : 'Guest',
          avatarUrl,
          role: 'guest',
          canViewCloudPortfolio: false,
          portfolioSource: 'local',
          accessToken: token,
          showAuthModal: !authenticated && !isGuestModePreferred(),
          backendError: err instanceof Error ? err.message : 'Unable to load data',
        };
      }
    } finally {
      authState.value.initialized = true;
    }
  }

  async function signInWithGoogle() {
    authState.value.authError = null;
    const client = getSupabaseClient();
    if (!client) {
      authState.value.authError = 'Supabase Auth is not configured in this environment.';
      return;
    }
    authState.value.loading = true;
    try {
      const redirectTo = resolveAuthRedirectUrl();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) authState.value.authError = error.message;
    } finally {
      authState.value.loading = false;
    }
  }

  async function signInWithEmail(email: string, password: string) {
    authState.value.authError = null;
    authState.value.authNotice = null;
    const client = getSupabaseClient();
    if (!client) {
      authState.value.authError = 'Supabase Auth is not configured in this environment.';
      return false;
    }
    authState.value.loading = true;
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        authState.value.authError = error.message;
        return false;
      }
      await refreshSession();
      authState.value.showAuthModal = false;
      return true;
    } finally {
      authState.value.loading = false;
    }
  }

  async function signUpWithEmail(email: string, password: string, displayName?: string) {
    authState.value.authError = null;
    authState.value.authNotice = null;
    const client = getSupabaseClient();
    if (!client) {
      authState.value.authError = 'Supabase Auth is not configured in this environment.';
      return false;
    }
    authState.value.loading = true;
    try {
      const { error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName } },
      });
      if (error) {
        authState.value.authError = error.message;
        return false;
      }
      authState.value.authNotice = 'Check your email to confirm your account.';
      return true;
    } finally {
      authState.value.loading = false;
    }
  }

  async function sendPasswordReset(email: string) {
    authState.value.authError = null;
    authState.value.authNotice = null;
    const client = getSupabaseClient();
    if (!client) {
      authState.value.authError = 'Supabase Auth is not configured in this environment.';
      return;
    }
    authState.value.loading = true;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) authState.value.authError = error.message;
      else authState.value.authNotice = 'Password reset link sent to your email.';
    } finally {
      authState.value.loading = false;
    }
  }

  async function updateDisplayName(displayName: string): Promise<{ ok: boolean; error?: string }> {
    const clean = displayName.trim();
    if (!clean) return { ok: false, error: 'Display name cannot be empty.' };
    const client = getSupabaseClient();
    const userId = authState.value.userId;
    if (!client || !userId) return { ok: false, error: 'Not signed in.' };

    authState.value.loading = true;
    try {
      const { error: profErr } = await client
        .from('user_profiles')
        .update({ display_name: clean })
        .eq('id', userId);
      if (profErr) return { ok: false, error: profErr.message };

      await client.auth.updateUser({ data: { full_name: clean } });
      authState.value.displayName = clean;
      return { ok: true };
    } finally {
      authState.value.loading = false;
    }
  }

  async function setPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase Auth is not configured.' };

    authState.value.loading = true;
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      await refreshIdentities();
      return { ok: true };
    } finally {
      authState.value.loading = false;
    }
  }

  async function linkGoogleAccount(): Promise<{ ok: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: 'Supabase Auth is not configured.' };

    authState.value.loading = true;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_LINK_PENDING_KEY, '1');
      }
      const redirectTo = resolveAuthRedirectUrl();
      const { error } = await client.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        if (typeof window !== 'undefined') window.localStorage.removeItem(AUTH_LINK_PENDING_KEY);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } finally {
      authState.value.loading = false;
    }
  }

  async function unlinkGoogleAccount(): Promise<{ ok: boolean; error?: string }> {
    if (!authState.value.canUnlinkGoogle) {
      return { ok: false, error: 'Set an email password first before unlinking Google.' };
    }
    const client = getSupabaseClient();
    const googleIdentity = authState.value.identities.find((i) => i.provider === 'google');
    if (!client || !googleIdentity) {
      return { ok: false, error: 'Google account is not linked.' };
    }

    authState.value.loading = true;
    try {
      const { error } = await client.auth.unlinkIdentity(googleIdentity);
      if (error) return { ok: false, error: error.message };
      await refreshIdentities();
      return { ok: true };
    } finally {
      authState.value.loading = false;
    }
  }

  async function handleAuthCallback(): Promise<void> {
    const client = getSupabaseClient();
    if (client && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errDesc = params.get('error_description') || params.get('error');
      if (errDesc) {
        authState.value.authError = errDesc;
      } else {
        const code = params.get('code');
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) authState.value.authError = error.message;
        }
      }
    }
    await refreshSession();
    if (typeof window !== 'undefined' && window.localStorage.getItem(AUTH_LINK_PENDING_KEY) === '1') {
      window.localStorage.removeItem(AUTH_LINK_PENDING_KEY);
      authState.value.pendingSettingsReopen = true;
    }
  }

  function openAuthModal() {
    authState.value.authError = null;
    authState.value.authNotice = null;
    authState.value.showAuthModal = true;
  }

  function continueAsGuest() {
    setGuestModePreferred(true);
    authState.value.showAuthModal = false;
  }

  async function signOut() {
    setGuestModePreferred(false);
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    authState.value = {
      ...authState.value,
      initialized: true,
      authenticated: false,
      userId: null,
      email: null,
      displayName: 'Guest',
      avatarUrl: null,
      role: 'guest',
      canViewCloudPortfolio: false,
      portfolioSource: 'local',
      accessToken: null,
      showAuthModal: true,
      identities: [],
      hasEmailIdentity: false,
      hasGoogleLinked: false,
      canUnlinkGoogle: false,
    };
  }

  return {
    authState,
    getSupabaseClient,
    refreshSession,
    refreshIdentities,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    updateDisplayName,
    setPassword,
    linkGoogleAccount,
    unlinkGoogleAccount,
    handleAuthCallback,
    openAuthModal,
    continueAsGuest,
    signOut,
  };
}
