<script setup lang="ts">
import type { PortfolioPerformanceResponse } from '@sgsk-wealth/contracts';
import { displaySymbol, getAssetColor, getAssetTypeLabel, getSymbolColor, getSymbolName } from '@sgsk-wealth/domain';

type PerfSortField =
  | 'symbol'
  | 'totalReturnPercent'
  | 'totalReturn'
  | 'investedCost'
  | 'currentValue'
  | 'realizedPL'
  | 'unrealizedPL';

const props = defineProps<{
  performance: PortfolioPerformanceResponse;
  timeframe: string;
  startDate: string;
  endDate: string;
  currency: string;
  exchangeRate: number;
  hasRate: boolean;
}>();

const emit = defineEmits<{
  dateRangeChange: [next: { timeframe: string; startDate: string; endDate: string }];
}>();

const { t, language } = useI18n();

const perfAssetFilter = ref('all');
const perfStatusFilter = ref('all');
const perfSearch = ref('');
const perfSortField = ref<PerfSortField>('symbol');
const perfSortDir = ref<'asc' | 'desc'>('desc');
const showAllPerf = ref(false);
const isSearchOpen = ref(false);
const searchActiveIdx = ref(-1);

const sortOptions = computed<Array<{ field: PerfSortField; label: string }>>(() => [
  { field: 'symbol', label: t('perf.sort.symbol') },
  { field: 'totalReturnPercent', label: t('perf.sort.totalReturnPct') },
  { field: 'totalReturn', label: t('perf.sort.totalReturnAmt') },
  { field: 'investedCost', label: t('perf.sort.investedCost') },
  { field: 'currentValue', label: t('perf.sort.currentValue') },
  { field: 'realizedPL', label: t('perf.sort.realizedPL') },
  { field: 'unrealizedPL', label: t('perf.sort.unrealizedPL') },
]);

const assetTypeOptions = computed(() => {
  const seen = new Set<string>();
  for (const s of props.performance.symbolPerformance || []) seen.add(s.assetType);
  return [
    { value: 'all', label: t('asset.all') },
    ...[...seen].map((type) => ({
      value: type,
      label: getAssetTypeLabel(type, undefined, language.value),
    })),
  ];
});

function symDisplayName(s: { symbol: string; name?: string; nameTh?: string; assetType?: string }) {
  return getSymbolName(s.symbol, s.name || '', language.value, s.nameTh || '', s.assetType) || s.name || s.symbol;
}

function getStatusLabel(status?: string): string {
  const key = (status || 'OPEN').toLowerCase();
  if (key === 'closed') return t('perf.status.closed');
  if (key === 'both') return t('perf.status.both');
  return t('perf.status.open');
}

const perfSummary = computed(() => props.performance.summary);

const assetTypePerformance = computed(() => {
  const fromApi = props.performance.assetTypePerformance || [];
  const rows =
    fromApi.length > 0
      ? fromApi.map((a) => ({
          type: a.assetType,
          label: getAssetTypeLabel(a.assetType, undefined, language.value),
          color: getAssetColor(a.assetType),
          totalReturnPercent: a.totalReturnPercent,
        }))
      : (() => {
          const byType = new Map<string, { invested: number; ret: number }>();
          for (const s of props.performance.symbolPerformance || []) {
            const cur = byType.get(s.assetType) ?? { invested: 0, ret: 0 };
            cur.invested += s.investedCost ?? 0;
            cur.ret += s.totalReturn ?? 0;
            byType.set(s.assetType, cur);
          }
          return [...byType.entries()].map(([type, v]) => ({
            type,
            label: getAssetTypeLabel(type, undefined, language.value),
            color: getAssetColor(type),
            totalReturnPercent: v.invested > 0 ? (v.ret / v.invested) * 100 : 0,
          }));
        })();
  return [...rows].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
});

const maxAbsReturnPercent = computed(() =>
  Math.max(1, ...assetTypePerformance.value.map((a) => Math.abs(a.totalReturnPercent))),
);

const searchFilteredBase = computed(() => {
  const q = perfSearch.value.trim().toLowerCase();
  return (props.performance.symbolPerformance || []).filter((s) => {
    if (!q) return true;
    return (
      s.symbol.toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.nameTh || '').toLowerCase().includes(q) ||
      symDisplayName(s).toLowerCase().includes(q)
    );
  });
});

