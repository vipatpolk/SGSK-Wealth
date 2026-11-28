<script setup lang="ts">
import type { PortfolioPosition } from '@sgsk-wealth/contracts';
import {
  convertCurrency,
  displaySymbol,
  getAssetColor,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  getSymbolName,
  getUnitLabel,
} from '@sgsk-wealth/domain';

const route = useRoute();
const { t } = useI18n();
const { settings } = useUserSettings();
const { activeTab, holdings, loading, exchangeRate, hasRate, refreshAll } = usePortfolioData();

const searchQuery = ref('');
const sortBy = ref<'symbol' | 'totalCost' | 'avgCost' | 'value' | 'pl'>('value');
const sortDir = ref<'asc' | 'desc'>('desc');
const selectedClosedAssetType = ref('all');
const expandedSymbols = ref<Record<string, boolean>>({});
const factsheetTarget = ref<{ symbol: string; assetType: string } | null>(null);

const tabDefs = [
  { id: 'all', labelKey: 'tab.allHoldings', icon: 'all' },
  { id: 'us-stock', labelKey: 'tab.usStock', icon: 'us-stock' },
  { id: 'thai-stock', labelKey: 'tab.thaiStock', icon: 'thai-stock' },
  { id: 'crypto', labelKey: 'tab.crypto', icon: 'crypto' },
  { id: 'mutual-fund', labelKey: 'tab.mutualFund', icon: 'mutual-fund' },
  { id: 'bond', labelKey: 'tab.bond', icon: 'bond' },
  { id: 'provident-fund', labelKey: 'tab.pvd', icon: 'pvd' },
  { id: 'closed-position', labelKey: 'tab.closed', icon: 'closed' },
];

const sortOptions = [
  { field: 'symbol' as const, labelKey: 'holdings.sort.symbol' },
  { field: 'totalCost' as const, labelKey: 'holdings.sort.totalCost' },
  { field: 'avgCost' as const, labelKey: 'common.avgCost' },
  { field: 'value' as const, labelKey: 'holdings.sort.value' },
  { field: 'pl' as const, labelKey: 'holdings.sort.plPctShort' },
];

watch(
  () => [route.query.tab, route.query.symbol] as const,
  ([tab, sym]) => {
    if (typeof tab === 'string' && tab) activeTab.value = tab;
    if (typeof sym === 'string' && sym) searchQuery.value = sym;
  },
  { immediate: true },
);

watch(activeTab, () => {
  void refreshAll();
});

function posName(pos: { symbol: string; name: string; nameTh?: string; assetType: string }) {
  return getSymbolName(pos.symbol, pos.name, settings.value.language, pos.nameTh, pos.assetType) || pos.name;
}

const searchAutocompleteItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const source = activeTab.value === 'closed-position' ? holdings.value.closedPositions : holdings.value.openPositions;
  if (!q) return [];
  return source
    .filter((p) => {
      const loc = posName(p).toLowerCase();
      return (
        p.symbol.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.nameTh || '').toLowerCase().includes(q) ||
        loc.includes(q)
      );
    })
    .map((p) => ({
      symbol: p.symbol,
      displaySymbol: displaySymbol(p.symbol),
      name: posName(p),
    }));
});

const summary = computed(() => holdings.value.summary);

const tabCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {
    all: holdings.value.openPositions.length,
    'closed-position': holdings.value.closedPositions.length,
  };
  for (const p of holdings.value.openPositions) {
    counts[p.assetType] = (counts[p.assetType] ?? 0) + 1;
  }
  return counts;
});

const totalLotsCount = computed(() =>
  holdings.value.openPositions
    .filter((p) => p.assetType !== 'provident-fund')
    .reduce((acc, p) => acc + (p.lots?.length || 0), 0),
);

function isPvdPosition(pos: PortfolioPosition): boolean {
  return pos.assetType === 'provident-fund';
}

