<script setup lang="ts">
import {
  displaySymbol,
  generateExportFilename,
  generateTransactionsCsv,
  getSymbolColor,
  getSymbolName,
  getUnitLabel,
  resolveSymbolName,
} from '@sgsk-wealth/domain';

const route = useRoute();
const { t } = useI18n();
const { settings } = useUserSettings();
const { holdings, pricesMap, transactionSummaries, exchangeRate, hasRate } = usePortfolioData();

const selectedSymbol = ref<string | null>(null);
const isSymbolDropdownOpen = ref(false);
const isExportMenuOpen = ref(false);
const exportScope = ref<'all' | 'open' | 'closed'>('all');
const exportAssetType = ref('all');
const symbolSearchQuery = ref('');
const dropdownAssetFilter = ref('all');
const search = ref('');
const typeFilter = ref<'all' | 'buy' | 'sell' | 'exchange'>('all');
const assetFilter = ref('all');
const fromDate = ref('');
const toDate = ref('');
const sortOrder = ref<'desc' | 'asc'>('desc');
const currentPage = ref(1);
const pageSize = ref(10);

watch(
  () => route.query.symbol,
  (sym) => {
    if (typeof sym === 'string' && sym.trim()) {
      selectedSymbol.value = sym.trim();
    }
  },
  { immediate: true },
);

function symbolFullName(symbol: string, assetType?: string): string {
  const pos =
    holdings.value.openPositions.find((p) => p.symbol === symbol) ??
    holdings.value.closedPositions.find((p) => p.symbol === symbol);
  return (
    getSymbolName(symbol, pos?.name || '', settings.value.language, pos?.nameTh || '', assetType || pos?.assetType) ||
    resolveSymbolName(symbol, pricesMap.value, settings.value.language, assetType) ||
    displaySymbol(symbol)
  );
}

const marketTransactionSummaries = computed(() =>
  transactionSummaries.value.filter((s) => s.assetType !== 'provident-fund'),
);

const marketOpenPositionsCount = computed(
  () => holdings.value.openPositions.filter((p) => p.assetType !== 'provident-fund').length,
);

const activeSummary = computed(() =>
  selectedSymbol.value ? marketTransactionSummaries.value.find((s) => s.symbol === selectedSymbol.value) ?? null : null,
);

const totalTxCount = computed(() =>
  marketTransactionSummaries.value.reduce((a, s) => a + s.totalTransactions, 0),
);

