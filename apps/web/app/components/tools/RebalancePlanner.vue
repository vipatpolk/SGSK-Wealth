<script setup lang="ts">
import type { NoSellSubMode, RebalanceMode } from '@sgsk-wealth/contracts';
import {
  calculateRebalancePlan,
  displaySymbol,
  getAssetColor,
  getAssetTypeLabel,
  getCurrentWeightsForClass,
  getEqualWeightsForClass,
  normalizeWeightsTo100,
} from '@sgsk-wealth/domain';

const { t, language } = useI18n();
const { settings, setRebalanceTargets } = useUserSettings();
const { holdings, pricesMap, exchangeRate, hasRate } = usePortfolioData();

const rebalanceMode = ref<RebalanceMode>('standard');
const noSellSubMode = ref<NoSellSubMode>('optimal');
const customCashDeposit = ref(5000);
const rebalanceClassFilter = ref('all');
const rebalanceTargets = ref<Record<string, Record<string, number>>>({});
const copiedToast = ref(false);

const rebalancePositionList = computed(() =>
  holdings.value.openPositions.filter((p) => p.assetType !== 'provident-fund'),
);

const rebalanceClasses = computed(() => {
  const counts = new Map<string, number>();
  for (const p of rebalancePositionList.value) {
    counts.set(p.assetType, (counts.get(p.assetType) ?? 0) + 1);
  }
  return [
    { id: 'all', label: t('asset.allClasses'), count: rebalancePositionList.value.length },
    ...[...counts.entries()].map(([id, count]) => ({
      id,
      label: getAssetTypeLabel(id, undefined, language.value),
      count,
    })),
  ];
});

watch(
  rebalancePositionList,
  (list) => {
    const byClass = new Map<string, string[]>();
    for (const p of list) {
      const arr = byClass.get(p.assetType) ?? [];
      arr.push(p.symbol);
      byClass.set(p.assetType, arr);
    }
    const next: Record<string, Record<string, number>> = { ...rebalanceTargets.value };
    for (const [cls, syms] of byClass.entries()) {
      if (!next[cls]) {
        next[cls] = settings.value.rebalanceTargets?.[cls] ?? getEqualWeightsForClass(syms);
      }
    }
    rebalanceTargets.value = next;
  },
  { immediate: true },
);

const rebalancePlan = computed(() => {
  const flattenedTargets: Record<string, number> = Object.assign({}, ...Object.values(rebalanceTargets.value));
  return calculateRebalancePlan(
    rebalancePositionList.value,
    pricesMap.value,
    {
      mode: rebalanceMode.value,
      noSellSubMode: noSellSubMode.value,
      customCashDeposit: customCashDeposit.value,
      targetAllocations: flattenedTargets,
      selectedAssetClassFilter: rebalanceClassFilter.value,
    },
    settings.value.currency,
    exchangeRate.value || 34.5,
    language.value,
  );
});

const filteredRebalanceGroups = computed(() =>
  rebalanceClassFilter.value === 'all'
    ? rebalancePlan.value.groups
    : rebalancePlan.value.groups.filter((g) => g.assetType === rebalanceClassFilter.value),
);

const currentValLabel = computed(() =>
  rebalanceClassFilter.value === 'all' ? t('tools.reb.currentPortfolioVal') : t('tools.reb.currentClassVal'),
);

const resultingValLabel = computed(() =>
  rebalanceClassFilter.value === 'all' ? t('tools.reb.resultingPortfolioVal') : t('tools.reb.resultingClassVal'),
);

function updateTarget(assetType: string, sym: string, val: number) {
  const clamped = Math.min(100, Math.max(0, Number(val.toFixed(2)) || 0));
  const cur = rebalanceTargets.value[assetType] ?? {};
  rebalanceTargets.value = {
    ...rebalanceTargets.value,
    [assetType]: { ...cur, [sym]: clamped },
  };
  setRebalanceTargets(rebalanceTargets.value);
}

function applyEqualPreset(assetType: string, symbols: string[]) {
  rebalanceTargets.value = { ...rebalanceTargets.value, [assetType]: getEqualWeightsForClass(symbols) };
  setRebalanceTargets(rebalanceTargets.value);
}

