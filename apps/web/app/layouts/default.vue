<script setup lang="ts">
const route = useRoute();
const { settings, syncOnSignIn, setCurrency, setLanguage, togglePrivacyMode } = useUserSettings();

useHead(() => ({
  htmlAttrs: {
    lang: settings.value.language,
    'data-theme': settings.value.theme === 'light' ? 'light' : 'dark',
    'data-theme-mode': settings.value.theme,
    'data-privacy': settings.value.privacyMode ? 'true' : 'false',
  },
}));

const { t } = useI18n();
const { authState, refreshSession, openAuthModal, signOut } = useAuth();
const { transactions, resetToSample } = useLocalPortfolio();
const { exchangeRate, hasRate, loading, errorMessage, isUnauthorizedError, pricesError, refreshAll } =
  usePortfolioData();
const nativePlatform = useNativePlatform();

const sidebarCollapsed = ref(false);
const isUserMenuOpen = ref(false);
const showSettings = ref(false);
const showLocalModal = ref(false);

const navItems = [
  { to: '/', id: 'dashboard', labelKey: 'nav.dashboard' },
  { to: '/holdings', id: 'holdings', labelKey: 'nav.holdings' },
  { to: '/analytics', id: 'analytics', labelKey: 'nav.analytics' },
  { to: '/dividends', id: 'dividends', labelKey: 'nav.dividends' },
  { to: '/transactions', id: 'transactions', labelKey: 'nav.transactions' },
  { to: '/tools', id: 'tools', labelKey: 'nav.tools' },
];

const activeViewLabelKey = computed(() => {
  const match = navItems.find((item) => item.to === route.path);
  return match?.labelKey ?? 'nav.dashboard';
});

const userInitial = computed(() =>
  (authState.value.displayName || 'G').trim().charAt(0).toUpperCase(),
);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.sidebarCollapsed = String(sidebarCollapsed.value);
  }
}

watch(
  () => authState.value.pendingSettingsReopen,
  (reopen) => {
    if (reopen) {
      authState.value.pendingSettingsReopen = false;
      showSettings.value = true;
    }
  },
);

watch(
  [() => authState.value.authenticated, () => authState.value.userId],
  ([authenticated, userId]) => {
    void syncOnSignIn(authenticated ? userId : null);
  },
);

onMounted(async () => {
  void nativePlatform.hideSplashScreen();
  void nativePlatform.registerBackButtonHandler(() => {
    if (showSettings.value) {
      showSettings.value = false;
      return true;
    }
    if (showLocalModal.value) {
      showLocalModal.value = false;
      return true;
    }
    return false;
  });
  await refreshSession();
  await refreshAll();
});
</script>