const dropdownSymbols = computed(() => {
  const q = symbolSearchQuery.value.trim().toLowerCase();
  return marketTransactionSummaries.value.filter((s) => {
    if (dropdownAssetFilter.value !== 'all' && s.assetType !== dropdownAssetFilter.value) return false;
    if (
      q &&
      !s.symbol.toLowerCase().includes(q) &&
      !displaySymbol(s.symbol).toLowerCase().includes(q) &&
      !symbolFullName(s.symbol, s.assetType).toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
});

function selectSymbolFromDropdown(sym: string | null) {
  selectedSymbol.value = sym;
  isSymbolDropdownOpen.value = false;
  currentPage.value = 1;
}

function convertToDisplay(amount: number, fromCurrency: string): number {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = settings.value.currency;
  if (from === to) return amount;
  if (!exchangeRate.value || exchangeRate.value <= 0) return amount;
  if (from === 'USD' && to === 'THB') return amount * exchangeRate.value;
  if (from === 'THB' && to === 'USD') return amount / exchangeRate.value;
  return amount;
}

const assetTypeOptions = computed(() => {
  const counts = new Map<string, number>();
  for (const s of marketTransactionSummaries.value) {
    counts.set(s.assetType, (counts.get(s.assetType) ?? 0) + 1);
  }
  return [
    { id: 'all', label: t('asset.all'), count: marketTransactionSummaries.value.length },
    { id: 'us-stock', label: t('asset.usStock'), count: counts.get('us-stock') ?? 0 },
    { id: 'thai-stock', label: t('asset.thaiStock'), count: counts.get('thai-stock') ?? 0 },
    { id: 'crypto', label: t('asset.crypto'), count: counts.get('crypto') ?? 0 },
    { id: 'mutual-fund', label: t('asset.mutualFund'), count: counts.get('mutual-fund') ?? 0 },
    { id: 'bond', label: t('asset.bond'), count: counts.get('bond') ?? 0 },
  ].filter((o) => o.id === 'all' || o.count > 0);
});

const scopedSummaries = computed(() =>
  marketTransactionSummaries.value.filter((s) => {
    if (selectedSymbol.value && s.symbol !== selectedSymbol.value) return false;
    if (assetFilter.value !== 'all' && s.assetType !== assetFilter.value) return false;
    return true;
  }),
);

const allTxsInScope = computed(() => {
  const rows: Array<{
    id: string;
    symbol: string;
    displaySymbol: string;
    assetType: string;
    currency: string;
    date: string;
    type: string;
    quantity: number;
    rawQuantity: number;
    price: number;
    totalAmount: number;
    realizedPL?: number | null;
    runningShares: number;
    runningAverageCost: number;
    runningCost: number;
  }> = [];

  for (const s of scopedSummaries.value) {
    for (const tx of s.transactions) {
      rows.push({
        id: tx.id,
        symbol: s.symbol,
        displaySymbol: displaySymbol(s.symbol),
        assetType: s.assetType,
        currency: tx.currency || s.currency,
        date: tx.date,
        type: tx.type,
        quantity: tx.quantity,
        rawQuantity: tx.rawQuantity,
        price: tx.price,
        totalAmount: tx.totalAmount,
        realizedPL: tx.realizedPL,
        runningShares: tx.runningShares,
        runningAverageCost: tx.runningAverageCost,
        runningCost: tx.runningShares * tx.runningAverageCost,
      });
    }
  }
  return rows;
});

const allCount = computed(() => allTxsInScope.value.length);
const buyCount = computed(() => allTxsInScope.value.filter((t) => t.type === 'BUY').length);
const sellCount = computed(() => allTxsInScope.value.filter((t) => t.type === 'SELL').length);
const exchangeCount = computed(() => allTxsInScope.value.filter((t) => t.type !== 'BUY' && t.type !== 'SELL').length);

const totals = computed(() => {
  let volume = 0;
  let realizedPL = 0;
  for (const s of scopedSummaries.value) {
    realizedPL += convertToDisplay(s.realizedPL, s.currency);
    for (const tx of s.transactions) {
      volume += convertToDisplay(tx.totalAmount, tx.currency || s.currency);
    }
  }
  return { totalTrades: allCount.value, buys: buyCount.value, sells: sellCount.value, tradedVolume: volume, realizedPL };
});

const filteredTransactions = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = allTxsInScope.value.filter((tx) => {
    if (typeFilter.value === 'buy' && tx.type !== 'BUY') return false;
    if (typeFilter.value === 'sell' && tx.type !== 'SELL') return false;
    if (typeFilter.value === 'exchange' && (tx.type === 'BUY' || tx.type === 'SELL')) return false;
    if (
      q &&
      !tx.symbol.toLowerCase().includes(q) &&
      !tx.displaySymbol.toLowerCase().includes(q) &&
      !symbolFullName(tx.symbol, tx.assetType).toLowerCase().includes(q)
    ) {
      return false;
    }
    if (fromDate.value && tx.date < fromDate.value) return false;
    if (toDate.value && tx.date > toDate.value) return false;
    return true;
  });
  return [...list].sort((a, b) => (sortOrder.value === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTransactions.value.slice(start, start + pageSize.value);
});

watch([search, typeFilter, assetFilter, fromDate, toDate], () => {
  currentPage.value = 1;
});

function handleExportCsv() {
  if (typeof window === 'undefined') return;
  const openSymbols = new Set(holdings.value.openPositions.map((p) => p.symbol));
  const closedSymbols = new Set(holdings.value.closedPositions.map((p) => p.symbol));
  const opts = {
    assetTypeFilter: exportAssetType.value,
    statusScope: exportScope.value,
    openSymbols,
    closedSymbols,
    activeSymbol: selectedSymbol.value,
    getDisplaySymbolFn: (sym: string) => displaySymbol(sym),
  };
  const csv = generateTransactionsCsv(
    filteredTransactions.value.map((tx) => ({
      symbol: tx.symbol,
      date: tx.date,
      quantity: Math.abs(tx.rawQuantity),
      rawQuantity: tx.rawQuantity,
      price: tx.price,
      currency: tx.currency,
      assetType: tx.assetType,
      type: tx.type as 'BUY' | 'SELL' | 'EXCHANGE_IN' | 'EXCHANGE_OUT',
    })),
    opts,
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateExportFilename(opts);
  a.click();
  URL.revokeObjectURL(url);
  isExportMenuOpen.value = false;
}
</script>

<template>
  <div id="tx-history-container" class="space-y-4">
    <!-- Top Bar: Symbol Selector + Export CSV -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <UiAppButton v-if="selectedSymbol" id="btn-all-symbols-feed" size="sm" @click="selectSymbolFromDropdown(null)">
          ← {{ t('tx.allSymbolsFeed') }}
        </UiAppButton>

        <div class="relative">
          <button
            id="symbol-selector-btn"
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
            @click="isSymbolDropdownOpen = !isSymbolDropdownOpen"
          >
            <template v-if="activeSummary">
              <SymbolIcon :symbol="activeSummary.symbol" :asset-type="activeSummary.assetType" :size="20" />
              <span class="font-mono font-bold">{{ displaySymbol(activeSummary.symbol) }}</span>
              <span class="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px]">{{ activeSummary.totalTransactions }}</span>
            </template>
            <template v-else>
              <span>{{ t('tx.allSymbolsFeed') }}</span>
              <span class="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[10px]">{{ totalTxCount }}</span>
            </template>
            <span class="text-[10px]">▾</span>
          </button>

          <template v-if="isSymbolDropdownOpen">
            <div class="symbol-dropdown-backdrop fixed inset-0 z-[var(--z-backdrop)] bg-transparent" @click="isSymbolDropdownOpen = false" />
            <div
              id="symbol-dropdown-menu"
              role="dialog"
              aria-modal="true"
              :aria-label="t('tx.selectSymbol')"
              class="symbol-dropdown-menu absolute left-0 top-[calc(100%+6px)] z-[var(--z-popover)] w-80 max-w-[90vw] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2 shadow-2xl"
            >
              <input
                id="symbol-search-input"
                v-model="symbolSearchQuery"
                type="search"
                :placeholder="t('tx.searchSymbolsPlaceholder')"
                class="mb-2 h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs"
              />
              <div class="mb-2 flex flex-wrap gap-1">
                <button
                  v-for="pill in [['all', t('asset.all')], ['us-stock', 'US'], ['thai-stock', 'TH'], ['crypto', 'Crypto'], ['mutual-fund', 'Fund']]"
                  :key="pill[0]"
                  type="button"
                  class="rounded border px-2 py-0.5 text-[10px] font-medium"
                  :class="dropdownAssetFilter === pill[0] ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
                  @click="dropdownAssetFilter = pill[0]"
                >
                  {{ pill[1] }}
                </button>
              </div>
              <div class="max-h-60 space-y-0.5 overflow-y-auto">
                <button
                  id="dropdown-item-all-symbols"
                  type="button"
                  class="dropdown-item flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
                  @click="selectSymbolFromDropdown(null)"
                >
                  <span class="dropdown-item-name font-semibold">{{ t('tx.allSymbolsFeed') }}</span>
                  <span class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ totalTxCount }}</span>
                </button>
                <button
                  v-for="s in dropdownSymbols"
                  :id="`dropdown-item-${s.symbol}`"
                  :key="s.symbol"
                  type="button"
                  class="dropdown-item flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
                  @click="selectSymbolFromDropdown(s.symbol)"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <SymbolIcon :symbol="s.symbol" :asset-type="s.assetType" :size="20" />
                    {{ ' ' }}
                    <span class="font-mono font-semibold">{{ displaySymbol(s.symbol) }}</span>
                    {{ ' ' }}
                    <span class="dropdown-item-name truncate text-[var(--color-text-secondary)]">{{ symbolFullName(s.symbol, s.assetType) }}</span>
                  </div>
                  <span class="shrink-0 font-mono text-[11px] text-[var(--color-text-muted)]">{{ s.totalTransactions }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="relative">
        <UiAppButton id="btn-export-csv-trigger" variant="primary" size="sm" @click="isExportMenuOpen = !isExportMenuOpen">
          {{ t('tx.exportCsv') }}
        </UiAppButton>
        <div
          v-if="isExportMenuOpen"
          class="absolute right-0 top-[calc(100%+6px)] z-[var(--z-popover)] w-64 space-y-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 shadow-2xl"
        >
          <div class="grid grid-cols-3 gap-1">
            <button
              id="btn-export-scope-all"
              type="button"
              class="rounded border py-1 text-[11px] font-medium"
              :class="exportScope === 'all' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
              @click="exportScope = 'all'"
            >
              {{ t('tx.allPositions') }}
            </button>
            <button
              id="btn-export-scope-open"
              type="button"
              class="rounded border py-1 text-[11px] font-medium"
              :class="exportScope === 'open' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
              @click="exportScope = 'open'"
            >
              {{ t('tx.onlyOpen') }}
            </button>
            <button
              id="btn-export-scope-closed"
              type="button"
              class="rounded border py-1 text-[11px] font-medium"
              :class="exportScope === 'closed' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
              @click="exportScope = 'closed'"
            >
              {{ t('tab.closed') }}
            </button>
          </div>
          <select v-model="exportAssetType" class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 text-xs" :aria-label="t('tx.exportByAssetType')">
            <option value="all">{{ t('asset.allTypes') }}</option>
            <option value="us-stock">{{ t('asset.usStock') }}</option>
            <option value="thai-stock">{{ t('asset.thaiStock') }}</option>
            <option value="crypto">{{ t('asset.crypto') }}</option>
            <option value="mutual-fund">{{ t('asset.mutualFund') }}</option>
            <option value="bond">{{ t('asset.bond') }}</option>
          </select>
          <UiAppButton id="btn-export-all" variant="primary" size="sm" class="w-full" @click="handleExportCsv">
            {{ t('tx.exportAllTypes') }}
          </UiAppButton>
        </div>
      </div>
    </div>

    <!-- Focused Symbol Hero Card -->
    <UiAppCard v-if="activeSummary" id="symbol-hero-card">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-mono text-lg font-bold text-[var(--color-text-primary)]">{{ activeSummary.symbol }}</h2>
            <UiAppBadge>{{ activeSummary.netShares }} {{ getUnitLabel(activeSummary.symbol, activeSummary.assetType, settings.language) }}</UiAppBadge>
          </div>
          <p class="symbol-hero-subtitle mt-0.5 text-xs text-[var(--color-text-muted)]">{{ symbolFullName(activeSummary.symbol, activeSummary.assetType) }}</p>
        </div>
      </div>
    </UiAppCard>

    <!-- Summary KPI Grid + Asset Filter Pills -->
    <UiAppCard>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-[var(--color-text-primary)]">{{ t('tx.allFeedTitle') }}</h2>
          <p class="text-xs text-[var(--color-text-muted)]">{{ t('tx.allFeedSub') }}</p>
        </div>
        <div id="history-asset-filter-bar" class="flex flex-wrap gap-1.5">
          <button
            v-for="opt in assetTypeOptions"
            :key="opt.id"
            type="button"
            class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium"
            :class="assetFilter === opt.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'"
            @click="assetFilter = opt.id"
          >
            {{ opt.label }} ({{ opt.count }})
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UiKpiStatCard :label="t('tx.totalTrades')" :value="String(totals.totalTrades)" :subtext="`${t('tx.buysLower', { count: totals.buys })} · ${t('tx.sellsLower', { count: totals.sells })}`" />
        <UiKpiStatCard :label="t('tx.totalTradedVolume')" :value="formatMoney(totals.tradedVolume, settings.currency)" :secondary-amount="totals.tradedVolume" :exchange-rate="exchangeRate" :has-rate="hasRate" masked />
        <UiKpiStatCard :label="t('tx.portfolioRealizedPL')" :value="formatSignedMoney(totals.realizedPL, settings.currency)" :tone="totals.realizedPL >= 0 ? 'positive' : 'negative'" :secondary-amount="totals.realizedPL" :exchange-rate="exchangeRate" :has-rate="hasRate" secondary-signed masked />
        <UiKpiStatCard :label="t('tx.holdingsStatus')" :value="`${marketOpenPositionsCount} ${t('tx.openCap')}`" :subtext="t('tx.fullyClosedPositions', { count: holdings.closedPositions.length })" />
      </div>
    </UiAppCard>

    <!-- Ledger Table & Mobile Cards -->
    <UiAppCard id="tx-table-section" :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-3.5">
        <div class="flex flex-wrap gap-1.5">
          <button id="filter-type-all" type="button" class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium" :class="typeFilter === 'all' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="typeFilter = 'all'">
            {{ t('tx.allCount', { count: allCount }) }}
          </button>
          <button id="filter-type-buy" type="button" class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium" :class="typeFilter === 'buy' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="typeFilter = 'buy'">
            {{ t('tx.buysCountFilter', { count: buyCount }) }}
          </button>
          <button id="filter-type-sell" type="button" class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium" :class="typeFilter === 'sell' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="typeFilter = 'sell'">
            {{ t('tx.sellsCountFilter', { count: sellCount }) }}
          </button>
          <button id="filter-type-exchange" type="button" class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium" :class="typeFilter === 'exchange' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="typeFilter = 'exchange'">
            {{ t('tx.exchangesCountFilter', { count: exchangeCount }) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input id="tx-search-input" v-model="search" type="search" :placeholder="t('common.searchPlaceholder')" class="h-8 w-44 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs" />
          <input id="tx-from-date" v-model="fromDate" type="date" :aria-label="t('common.date')" class="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs" />
          <input id="tx-to-date" v-model="toDate" type="date" :aria-label="t('common.date')" class="h-8 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs" />
          <UiAppButton id="btn-toggle-sort" size="sm" @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'">
            {{ sortOrder === 'desc' ? t('tx.newestFirst') : t('tx.oldestFirst') }}
          </UiAppButton>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="hidden overflow-x-auto md:block">
        <table id="tx-table" class="tx-table w-full text-left text-xs">
          <thead class="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] uppercase text-[var(--color-text-muted)]">
            <tr>
              <th class="px-3 py-2.5">#</th>
              <th class="px-3 py-2.5">{{ t('common.symbol') }}</th>
              <th class="px-3 py-2.5">{{ t('common.date') }}</th>
              <th class="px-3 py-2.5">{{ t('common.type') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('common.shares') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('common.pricePerUnit') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('common.totalValue') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('common.realizedPL') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('tx.positionAfter') }}</th>
              <th class="px-3 py-2.5 text-right">{{ t('tx.runningCost') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr v-if="paginatedTransactions.length === 0">
              <td colspan="10" class="py-8 text-center text-[var(--color-text-muted)]">{{ t('tx.emptyTable') }}</td>
            </tr>
            <tr v-for="(tx, idx) in paginatedTransactions" :key="tx.id" class="tx-row hover:bg-[var(--color-surface-overlay)]">
              <td class="px-3 py-2.5 font-mono text-[var(--color-text-muted)]">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <SymbolIcon :symbol="tx.symbol" :asset-type="tx.assetType" :size="22" />
                  {{ ' ' }}
                  <span class="rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold" :style="{ color: getSymbolColor(tx.symbol), borderColor: `${getSymbolColor(tx.symbol)}30` }">
                    {{ tx.displaySymbol }}
                  </span>
                  {{ ' ' }}
                  <span class="tx-symbol-name text-[var(--color-text-secondary)]">{{ symbolFullName(tx.symbol, tx.assetType) }}</span>
                </div>
              </td>
              <td class="px-3 py-2.5 font-mono">{{ tx.date }}</td>
              <td class="px-3 py-2.5">
                <UiAppBadge :tone="tx.type === 'BUY' ? 'positive' : tx.type === 'SELL' ? 'negative' : 'neutral'">
                  {{ tx.type === 'BUY' ? t('common.buy') : tx.type === 'SELL' ? t('common.sell') : tx.type === 'EXCHANGE_IN' ? t('common.exIn') : t('common.exOut') }}
                </UiAppBadge>
              </td>
              <td class="privacy-mask px-3 py-2.5 text-right font-mono">{{ tx.quantity }}</td>
              <td class="px-3 py-2.5 text-right font-mono">{{ formatMoney(tx.price, tx.currency) }}</td>
              <td class="privacy-mask px-3 py-2.5 text-right font-mono font-semibold">{{ formatMoney(tx.totalAmount, tx.currency) }}</td>
              <td class="px-3 py-2.5 text-right font-mono" :class="(tx.realizedPL ?? 0) >= 0 ? 'pl-positive' : 'pl-negative'">
                {{ tx.realizedPL != null ? formatSignedMoney(tx.realizedPL, tx.currency) : '—' }}
              </td>
              <td class="privacy-mask px-3 py-2.5 text-right font-mono">{{ tx.runningShares }}</td>
              <td class="privacy-mask px-3 py-2.5 text-right font-mono">{{ formatMoney(tx.runningCost, tx.currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Transaction Cards -->
      <div class="divide-y divide-[var(--color-border)] md:hidden">
        <div v-for="tx in paginatedTransactions" :key="`m-${tx.id}`" class="tx-row space-y-2 p-3.5 text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <SymbolIcon :symbol="tx.symbol" :asset-type="tx.assetType" :size="24" />
              {{ ' ' }}
              <span class="font-mono font-bold">{{ tx.displaySymbol }}</span>
              {{ ' ' }}
              <span class="tx-symbol-name text-[var(--color-text-muted)]">{{ symbolFullName(tx.symbol, tx.assetType) }}</span>
            </div>
            <UiAppBadge :tone="tx.type === 'BUY' ? 'positive' : tx.type === 'SELL' ? 'negative' : 'neutral'">
              {{ tx.type }}
            </UiAppBadge>
          </div>
          <div class="flex justify-between font-mono text-[11px] text-[var(--color-text-secondary)]">
            <span>{{ tx.date }}</span>
            <span class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(tx.totalAmount, tx.currency) }}</span>
          </div>
        </div>
      </div>

      <UiAppPagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total-items="filteredTransactions.length" />
    </UiAppCard>
  </div>
</template>
