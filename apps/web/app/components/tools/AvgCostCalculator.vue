<script setup lang="ts">
import type { SimulatedStep } from '@sgsk-wealth/contracts';
import {
  displaySymbol,
  getAssetTypeLabel,
  getQuickAdjustedPrice,
  getSymbolName,
  simulateAvgCost,
  solveTargetAvgCostGoal,
} from '@sgsk-wealth/domain';

const { t, language } = useI18n();
const { settings } = useUserSettings();
const { holdings, exchangeRate, hasRate } = usePortfolioData();

const avgMode = ref<'forward' | 'reverse'>('forward');
const orderInputMode = ref<'shares' | 'amount'>('shares');
const selectedSymbol = ref<string>('CUSTOM');
const isToolDropdownOpen = ref(false);
const toolSearchQuery = ref('');
const toolAssetFilter = ref('all');

const assetFilterTabs = computed(() => [
  { id: 'all', label: t('asset.all') },
  { id: 'us-stock', label: t('asset.short.usStock') },
  { id: 'thai-stock', label: t('asset.short.thaiStock') },
  { id: 'crypto', label: t('asset.short.crypto') },
  { id: 'mutual-fund', label: t('asset.short.mutualFund') },
  { id: 'bond', label: t('asset.short.bond') },
]);

function posDisplayName(pos: { symbol: string; name: string; nameTh?: string; assetType: string }) {
  return getSymbolName(pos.symbol, pos.name, language.value, pos.nameTh, pos.assetType) || pos.name;
}

const openMarketPositions = computed(() =>
  holdings.value.openPositions.filter((p) => p.assetType !== 'provident-fund'),
);

const currentPos = computed(() =>
  openMarketPositions.value.find((p) => p.symbol === selectedSymbol.value) ?? null,
);