const topGainers = computed(() =>
  [...searchFilteredBase.value]
    .filter((s) => (s.totalReturnPercent ?? 0) > 0)
    .sort((a, b) => (b.totalReturnPercent ?? 0) - (a.totalReturnPercent ?? 0))
    .slice(0, 5),
);

const topLosers = computed(() =>
  [...searchFilteredBase.value]
    .filter((s) => (s.totalReturnPercent ?? 0) < 0)
    .sort((a, b) => (a.totalReturnPercent ?? 0) - (b.totalReturnPercent ?? 0))
    .slice(0, 5),
);

const autocompleteSuggestions = computed(() => {
  const q = perfSearch.value.trim().toLowerCase();
  const list = props.performance.symbolPerformance || [];
  const matched = q
    ? list.filter((s) => {
        const loc = symDisplayName(s).toLowerCase();
        return (
          s.symbol.toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.nameTh || '').toLowerCase().includes(q) ||
          loc.includes(q)
        );
      })
    : list;
  return matched.map((s) => ({
    ...s,
    displaySym: s.displaySymbol || displaySymbol(s.symbol),
    displayName: symDisplayName(s),
    assetLabel: getAssetTypeLabel(s.assetType, undefined, language.value),
    color: getSymbolColor(s.symbol),
  }));
});

const filteredPerfSymbols = computed(() => {
  const mult = perfSortDir.value === 'asc' ? 1 : -1;
  const rows = searchFilteredBase.value.filter((s) => {
    if (perfAssetFilter.value !== 'all' && s.assetType !== perfAssetFilter.value) return false;
    if (perfStatusFilter.value !== 'all' && (s.status || 'OPEN').toLowerCase() !== perfStatusFilter.value) return false;
    return true;
  });
  return [...rows].sort((a, b) => {
    if (perfSortField.value === 'symbol') return a.symbol.localeCompare(b.symbol) * mult;
    if (perfSortField.value === 'investedCost') return ((a.investedCost ?? 0) - (b.investedCost ?? 0)) * mult;
    if (perfSortField.value === 'currentValue') return ((a.currentValue ?? 0) - (b.currentValue ?? 0)) * mult;
    if (perfSortField.value === 'realizedPL') return ((a.realizedPL ?? 0) - (b.realizedPL ?? 0)) * mult;
    if (perfSortField.value === 'unrealizedPL') return ((a.unrealizedPL ?? 0) - (b.unrealizedPL ?? 0)) * mult;
    if (perfSortField.value === 'totalReturn') return ((a.totalReturn ?? 0) - (b.totalReturn ?? 0)) * mult;
    return ((a.totalReturnPercent ?? 0) - (b.totalReturnPercent ?? 0)) * mult;
  });
});

const visiblePerfRows = computed(() =>
  showAllPerf.value ? filteredPerfSymbols.value : filteredPerfSymbols.value.slice(0, 10),
);

function togglePerfSort(field: PerfSortField) {
  if (perfSortField.value === field) perfSortDir.value = perfSortDir.value === 'desc' ? 'asc' : 'desc';
  else {
    perfSortField.value = field;
    perfSortDir.value = field === 'symbol' ? 'asc' : 'desc';
  }
}

function selectAutocompleteItem(item: { displaySym: string }) {
  perfSearch.value = item.displaySym;
  isSearchOpen.value = false;
  searchActiveIdx.value = -1;
}

function onSearchKeydown(event: KeyboardEvent) {
  if (!isSearchOpen.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    isSearchOpen.value = true;
  }
  const len = autocompleteSuggestions.value.length;
  if (event.key === 'ArrowDown' && len > 0) {
    event.preventDefault();
    searchActiveIdx.value = (searchActiveIdx.value + 1) % len;
  } else if (event.key === 'ArrowUp' && len > 0) {
    event.preventDefault();
    searchActiveIdx.value = searchActiveIdx.value <= 0 ? len - 1 : searchActiveIdx.value - 1;
  } else if (event.key === 'Enter' && isSearchOpen.value && searchActiveIdx.value >= 0) {
    const picked = autocompleteSuggestions.value[searchActiveIdx.value];
    if (picked) {
      event.preventDefault();
      selectAutocompleteItem(picked);
    }
  } else if (event.key === 'Escape') {
    isSearchOpen.value = false;
    searchActiveIdx.value = -1;
  }
}
</script>

