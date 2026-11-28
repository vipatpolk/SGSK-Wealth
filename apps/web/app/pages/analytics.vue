<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
const { settings } = useUserSettings();
const { holdings, allocation, getPerformance, refreshPerformance, exchangeRate, hasRate } = usePortfolioData();

const subTab = ref<'overview' | 'allocation' | 'performance'>('overview');
const timeframe = ref('ALL');
const startDate = ref('');
const endDate = ref('');

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'overview' || tab === 'allocation' || tab === 'performance') {
      subTab.value = tab;
    }
  },
  { immediate: true },
);

function onDateRangeChange(next: { timeframe: string; startDate: string; endDate: string }) {
  timeframe.value = next.timeframe;
  startDate.value = next.startDate;
  endDate.value = next.endDate;
  void refreshPerformance(next.timeframe, next.startDate, next.endDate);
}

const performance = computed(() => getPerformance(timeframe.value, startDate.value, endDate.value));
</script>

<template>
  <div id="analytics-view" class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">{{ t('analytics.title') }}</h2>
        <p class="text-xs text-[var(--color-text-muted)]">{{ t('analytics.subtitle') }}</p>
      </div>

      <div
        class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5"
        role="tablist"
        :aria-label="t('analytics.viewsAria')"
      >
        <button
          id="analytics-tab-overview"
          type="button"
          role="tab"
          :aria-selected="subTab === 'overview'"
          class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="subTab === 'overview' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
          @click="subTab = 'overview'"
        >
          <NavIcon name="dashboard" :active="subTab === 'overview'" class="h-3.5 w-3.5" />
          <span>{{ t('analytics.overview') }}</span>
        </button>
        <button
          id="analytics-tab-allocation"
          type="button"
          role="tab"
          :aria-selected="subTab === 'allocation'"
          class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="subTab === 'allocation' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
          @click="subTab = 'allocation'"
        >
          <NavIcon name="allocation" :active="subTab === 'allocation'" class="h-3.5 w-3.5" />
          <span>{{ t('nav.allocation') }}</span>
        </button>
        <button
          id="analytics-tab-performance"
          type="button"
          role="tab"
          :aria-selected="subTab === 'performance'"
          class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="subTab === 'performance' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
          @click="subTab = 'performance'"
        >
          <NavIcon name="performance" :active="subTab === 'performance'" class="h-3.5 w-3.5" />
          <span>{{ t('nav.performance') }}</span>
        </button>
      </div>
    </div>

    <AnalyticsOverview
      v-if="subTab === 'overview'"
      :holdings-summary="holdings.summary"
      :open-positions="holdings.openPositions"
      :allocation="allocation"
      :performance="performance"
      :currency="settings.currency"
      :exchange-rate="exchangeRate"
      :has-rate="hasRate"
      @switch-tab="subTab = $event"
    />

    <AnalyticsAllocation
      v-else-if="subTab === 'allocation'"
      :open-positions="holdings.openPositions"
      :allocation="allocation"
      :currency="settings.currency"
      :exchange-rate="exchangeRate"
      :has-rate="hasRate"
    />

    <AnalyticsPerformance
      v-else
      :performance="performance"
      :timeframe="timeframe"
      :start-date="startDate"
      :end-date="endDate"
      :currency="settings.currency"
      :exchange-rate="exchangeRate"
      :has-rate="hasRate"
      @date-range-change="onDateRangeChange"
    />
  </div>
</template>