const filteredToolPositions = computed(() => {
  const q = toolSearchQuery.value.trim().toLowerCase();
  return openMarketPositions.value.filter((p) => {
    if (toolAssetFilter.value !== 'all' && p.assetType !== toolAssetFilter.value) return false;
    if (
      q &&
      !p.symbol.toLowerCase().includes(q) &&
      !p.name.toLowerCase().includes(q) &&
      !posDisplayName(p).toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
});

function selectToolSymbol(sym: string) {
  selectedSymbol.value = sym;
  isToolDropdownOpen.value = false;
  queuedSteps.value = [];
}

const sim = reactive({
  customSymbolName: 'CUSTOM',
  customCurrency: 'USD' as 'USD' | 'THB',
  currentShares: 100,
  currentAvgCost: 150,
  currentPrice: 170,
  action: 'BUY' as 'BUY' | 'SELL',
  newShares: 50,
  newAmount: 7000,
  newPrice: 140,
  feePercent: 0,
  targetAvgCost: 145,
});

const queuedSteps = ref<SimulatedStep[]>([]);

watch(currentPos, (pos) => {
  if (pos) {
    sim.currentShares = pos.totalShares;
    sim.currentAvgCost = Number(pos.averageCost.toFixed(4));
    sim.currentPrice = Number(pos.currentPrice.toFixed(4));
    sim.newPrice = Number(pos.currentPrice.toFixed(4));
    sim.targetAvgCost = Number((pos.averageCost * 0.95).toFixed(2));
  }
});

const activeCurrency = computed(() => currentPos.value?.currency || sim.customCurrency || 'USD');

const effectiveShares = computed(() => {
  if (orderInputMode.value === 'amount') {
    return sim.newPrice > 0 ? sim.newAmount / sim.newPrice : 0;
  }
  return sim.newShares;
});

const orderPreviewGross = computed(() => effectiveShares.value * sim.newPrice);
const orderPreviewFee = computed(() => orderPreviewGross.value * (Math.max(0, sim.feePercent) / 100));

function applyQuickSharesPct(mult: number) {
  if (sim.currentShares <= 0) return;
  sim.newShares = Number((sim.currentShares * mult).toFixed(4));
}

function applyMaxSellShares() {
  sim.newShares = sim.currentShares;
}

function addQuickAmount(delta: number) {
  sim.newAmount = Number(Math.max(0, (sim.newAmount || 0) + delta).toFixed(2));
}

function applyQuickAmountPct(mult: number) {
  const baseVal = sim.currentShares * sim.currentPrice;
  if (baseVal > 0) sim.newAmount = Number((baseVal * mult).toFixed(2));
}

function applyQuickPrice(pct: number) {
  const base = sim.currentPrice > 0 ? sim.currentPrice : sim.newPrice;
  if (base > 0) sim.newPrice = Number(getQuickAdjustedPrice(base, pct).toFixed(4));
}

function addCurrentStepToChain() {
  if (effectiveShares.value <= 0 || sim.newPrice <= 0) return;
  queuedSteps.value = [
    ...queuedSteps.value,
    {
      id: `step-${Date.now()}-${queuedSteps.value.length}`,
      action: sim.action,
      shares: Number(effectiveShares.value.toFixed(6)),
      price: sim.newPrice,
      feePercent: sim.feePercent,
    },
  ];
}

const simResult = computed(() =>
  simulateAvgCost(
    {
      symbol: selectedSymbol.value === 'CUSTOM' ? sim.customSymbolName || 'CUSTOM' : selectedSymbol.value,
      displaySymbol: selectedSymbol.value === 'CUSTOM' ? sim.customSymbolName || 'CUSTOM' : displaySymbol(selectedSymbol.value),
      name: currentPos.value ? posDisplayName(currentPos.value) : sim.customSymbolName || 'CUSTOM',
      assetType: currentPos.value?.assetType || 'us-stock',
      assetTypeLabel: currentPos.value ? getAssetTypeLabel(currentPos.value.assetType, undefined, language.value) : '',
      totalShares: sim.currentShares,
      averageCost: sim.currentAvgCost,
      totalCost: sim.currentShares * sim.currentAvgCost,
      currentPrice: sim.currentPrice,
      holdingValue: sim.currentShares * sim.currentPrice,
      unrealizedPL: sim.currentShares * (sim.currentPrice - sim.currentAvgCost),
      unrealizedPLPercent:
        sim.currentAvgCost > 0 ? ((sim.currentPrice - sim.currentAvgCost) / sim.currentAvgCost) * 100 : 0,
      hasPrice: sim.currentPrice > 0,
      currency: activeCurrency.value,
    },
    [
      ...queuedSteps.value,
      {
        id: 'draft',
        action: sim.action,
        shares: effectiveShares.value,
        price: sim.newPrice,
        feePercent: sim.feePercent,
      },
    ],
  ),
);

const initialSnapshot = computed(() => simResult.value.initial);

const solverResult = computed(() =>
  solveTargetAvgCostGoal({
    currentShares: sim.currentShares,
    currentAvgCost: sim.currentAvgCost,
    targetAvgCost: sim.targetAvgCost,
    purchasePrice: sim.newPrice,
    feePercent: sim.feePercent,
  }),
);

function applySolverToForward() {
  if (!solverResult.value.isValid) return;
  avgMode.value = 'forward';
  sim.action = 'BUY';
  orderInputMode.value = 'shares';
  sim.newShares = Number(solverResult.value.requiredShares.toFixed(4));
}

const shiftScale = computed(() => {
  const prices = [sim.currentPrice, sim.currentAvgCost, simResult.value.simulated.averageCost].filter(
    (v) => Number.isFinite(v) && v > 0,
  );
  const min = Math.min(...prices) * 0.92;
  const max = Math.max(...prices) * 1.08;
  const span = Math.max(1e-6, max - min);
  const toPct = (v: number) => Math.min(96, Math.max(4, ((v - min) / span) * 100));
  return {
    livePct: toPct(sim.currentPrice),
    initialPct: toPct(sim.currentAvgCost),
    projectedPct: toPct(simResult.value.simulated.averageCost),
  };
});

const comparisonRows = computed(() => [
  {
    key: 'avgCost',
    label: t('tools.avg.metricAvgCost'),
    initial: formatMoney(initialSnapshot.value.averageCost, activeCurrency.value),
    simulated: formatMoney(simResult.value.simulated.averageCost, activeCurrency.value),
    delta: `${simResult.value.delta.averageCost >= 0 ? '+' : ''}${formatMoney(simResult.value.delta.averageCost, activeCurrency.value)} (${formatPercent(simResult.value.delta.averageCostPercent)})`,
    deltaTone: simResult.value.delta.averageCost <= 0 ? 'positive' : 'negative',
    initNum: initialSnapshot.value.averageCost,
    simNum: simResult.value.simulated.averageCost,
  },
  {
    key: 'shares',
    label: t('tools.avg.metricTotalShares'),
    initial: initialSnapshot.value.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 }),
    simulated: simResult.value.simulated.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 }),
    delta: `${simResult.value.delta.shares >= 0 ? '+' : ''}${simResult.value.delta.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} (${formatPercent(simResult.value.delta.sharesPercent)})`,
    deltaTone: simResult.value.delta.shares >= 0 ? 'positive' : 'negative',
    initNum: null as number | null,
    simNum: null as number | null,
  },
  {
    key: 'totalCost',
    label: t('tools.avg.metricTotalCost'),
    initial: formatMoney(initialSnapshot.value.totalCost, activeCurrency.value),
    simulated: formatMoney(simResult.value.simulated.totalCost, activeCurrency.value),
    delta: formatSignedMoney(simResult.value.delta.totalCost, activeCurrency.value),
    deltaTone: 'neutral',
    initNum: initialSnapshot.value.totalCost,
    simNum: simResult.value.simulated.totalCost,
  },
  {
    key: 'holdingValue',
    label: t('tools.avg.metricHoldingValue'),
    initial: formatMoney(initialSnapshot.value.holdingValue, activeCurrency.value),
    simulated: formatMoney(simResult.value.simulated.holdingValue, activeCurrency.value),
    delta: formatSignedMoney(simResult.value.delta.holdingValue, activeCurrency.value),
    deltaTone: simResult.value.delta.holdingValue >= 0 ? 'positive' : 'negative',
    initNum: initialSnapshot.value.holdingValue,
    simNum: simResult.value.simulated.holdingValue,
  },
  {
    key: 'unrealizedPL',
    label: t('tools.avg.metricUnrealizedPL'),
    initial: formatSignedMoney(initialSnapshot.value.unrealizedPL, activeCurrency.value),
    simulated: formatSignedMoney(simResult.value.simulated.unrealizedPL, activeCurrency.value),
    delta: formatSignedMoney(simResult.value.delta.unrealizedPL, activeCurrency.value),
    deltaTone: simResult.value.delta.unrealizedPL >= 0 ? 'positive' : 'negative',
    initNum: initialSnapshot.value.unrealizedPL,
    simNum: simResult.value.simulated.unrealizedPL,
  },
]);
</script>

