<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { settings, syncStatus, setTheme } = useUserSettings();
const { authState, openAuthModal, updateDisplayName, setPassword, linkGoogleAccount, unlinkGoogleAccount, signOut } =
  useAuth();
const { t } = useI18n();

const displayNameDraft = ref(authState.value.displayName || '');
const showSetPasswordForm = ref(false);
const newPasswordDraft = ref('');
const feedbackMsg = ref<string | null>(null);
const feedbackError = ref<string | null>(null);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      displayNameDraft.value = authState.value.displayName || '';
      feedbackMsg.value = null;
      feedbackError.value = null;
      showSetPasswordForm.value = false;
      newPasswordDraft.value = '';
    }
  },
);

const syncLabelKey = computed(() => {
  if (syncStatus.value === 'syncing') return 'settings.syncSyncing';
  if (syncStatus.value === 'synced') return 'settings.syncSynced';
  if (syncStatus.value === 'error') return 'settings.syncError';
  return 'settings.syncLocal';
});

function onOpenSignInClick() {
  emit('close');
  openAuthModal(true);
}

async function onSaveProfile() {
  feedbackMsg.value = null;
  feedbackError.value = null;
  const res = await updateDisplayName(displayNameDraft.value);
  if (res.ok) feedbackMsg.value = t('settings.saveProfile');
  else feedbackError.value = res.error ?? 'Failed to update profile';
}

async function onSavePassword() {
  feedbackMsg.value = null;
  feedbackError.value = null;
  const res = await setPassword(newPasswordDraft.value);
  if (res.ok) {
    newPasswordDraft.value = '';
    showSetPasswordForm.value = false;
    feedbackMsg.value = t('settings.savePassword');
  } else {
    feedbackError.value = res.error ?? 'Failed to set password';
  }
}

async function onLinkGoogle() {
  feedbackMsg.value = null;
  feedbackError.value = null;
  const res = await linkGoogleAccount();
  if (!res.ok) feedbackError.value = res.error ?? 'Failed to link Google account';
}

async function onUnlinkGoogle() {
  feedbackMsg.value = null;
  feedbackError.value = null;
  const res = await unlinkGoogleAccount();
  if (res.ok) feedbackMsg.value = t('settings.unlinkGoogle');
  else feedbackError.value = res.error ?? 'Failed to unlink Google account';
}
</script>

