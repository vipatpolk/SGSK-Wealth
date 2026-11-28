<script setup lang="ts">
import type {
  PortfolioAllocationResponse,
  PortfolioPerformanceResponse,
  PortfolioPosition,
  PortfolioSummary,
} from '@sgsk-wealth/contracts';
import { convertCurrency, displaySymbol, getAssetColor, getAssetTypeLabel, getSymbolColor } from '@sgsk-wealth/domain';

const props = defineProps<{
  holdingsSummary: PortfolioSummary;
  openPositions: PortfolioPosition[];
  allocation: PortfolioAllocationResponse;
  performance: PortfolioPerformanceResponse;
  currency: string;
  exchangeRate: number;
  hasRate: boolean;
}>();

const emit = defineEmits<{
  switchTab: [tab: 'overview' | 'allocation' | 'performance'];
}>();

const { t, language } = useI18n();

const allocSlices = computed(() =>
  props.allocation.recommendations
    .filter((r) => r.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((r) => ({
      key: r.assetType,
      label: getAssetTypeLabel(r.assetType, undefined, language.value),
      percent: r.actualPercent,
      color: getAssetColor(r.assetType),
      valueLabel: formatMoney(r.currentValue, props.currency),
    })),
);

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

const topConcentration = computed(() => {
  const apiRows = (props.allocation.holdingsConcentration || []).filter((h) => h.value > 0);
  if (apiRows.length > 0) {
    return apiRows.slice(0, 5).map((h) => ({
      symbol: h.symbol,
      displaySymbol: h.displaySymbol || displaySymbol(h.symbol),
      assetType: h.assetType,
      color: getSymbolColor(h.symbol),
      value: h.value,
      percent: h.portfolioPercent,
    }));
  }
  const converted = props.openPositions.map((p) => ({
    symbol: p.symbol,
    displaySymbol: p.displaySymbol || displaySymbol(p.symbol),
    assetType: p.assetType,
    color: getSymbolColor(p.symbol),
    value:
      p.currency.toUpperCase() === props.currency.toUpperCase() || !props.exchangeRate
        ? p.holdingValue
        : convertCurrency(p.holdingValue, p.currency, props.currency, props.exchangeRate),
  }));
  const total = converted.reduce((acc, x) => acc + x.value, 0);
  return converted
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((x) => ({ ...x, percent: total > 0 ? (x.value / total) * 100 : 0 }));
});

const topGainers = computed(() =>
  [...(props.performance.symbolPerformance || [])]
    .filter((s) => (s.totalReturnPercent ?? 0) > 0)
    .sort((a, b) => (b.totalReturnPercent ?? 0) - (a.totalReturnPercent ?? 0))
    .slice(0, 3),
);

const topLosers = computed(() =>
  [...(props.performance.symbolPerformance || [])]
    .filter((s) => (s.totalReturnPercent ?? 0) < 0)
    .sort((a, b) => (a.totalReturnPercent ?? 0) - (b.totalReturnPercent ?? 0))
    .slice(0, 3),
);
</script>

<template>
  <div id="analytics-overview-pane" class="space-y-4">
    <!-- 5-Card KPI Strip -->
    <div class="overview-kpi-grid grid grid-cols-2 gap-3 lg:grid-cols-5">
      <UiKpiStatCard
        class="overview-kpi-card"
        :label="t('common.totalInvested')"
        :value="formatMoney(holdingsSummary.totalInvested, currency)"
        :secondary-amount="holdingsSummary.totalInvested"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        masked
      />
      <UiKpiStatCard
        class="overview-kpi-card"
        :label="t('common.totalValue')"
        :value="formatMoney(holdingsSummary.totalValue, currency)"
        :secondary-amount="holdingsSummary.totalValue"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        masked
      />
      <UiKpiStatCard
        class="overview-kpi-card"
        :label="t('common.unrealizedPL')"
        :value="formatSignedMoney(holdingsSummary.totalUnrealizedPL, currency)"
        :subtext="formatPercent(holdingsSummary.totalUnrealizedPLPercent)"
        :tone="holdingsSummary.totalUnrealizedPL >= 0 ? 'positive' : 'negative'"
        :secondary-amount="holdingsSummary.totalUnrealizedPL"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
      <UiKpiStatCard
        class="overview-kpi-card"
        :label="t('common.realizedPL')"
        :value="formatSignedMoney(holdingsSummary.totalRealizedPL, currency)"
        :subtext="formatPercent(holdingsSummary.totalRealizedPLPercent)"
        :tone="holdingsSummary.totalRealizedPL >= 0 ? 'positive' : 'negative'"
        :secondary-amount="holdingsSummary.totalRealizedPL"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
      <UiKpiStatCard
        class="overview-kpi-card kpi-card-highlight col-span-2 border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/25 lg:col-span-1"
        :label="t('common.totalReturn')"
        :value="formatSignedMoney(holdingsSummary.totalReturn, currency)"
        :subtext="formatPercent(holdingsSummary.totalReturnPercent)"
        :tone="holdingsSummary.totalReturn >= 0 ? 'positive' : 'negative'"
        :secondary-amount="holdingsSummary.totalReturn"
        :exchange-rate="exchangeRate"
        :has-rate="hasRate"
        secondary-signed
        masked
      />
    </div>

    <!-- Mid Row: Asset Distribution & Returns by Asset Class (+ Currency Exposure) -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard :title="t('alloc.assetDistribution')" class="lg:col-span-6">
        <template #actions>
          <button
            type="button"
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
            @click="emit('switchTab', 'allocation')"
          >
            {{ t('analytics.viewAllocation') }} ›
          </button>
        </template>
        <UiDonutChart
          :slices="allocSlices"
          :center-label="t('common.totalValue')"
          :center-value="formatMoney(allocation.totalPortfolioValue, currency)"
          :center-secondary-amount="allocation.totalPortfolioValue"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          legend-layout="pills"
          :size="180"
          @select="emit('switchTab', 'allocation')"
        />
      </UiAppCard>

      <UiAppCard :title="t('analytics.returnsByClass')" class="lg:col-span-6">
        <template #actions>
          <button
            type="button"
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
            @click="emit('switchTab', 'performance')"
          >
            {{ t('analytics.viewPerformance') }} ›
          </button>
        </template>

        <div class="space-y-3">
          <div class="space-y-2.5">
            <div v-for="asset in assetTypePerformance" :key="asset.type" class="flex items-center gap-3 text-xs">
              <div class="flex w-32 shrink-0 items-center gap-2">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: asset.color }" />
                <span class="truncate text-[var(--color-text-secondary)]">{{ asset.label }}</span>
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
              <span
                class="w-16 shrink-0 text-right font-mono font-semibold"
                :class="asset.totalReturnPercent >= 0 ? 'pl-positive' : 'pl-negative'"
              >
                {{ formatPercent(asset.totalReturnPercent) }}
              </span>
            </div>
          </div>

          <div class="border-t border-[var(--color-border)] pt-3 space-y-2">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {{ t('analytics.currencyExposure') }}
            </div>
            <div class="flex justify-between font-mono text-xs">
              <span>USD <span class="text-[var(--color-text-muted)]">({{ allocation.currencyExposure.usdPercent.toFixed(1) }}%)</span></span>
              <span>THB <span class="text-[var(--color-text-muted)]">({{ allocation.currencyExposure.thbPercent.toFixed(1) }}%)</span></span>
            </div>
            <div class="flex h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="bg-[var(--color-asset-us-stocks)]" :style="{ width: `${allocation.currencyExposure.usdPercent}%` }" />
              <div class="bg-[var(--color-asset-thai-stocks)]" :style="{ width: `${allocation.currencyExposure.thbPercent}%` }" />
            </div>
          </div>
        </div>
      </UiAppCard>
    </div>

    <!-- Bottom Row: Top Holdings Concentration & Top Movers -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard :title="t('analytics.topConcentration')" class="lg:col-span-6">
        <template #actions>
          <NuxtLink to="/holdings" class="text-xs font-medium text-[var(--color-accent)] hover:underline">
            {{ t('analytics.allHoldings') }} ›
          </NuxtLink>
        </template>

        <div class="space-y-2.5">
          <div
            v-for="h in topConcentration"
            :key="h.symbol"
            class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <SymbolIcon :symbol="h.symbol" :asset-type="h.assetType" :size="22" />
                <span
                  class="rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                  :style="{ backgroundColor: `${h.color}18`, color: h.color, borderColor: `${h.color}30` }"
                >
                  {{ h.displaySymbol }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-right font-mono">
                <div>
                  <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(h.value, currency) }}</div>
                  <SecondaryCurrency :amount="h.value" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
                </div>
                <span class="w-12 font-semibold text-[var(--color-text-secondary)]">{{ h.percent.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="h-full rounded-full" :style="{ width: `${Math.min(100, h.percent)}%`, backgroundColor: h.color }" />
            </div>
          </div>
        </div>
      </UiAppCard>

      <UiAppCard :title="t('perf.topMovers')" class="lg:col-span-6">
        <template #actions>
          <button
            type="button"
            class="text-xs font-medium text-[var(--color-accent)] hover:underline"
            @click="emit('switchTab', 'performance')"
          >
            {{ t('analytics.perfTable') }} ›
          </button>
        </template>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pl-positive)]">
              {{ t('analytics.gainers') }}
            </div>
            <div
              v-for="g in topGainers"
              :key="`ov-g-${g.symbol}`"
              class="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs"
            >
              <div class="flex min-w-0 items-center gap-2">
                <SymbolIcon :symbol="g.symbol" :asset-type="g.assetType" :size="20" />
                <span class="truncate font-mono font-semibold text-[var(--color-text-primary)]">{{ g.displaySymbol || displaySymbol(g.symbol) }}</span>
              </div>
              <span class="shrink-0 font-mono font-semibold pl-positive">{{ formatPercent(g.totalReturnPercent ?? 0) }}</span>
            </div>
            <div v-if="topGainers.length === 0" class="py-3 text-xs text-[var(--color-text-muted)]">
              {{ t('analytics.noGainers') }}
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pl-negative)]">
              {{ t('analytics.losers') }}
            </div>
            <div
              v-for="l in topLosers"
              :key="`ov-l-${l.symbol}`"
              class="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs"
            >
              <div class="flex min-w-0 items-center gap-2">
                <SymbolIcon :symbol="l.symbol" :asset-type="l.assetType" :size="20" />
                <span class="truncate font-mono font-semibold text-[var(--color-text-primary)]">{{ l.displaySymbol || displaySymbol(l.symbol) }}</span>
              </div>
              <span class="shrink-0 font-mono font-semibold pl-negative">{{ formatPercent(l.totalReturnPercent ?? 0) }}</span>
            </div>
            <div v-if="topLosers.length === 0" class="py-3 text-xs text-[var(--color-text-muted)]">
              {{ t('analytics.noLosers') }}
            </div>
          </div>
        </div>
      </UiAppCard>
    </div>
  </div>
</template>