function applyCurrentPreset(assetType: string, groupSymbols: { symbol: string; currentWeightPct: number }[]) {
  rebalanceTargets.value = {
    ...rebalanceTargets.value,
    [assetType]: getCurrentWeightsForClass(groupSymbols),
  };
  setRebalanceTargets(rebalanceTargets.value);
}

function applyNormalizePreset(assetType: string, symbols: string[]) {
  const cur = rebalanceTargets.value[assetType] ?? {};
  rebalanceTargets.value = { ...rebalanceTargets.value, [assetType]: normalizeWeightsTo100(cur, symbols) };
  setRebalanceTargets(rebalanceTargets.value);
}

async function copyOrdersToClipboard() {
  const orders = rebalancePlan.value.orders || [];
  if (orders.length === 0 || typeof navigator === 'undefined' || !navigator.clipboard) return;
  const lines = orders.map(
    (o, i) => `${i + 1}. ${o.action} ${o.shares.toFixed(4)} ${displaySymbol(o.symbol)} (~${o.amount.toFixed(2)} ${o.currency})`,
  );
  await navigator.clipboard.writeText(lines.join('\n'));
  copiedToast.value = true;
  setTimeout(() => { copiedToast.value = false; }, 2200);
}
</script>

<template>
  <div id="rebalance-calculator" class="space-y-4">
    <UiAppCard :title="t('tools.reb.heading')" :subtitle="t('tools.rebalance.desc')">
      <template #actions>
        <div class="rebalance-mode-toggle inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs">
          <button
            id="btn-mode-standard"
            type="button"
            class="rounded px-2.5 py-1 font-semibold"
            :class="rebalanceMode === 'standard' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            @click="rebalanceMode = 'standard'"
          >
            <span class="hidden sm:inline">{{ t('tools.reb.modeStandardDesktop') }}</span>
            <span class="mode-text-mobile sm:hidden">{{ t('tools.reb.modeStandardMobile') }}</span>
          </button>
          <button
            id="btn-mode-nosell"
            type="button"
            class="rounded px-2.5 py-1 font-semibold"
            :class="rebalanceMode === 'no-sell' ? 'active bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'"
            @click="rebalanceMode = 'no-sell'"
          >
            <span class="hidden sm:inline">{{ t('tools.reb.modeNoSellDesktop') }}</span>
            <span class="sm:hidden">{{ t('tools.reb.modeNoSellMobile') }}</span>
          </button>
        </div>
      </template>

      <div class="space-y-3">
        <!-- Class Filter Chips -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {{ t('tools.reb.filterClass') }}
          </span>
          <button
            v-for="cls in rebalanceClasses"
            :key="cls.id"
            type="button"
            class="class-chip inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium"
            :class="
              rebalanceClassFilter === cls.id
                ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            "
            @click="rebalanceClassFilter = cls.id"
          >
            <span>{{ cls.label }}</span>
            <span class="rounded bg-[var(--color-surface-overlay)] px-1 font-mono text-[10px]">{{ cls.count }}</span>
          </button>
        </div>

        <!-- No-Sell Sub-Mode Radio Panel -->
        <div
          v-if="rebalanceMode === 'no-sell'"
          id="nosell-settings-panel"
          class="space-y-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs"
        >
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              class="flex cursor-pointer items-start gap-2 rounded border p-2.5 transition-colors"
              :class="noSellSubMode === 'optimal' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30' : 'border-[var(--color-border)]'"
            >
              <input v-model="noSellSubMode" type="radio" value="optimal" class="mt-0.5" />
              <div>
                <div class="font-semibold text-[var(--color-text-primary)]">{{ t('tools.reb.minInflowTitle') }}</div>
                <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ t('tools.reb.minInflowDesc') }}</div>
              </div>
            </label>

            <label
              class="flex cursor-pointer items-start gap-2 rounded border p-2.5 transition-colors"
              :class="noSellSubMode === 'custom-cash' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30' : 'border-[var(--color-border)]'"
            >
              <input id="radio-custom-deposit" v-model="noSellSubMode" type="radio" value="custom-cash" class="mt-0.5" />
              <div>
                <div class="font-semibold text-[var(--color-text-primary)]">{{ t('tools.reb.customDepositTitle') }}</div>
                <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ t('tools.reb.customDepositDesc') }}</div>
              </div>
            </label>
          </div>

          <div v-if="noSellSubMode === 'custom-cash'" class="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-2.5">
            <label for="custom-cash-input" class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.reb.availableCash') }}</label>
            <input
              id="custom-cash-input"
              v-model.number="customCashDeposit"
              type="number"
              min="0"
              class="h-8 w-36 rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
            />
            <div class="flex flex-wrap gap-1">
              <button v-for="amt in [500, 1000, 5000, 10000]" :key="amt" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="customCashDeposit += amt">
                +{{ amt.toLocaleString() }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mode-Aware 4-Card KPI Strip -->
        <div class="rebalance-kpi-grid grid grid-cols-2 gap-3 lg:grid-cols-4">
          <UiKpiStatCard
            :label="currentValLabel"
            :value="formatMoney(rebalancePlan.totalCurrentPortfolioValue, settings.currency)"
            :secondary-amount="rebalancePlan.totalCurrentPortfolioValue"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            masked
          />
          <UiKpiStatCard
            v-if="rebalanceMode === 'no-sell'"
            :label="noSellSubMode === 'optimal' ? t('tools.reb.minInflowReq') : t('tools.reb.cashContribution')"
            :value="formatMoney(rebalancePlan.cashContribution, settings.currency)"
            :secondary-amount="rebalancePlan.cashContribution"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            masked
          />
          <UiKpiStatCard
            :label="t('tools.reb.totalBuyOrders')"
            :value="formatMoney(rebalancePlan.totalBuyAmount, settings.currency)"
            tone="positive"
            :secondary-amount="rebalancePlan.totalBuyAmount"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            masked
          />
          <UiKpiStatCard
            v-if="rebalanceMode === 'standard'"
            :label="t('tools.reb.totalSellOrders')"
            :value="formatMoney(rebalancePlan.totalSellAmount, settings.currency)"
            tone="negative"
            :secondary-amount="rebalancePlan.totalSellAmount"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            masked
          />
          <UiKpiStatCard
            :label="resultingValLabel"
            :value="formatMoney(rebalancePlan.totalTargetPortfolioValue, settings.currency)"
            :secondary-amount="rebalancePlan.totalTargetPortfolioValue"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            masked
          />
        </div>
      </div>
    </UiAppCard>

    <!-- Per-Asset-Class Cards -->
    <div
      v-for="group in filteredRebalanceGroups"
      :key="group.assetType"
      class="asset-class-card space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: getAssetColor(group.assetType) }" />
          <h3 class="text-sm font-semibold text-[var(--color-text-primary)]">{{ group.label }}</h3>
          <span class="font-mono text-[11px] text-[var(--color-text-muted)]">
            {{ t('tools.reb.classValueColon') }} {{ formatMoney(group.currentValue, settings.currency) }} ·
            {{ t('tools.reb.portfolioShareColon') }} {{ group.currentPortfolioPercent.toFixed(1) }}%
          </span>
          <UiAppBadge :tone="group.isValid ? 'positive' : 'warning'" class="target-sum-badge font-mono">
            {{ t('tools.reb.targetSumColon') }} {{ group.targetTotalPercent.toFixed(1) }}%
          </UiAppBadge>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <UiAppButton size="xs" :title="t('tools.reb.equalWeightTitle')" @click="applyEqualPreset(group.assetType, group.symbols.map((s) => s.symbol))">
            {{ t('tools.reb.equalWeight') }}
          </UiAppButton>
          <UiAppButton size="xs" :title="t('tools.reb.setCurrentTitle')" @click="applyCurrentPreset(group.assetType, group.symbols.map((s) => ({ symbol: s.symbol, currentWeightPct: s.currentClassPercent })))">
            {{ t('tools.reb.setCurrent') }}
          </UiAppButton>
          <UiAppButton size="xs" :title="t('tools.reb.normalizeTitle')" @click="applyNormalizePreset(group.assetType, group.symbols.map((s) => s.symbol))">
            {{ t('tools.reb.normalize') }}
          </UiAppButton>
        </div>
      </div>

      <!-- Sum != 100% Warning Banner -->
      <div
        v-if="!group.isValid"
        class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-financial-warning-border)] bg-[var(--color-financial-warning-soft)] px-3 py-2 text-xs text-[var(--color-financial-warning)]"
      >
        <span>
          {{ t('tools.reb.sumWarningBefore') }} <strong class="font-mono">{{ group.targetTotalPercent.toFixed(1) }}%</strong>{{ t('tools.reb.sumWarningMiddle') }}
        </span>
        <UiAppButton size="xs" @click="applyNormalizePreset(group.assetType, group.symbols.map((s) => s.symbol))">
          {{ t('tools.reb.normalize') }}
        </UiAppButton>
      </div>

      <!-- 6-Column Desktop Table -->
      <div class="hidden overflow-x-auto sm:block">
        <table class="w-full text-left text-xs">
          <thead class="border-b border-[var(--color-border)] text-[11px] uppercase text-[var(--color-text-muted)]">
            <tr>
              <th class="py-2 pr-2">{{ t('tools.reb.thSymbol') }}</th>
              <th class="px-2 py-2 text-right">{{ t('tools.reb.thCurrentPos') }}</th>
              <th class="px-2 py-2 text-right">{{ t('tools.reb.thCurrentPct') }}</th>
              <th class="px-2 py-2 text-right">{{ t('tools.reb.thTargetPct') }}</th>
              <th class="px-2 py-2 text-right">{{ t('tools.reb.thTargetVal') }}</th>
              <th class="py-2 pl-2 text-right">{{ t('tools.reb.thAction') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr v-for="row in group.symbols" :id="`rebalance-row-${row.symbol}`" :key="row.symbol">
              <td class="py-2.5 pr-2">
                <div class="flex items-center gap-2">
                  <SymbolIcon :symbol="row.symbol" :asset-type="row.assetType" :size="22" />
                  <div class="min-w-0">
                    <div>
                      <span class="font-mono font-bold text-[var(--color-text-primary)]">{{ displaySymbol(row.symbol) }}</span>
                      {{ ' ' }}
                      <span class="sym-name text-[var(--color-text-secondary)]">{{ row.name }}</span>
                    </div>
                    <div class="font-mono text-[10px] text-[var(--color-text-muted)]">
                      {{ formatMoney(row.currentPrice, row.currency) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2.5 text-right font-mono">
                <div class="privacy-mask font-semibold">{{ formatMoney(row.currentValue, settings.currency) }}</div>
                <SecondaryCurrency :amount="row.currentValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                <div class="text-[10px] text-[var(--color-text-muted)]">{{ row.currentShares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }} {{ t('tools.avg.unitShort') }}</div>
              </td>
              <td class="px-2 py-2.5 text-right font-mono">{{ row.currentClassPercent.toFixed(1) }}%</td>
              <td class="px-2 py-2.5 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="h-6 w-6 rounded border border-[var(--color-border)] font-mono"
                    :aria-label="t('tools.reb.decreaseTarget')"
                    @click="updateTarget(group.assetType, row.symbol, (rebalanceTargets[group.assetType]?.[row.symbol] ?? row.targetPercent) - 1)"
                  >
                    -
                  </button>
                  <input
                    :value="rebalanceTargets[group.assetType]?.[row.symbol] ?? row.targetPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="h-7 w-16 rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-1.5 text-right font-mono text-xs"
                    @change="updateTarget(group.assetType, row.symbol, Number(($event.target as HTMLInputElement).value))"
                  />
                  <button
                    type="button"
                    class="h-6 w-6 rounded border border-[var(--color-border)] font-mono"
                    :aria-label="t('tools.reb.increaseTarget')"
                    @click="updateTarget(group.assetType, row.symbol, (rebalanceTargets[group.assetType]?.[row.symbol] ?? row.targetPercent) + 1)"
                  >
                    +
                  </button>
                </div>
              </td>
              <td class="px-2 py-2.5 text-right font-mono">
                <div class="privacy-mask">{{ formatMoney(row.targetValue, settings.currency) }}</div>
                <SecondaryCurrency :amount="row.targetValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
              </td>
              <td class="py-2.5 pl-2 text-right font-mono">
                <div class="flex flex-col items-end gap-0.5">
                  <div class="flex items-center gap-1">
                    <UiAppBadge v-if="row.isAnchorPosition" tone="info">{{ t('tools.reb.anchor') }}</UiAppBadge>
                    <UiAppBadge :tone="row.action === 'BUY' ? 'positive' : row.action === 'SELL' ? 'negative' : 'neutral'">
                      {{ row.action === 'BUY' ? t('common.buy') : row.action === 'SELL' ? t('common.sell') : t('tools.reb.balanced') }}
                      {{ row.action !== 'HOLD' ? formatMoney(Math.abs(row.deltaValue), settings.currency) : '' }}
                    </UiAppBadge>
                  </div>
                  <span v-if="row.action !== 'HOLD'" class="text-[10px] text-[var(--color-text-muted)]">
                    ({{ row.deltaShares >= 0 ? '+' : '' }}{{ row.deltaShares.toFixed(3) }} {{ t('tools.avg.unitShort') }})
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="mobile-symbol-cards-list space-y-2 sm:hidden">
        <div
          v-for="row in group.symbols"
          :key="`m-${row.symbol}`"
          class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono font-bold">{{ displaySymbol(row.symbol) }}</span>
              {{ ' ' }}
              <span class="sym-name text-[var(--color-text-secondary)]">{{ row.name }}</span>
            </div>
            <UiAppBadge :tone="row.action === 'BUY' ? 'positive' : row.action === 'SELL' ? 'negative' : 'neutral'">
              {{ row.action }}
            </UiAppBadge>
          </div>
          <div class="mt-2 flex items-center justify-between font-mono text-[11px]">
            <span>{{ t('tools.reb.curShort', { pct: row.currentClassPercent.toFixed(1) }) }}</span>
            <span>{{ t('tools.reb.tgtShort', { pct: (rebalanceTargets[group.assetType]?.[row.symbol] ?? row.targetPercent).toFixed(1) }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trade Execution Plan Section -->
    <UiAppCard id="rebalance-orders-checklist">
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="text-sm font-semibold text-[var(--color-text-primary)]">{{ t('tools.reb.drawerTitle') }}</h4>
          <UiAppBadge tone="info" class="font-mono">
            {{
              rebalancePlan.orders.length === 1
                ? t('tools.reb.recommendedOrdersSingular', { count: 1 })
                : t('tools.reb.recommendedOrdersPlural', { count: rebalancePlan.orders.length })
            }}
          </UiAppBadge>
        </div>
      </template>
      <template #actions>
        <UiAppButton id="btn-copy-trade-plan" size="xs" :disabled="rebalancePlan.orders.length === 0" @click="copyOrdersToClipboard">
          {{ copiedToast ? t('tools.reb.copied') : t('tools.reb.copyPlan') }}
        </UiAppButton>
      </template>

      <div v-if="rebalancePlan.orders.length > 0" class="space-y-1.5">
        <div
          v-for="(order, idx) in rebalancePlan.orders"
          :key="order.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
        >
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ idx + 1 }}.</span>
            <UiAppBadge :tone="order.action === 'BUY' ? 'positive' : 'negative'" class="font-mono">
              {{ order.action === 'BUY' ? t('common.buy') : t('common.sell') }}
            </UiAppBadge>
            <span class="font-mono font-bold text-[var(--color-text-primary)]">{{ order.displaySymbol }}</span>
            <span class="font-mono text-[11px] text-[var(--color-text-muted)]">
              {{ t('tools.reb.sharesAt', { shares: order.shares.toFixed(4) }) }} {{ formatMoney(order.price, order.currency) }}
            </span>
          </div>
          <span class="privacy-mask font-mono font-semibold" :class="order.action === 'BUY' ? 'pl-positive' : 'pl-negative'">
            {{ order.action === 'BUY' ? '+' : '-' }}{{ formatMoney(order.amount, order.currency) }}
          </span>
        </div>
      </div>
      <div v-else class="py-4 text-center text-xs text-[var(--color-text-muted)]">
        {{ t('tools.reb.emptyDesc') }}
      </div>
    </UiAppCard>
  </div>
</template>