function toPosDisplayCurrency(amount: number | undefined | null, fromCurrency: string): number {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  const from = (fromCurrency || 'THB').toUpperCase();
  const to = settings.value.currency.toUpperCase();
  if (from === to) return n;
  return exchangeRate.value > 0 ? convertCurrency(n, from, to, exchangeRate.value) : n;
}

function getPvdMetrics(pos: PortfolioPosition) {
  const targetCurr = settings.value.currency;
  const fromCurr = pos.currency || pos.originalCurrency || 'THB';
  const holdingValue = toPosDisplayCurrency(pos.holdingValue, fromCurr);
  const totalCost = toPosDisplayCurrency(pos.totalCost, fromCurr);
  const empShares = Number(pos.employeeShares || 0);
  const emprShares = Number(pos.employerShares || 0);
  const explicit =
    pos.employeeContribution != null ||
    pos.employerMatching != null ||
    pos.employeeEarnings != null ||
    pos.employerEarnings != null;
  const shareSum = empShares + emprShares;
  const shareRatio = shareSum > 0 ? empShares / shareSum : 0.5;
  const fallbackEarn = holdingValue - totalCost;

  const empPrincipal = explicit ? toPosDisplayCurrency(pos.employeeContribution, fromCurr) : totalCost * shareRatio;
  const empEarnings = explicit ? toPosDisplayCurrency(pos.employeeEarnings, fromCurr) : fallbackEarn * shareRatio;
  const emprPrincipal = explicit ? toPosDisplayCurrency(pos.employerMatching, fromCurr) : totalCost * (1 - shareRatio);
  const emprEarnings = explicit ? toPosDisplayCurrency(pos.employerEarnings, fromCurr) : fallbackEarn * (1 - shareRatio);
  const empTotal = empPrincipal + empEarnings;
  const emprTotal = emprPrincipal + emprEarnings;
  const totalVal = empTotal + emprTotal;
  const empPct = totalVal > 0 ? (empTotal / totalVal) * 100 : shareRatio * 100;
  const emprPct = totalVal > 0 ? 100 - empPct : (1 - shareRatio) * 100;

  return {
    currency: targetCurr,
    empShares,
    emprShares,
    empPct,
    emprPct,
    empPrincipal,
    empEarnings,
    empTotal,
    emprPrincipal,
    emprEarnings,
    emprTotal,
    totalEarnings: empEarnings + emprEarnings,
  };
}