<template>
  <div id="performance-pane" class="space-y-4">
    <!-- Performance Header & Date Range Picker -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-base font-bold tracking-tight text-[var(--color-text-primary)]">{{ t('perf.title') }}</h2>
      <UiAppDateRangePicker
        :timeframe="timeframe"
        :start-date="startDate"
        :end-date="endDate"
        @change="emit('dateRangeChange', $event)"
      />
    </div>

    <!-- 5-Card KPI Strip -->
    <div class="perf-summary-grid grid grid-cols-2 gap-3 lg:grid-cols-5">
      <UiKpiStatCard
        class="perf-summary-card"
        :label="t('common.totalInvested')"
        :value="formatMoney(perfSummary?.totalInvested ?? 0, currency)"
        :secondary-amount="perfSummary?.totalInvested ?? 0"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        masked
      />
      <UiKpiStatCard
        class="perf-summary-card"
        :label="t('common.totalValue')"
        :value="formatMoney(perfSummary?.totalValue ?? 0, currency)"
        :secondary-amount="perfSummary?.totalValue ?? 0"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        masked
      />
      <UiKpiStatCard
        class="perf-summary-card"
        :label="t('common.pl')"
        :value="formatSignedMoney(perfSummary?.totalUnrealizedPL ?? 0, currency)"
        :subtext="formatPercent(perfSummary?.totalUnrealizedPLPercent ?? 0)"
        :tone="(perfSummary?.totalUnrealizedPL ?? 0) >= 0 ? 'positive' : 'negative'"
        :secondary-amount="perfSummary?.totalUnrealizedPL ?? 0"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
      <UiKpiStatCard
        class="perf-summary-card"
        :label="t('common.realizedPL')"
        :value="formatSignedMoney(perfSummary?.totalRealizedPL ?? 0, currency)"
        :subtext="formatPercent(perfSummary?.totalRealizedPLPercent ?? 0)"
        :tone="(perfSummary?.totalRealizedPL ?? 0) >= 0 ? 'positive' : 'negative'"
        :secondary-amount="perfSummary?.totalRealizedPL ?? 0"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
      <UiKpiStatCard
        class="perf-summary-card perf-summary-card-highlight col-span-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/25 lg:col-span-1"
        :label="t('common.totalReturn')"
        :value="formatSignedMoney(perfSummary?.totalReturn ?? 0, currency)"
        :subtext="formatPercent(perfSummary?.totalReturnPercent ?? 0)"
        :tone="(perfSummary?.totalReturn ?? 0) >= 0 ? 'positive' : 'negative'"
        :secondary-amount="perfSummary?.totalReturn ?? 0"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
    </div>

    <!-- Middle Charts Row -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard class="lg:col-span-6">
        <template #header>
          <h3 class="perf-chart-title text-sm font-semibold text-[var(--color-text-primary)]">{{ t('perf.assetTypeReturn') }}</h3>
        </template>
        <div class="space-y-2.5">
          <div v-for="asset in assetTypePerformance" :key="asset.type" class="flex items-center gap-3 text-xs">
            <div class="flex w-32 shrink-0 items-center gap-2">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: asset.color }" />
              <span class="truncate">{{ asset.label }}</span>
            </div>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${(Math.abs(asset.totalReturnPercent) / maxAbsReturnPercent) * 100}%`,
                  backgroundColor: asset.totalReturnPercent >= 0 ? 'var(--color-pl-positive)' : 'var(--color-pl-negative)',
                }"
              />
            </div>
            <span class="w-16 text-right font-mono font-semibold" :class="asset.totalReturnPercent >= 0 ? 'pl-positive' : 'pl-negative'">
              {{ formatPercent(asset.totalReturnPercent) }}
            </span>
          </div>
        </div>
      </UiAppCard>

      <UiAppCard class="lg:col-span-6">
        <template #header>
          <h3 class="perf-chart-title text-sm font-semibold text-[var(--color-text-primary)]">{{ t('perf.topMovers') }}</h3>
        </template>

        <div class="space-y-4">
          <div class="space-y-2">
            <h4 class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pl-positive)]">
              {{ t('perf.topGainers') }}
            </h4>
            <div v-for="g in topGainers" :key="`g-${g.symbol}`" class="perf-rank-item flex items-center gap-2 text-xs">
              <SymbolIcon :symbol="g.symbol" :asset-type="g.assetType" :size="20" />
              {{ ' ' }}
              <span
                class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
                :style="{ backgroundColor: `${getSymbolColor(g.symbol)}18`, color: getSymbolColor(g.symbol), borderColor: `${getSymbolColor(g.symbol)}30` }"
              >
                {{ g.displaySymbol || displaySymbol(g.symbol) }}
              </span>
              {{ ' ' }}
              <span class="perf-rank-name min-w-0 flex-1 truncate text-[var(--color-text-muted)]">{{ symDisplayName(g) }}</span>
              <div class="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-surface-overlay)] sm:block">
                <div
                  class="h-full rounded-full bg-[var(--color-pl-positive)]"
                  :style="{ width: `${((g.totalReturnPercent ?? 0) / (topGainers[0]?.totalReturnPercent || 1)) * 100}%` }"
                />
              </div>
              <span class="w-16 shrink-0 text-right font-mono font-semibold pl-positive">
                {{ formatPercent(g.totalReturnPercent ?? 0) }}
              </span>
            </div>
            <div v-if="topGainers.length === 0" class="text-xs text-[var(--color-text-muted)]">{{ t('analytics.noGainers') }}</div>
          </div>

          <div class="space-y-2 border-t border-[var(--color-border)] pt-3">
            <h4 class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pl-negative)]">
              {{ t('perf.topLosers') }}
            </h4>
            <div v-for="l in topLosers" :key="`l-${l.symbol}`" class="perf-rank-item flex items-center gap-2 text-xs">
              <SymbolIcon :symbol="l.symbol" :asset-type="l.assetType" :size="20" />
              {{ ' ' }}
              <span
                class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
                :style="{ backgroundColor: `${getSymbolColor(l.symbol)}18`, color: getSymbolColor(l.symbol), borderColor: `${getSymbolColor(l.symbol)}30` }"
              >
                {{ l.displaySymbol || displaySymbol(l.symbol) }}
              </span>
              {{ ' ' }}
              <span class="perf-rank-name min-w-0 flex-1 truncate text-[var(--color-text-muted)]">{{ symDisplayName(l) }}</span>
              <div class="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-surface-overlay)] sm:block">
                <div
                  class="h-full rounded-full bg-[var(--color-pl-negative)]"
                  :style="{ width: `${((l.totalReturnPercent ?? 0) / (topLosers[0]?.totalReturnPercent || -1)) * 100}%` }"
                />
              </div>
              <span class="w-16 shrink-0 text-right font-mono font-semibold pl-negative">
                {{ formatPercent(l.totalReturnPercent ?? 0) }}
              </span>
            </div>
            <div v-if="topLosers.length === 0" class="text-xs text-[var(--color-text-muted)]">{{ t('analytics.noLosers') }}</div>
          </div>
        </div>
      </UiAppCard>
    </div>

    <!-- Performance Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
      <!-- Search + Rich Autocomplete -->
      <div class="relative w-full sm:w-72">
        <div class="relative flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            class="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="analytics-perf-search"
            v-model="perfSearch"
            type="search"
            class="perf-search-input h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] pl-9 pr-8 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            :placeholder="t('common.searchPlaceholder')"
            autocomplete="off"
            @focus="isSearchOpen = true"
            @input="isSearchOpen = true; searchActiveIdx = -1"
            @keydown="onSearchKeydown"
          />
          <button
            v-if="perfSearch"
            type="button"
            class="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)]"
            :aria-label="t('common.clearSearch')"
            @click="perfSearch = ''; isSearchOpen = false"
          >
            ✕
          </button>
        </div>

        <div
          v-if="isSearchOpen"
          class="perf-search-backdrop fixed inset-0 z-[var(--z-backdrop)] bg-transparent"
          @mousedown="isSearchOpen = false"
        />

        <div
          v-if="isSearchOpen"
          id="perf-autocomplete-dropdown"
          class="absolute left-0 top-[calc(100%+4px)] z-[var(--z-popover)] w-[min(92vw,380px)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl"
        >
          <div class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[10px] text-[var(--color-text-muted)]">
            <span class="font-semibold uppercase">
              {{
                perfSearch
                  ? t('holdings.matchingSymbols', { count: autocompleteSuggestions.length })
                  : t('holdings.availableSymbols', { count: autocompleteSuggestions.length })
              }}
            </span>
            <span class="hidden sm:inline">{{ t('holdings.searchHint') }}</span>
          </div>

          <div class="max-h-64 overflow-y-auto p-1" role="listbox">
            <button
              v-for="(item, idx) in autocompleteSuggestions"
              :key="item.symbol"
              type="button"
              role="option"
              class="perf-autocomplete-item flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
              :class="searchActiveIdx === idx ? 'bg-[var(--color-surface-overlay)]' : ''"
              @mousedown.prevent="selectAutocompleteItem(item)"
            >
              <div class="flex min-w-0 items-center gap-2">
                <SymbolIcon :symbol="item.symbol" :asset-type="item.assetType" :size="20" />
                {{ ' ' }}
                <span
                  class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
                  :style="{ backgroundColor: `${item.color}18`, color: item.color, borderColor: `${item.color}30` }"
                >
                  {{ item.displaySym }}
                </span>
                {{ ' ' }}
                <div class="min-w-0">
                  <div class="perf-autocomplete-item-name truncate font-medium text-[var(--color-text-primary)]">{{ item.displayName }}</div>
                  <div class="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                    <span>{{ item.assetLabel }}</span>
                    <span>·</span>
                    <span>{{ getStatusLabel(item.status) }}</span>
                  </div>
                </div>
              </div>
              <span
                class="shrink-0 font-mono text-[11px] font-semibold"
                :class="(item.totalReturnPercent ?? 0) >= 0 ? 'pl-positive' : 'pl-negative'"
              >
                {{ formatPercent(item.totalReturnPercent ?? 0) }}
              </span>
            </button>

            <div v-if="autocompleteSuggestions.length === 0" class="px-3 py-3 text-center text-xs text-[var(--color-text-muted)]">
              {{ t('holdings.noMatchQuoted') }} "<strong>{{ perfSearch }}</strong>"
            </div>
          </div>

          <div v-if="perfSearch" class="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-1.5">
            <button
              type="button"
              class="w-full rounded px-2 py-1 text-left text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface-overlay)]"
              @mousedown.prevent="isSearchOpen = false"
            >
              {{ t('perf.filterTableBy', { query: perfSearch, count: filteredPerfSymbols.length }) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filter & Sort Controls (Preserve select index 0=Asset, 1=Status, 2=Sort) -->
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="perfAssetFilter"
          class="perf-filter-select h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs"
          :aria-label="t('holdings.filterType')"
        >
          <option v-for="opt in assetTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <select
          v-model="perfStatusFilter"
          class="perf-filter-select h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs"
          :aria-label="t('perf.allStatus')"
        >
          <option value="all">{{ t('perf.allStatus') }}</option>
          <option value="open">{{ t('common.open') }}</option>
          <option value="closed">{{ t('common.closed') }}</option>
        </select>

        <select
          id="perf-sort-select"
          v-model="perfSortField"
          class="perf-filter-select h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs"
          :aria-label="t('holdings.sortByLabel')"
        >
          <option v-for="opt in sortOptions" :key="opt.field" :value="opt.field">
            {{ t('holdings.sortPrefix', { label: opt.label }) }}
          </option>
        </select>

        <button
          id="perf-sort-dir-btn"
          type="button"
          class="perf-filter-btn inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
          @click="perfSortDir = perfSortDir === 'asc' ? 'desc' : 'asc'"
        >
          {{ perfSortDir === 'asc' ? `↑ ${t('common.asc')}` : `↓ ${t('common.desc')}` }}
        </button>
      </div>
    </div>

    <!-- 7-Column Performance Table -->
    <UiAppCard :padded="false">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] uppercase text-[var(--color-text-muted)]">
            <tr>
              <th class="cursor-pointer px-4 py-2.5" @click="togglePerfSort('symbol')">{{ t('common.symbol') }}</th>
              <th class="px-3 py-2.5">{{ t('common.status') }}</th>
              <th class="cursor-pointer px-3 py-2.5 text-right" @click="togglePerfSort('investedCost')">{{ t('common.invested') }}</th>
              <th class="cursor-pointer px-3 py-2.5 text-right" @click="togglePerfSort('currentValue')">{{ t('common.currentValue') }}</th>
              <th class="cursor-pointer px-3 py-2.5 text-right" @click="togglePerfSort('realizedPL')">{{ t('common.realizedPL') }}</th>
              <th class="cursor-pointer px-3 py-2.5 text-right" @click="togglePerfSort('unrealizedPL')">{{ t('common.unrealizedPL') }}</th>
              <th class="cursor-pointer px-4 py-2.5 text-right" @click="togglePerfSort('totalReturnPercent')">{{ t('common.totalReturn') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr v-for="row in visiblePerfRows" :key="row.symbol" class="perf-table-row hover:bg-[var(--color-surface-overlay)]">
              <td class="px-4 py-2.5">
                <div class="flex flex-wrap items-center gap-2">
                  <SymbolIcon :symbol="row.symbol" :asset-type="row.assetType" :size="22" />
                  {{ ' ' }}
                  <span
                    class="rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                    :style="{ backgroundColor: `${getSymbolColor(row.symbol)}18`, color: getSymbolColor(row.symbol), borderColor: `${getSymbolColor(row.symbol)}30` }"
                  >
                    {{ row.displaySymbol || displaySymbol(row.symbol) }}
                  </span>
                  {{ ' ' }}
                  <span class="symbol-name text-[var(--color-text-secondary)]">{{ symDisplayName(row) }}</span>
                  <span class="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                    {{ getAssetTypeLabel(row.assetType, undefined, language) }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2.5">
                <span
                  class="perf-status-pill inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  :class="
                    (row.status || 'OPEN').toLowerCase() === 'closed'
                      ? 'bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]'
                      : 'bg-[var(--color-pl-positive-soft)] text-[var(--color-pl-positive)]'
                  "
                >
                  {{ getStatusLabel(row.status) }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-right font-mono">
                <div class="privacy-mask">{{ formatMoney(row.investedCost ?? 0, currency) }}</div>
                <SecondaryCurrency :amount="row.investedCost ?? 0" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
              </td>
              <td class="px-3 py-2.5 text-right font-mono">
                <div class="privacy-mask">{{ formatMoney(row.currentValue ?? 0, currency) }}</div>
                <SecondaryCurrency :amount="row.currentValue ?? 0" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
              </td>
              <td class="px-3 py-2.5 text-right font-mono">
                <div class="privacy-mask" :class="(row.realizedPL ?? 0) > 0 ? 'pl-positive' : (row.realizedPL ?? 0) < 0 ? 'pl-negative' : ''">
                  {{ (row.realizedPL ?? 0) !== 0 ? formatSignedMoney(row.realizedPL ?? 0, currency) : formatMoney(0, currency) }}
                </div>
                <SecondaryCurrency
                  v-if="(row.realizedPL ?? 0) !== 0"
                  :amount="row.realizedPL ?? 0"
                  :exchange-rate="exchangeRate"
                  :has-rate="hasRate"
                  variant="table"
                  signed
                />
              </td>
              <td class="px-3 py-2.5 text-right font-mono">
                <div class="privacy-mask" :class="(row.unrealizedPL ?? 0) > 0 ? 'pl-positive' : (row.unrealizedPL ?? 0) < 0 ? 'pl-negative' : ''">
                  {{ (row.unrealizedPL ?? 0) !== 0 ? formatSignedMoney(row.unrealizedPL ?? 0, currency) : formatMoney(0, currency) }}
                </div>
                <SecondaryCurrency
                  v-if="(row.unrealizedPL ?? 0) !== 0"
                  :amount="row.unrealizedPL ?? 0"
                  :exchange-rate="exchangeRate"
                  :has-rate="hasRate"
                  variant="table"
                  signed
                />
              </td>
              <td class="px-4 py-2.5 text-right font-mono font-semibold">
                <div :class="(row.totalReturn ?? 0) >= 0 ? 'pl-positive' : 'pl-negative'">
                  <span class="privacy-mask">{{ formatSignedMoney(row.totalReturn ?? 0, currency) }}</span>
                  <span class="ml-1 text-[11px]">({{ formatPercent(row.totalReturnPercent ?? 0) }})</span>
                </div>
                <SecondaryCurrency
                  :amount="row.totalReturn ?? 0"
                  :exchange-rate="exchangeRate"
                  :has-rate="hasRate"
                  variant="table"
                  signed
                />
              </td>
            </tr>
            <tr v-if="filteredPerfSymbols.length === 0">
              <td colspan="7" class="py-8 text-center text-[var(--color-text-muted)]">{{ t('common.noResults') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredPerfSymbols.length > 10" class="border-t border-[var(--color-border)] p-2.5 text-center">
        <UiAppButton class="perf-show-all-btn" size="xs" variant="ghost" @click="showAllPerf = !showAllPerf">
          {{ showAllPerf ? t('common.showTop10') : t('perf.showAllSymbols', { count: filteredPerfSymbols.length }) }}
        </UiAppButton>
      </div>
    </UiAppCard>
  </div>
</template>