<template>
  <LoadingScreen
    v-if="!authState.initialized"
    :status-tag="t('loading.module')"
    title="SGSK Wealth"
    :subtitle="t('settings.syncSyncing')"
  />

  <AuthScreen v-else-if="authState.showAuthModal" />

  <div v-else class="app-workspace-shell min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
    <!-- Collapsible Left Rail (Desktop lg+) & Fixed Bottom Tab Bar (Mobile < lg) -->
    <aside
      id="desktop-sidebar"
      :class="[
        'fixed inset-x-0 bottom-0 z-[var(--z-sidebar)] border-t border-[var(--color-border)] bg-[var(--color-component-bottom-nav)] lg:inset-y-0 lg:right-auto lg:flex lg:flex-col lg:border-r lg:border-t-0 lg:bg-[var(--color-component-sidebar)] lg:transition-all',
        sidebarCollapsed ? 'collapsed lg:w-[var(--sidebar-collapsed-width)]' : 'lg:w-[var(--sidebar-width)]',
      ]"
    >
      <!-- Desktop Brand -->
      <div class="hidden h-[var(--topbar-height)] items-center gap-2.5 border-b border-[var(--color-border)] px-4 lg:flex">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <img src="/brand-logo.png" alt="SGSK Wealth" class="h-5 w-5 object-contain" />
        </div>
        <div v-if="!sidebarCollapsed" class="min-w-0">
          <h1 class="logo-text truncate text-sm font-bold tracking-tight text-[var(--color-text-primary)]">SGSK Wealth</h1>
          <p class="truncate text-[10px] text-[var(--color-text-muted)]">{{ t('app.tagline') }}</p>
        </div>
      </div>

      <div v-if="!sidebarCollapsed" class="hidden px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] lg:block">
        {{ t('sidebar.workspaceLabel') }}
      </div>

      <nav
        id="view-toggle"
        class="grid grid-cols-6 gap-0.5 px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:px-2.5 lg:py-2"
        :aria-label="t('header.mainNav')"
      >
        <NuxtLink
          v-for="item in navItems"
          :id="`view-toggle-${item.id}`"
          :key="item.to"
          :to="item.to"
          class="view-toggle-btn flex flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1.5 text-[10px] font-medium transition-colors lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-2 lg:text-xs"
          :class="
            route.path === item.to
              ? 'view-toggle-btn-active bg-[var(--color-component-active-nav)] font-semibold text-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]'
          "
          :title="t(item.labelKey)"
          :aria-label="t(item.labelKey)"
          @click="nativePlatform.triggerHapticSelection()"
        >
          <NavIcon :name="item.id" :active="route.path === item.to" class="h-4 w-4 shrink-0" />
          <span v-if="!sidebarCollapsed" class="view-toggle-label truncate">{{ t(item.labelKey) }}</span>
        </NuxtLink>
      </nav>

      <div class="hidden border-t border-[var(--color-border)] p-2.5 lg:block">
        <button
          id="sidebar-collapse-btn"
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]"
          :title="sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
          :aria-label="sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
          :aria-expanded="!sidebarCollapsed"
          @click="toggleSidebar"
        >
          <NavIcon name="sidebar-collapse" class="h-4 w-4 transition-transform" :class="{ 'rotate-180': sidebarCollapsed }" />
          <span v-if="!sidebarCollapsed">{{ t('sidebar.collapse') }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace Column -->
    <div
      class="flex min-h-screen flex-col pb-20 lg:pb-0 lg:transition-all"
      :class="sidebarCollapsed ? 'lg:pl-[var(--sidebar-collapsed-width)]' : 'lg:pl-[var(--sidebar-width)]'"
    >
      <!-- Contextual Top Command Bar -->
      <header class="header sticky top-0 z-[var(--z-topbar)] flex h-[var(--topbar-height)] items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-component-header)] px-3 sm:px-5">
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex items-center gap-2 lg:hidden">
            <img src="/brand-logo.png" alt="SGSK Wealth" class="h-6 w-6 object-contain" />
            <span class="logo-text text-sm font-bold text-[var(--color-text-primary)]">SGSK</span>
          </div>
          <div class="hidden items-center gap-2 text-xs lg:flex">
            <span class="text-[var(--color-text-muted)]">{{ t('sidebar.workspaceLabel') }}</span>
            <span class="text-[var(--color-text-muted)]" aria-hidden="true">/</span>
            <span id="desktop-topbar-title" class="font-semibold text-[var(--color-text-primary)]">
              {{ t(activeViewLabelKey) }}
            </span>
          </div>
        </div>

        <div class="header-right flex items-center gap-1.5 sm:gap-2">
          <div
            v-if="hasRate || exchangeRate > 0"
            class="hidden items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs md:flex"
            :title="`Exchange Rate: 1 USD = ${exchangeRate.toFixed(2)} THB`"
          >
            <span class="text-[11px] font-medium text-[var(--color-text-muted)]">USD/THB</span>
            <span class="font-mono font-semibold text-[var(--color-text-primary)]">{{ exchangeRate.toFixed(2) }}</span>
          </div>

          <div
            id="currency-toggle"
            class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
            role="group"
            :aria-label="t('settings.currencyLabel')"
          >
            <button
              id="currency-btn-thb"
              type="button"
              class="currency-btn rounded px-2 py-1 text-[11px] font-semibold transition-colors"
              :class="settings.currency === 'THB' ? 'currency-btn-active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              :title="t('header.currencyThb')"
              :aria-label="t('header.currencyThb')"
              @click="setCurrency('THB'); void refreshAll()"
            >
              THB
            </button>
            <button
              id="currency-btn-usd"
              type="button"
              class="currency-btn rounded px-2 py-1 text-[11px] font-semibold transition-colors"
              :class="settings.currency === 'USD' ? 'currency-btn-active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              :title="t('header.currencyUsd')"
              :aria-label="t('header.currencyUsd')"
              @click="setCurrency('USD'); void refreshAll()"
            >
              USD
            </button>
          </div>

          <div
            id="lang-toggle"
            class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
            role="group"
            :aria-label="t('header.language')"
          >
            <button
              id="lang-btn-en"
              type="button"
              class="lang-btn rounded px-2 py-1 text-[11px] font-semibold transition-colors"
              :class="settings.language === 'en' ? 'lang-btn-active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              :title="t('header.langEn')"
              :aria-label="t('header.langEn')"
              @click="setLanguage('en')"
            >
              EN
            </button>
            <button
              id="lang-btn-th"
              type="button"
              class="lang-btn rounded px-2 py-1 text-[11px] font-semibold transition-colors"
              :class="settings.language === 'th' ? 'lang-btn-active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
              :title="t('header.langTh')"
              :aria-label="t('header.langTh')"
              @click="setLanguage('th')"
            >
              ไทย
            </button>
          </div>

          <button
            id="privacy-toggle-btn"
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]"
            :class="{ 'privacy-active border-[var(--color-accent)] text-[var(--color-accent)]': settings.privacyMode }"
            :title="settings.privacyMode ? t('header.privacyShow') : t('header.privacyHide')"
            :aria-label="settings.privacyMode ? t('header.privacyShow') : t('header.privacyHide')"
            @click="togglePrivacyMode"
          >
            <NavIcon :name="settings.privacyMode ? 'eye-off' : 'eye'" :active="settings.privacyMode" class="h-4 w-4" />
          </button>

          <div class="relative">
            <button
              id="user-menu-btn"
              type="button"
              class="inline-flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs hover:bg-[var(--color-surface-overlay)]"
              :aria-expanded="isUserMenuOpen"
              :aria-label="t('userMenu.ariaLabel')"
              @click="isUserMenuOpen = !isUserMenuOpen"
            >
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[10px] font-bold text-[var(--color-accent)]">
                <img v-if="authState.avatarUrl" :src="authState.avatarUrl" alt="" class="h-full w-full rounded-full object-cover" />
                <template v-else>{{ userInitial }}</template>
              </span>
              <span class="hidden max-w-[96px] truncate font-medium sm:inline">
                {{ authState.authenticated ? authState.displayName : t('userMenu.guestName') }}
              </span>
              <UiAppBadge :tone="authState.portfolioSource === 'google_sheets' ? 'positive' : 'neutral'" class="hidden sm:inline-flex">
                {{ authState.portfolioSource === 'google_sheets' ? t('userMenu.cloudBadge') : t('userMenu.localBadge') }}
              </UiAppBadge>
            </button>

            <div
              v-if="isUserMenuOpen"
              class="fixed inset-0 z-[var(--z-backdrop)] bg-transparent"
              @click="isUserMenuOpen = false"
            />

            <div
              v-if="isUserMenuOpen"
              id="user-menu-dropdown"
              role="menu"
              class="absolute right-0 top-[calc(100%+6px)] z-[var(--z-popover)] w-64 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 shadow-2xl"
            >
              <div class="mb-2 border-b border-[var(--color-border)] px-2 pb-2">
                <div class="text-xs font-semibold text-[var(--color-text-primary)]">
                  {{ authState.authenticated ? authState.displayName : t('userMenu.guestName') }}
                </div>
                <div class="truncate text-[11px] text-[var(--color-text-muted)]">
                  {{ authState.authenticated ? authState.email : t('userMenu.guestSub') }}
                </div>
                <UiAppBadge class="mt-1.5" :tone="authState.canViewCloudPortfolio ? 'positive' : 'neutral'">
                  <template v-if="authState.canViewCloudPortfolio">{{ t('userMenu.ownerRole') }}</template>
                  <template v-else-if="authState.authenticated">{{ t('userMenu.standardRole') }}</template>
                  <template v-else>{{ t('userMenu.guestRole') }}</template>
                </UiAppBadge>
              </div>

              <button
                id="user-menu-settings-btn"
                type="button"
                role="menuitem"
                class="flex w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
                @click="isUserMenuOpen = false; showSettings = true"
              >
                {{ t('userMenu.settings') }}
              </button>

              <button
                v-if="authState.portfolioSource === 'local'"
                id="user-menu-local-data-btn"
                type="button"
                role="menuitem"
                class="flex w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
                @click="isUserMenuOpen = false; showLocalModal = true"
              >
                {{ t('userMenu.manageLocal') }}
              </button>

              <button
                v-if="!authState.authenticated"
                id="user-menu-signin-btn"
                type="button"
                role="menuitem"
                class="mt-1 flex w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-overlay)]"
                @click="isUserMenuOpen = false; openAuthModal(true)"
              >
                {{ t('userMenu.signIn') }}
              </button>

              <button
                v-else
                id="user-menu-signout-btn"
                type="button"
                role="menuitem"
                class="mt-1 flex w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs font-semibold text-[var(--color-pl-negative)] hover:bg-[var(--color-surface-overlay)]"
                @click="isUserMenuOpen = false; void signOut()"
              >
                {{ t('userMenu.signOut') }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="main-content mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
        <!-- Local Portfolio Workspace Banner -->
        <section
          v-if="authState.portfolioSource === 'local'"
          id="local-workspace-bar"
          class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3"
        >
          <div class="space-y-0.5">
            <strong class="block text-xs font-semibold text-[var(--color-text-primary)]">{{ t('localPortfolio.bannerTitle') }}</strong>
            <span class="block text-xs text-[var(--color-text-muted)]">
              {{ t('localPortfolio.bannerSub', { count: transactions.length }) }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiAppButton
              v-if="transactions.length === 0"
              id="local-bar-sample-btn"
              size="xs"
              @click="resetToSample"
            >
              {{ t('localPortfolio.loadSampleBtn') }}
            </UiAppButton>
            <UiAppButton
              id="local-bar-add-btn"
              variant="primary"
              size="xs"
              @click="showLocalModal = true"
            >
              {{ t('localPortfolio.addTxBtn') }}
            </UiAppButton>
          </div>
        </section>

        <!-- Local Partial Quote Refresh Warning -->
        <section
          v-if="authState.portfolioSource === 'local' && pricesError"
          id="local-quotes-warning"
          role="status"
          class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-financial-warning-border)] bg-[var(--color-financial-warning-soft)] px-4 py-2.5 text-xs text-[var(--color-financial-warning)]"
        >
          <span>{{ t('app.error.partialQuotes') }}</span>
          <UiAppButton id="local-quotes-retry-btn" size="xs" @click="refreshAll">
            {{ t('common.retry') }}
          </UiAppButton>
        </section>

        <!-- API Error Banner -->
        <div
          v-if="errorMessage"
          id="error-state"
          class="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-pl-negative-border)] bg-[var(--color-pl-negative-soft)] p-6 text-center"
        >
          <p class="text-sm font-semibold text-[var(--color-text-primary)]">{{ t('app.error.unableData') }}</p>
          <p class="text-xs text-[var(--color-pl-negative)]">{{ errorMessage }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <UiAppButton v-if="isUnauthorizedError" id="reauth-btn" size="sm" @click="openAuthModal(true)">
              {{ t('app.error.signInAgain') }}
            </UiAppButton>
            <UiAppButton id="retry-btn" variant="primary" size="sm" @click="refreshAll">
              {{ t('common.retry') }}
            </UiAppButton>
          </div>
        </div>

        <LoadingScreen
          v-if="loading && authState.portfolioSource === 'google_sheets' && !errorMessage"
          variant="inline"
          :status-tag="t('loading.tag.fifoEngine')"
          :title="t('loading.liveQuotes')"
        />

        <slot v-else-if="!errorMessage" />
      </main>
    </div>

    <UserSettingsModal :open="showSettings" @close="showSettings = false" />
    <LocalPortfolioModal :open="showLocalModal" @close="showLocalModal = false" />
  </div>
</template>