function formatPosQty(pos: PortfolioPosition): string {
  const digits = getQuantityFormat(pos.symbol, pos.assetType) === '1.0-10' ? 10 : isPvdPosition(pos) ? 2 : 6;
  return Number(pos.totalShares || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPosPrice(price: number, pos: PortfolioPosition): string {
  if (isPvdPosition(pos) || pos.assetType === 'mutual-fund') {
    const digits = getPriceFormat(pos.symbol, pos.assetType) === '1.2-4' ? 4 : 2;
    return `${formatMoney(price, pos.currency).replace(/[\d.,]+$/, '')}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
  }
  return formatMoney(price, pos.currency);
}

const filteredOpen = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = holdings.value.openPositions.filter(
    (p) =>
      !q ||
      p.symbol.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.nameTh || '').toLowerCase().includes(q) ||
      posName(p).toLowerCase().includes(q),
  );
  const mult = sortDir.value === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (sortBy.value === 'symbol') return a.symbol.localeCompare(b.symbol) * mult;
    if (sortBy.value === 'totalCost') return (a.totalCost - b.totalCost) * mult;
    if (sortBy.value === 'avgCost') return (a.averageCost - b.averageCost) * mult;
    if (sortBy.value === 'pl') return (a.unrealizedPLPercent - b.unrealizedPLPercent) * mult;
    return (a.holdingValue - b.holdingValue) * mult;
  });
});

const pvdPositions = computed(() =>
  holdings.value.openPositions.filter((position) => position.assetType === 'provident-fund'),
);

const closedAssetTypeOptions = computed(() => {
  const counts = new Map<string, number>();
  for (const p of holdings.value.closedPositions) {
    counts.set(p.assetType, (counts.get(p.assetType) ?? 0) + 1);
  }
  return [
    { id: 'all', label: t('asset.all'), count: holdings.value.closedPositions.length },
    { id: 'us-stock', label: t('asset.usStock'), count: counts.get('us-stock') ?? 0 },
    { id: 'thai-stock', label: t('asset.thaiStock'), count: counts.get('thai-stock') ?? 0 },
    { id: 'crypto', label: t('asset.crypto'), count: counts.get('crypto') ?? 0 },
    { id: 'mutual-fund', label: t('asset.mutualFund'), count: counts.get('mutual-fund') ?? 0 },
    { id: 'bond', label: t('asset.bond'), count: counts.get('bond') ?? 0 },
  ].filter((o) => o.id === 'all' || o.count > 0);
});

const filteredClosed = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return holdings.value.closedPositions.filter((p) => {
    if (selectedClosedAssetType.value !== 'all' && p.assetType !== selectedClosedAssetType.value) return false;
    if (
      q &&
      !p.symbol.toLowerCase().includes(q) &&
      !p.name.toLowerCase().includes(q) &&
      !(p.nameTh || '').toLowerCase().includes(q) &&
      !posName(p).toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
});

function setSort(field: typeof sortBy.value) {
  if (sortBy.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  else {
    sortBy.value = field;
    sortDir.value = field === 'symbol' ? 'asc' : 'desc';
  }
}

function toggleLots(symbol: string) {
  expandedSymbols.value = { ...expandedSymbols.value, [symbol]: !expandedSymbols.value[symbol] };
}

function expandAll() {
  const next: Record<string, boolean> = {};
  for (const p of filteredOpen.value) next[p.symbol] = true;
  expandedSymbols.value = next;
}

function collapseAll() {
  expandedSymbols.value = {};
}
</script>

<template>
  <div id="holdings-view" class="space-y-4">
    <!-- Header + Market/PVD Mode Switcher -->
    <div id="holdings-screen-header" class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          {{ activeTab === 'provident-fund' ? t('holdings.subtabPvd') : t('holdings.title') }}
        </h2>
        <p class="text-xs text-[var(--color-text-muted)]">
          {{ activeTab === 'provident-fund' ? t('holdings.subtitlePvd') : t('holdings.subtitleMarket') }}
        </p>
      </div>

      <div id="holdings-screen-toggle" class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5" role="tablist" :aria-label="t('holdings.modeAria')">
        <button
          id="holdings-subtab-market"
          type="button"
          role="tab"
          class="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="activeTab !== 'provident-fund' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
          :aria-selected="activeTab !== 'provident-fund' ? 'true' : 'false'"
          @click="activeTab = 'all'"
        >
          {{ t('holdings.subtabMarket') }}
        </button>
        <button
          id="holdings-subtab-pvd"
          type="button"
          role="tab"
          class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="activeTab === 'provident-fund' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
          :aria-selected="activeTab === 'provident-fund' ? 'true' : 'false'"
          @click="activeTab = 'provident-fund'"
        >
          <span>{{ t('holdings.subtabPvd') }}</span>
          <span
            v-if="pvdPositions.length > 0"
            class="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
            :class="activeTab === 'provident-fund' ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'"
          >
            {{ pvdPositions.length }}
          </span>
        </button>
      </div>
    </div>

    <PvdHoldings
      v-if="activeTab === 'provident-fund'"
      :positions="pvdPositions"
      :currency="holdings.currency"
      :exchange-rate="exchangeRate"
      :has-rate="hasRate"
      :loading="loading"
      :privacy-mode="settings.privacyMode"
      @refresh="refreshAll"
      @open-factsheet="(sym, at) => { factsheetTarget = { symbol: sym, assetType: at }; }"
    />

    <template v-else>
      <!-- Executive Portfolio Hero -->
      <div id="portfolio-hero" class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <div class="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('holdings.netValue') }}</span>
            <div class="mt-1 flex flex-wrap items-baseline gap-3">
              <h2 class="hero-total-val font-mono text-2xl font-bold text-[var(--color-text-primary)]">
                {{ formatMoney(summary.totalValue > 0 ? summary.totalValue : summary.totalInvested, settings.currency) }}
              </h2>
              <SecondaryCurrency
                :amount="summary.totalValue > 0 ? summary.totalValue : summary.totalInvested"
                :exchange-rate="exchangeRate"
                :has-rate="hasRate"
                variant="inline"
              />
            </div>
          </div>
          <UiAppBadge v-if="summary.totalUnrealizedPL !== 0 || summary.totalRealizedPL !== 0" :tone="summary.totalReturn >= 0 ? 'positive' : 'negative'" class="font-mono">
            {{ formatSignedMoney(summary.totalReturn, settings.currency) }} ({{ formatPercent(summary.totalReturnPercent) }})
          </UiAppBadge>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <UiKpiStatCard :label="t('dash.investedCapital')" :value="formatMoney(summary.totalInvested, settings.currency)" :secondary-amount="summary.totalInvested" :exchange-rate="exchangeRate" :has-rate="hasRate" masked />
          <UiKpiStatCard :label="t('holdings.realizedReturn')" :value="formatSignedMoney(summary.totalRealizedPL, settings.currency)" :tone="summary.totalRealizedPL >= 0 ? 'positive' : 'negative'" :secondary-amount="summary.totalRealizedPL" :exchange-rate="exchangeRate" :has-rate="hasRate" secondary-signed masked />
          <UiKpiStatCard :label="t('holdings.openPositions')" :value="String(holdings.openPositions.length)" :subtext="t('holdings.symbolsOpenClosed', { open: holdings.openPositions.length, closed: holdings.closedPositions.length })" />
          <UiKpiStatCard :label="t('holdings.totalLots')" :value="String(totalLotsCount)" :subtext="t('holdings.lotsUnit')" />
        </div>
      </div>

      <!-- 8-Tab Asset Bar -->
      <nav id="tab-bar" class="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        <button
          v-for="tab in tabDefs"
          :id="`tab-${tab.id}`"
          :key="tab.id"
          type="button"
          class="tab-button inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            activeTab === tab.id
              ? 'tab-active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]'
          "
          @click="activeTab = tab.id"
        >
          <NavIcon :name="tab.icon" :active="activeTab === tab.id" class="h-3.5 w-3.5" />
          <span>{{ t(tab.labelKey) }}</span>
          <span v-if="(tabCounts[tab.id] ?? 0) > 0" class="rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px]">
            {{ tabCounts[tab.id] }}
          </span>
        </button>
      </nav>

      <!-- Search & Action Controls -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="w-full sm:w-80">
          <UiAppSearchAutocomplete
            v-model="searchQuery"
            :items="searchAutocompleteItems"
            :placeholder="t('common.searchPlaceholder')"
            input-id="holdings-search-input"
            dropdown-id="search-autocomplete-dropdown"
            clear-btn-id="search-clear-btn"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiAppButton id="holdings-refresh-btn" size="sm" :disabled="loading" @click="refreshAll">
            {{ t('app.refreshShort') }}
          </UiAppButton>
          <UiAppButton v-if="activeTab !== 'closed-position'" id="holdings-expand-all-btn" size="sm" @click="expandAll">
            {{ t('common.expandAll') }}
          </UiAppButton>
          <UiAppButton v-if="activeTab !== 'closed-position'" id="holdings-collapse-all-btn" size="sm" @click="collapseAll">
            {{ t('common.collapseAll') }}
          </UiAppButton>
        </div>
      </div>

      <!-- Closed Positions Asset Filter -->
      <div v-if="activeTab === 'closed-position'" id="closed-asset-filter-bar" class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-medium text-[var(--color-text-muted)]">{{ t('holdings.filterType') }}</span>
        <button
          v-for="opt in closedAssetTypeOptions"
          :id="`filter-asset-${opt.id}`"
          :key="opt.id"
          type="button"
          class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium"
          :class="
            selectedClosedAssetType === opt.id
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
          "
          @click="selectedClosedAssetType = opt.id"
        >
          {{ opt.label }} ({{ opt.count }})
        </button>
      </div>

      <!-- Pill Sort Bar -->
      <div id="sort-bar" class="flex flex-wrap items-center gap-1.5">
        <span class="mr-1 text-xs text-[var(--color-text-muted)]">{{ t('holdings.sortByLabel') }}</span>
        <button
          v-for="opt in sortOptions"
          :id="`sort-${opt.field}`"
          :key="opt.field"
          type="button"
          class="sort-pill inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            sortBy === opt.field
              ? 'sort-pill-active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
          "
          @click="setSort(opt.field)"
        >
          <span>{{ t(opt.labelKey) }}</span>
          <span v-if="sortBy === opt.field" :class="{ 'sort-arrow-up': sortDir === 'asc' }" class="font-mono text-[10px]">
            {{ sortDir === 'asc' ? '↑' : '↓' }}
          </span>
        </button>
      </div>

      <!-- Open Positions -->
      <template v-if="activeTab !== 'closed-position'">
        <div class="space-y-2.5">
          <div
            v-for="pos in filteredOpen"
            :id="`card-${pos.symbol}`"
            :key="pos.symbol"
            :data-symbol-lots="pos.symbol"
            class="symbol-card overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
            :class="{ 'symbol-card-pvd border-amber-500/30': isPvdPosition(pos) }"
          >
            <div
              :id="`toggle-${pos.symbol}`"
              role="button"
              tabindex="0"
              class="card-header flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-[var(--color-card-hover)] lg:flex-row lg:items-center"
              @click="toggleLots(pos.symbol)"
              @keydown.enter.prevent="toggleLots(pos.symbol)"
              @keydown.space.prevent="toggleLots(pos.symbol)"
            >
              <div class="flex min-w-0 items-center gap-3">
                <SymbolIcon :symbol="pos.symbol" :asset-type="pos.assetType" :size="38" :fund-name="pos.pvdFundName" />
                {{ ' ' }}
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="symbol-badge rounded px-2 py-0.5 font-mono text-xs font-bold border"
                      :style="{
                        backgroundColor: `${getSymbolColor(pos.symbol)}18`,
                        color: getSymbolColor(pos.symbol),
                        borderColor: `${getSymbolColor(pos.symbol)}30`,
                      }"
                    >
                      {{ displaySymbol(pos.symbol) }}
                    </span>
                    {{ ' ' }}
                    <span class="symbol-name truncate text-sm font-semibold text-[var(--color-text-primary)]" :title="posName(pos)">
                      {{ posName(pos) }}
                    </span>
                    <button
                      v-if="pos.assetType === 'mutual-fund' || pos.assetType === 'provident-fund'"
                      :id="`btn-factsheet-${pos.symbol}`"
                      type="button"
                      class="factsheet-icon-btn inline-flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                      :title="t('factsheet.viewBtn')"
                      @click.stop="factsheetTarget = { symbol: pos.symbol, assetType: pos.assetType }"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </button>
                  </div>
                  <div v-if="isPvdPosition(pos) && pos.pvdFundName" class="flex flex-wrap items-center gap-1.5">
                    <span class="pvd-fund-badge inline-flex items-center rounded bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                      {{ pos.pvdFundName }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                    <UiAppBadge :color="getAssetColor(pos.assetType)">{{ pos.assetTypeLabel }}</UiAppBadge>
                    <span class="card-shares privacy-mask font-mono">{{ formatPosQty(pos) }} {{ getUnitLabel(pos.symbol, pos.assetType, settings.language) }}</span>
                    <span v-if="!isPvdPosition(pos)" class="card-lots-count">{{ pos.lots.length }} {{ pos.lots.length === 1 ? t('common.lot') : t('common.lots') }}</span>
                    <div
                      v-if="isPvdPosition(pos)"
                      class="card-pvd-split card-pvd-split-container inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px]"
                      :title="t('summary.pvdTooltip', {
                        empVal: getPvdMetrics(pos).empShares.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        empPct: getPvdMetrics(pos).empPct.toFixed(1),
                        emprVal: getPvdMetrics(pos).emprShares.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        emprPct: getPvdMetrics(pos).emprPct.toFixed(1),
                      })"
                    >
                      <span class="font-medium text-sky-500">{{ t('summary.empShort') }} {{ Math.round(getPvdMetrics(pos).empPct) }}%</span>
                      <span class="inline-flex h-1.5 w-12 overflow-hidden rounded-full bg-[var(--color-border)]">
                        <span class="pvd-segment-employee h-full bg-sky-500" :style="{ width: `${getPvdMetrics(pos).empPct}%` }" />
                        <span class="pvd-segment-employer h-full bg-amber-500" :style="{ width: `${getPvdMetrics(pos).emprPct}%` }" />
                      </span>
                      <span class="font-medium text-amber-500">{{ t('summary.coShort') }} {{ Math.round(getPvdMetrics(pos).emprPct) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-center lg:gap-5">
                <div class="text-left lg:text-right">
                  <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.totalCost') }}</div>
                  <div class="privacy-mask font-mono text-xs font-semibold">{{ formatMoney(pos.totalCost, pos.currency) }}</div>
                  <SecondaryCurrency :amount="pos.totalCost" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
                </div>
                <div class="text-left lg:text-right">
                  <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.avgCost') }}</div>
                  <div class="font-mono text-xs font-semibold">{{ formatPosPrice(pos.averageCost, pos) }}</div>
                </div>
                <div class="text-left lg:text-right">
                  <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ pos.assetType === 'mutual-fund' || isPvdPosition(pos) ? t('summary.nav') : t('summary.mktPrice') }}</div>
                  <div class="font-mono text-xs font-semibold">{{ formatPosPrice(pos.currentPrice, pos) }}</div>
                </div>
                <div class="text-left lg:text-right">
                  <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('summary.holdingValue') }}</div>
                  <div class="privacy-mask font-mono text-xs font-bold text-[var(--color-text-primary)]">{{ formatMoney(pos.holdingValue, pos.currency) }}</div>
                  <SecondaryCurrency :amount="pos.holdingValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
                </div>
                <div class="text-left lg:text-right">
                  <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.unrealizedPL') }}</div>
                  <div class="font-mono text-xs font-bold" :class="pos.unrealizedPL >= 0 ? 'pl-positive' : 'pl-negative'">
                    <span class="privacy-mask">{{ formatSignedMoney(pos.unrealizedPL, pos.currency) }}</span>
                    <span class="pl-percent ml-1">({{ formatPercent(pos.unrealizedPLPercent) }})</span>
                  </div>
                </div>
                <NuxtLink
                  v-if="!isPvdPosition(pos)"
                  :to="`/transactions?symbol=${encodeURIComponent(pos.symbol)}`"
                  data-testid="holdings-view-trades"
                  class="inline-flex h-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[11px] font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  @click.stop
                >
                  {{ t('summary.viewTrades') }}
                </NuxtLink>
              </div>
            </div>

            <!-- Expanded Detail Drawer: Contribution Breakdown for PVD, FIFO Share Lots for Market Assets -->
            <template v-if="Boolean(expandedSymbols[pos.symbol])">
              <div
                v-if="isPvdPosition(pos)"
                :id="`lots-${pos.symbol}`"
                class="pvd-expanded-container space-y-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div class="pvd-expanded-header flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                    <span>{{ t('summary.contribBreakdown') }}</span>
                  </div>
                  <span class="pvd-snapshot-pill rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                    {{ t('summary.officialSnapshot') }}
                  </span>
                </div>

                <div class="pvd-dual-cards grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div class="pvd-contrib-card pvd-card-employee rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 space-y-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <div class="text-xs font-bold text-[var(--color-text-primary)]">{{ t('summary.empContribTitle') }}</div>
                        <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('summary.empContribSub') }}</div>
                      </div>
                      <span class="pvd-ratio-badge pvd-ratio-emp rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-500">
                        {{ getPvdMetrics(pos).empPct.toFixed(1) }}%
                      </span>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('summary.accumulatedValue') }}</div>
                      <div class="privacy-mask font-mono text-base font-bold text-[var(--color-text-primary)]">
                        {{ formatMoney(getPvdMetrics(pos).empTotal, pos.currency) }}
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-2 text-xs">
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.principalLabel') }}</div>
                        <div class="privacy-mask font-mono font-semibold">{{ formatMoney(getPvdMetrics(pos).empPrincipal, pos.currency) }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.earningsGain') }}</div>
                        <div class="privacy-mask font-mono font-semibold" :class="getPvdMetrics(pos).empEarnings >= 0 ? 'pl-positive' : 'pl-negative'">
                          {{ formatSignedMoney(getPvdMetrics(pos).empEarnings, pos.currency) }}
                        </div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('pvd.unitsLabel') }}</div>
                        <div class="privacy-mask font-mono">{{ getPvdMetrics(pos).empShares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.nav') }}</div>
                        <div class="font-mono">{{ formatPosPrice(pos.currentPrice, pos) }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="pvd-contrib-card pvd-card-employer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 space-y-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <div class="text-xs font-bold text-[var(--color-text-primary)]">{{ t('summary.emprMatchTitle') }}</div>
                        <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('summary.emprMatchSub') }}</div>
                      </div>
                      <span class="pvd-ratio-badge pvd-ratio-co rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-500">
                        {{ getPvdMetrics(pos).emprPct.toFixed(1) }}%
                      </span>
                    </div>
                    <div>
                      <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('summary.matchedValue') }}</div>
                      <div class="privacy-mask font-mono text-base font-bold text-[var(--color-text-primary)]">
                        {{ formatMoney(getPvdMetrics(pos).emprTotal, pos.currency) }}
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-2 text-xs">
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.matchingLabel') }}</div>
                        <div class="privacy-mask font-mono font-semibold">{{ formatMoney(getPvdMetrics(pos).emprPrincipal, pos.currency) }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.earningsGain') }}</div>
                        <div class="privacy-mask font-mono font-semibold" :class="getPvdMetrics(pos).emprEarnings >= 0 ? 'pl-positive' : 'pl-negative'">
                          {{ formatSignedMoney(getPvdMetrics(pos).emprEarnings, pos.currency) }}
                        </div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('pvd.unitsLabel') }}</div>
                        <div class="privacy-mask font-mono">{{ getPvdMetrics(pos).emprShares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{{ t('summary.nav') }}</div>
                        <div class="font-mono">{{ formatPosPrice(pos.currentPrice, pos) }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pvd-footer-banner flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-xs">
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span v-if="pos.pvdFundName">
                      <span class="text-[var(--color-text-muted)]">{{ t('summary.pvdFundLabel') }}:</span>
                      <strong class="ml-1 text-[var(--color-text-primary)]">{{ pos.pvdFundName }}</strong>
                    </span>
                    <span>
                      <span class="text-[var(--color-text-muted)]">{{ t('summary.fundPolicyLabel') }}:</span>
                      <strong class="ml-1 text-[var(--color-text-primary)]">{{ posName(pos) }}</strong>
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                    <span>
                      <span class="text-[var(--color-text-muted)]">{{ t('summary.totalUnits') }}:</span>
                      <strong class="privacy-mask ml-1">{{ formatPosQty(pos) }}</strong>
                    </span>
                    <span>
                      <span class="text-[var(--color-text-muted)]">{{ t('common.totalCost') }}:</span>
                      <strong class="privacy-mask ml-1">{{ formatMoney(pos.totalCost, pos.currency) }}</strong>
                    </span>
                    <span>
                      <span class="text-[var(--color-text-muted)]">{{ t('summary.totalEarnings') }}:</span>
                      <strong class="privacy-mask ml-1" :class="pos.unrealizedPL >= 0 ? 'pl-positive' : 'pl-negative'">{{ formatSignedMoney(pos.unrealizedPL, pos.currency) }}</strong>
                    </span>
                    <span>
                      <span class="text-[var(--color-text-muted)]">{{ t('common.totalValue') }}:</span>
                      <strong class="privacy-mask ml-1 text-[var(--color-accent)]">{{ formatMoney(pos.holdingValue, pos.currency) }}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div v-else :id="`lots-${pos.symbol}`" class="lots-section overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                <table class="w-full text-left text-xs">
                  <thead class="text-[11px] uppercase text-[var(--color-text-muted)]">
                    <tr>
                      <th class="px-4 py-2">{{ t('summary.purchaseDate') }}</th>
                      <th class="px-4 py-2 text-right">{{ t('common.shares') }}</th>
                      <th class="px-4 py-2 text-right">{{ t('summary.costBasis') }}</th>
                      <th class="px-4 py-2 text-right">{{ t('common.totalCost') }}</th>
                      <th class="px-4 py-2 text-right">{{ t('summary.holdingValue') }}</th>
                      <th class="px-4 py-2 text-right">{{ t('common.unrealizedPL') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[var(--color-border)]">
                    <tr v-for="(lot, idx) in pos.lots" :key="idx">
                      <td class="px-4 py-2 font-mono">{{ formatDisplayDate(lot.purchaseDate, settings.language) }}</td>
                      <td class="privacy-mask px-4 py-2 text-right font-mono">{{ (lot.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 }) }}</td>
                      <td class="px-4 py-2 text-right font-mono">{{ formatMoney(lot.costBasis ?? 0, lot.currency) }}</td>
                      <td class="privacy-mask px-4 py-2 text-right font-mono">{{ formatMoney(lot.totalCost ?? 0, lot.currency) }}</td>
                      <td class="privacy-mask px-4 py-2 text-right font-mono">{{ formatMoney(lot.holdingValue ?? (lot.quantity ?? 0) * pos.currentPrice, lot.currency) }}</td>
                      <td class="px-4 py-2 text-right font-mono" :class="(lot.unrealizedPL ?? 0) >= 0 ? 'pl-positive' : 'pl-negative'">
                        {{ formatSignedMoney(lot.unrealizedPL ?? 0, lot.currency) }} ({{ formatPercent(lot.unrealizedPLPercent ?? 0) }})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Closed Positions -->
      <template v-else>
        <div class="space-y-2.5">
          <div
            v-for="cp in filteredClosed"
            :id="`card-${cp.symbol}`"
            :key="cp.symbol"
            class="symbol-card flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4"
          >
            <div class="flex items-center gap-3">
              <SymbolIcon :symbol="cp.symbol" :asset-type="cp.assetType" :size="36" />
              {{ ' ' }}
              <div>
                <div class="font-mono text-xs font-bold">{{ displaySymbol(cp.symbol) }}</div>
                <div class="symbol-name text-sm font-semibold text-[var(--color-text-primary)]">{{ posName(cp) }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 font-mono text-xs sm:flex sm:items-center sm:gap-6">
              <div>
                <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('summary.closedShares') }}</div>
                <div class="privacy-mask font-semibold">{{ cp.totalShares }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.totalCost') }}</div>
                <div class="privacy-mask font-semibold">{{ formatMoney(cp.totalCost, cp.currency) }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('summary.totalProceeds') }}</div>
                <div class="privacy-mask font-semibold">{{ formatMoney(cp.totalProceeds, cp.currency) }}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.realizedPL') }}</div>
                <div class="font-bold" :class="cp.realizedPL >= 0 ? 'pl-positive' : 'pl-negative'">
                  {{ formatSignedMoney(cp.realizedPL, cp.currency) }} ({{ formatPercent(cp.realizedPLPercent) }})
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <FundFactsheetModal
      :open="Boolean(factsheetTarget)"
      :symbol="factsheetTarget?.symbol ?? null"
      :asset-type="factsheetTarget?.assetType"
      @close="factsheetTarget = null"
    />
  </div>
</template>