<template>
  <UiAppModal
    :open="props.open"
    modal-id="user-settings-modal"
    close-btn-id="settings-close-btn"
    max-width-class="max-w-lg"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <h2 id="settings-modal-title" class="text-base font-semibold text-[var(--color-text-primary)]">
          {{ t('settings.title') }}
        </h2>
        <UiAppBadge :tone="syncStatus === 'error' ? 'negative' : syncStatus === 'synced' ? 'positive' : 'neutral'">
          {{ t(syncLabelKey) }}
        </UiAppBadge>
      </div>
    </template>

    <div class="space-y-6">
      <section class="space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('settings.preferencesTitle') }}
        </h3>
        <div class="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span class="text-sm font-medium text-[var(--color-text-primary)]">{{ t('settings.themeLabel') }}</span>
          <div class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5" role="group" :aria-label="t('settings.themeLabel')">
            <button
              id="settings-theme-dark"
              type="button"
              class="seg-btn rounded px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="settings.theme === 'dark' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              @click="setTheme('dark')"
            >
              {{ t('settings.themeDark') }}
            </button>
            <button
              id="settings-theme-light"
              type="button"
              class="seg-btn rounded px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="settings.theme === 'light' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              @click="setTheme('light')"
            >
              {{ t('settings.themeLight') }}
            </button>
            <button
              id="settings-theme-system"
              type="button"
              class="seg-btn rounded px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="settings.theme === 'system' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              @click="setTheme('system')"
            >
              {{ t('settings.themeSystem') }}
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('settings.accountTitle') }}
        </h3>

        <div
          v-if="feedbackError || authState.authError"
          id="settings-error-banner"
          class="rounded-[var(--radius-sm)] border border-[var(--color-pl-negative-border)] bg-[var(--color-pl-negative-soft)] px-3 py-2 text-xs text-[var(--color-pl-negative)]"
          role="alert"
        >
          {{ feedbackError || authState.authError }}
        </div>
        <div
          v-if="feedbackMsg || authState.authNotice"
          id="settings-notice-banner"
          class="rounded-[var(--radius-sm)] border border-[var(--color-pl-positive-border)] bg-[var(--color-pl-positive-soft)] px-3 py-2 text-xs text-[var(--color-pl-positive)]"
          role="status"
        >
          {{ feedbackMsg || authState.authNotice }}
        </div>

        <div v-if="!authState.authenticated" class="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div class="text-sm font-semibold text-[var(--color-text-primary)]">{{ t('settings.guestPromptTitle') }}</div>
          <p class="text-xs text-[var(--color-text-muted)]">{{ t('settings.guestPromptDesc') }}</p>
          <UiAppButton id="settings-signin-btn" variant="primary" size="sm" @click="onOpenSignInClick">
            {{ t('userMenu.signIn') }}
          </UiAppButton>
        </div>

        <template v-else>
          <div class="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <label for="settings-display-name-input" class="block text-xs font-medium text-[var(--color-text-secondary)]">
              {{ t('settings.displayName') }}
            </label>
            <div class="flex gap-2">
              <input
                id="settings-display-name-input"
                v-model="displayNameDraft"
                name="displayNameDraft"
                type="text"
                class="h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs text-[var(--color-text-primary)]"
              />
              <UiAppButton id="settings-save-profile-btn" size="sm" :disabled="authState.loading" @click="onSaveProfile">
                {{ t('settings.saveProfile') }}
              </UiAppButton>
            </div>
            <div class="flex items-center justify-between pt-1 text-xs">
              <span class="text-[var(--color-text-muted)]">{{ t('settings.emailLabel') }}</span>
              <span class="font-mono text-[var(--color-text-primary)]">{{ authState.email }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-[var(--color-text-muted)]">{{ t('settings.portfolioAccess') }}</span>
              <UiAppBadge :tone="authState.canViewCloudPortfolio ? 'positive' : 'neutral'">
                {{ authState.canViewCloudPortfolio ? t('settings.accessOwnerCloud') : t('settings.accessLocalOnly') }}
              </UiAppBadge>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-semibold text-[var(--color-text-secondary)]">{{ t('settings.connectedAccounts') }}</div>

            <div class="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div>
                <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('settings.emailPassword') }}</div>
                <div class="text-[11px] text-[var(--color-text-muted)]">
                  {{ authState.hasEmailIdentity ? t('settings.emailConnected') : t('settings.googleNotLinked') }}
                </div>
              </div>
              <UiAppButton
                v-if="!authState.hasEmailIdentity"
                id="settings-set-password-btn"
                size="xs"
                @click="showSetPasswordForm = !showSetPasswordForm"
              >
                {{ t('settings.setPasswordCta') }}
              </UiAppButton>
            </div>

            <div v-if="showSetPasswordForm" class="flex gap-2">
              <input
                id="settings-new-password-input"
                v-model="newPasswordDraft"
                name="newPasswordDraft"
                type="password"
                :placeholder="t('settings.setPasswordPlaceholder')"
                class="h-8 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs text-[var(--color-text-primary)]"
              />
              <UiAppButton id="settings-save-password-btn" variant="primary" size="xs" :disabled="authState.loading" @click="onSavePassword">
                {{ t('settings.savePassword') }}
              </UiAppButton>
            </div>

            <div class="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div>
                <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('settings.googleAccount') }}</div>
                <div class="text-[11px] text-[var(--color-text-muted)]">
                  {{ authState.hasGoogleLinked ? t('settings.googleConnected') : t('settings.googleNotLinked') }}
                </div>
              </div>
              <UiAppButton
                v-if="authState.hasGoogleLinked"
                id="settings-unlink-google-btn"
                variant="danger"
                size="xs"
                :disabled="!authState.canUnlinkGoogle || authState.loading"
                @click="onUnlinkGoogle"
              >
                {{ t('settings.unlinkGoogle') }}
              </UiAppButton>
              <UiAppButton
                v-else
                id="settings-link-google-btn"
                size="xs"
                :disabled="authState.loading"
                @click="onLinkGoogle"
              >
                {{ t('settings.linkGoogle') }}
              </UiAppButton>
            </div>
            <p v-if="authState.hasGoogleLinked && !authState.canUnlinkGoogle" class="text-[11px] text-[var(--color-text-muted)]">
              {{ t('settings.unlinkDisabledHint') }}
            </p>
          </div>

          <div class="pt-2">
            <UiAppButton id="settings-signout-btn" variant="danger" size="sm" @click="emit('close'); void signOut()">
              {{ t('userMenu.signOut') }}
            </UiAppButton>
          </div>
        </template>
      </section>
    </div>
  </UiAppModal>
</template>
