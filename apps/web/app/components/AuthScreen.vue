<script setup lang="ts">
const { authState, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, continueAsGuest } =
  useAuth();
const { settings, setLanguage } = useUserSettings();
const { t } = useI18n();

const mode = ref<'signin' | 'signup' | 'reset'>('signin');
const displayName = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const localError = ref<string | null>(null);

function setMode(next: 'signin' | 'signup' | 'reset') {
  mode.value = next;
  localError.value = null;
}

async function onSubmit() {
  localError.value = null;
  if (!email.value.trim()) {
    localError.value = t('auth.emailLabel');
    return;
  }
  if (mode.value === 'signin') {
    await signInWithEmail(email.value.trim(), password.value);
  } else if (mode.value === 'signup') {
    await signUpWithEmail(email.value.trim(), password.value, displayName.value.trim());
  } else {
    await sendPasswordReset(email.value.trim());
  }
}
</script>

<template>
  <section
    id="auth-screen"
    class="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-4 sm:p-6"
  >
    <div class="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-2xl">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]" aria-hidden="true">
            <img src="/brand-logo.png" alt="" class="h-7 w-7 object-contain" />
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight text-[var(--color-text-primary)]">SGSK Wealth</h1>
            <p class="text-xs text-[var(--color-text-muted)]">{{ t('app.tagline') }}</p>
          </div>
        </div>

        <div
          id="auth-lang-toggle"
          class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
          role="group"
          :aria-label="t('settings.languageLabel')"
        >
          <button
            id="auth-lang-en"
            type="button"
            class="rounded px-2 py-1 text-xs font-semibold transition-colors"
            :class="settings.language === 'en' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            :aria-pressed="settings.language === 'en'"
            :title="t('header.langEn')"
            :aria-label="t('header.langEn')"
            @click="setLanguage('en')"
          >
            EN
          </button>
          <button
            id="auth-lang-th"
            type="button"
            class="rounded px-2 py-1 text-xs font-semibold transition-colors"
            :class="settings.language === 'th' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            :aria-pressed="settings.language === 'th'"
            :title="t('header.langTh')"
            :aria-label="t('header.langTh')"
            @click="setLanguage('th')"
          >
            ไทย
          </button>
        </div>
      </div>

      <template v-if="mode !== 'reset'">
        <div class="mb-4 grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="tablist">
          <button
            id="auth-tab-signin"
            type="button"
            class="rounded-[var(--radius-sm)] py-1.5 text-xs font-semibold transition-colors"
            :class="mode === 'signin' ? 'active bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs' : 'text-[var(--color-text-muted)]'"
            @click="setMode('signin')"
          >
            {{ t('auth.signIn') }}
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            class="rounded-[var(--radius-sm)] py-1.5 text-xs font-semibold transition-colors"
            :class="mode === 'signup' ? 'active bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-xs' : 'text-[var(--color-text-muted)]'"
            @click="setMode('signup')"
          >
            {{ t('auth.signUp') }}
          </button>
        </div>

        <button
          id="auth-google-btn"
          type="button"
          class="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-50"
          :disabled="authState.loading"
          @click="signInWithGoogle"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.22 1.18-3.24 0-5.99-2.19-6.97-5.13H1.04v3.14C3.05 21.18 7.21 24 12 24Z" />
            <path fill="#FBBC05" d="M5.03 14.04c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.18H1.04A11.98 11.98 0 0 0 0 11.68c0 1.93.46 3.76 1.04 5.5l3.99-3.14Z" />
            <path fill="#EA4335" d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.82 1.04 6.82l3.99 3.14C6.01 6.94 8.76 4.75 12 4.75Z" />
          </svg>
          <span>{{ t('auth.continueWithGoogle') }}</span>
        </button>

        <div class="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
          <div class="h-px flex-1 bg-[var(--color-border)]" />
          <span>{{ t('auth.orWithEmail') }}</span>
          <div class="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      </template>

      <div v-else class="mb-4">
        <h2 class="text-sm font-semibold text-[var(--color-text-primary)]">{{ t('auth.resetPasswordTitle') }}</h2>
        <p class="mt-1 text-xs text-[var(--color-text-muted)]">{{ t('auth.resetPasswordDesc') }}</p>
      </div>

      <div
        v-if="localError || authState.authError"
        id="auth-error-banner"
        class="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-pl-negative-border)] bg-[var(--color-pl-negative-soft)] px-3 py-2 text-xs text-[var(--color-pl-negative)]"
        role="alert"
      >
        {{ localError || authState.authError }}
      </div>

      <div
        v-if="authState.authNotice"
        id="auth-notice-banner"
        class="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-pl-positive-border)] bg-[var(--color-pl-positive-soft)] px-3 py-2 text-xs text-[var(--color-pl-positive)]"
        role="status"
      >
        {{ authState.authNotice }}
      </div>

      <form class="space-y-3" @submit.prevent="onSubmit">
        <label v-if="mode === 'signup'" class="block space-y-1 text-xs" for="auth-name-input">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('auth.displayNameLabel') }}</span>
          <input
            id="auth-name-input"
            v-model="displayName"
            name="displayName"
            type="text"
            :placeholder="t('auth.displayNamePlaceholder')"
            autocomplete="name"
            class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]"
          />
        </label>

        <label class="block space-y-1 text-xs" for="auth-email-input">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('auth.emailLabel') }}</span>
          <input
            id="auth-email-input"
            v-model="email"
            name="email"
            type="email"
            :placeholder="t('auth.emailPlaceholder')"
            autocomplete="email"
            required
            class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]"
          />
        </label>

        <label v-if="mode !== 'reset'" class="block space-y-1 text-xs" for="auth-password-input">
          <div class="flex items-center justify-between">
            <span class="font-medium text-[var(--color-text-secondary)]">{{ t('auth.passwordLabel') }}</span>
            <button v-if="mode === 'signin'" id="auth-forgot-btn" type="button" class="text-[11px] font-medium text-[var(--color-accent)] hover:underline" @click="setMode('reset')">
              {{ t('auth.forgotPassword') }}
            </button>
          </div>
          <div class="relative flex items-center">
            <input
              id="auth-password-input"
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.passwordPlaceholder')"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
              required
              class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] pl-3 pr-14 text-sm text-[var(--color-text-primary)]"
            />
            <button
              type="button"
              class="absolute right-2.5 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? t('auth.hidePassword') : t('auth.showPassword') }}
            </button>
          </div>
        </label>

        <button
          id="auth-submit-btn"
          type="submit"
          class="h-10 w-full rounded-[var(--radius-sm)] bg-[var(--color-component-primary-btn)] text-sm font-semibold text-[var(--color-component-primary-btn-text)] hover:bg-[var(--color-component-primary-btn-hover)] disabled:opacity-50"
          :disabled="authState.loading"
        >
          <template v-if="mode === 'signin'">{{ t('auth.submitSignIn') }}</template>
          <template v-else-if="mode === 'signup'">{{ t('auth.submitSignUp') }}</template>
          <template v-else>{{ t('auth.sendResetLink') }}</template>
        </button>

        <button v-if="mode === 'reset'" type="button" class="w-full text-center text-xs font-medium text-[var(--color-accent)] hover:underline" @click="setMode('signin')">
          {{ t('auth.backToSignIn') }}
        </button>
      </form>

      <div class="mt-5 border-t border-[var(--color-border)] pt-4 text-center">
        <button
          id="auth-guest-btn"
          type="button"
          class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] disabled:opacity-50"
          :disabled="authState.loading"
          @click="continueAsGuest"
        >
          {{ t('auth.continueAsGuest') }}
        </button>
        <p class="mt-2 text-[11px] text-[var(--color-text-muted)]">{{ t('auth.guestHint') }}</p>
        <p class="mt-1 text-[11px] text-[var(--color-text-muted)]">{{ t('auth.ownerOnlyNotice') }}</p>
      </div>
    </div>
  </section>
</template>