<template>
  <div id="avg-cost-calculator" class="space-y-4">
    <!-- Top Control Bar: Asset Selector + Mode Toggle -->
    <div class="flex flex-wrap items-end justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div class="relative w-full space-y-1 sm:w-96">
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]" for="symbol-search-input">
          {{ t('tools.selectedAsset') }}
        </label>
        <div
          id="tool-symbol-select"
          class="symbol-search-box flex h-10 cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-xs"
          @click="isToolDropdownOpen = !isToolDropdownOpen"
        >
          <div v-if="!currentPos" class="symbol-selected-badge custom-badge flex items-center gap-2">
            <UiAppBadge>{{ t('tools.custom') }}</UiAppBadge>
            <span class="badge-name font-medium">{{ t('tools.avg.customOptionTitle') }}</span>
          </div>
          <div v-else class="symbol-selected-badge flex min-w-0 items-center gap-2">
            <SymbolIcon :symbol="currentPos.symbol" :asset-type="currentPos.assetType" :size="20" />
            {{ ' ' }}
            <span class="badge-tag font-mono font-bold">{{ displaySymbol(currentPos.symbol) }}</span>
            {{ ' ' }}
            <span class="badge-name truncate text-[var(--color-text-secondary)]">{{ posDisplayName(currentPos) }}</span>
          </div>
          <span class="text-[10px] text-[var(--color-text-muted)]">▾</span>
        </div>

        <template v-if="isToolDropdownOpen">
          <div class="symbol-dropdown-backdrop fixed inset-0 z-[var(--z-backdrop)] bg-transparent" @click="isToolDropdownOpen = false" />
          <div
            class="symbol-dropdown-menu absolute left-0 right-0 top-[calc(100%+4px)] z-[var(--z-popover)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2.5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            :aria-label="t('tools.selectAssetTitle')"
          >
            <input
              id="symbol-search-input"
              v-model="toolSearchQuery"
              type="text"
              class="mb-2 h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 text-xs"
              :placeholder="t('tools.searchPortfolioPlaceholder')"
              @click.stop
            />

            <div class="mb-2 flex flex-wrap gap-1">
              <button
                v-for="tab in assetFilterTabs"
                :key="tab.id"
                type="button"
                class="rounded px-2 py-0.5 text-[10px] font-semibold transition-colors"
                :class="
                  toolAssetFilter === tab.id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                "
                @click.stop="toolAssetFilter = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="max-h-64 space-y-1 overflow-y-auto">
              <button
                type="button"
                class="dropdown-option-item custom-option flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-left text-xs hover:border-[var(--color-accent)]"
                @click="selectToolSymbol('CUSTOM')"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <UiAppBadge>{{ t('tools.custom') }}</UiAppBadge>
                    <span class="font-semibold text-[var(--color-text-primary)]">{{ t('tools.avg.customOptionTitle') }}</span>
                  </div>
                  <div class="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.customOptionDesc') }}</div>
                </div>
              </button>

              <div class="px-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {{ t('tools.avg.yourOpenPositions', { count: filteredToolPositions.length }) }}
              </div>

              <button
                v-for="pos in filteredToolPositions"
                :key="pos.symbol"
                type="button"
                class="dropdown-option-item flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
                @click="selectToolSymbol(pos.symbol)"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <SymbolIcon :symbol="pos.symbol" :asset-type="pos.assetType" :size="22" />
                  {{ ' ' }}
                  <div class="min-w-0">
                    <div>
                      <span class="opt-sym font-mono font-bold text-[var(--color-text-primary)]">{{ displaySymbol(pos.symbol) }}</span>
                      {{ ' ' }}
                      <span class="opt-name-sub truncate text-[var(--color-text-secondary)]">{{ posDisplayName(pos) }}</span>
                    </div>
                    <div class="font-mono text-[10px] text-[var(--color-text-muted)]">
                      {{ pos.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }} {{ t('tools.avg.unitShort') }} ·
                      {{ t('tools.avg.avgShort') }} {{ formatMoney(pos.averageCost, pos.currency) }}
                    </div>
                  </div>
                </div>
                <span class="shrink-0 font-mono text-[11px] font-semibold text-[var(--color-text-primary)]">
                  {{ formatMoney(pos.currentPrice, pos.currency) }}
                </span>
              </button>

              <div v-if="filteredToolPositions.length === 0" class="py-3 text-center text-xs text-[var(--color-text-muted)]">
                {{ t('tools.avg.noMatchingSymbols') }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="space-y-1">
        <span class="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('tools.avg.calculatorMode') }}
        </span>
        <div class="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
          <button
            id="mode-forward-btn"
            type="button"
            class="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="avgMode === 'forward' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            @click="avgMode = 'forward'"
          >
            {{ t('tools.avg.modeForward') }}
          </button>
          <button
            id="mode-reverse-btn"
            type="button"
            class="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="avgMode === 'reverse' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            @click="avgMode = 'reverse'"
          >
            {{ t('tools.avg.modeReverse') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Initial State Config + 5-Metric Initial Snapshot Strip -->
    <UiAppCard>
      <div class="space-y-3">
        <div v-if="!currentPos" class="space-y-2.5 border-b border-[var(--color-border)] pb-3">
          <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.avg.configureCustomState') }}</div>
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <label class="space-y-1 text-[11px]">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.symbolName') }}</span>
              <input
                v-model="sim.customSymbolName"
                type="text"
                :placeholder="t('tools.avg.symbolPlaceholder')"
                class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs"
              />
            </label>
            <label class="space-y-1 text-[11px]">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.currency') }}</span>
              <select
                v-model="sim.customCurrency"
                class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 text-xs"
              >
                <option value="USD">{{ t('tools.avg.currencyUsd') }}</option>
                <option value="THB">{{ t('tools.avg.currencyThb') }}</option>
              </select>
            </label>
            <label class="space-y-1 text-[11px]">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.currentShares') }}</span>
              <input v-model.number="sim.currentShares" type="number" step="any" class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs" />
            </label>
            <label class="space-y-1 text-[11px]">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.currentAvgCost') }}</span>
              <input v-model.number="sim.currentAvgCost" type="number" step="any" class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs" />
            </label>
            <label class="space-y-1 text-[11px]">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.currentMarketPrice') }}</span>
              <input v-model.number="sim.currentPrice" type="number" step="any" class="h-8 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs" />
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('tools.avg.currentShares') }}</div>
            <div class="mt-0.5 font-mono text-sm font-bold text-[var(--color-text-primary)]">
              {{ initialSnapshot.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}
            </div>
          </div>
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('tools.avg.avgCostBasis') }}</div>
            <div class="mt-0.5 font-mono text-sm font-bold text-[var(--color-text-primary)]">{{ formatMoney(initialSnapshot.averageCost, activeCurrency) }}</div>
            <SecondaryCurrency :amount="initialSnapshot.averageCost" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
          </div>
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('tools.avg.liveMarketPrice') }}</div>
            <div class="mt-0.5 font-mono text-sm font-bold text-[var(--color-text-primary)]">{{ formatMoney(initialSnapshot.currentPrice, activeCurrency) }}</div>
            <SecondaryCurrency :amount="initialSnapshot.currentPrice" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
          </div>
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('common.totalInvested') }}</div>
            <div class="mt-0.5 font-mono text-sm font-bold text-[var(--color-text-primary)]">{{ formatMoney(initialSnapshot.totalCost, activeCurrency) }}</div>
            <SecondaryCurrency :amount="initialSnapshot.totalCost" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
          </div>
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('tools.avg.currentUnrealizedPL') }}</div>
            <div class="mt-0.5 font-mono text-sm font-bold" :class="initialSnapshot.unrealizedPL >= 0 ? 'pl-positive' : 'pl-negative'">
              {{ formatSignedMoney(initialSnapshot.unrealizedPL, activeCurrency) }} ({{ formatPercent(initialSnapshot.unrealizedPLPercent) }})
            </div>
            <SecondaryCurrency :amount="initialSnapshot.unrealizedPL" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" signed />
          </div>
        </div>
      </div>
    </UiAppCard>

    <!-- Main 2-Column Workspace -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- Left Inputs Panel -->
      <UiAppCard
        :title="avgMode === 'forward' ? t('tools.avg.simulateOrder') : t('tools.avg.solverTitle')"
        class="lg:col-span-5"
      >
        <div v-if="avgMode === 'forward'" class="space-y-4">
          <div class="grid grid-cols-2 gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <button
              id="action-buy-btn"
              type="button"
              class="rounded py-1.5 text-xs font-semibold transition-colors"
              :class="sim.action === 'BUY' ? 'active bg-[var(--color-pl-positive)] text-white' : 'text-[var(--color-text-secondary)]'"
              @click="sim.action = 'BUY'"
            >
              {{ t('tools.avg.buyBtn') }}
            </button>
            <button
              id="action-sell-btn"
              type="button"
              class="rounded py-1.5 text-xs font-semibold transition-colors"
              :class="sim.action === 'SELL' ? 'active bg-[var(--color-pl-negative)] text-white' : 'text-[var(--color-text-secondary)]'"
              @click="sim.action = 'SELL'"
            >
              {{ t('tools.avg.sellBtn') }}
            </button>
          </div>

          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-[var(--color-text-muted)]">{{ t('tools.avg.orderDimension') }}</span>
            <div class="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              <button
                id="mode-shares-pill"
                type="button"
                class="rounded px-2.5 py-1 text-xs font-medium"
                :class="orderInputMode === 'shares' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
                @click="orderInputMode = 'shares'"
              >
                {{ t('tools.avg.byShares') }}
              </button>
              <button
                id="mode-amount-pill"
                type="button"
                class="rounded px-2.5 py-1 text-xs font-medium"
                :class="orderInputMode === 'amount' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
                @click="orderInputMode = 'amount'"
              >
                {{ t('tools.avg.byAmount', { currency: activeCurrency }) }}
              </button>
            </div>
          </div>

          <!-- Shares Input + Quick Chips -->
          <div v-if="orderInputMode === 'shares'" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <label for="input-shares" class="text-[var(--color-text-muted)]">
                {{ t('tools.avg.sharesToAction', { action: sim.action === 'BUY' ? t('tools.avg.actionBuyVerb') : t('tools.avg.actionSellVerb') }) }}
              </label>
              <span class="font-mono text-[11px] text-[var(--color-text-secondary)]">≈ {{ formatMoney(orderPreviewGross, activeCurrency) }}</span>
            </div>
            <input
              id="input-shares"
              v-model.number="sim.newShares"
              type="number"
              step="any"
              :placeholder="t('tools.avg.sharesPlaceholder')"
              class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
            />
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.quickLabel') }}</span>
              <button v-for="m in [0.1, 0.25, 0.5]" :key="m" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickSharesPct(m)">
                +{{ (m * 100).toFixed(0) }}%
              </button>
              <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickSharesPct(1)">
                {{ t('tools.avg.doubleMultiplier') }}
              </button>
              <button v-if="sim.action === 'SELL'" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyMaxSellShares">
                {{ t('tools.avg.maxShares') }}
              </button>
            </div>
          </div>

          <!-- Amount Input + Quick Chips -->
          <div v-else class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <label for="input-amount" class="text-[var(--color-text-muted)]">
                {{ t('tools.avg.totalAmountToAction', { action: sim.action === 'BUY' ? t('tools.avg.actionBuyVerb') : t('tools.avg.actionSellVerb'), currency: activeCurrency }) }}
              </label>
              <span class="font-mono text-[11px] text-[var(--color-text-secondary)]">≈ {{ effectiveShares.toFixed(4) }} {{ t('tools.avg.unitShort') }}</span>
            </div>
            <input
              id="input-amount"
              v-model.number="sim.newAmount"
              type="number"
              step="any"
              :placeholder="t('tools.avg.amountPlaceholder')"
              class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
            />
            <div class="flex flex-wrap items-center gap-1">
              <span class="text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.amountLabel') }}</span>
              <button v-for="amt in [500, 1000, 2500, 5000, 10000]" :key="amt" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="addQuickAmount(amt)">
                +{{ amt >= 1000 ? `${amt / 1000}k` : amt }}
              </button>
              <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickAmountPct(0.25)">
                {{ t('tools.avg.valPlus25') }}
              </button>
              <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickAmountPct(0.5)">
                {{ t('tools.avg.valPlus50') }}
              </button>
              <button v-if="sim.action === 'SELL'" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickAmountPct(1)">
                {{ t('tools.avg.maxAmount') }}
              </button>
            </div>
          </div>

          <!-- Price + Fee Inputs -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <label for="input-price" class="text-[var(--color-text-muted)]">{{ t('tools.avg.simExecPrice', { currency: activeCurrency }) }}</label>
                <span class="text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.perUnit', { unit: t('tools.avg.unitShort') }) }}</span>
              </div>
              <input
                id="input-price"
                v-model.number="sim.newPrice"
                type="number"
                step="any"
                :placeholder="t('tools.avg.pricePlaceholder')"
                class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
              />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(0)">{{ t('tools.avg.marketPrice') }}</button>
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(-5)">{{ t('tools.avg.dip5') }}</button>
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(-10)">{{ t('tools.avg.dip10') }}</button>
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(5)">{{ t('tools.avg.rally5') }}</button>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <label for="input-fee" class="text-[var(--color-text-muted)]">{{ t('tools.avg.brokerFeePct') }}</label>
                <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ formatMoney(orderPreviewFee, activeCurrency) }} {{ t('tools.avg.feeSuffix') }}</span>
              </div>
              <input
                id="input-fee"
                v-model.number="sim.feePercent"
                type="number"
                step="any"
                min="0"
                :placeholder="t('tools.avg.feePlaceholder')"
                class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <UiAppButton id="btn-calculate-simulation" variant="primary" size="sm" @click="addCurrentStepToChain">
              {{ t('tools.avg.addToChain') }}
            </UiAppButton>
            <UiAppButton v-if="queuedSteps.length > 0" size="sm" @click="queuedSteps = []">
              {{ t('tools.avg.clearQueue') }} ({{ queuedSteps.length }})
            </UiAppButton>
          </div>

          <div v-if="queuedSteps.length > 0" class="space-y-1.5 border-t border-[var(--color-border)] pt-3">
            <div class="text-xs font-semibold">{{ t('tools.avg.queuedOrders', { count: queuedSteps.length }) }}</div>
            <div v-for="(s, idx) in queuedSteps" :key="s.id" class="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs">
              <span>#{{ idx + 1 }} <strong :class="s.action === 'BUY' ? 'pl-positive' : 'pl-negative'">{{ s.action }}</strong> {{ s.shares }} {{ t('tools.avg.unitShort') }} @ {{ formatMoney(s.price, activeCurrency) }}</span>
              <button type="button" class="text-[var(--color-pl-negative)]" :title="t('tools.avg.removeStep')" @click="queuedSteps = queuedSteps.filter((x) => x.id !== s.id)">✕</button>
            </div>
          </div>
        </div>

        <!-- Reverse Mode Inputs -->
        <div v-else class="space-y-4">
          <p class="text-xs text-[var(--color-text-muted)]">{{ t('tools.avg.solverHelp') }}</p>
          <div class="space-y-3">
            <label class="block space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.targetAvgCostLabel', { currency: activeCurrency }) }}</span>
                <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.currentHintColon') }} {{ formatMoney(sim.currentAvgCost, activeCurrency) }}</span>
              </div>
              <input id="target-avg-cost" v-model.number="sim.targetAvgCost" type="number" step="any" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
            </label>
            <div class="space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <label for="target-buy-price" class="text-[var(--color-text-muted)]">{{ t('tools.avg.targetBuyPriceLabel', { currency: activeCurrency }) }}</label>
                <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ t('tools.avg.marketColon') }} {{ formatMoney(sim.currentPrice, activeCurrency) }}</span>
              </div>
              <input id="target-buy-price" v-model.number="sim.newPrice" type="number" step="any" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(0)">{{ t('tools.avg.atMarket') }}</button>
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(-5)">{{ t('tools.avg.dip5') }}</button>
                <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="applyQuickPrice(-10)">{{ t('tools.avg.dip10') }}</button>
              </div>
            </div>
            <label class="block space-y-1 text-xs">
              <span class="text-[var(--color-text-muted)]">{{ t('tools.avg.brokerFeeSimple') }}</span>
              <input id="target-fee" v-model.number="sim.feePercent" type="number" step="any" min="0" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
            </label>
          </div>
          <UiAppButton id="btn-calculate-solver" variant="primary" size="sm" @click="() => {}">{{ t('tools.avg.calculateTargetGoal') }}</UiAppButton>
        </div>
      </UiAppCard>

      <!-- Right Results Panel -->
      <UiAppCard
        :title="avgMode === 'forward' ? t('tools.avg.projectedImpact') : t('tools.avg.goalFeasibilityTitle')"
        class="right-panel lg:col-span-7"
      >
        <div v-if="avgMode === 'forward'" class="space-y-4">
          <!-- 4 KPI Cards -->
          <div class="sim-kpi-grid grid grid-cols-2 gap-3 xl:grid-cols-4">
            <UiKpiStatCard
              :label="t('tools.avg.projectedAvgCost')"
              :value="formatMoney(simResult.simulated.averageCost, activeCurrency)"
              :subtext="`${simResult.delta.averageCost >= 0 ? '+' : ''}${formatMoney(simResult.delta.averageCost, activeCurrency)} (${formatPercent(simResult.delta.averageCostPercent)})`"
              :tone="simResult.delta.averageCost <= 0 ? 'positive' : 'negative'"
              :secondary-amount="simResult.simulated.averageCost"
              :display-currency="activeCurrency"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
            />
            <UiKpiStatCard
              :label="t('tools.avg.totalShares')"
              :value="simResult.simulated.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 })"
              :subtext="`${simResult.delta.shares >= 0 ? '+' : ''}${simResult.delta.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} (${formatPercent(simResult.delta.sharesPercent)})`"
              :tone="simResult.delta.shares >= 0 ? 'positive' : 'negative'"
            />
            <UiKpiStatCard
              :label="sim.action === 'SELL' ? t('tools.avg.netProceedsRealized') : t('tools.avg.totalCapitalReq')"
              :value="formatMoney(sim.action === 'SELL' ? simResult.simulated.totalProceeds : simResult.simulated.totalOutlay, activeCurrency)"
              :subtext="`${t('tools.avg.feesColon')} ${formatMoney(simResult.simulated.totalFees, activeCurrency)}`"
              :secondary-amount="sim.action === 'SELL' ? simResult.simulated.totalProceeds : simResult.simulated.totalOutlay"
              :display-currency="activeCurrency"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
            />
            <UiKpiStatCard
              :label="t('tools.avg.projectedUnrealizedPL')"
              :value="formatSignedMoney(simResult.simulated.unrealizedPL, activeCurrency)"
              :subtext="`${formatPercent(simResult.simulated.unrealizedPLPercent)} · ${t('tools.avg.realizedColon')} ${formatSignedMoney(simResult.simulated.realizedPL, activeCurrency)}`"
              :tone="simResult.simulated.unrealizedPL >= 0 ? 'positive' : 'negative'"
              :secondary-amount="simResult.simulated.unrealizedPL"
              :display-currency="activeCurrency"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
              secondary-signed
            />
          </div>

          <!-- Cost Basis Shift Visual Bar -->
          <div id="avg-cost-shift-bar" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-[var(--color-text-primary)]">{{ t('tools.avg.costShiftTitle') }}</span>
              <span class="font-mono text-[11px] text-[var(--color-text-secondary)]">
                {{ t('tools.avg.breakevenGap') }}
                <strong :class="simResult.delta.breakevenDistanceSimulated <= 0 ? 'pl-positive' : 'pl-negative'">
                  {{ formatPercent(simResult.delta.breakevenDistanceSimulated) }}
                </strong>
                <span class="ml-1 text-[var(--color-text-muted)]">{{ t('tools.avg.wasPct', { pct: formatPercent(simResult.delta.breakevenDistanceInitial) }) }}</span>
              </span>
            </div>
            <div class="relative h-3 rounded-full bg-[var(--color-surface-overlay)]">
              <div class="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded bg-[var(--color-text-muted)]" :style="{ left: `${shiftScale.initialPct}%` }" :title="t('tools.avg.initialLabel')" />
              <div class="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded bg-[var(--color-accent)]" :style="{ left: `${shiftScale.projectedPct}%` }" :title="t('tools.avg.projectedLabel')" />
              <div class="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded bg-[var(--color-pl-positive)]" :style="{ left: `${shiftScale.livePct}%` }" :title="t('tools.avg.livePriceLabel')" />
            </div>
            <div class="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-[var(--color-text-muted)]">
              <span>{{ t('tools.avg.initialLabel') }} {{ formatMoney(sim.currentAvgCost, activeCurrency) }}</span>
              <span class="text-[var(--color-accent)]">{{ t('tools.avg.projectedLabel') }} {{ formatMoney(simResult.simulated.averageCost, activeCurrency) }}</span>
              <span class="pl-positive">{{ t('tools.avg.livePriceLabel') }} {{ formatMoney(sim.currentPrice, activeCurrency) }}</span>
            </div>
          </div>

          <!-- Before / After / Delta Comparison Table -->
          <div id="avg-comparison-table" class="hidden overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] sm:block">
            <table class="w-full text-left text-xs">
              <thead class="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th class="px-3 py-2">{{ t('tools.avg.thMetric') }}</th>
                  <th class="px-3 py-2 text-right">{{ t('tools.avg.thInitial') }}</th>
                  <th class="px-3 py-2 text-right">{{ t('tools.avg.thSimulated') }}</th>
                  <th class="px-3 py-2 text-right">{{ t('tools.avg.thDelta') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-border)] font-mono">
                <tr v-for="row in comparisonRows" :key="row.key" class="hover:bg-[var(--color-surface-overlay)]">
                  <td class="px-3 py-2 font-sans font-medium text-[var(--color-text-primary)]">{{ row.label }}</td>
                  <td class="px-3 py-2 text-right">
                    <div>{{ row.initial }}</div>
                    <SecondaryCurrency v-if="row.initNum !== null" :amount="row.initNum" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                  </td>
                  <td class="px-3 py-2 text-right font-semibold">
                    <div>{{ row.simulated }}</div>
                    <SecondaryCurrency v-if="row.simNum !== null" :amount="row.simNum" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                  </td>
                  <td class="px-3 py-2 text-right font-semibold" :class="row.deltaTone === 'positive' ? 'pl-positive' : row.deltaTone === 'negative' ? 'pl-negative' : 'text-[var(--color-text-secondary)]'">
                    {{ row.delta }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Reverse Mode Results -->
        <div v-else class="solver-result-container space-y-4">
          <div v-if="solverResult.isValid" class="space-y-4">
            <div class="rounded-[var(--radius-md)] border border-[var(--color-pl-positive-border)] bg-[var(--color-pl-positive-soft)]/30 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('tools.avg.requiredQtyLabel') }}</div>
              <div class="solver-hero-val mt-1 font-mono text-2xl font-bold pl-positive">
                {{ solverResult.requiredShares.toFixed(2) }} {{ t('tools.avg.sharesUnit') }}
              </div>
              <div class="mt-1 text-xs text-[var(--color-text-secondary)]">
                {{ t('tools.avg.toAchieveTarget') }} <strong class="font-mono">{{ formatMoney(solverResult.achievedAvgCost, activeCurrency) }}</strong>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <UiKpiStatCard :label="t('tools.avg.capitalRequired')" :value="formatMoney(solverResult.requiredCapital, activeCurrency)" :secondary-amount="solverResult.requiredCapital" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" />
              <UiKpiStatCard :label="t('tools.avg.estimatedFees')" :value="formatMoney(solverResult.feeAmount, activeCurrency)" :secondary-amount="solverResult.feeAmount" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" />
              <UiKpiStatCard :label="t('tools.avg.totalCashOutlay')" :value="formatMoney(solverResult.totalOutlay, activeCurrency)" :secondary-amount="solverResult.totalOutlay" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" />
              <UiKpiStatCard :label="t('tools.avg.newTotalShares')" :value="solverResult.newTotalShares.toFixed(4)" />
              <UiKpiStatCard :label="t('tools.avg.newTotalCostBasis')" :value="formatMoney(solverResult.newTotalCost, activeCurrency)" :secondary-amount="solverResult.newTotalCost" :display-currency="activeCurrency" :exchange-rate="exchangeRate" :has-rate="hasRate" />
            </div>

            <UiAppButton class="btn-apply-solver" variant="primary" size="sm" @click="applySolverToForward">
              {{ t('tools.avg.applyToForward') }}
            </UiAppButton>
          </div>

          <div v-else class="solver-error-state space-y-1 rounded-[var(--radius-sm)] border border-[var(--color-pl-negative-border)] bg-[var(--color-pl-negative-soft)] p-4 text-xs text-[var(--color-pl-negative)]">
            <h4 class="solver-error-title font-semibold">{{ t('tools.avg.goalInfeasible') }}</h4>
            <div>{{ solverResult.errorKey ? t(solverResult.errorKey, solverResult.errorParams) : (solverResult.errorMessage || t('tools.avg.errNoFeasibleSolution')) }}</div>
          </div>
        </div>
      </UiAppCard>
    </div>
  </div>
</template>
