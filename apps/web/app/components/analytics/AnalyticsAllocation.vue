<script setup lang="ts">
import type { PortfolioAllocationResponse, PortfolioPosition } from '@sgsk-wealth/contracts';
import {
  convertCurrency,
  displaySymbol,
  getAssetColor,
  getAssetTypeLabel,
  getSymbolColor,
  getSymbolName,
} from '@sgsk-wealth/domain';

const props = defineProps<{
  openPositions: PortfolioPosition[];
  allocation: PortfolioAllocationResponse;
  currency: string;
  exchangeRate: number;
  hasRate: boolean;
}>();

const { t, language } = useI18n();
const selectedAllocClass = ref<string | null>(null);
const showAllHoldings = ref(false);

function toDisplay(val: number, fromCurrency: string): number {
  const from = (fromCurrency || 'THB').toUpperCase();
  const to = props.currency.toUpperCase();
  if (from === to || !props.exchangeRate) return val;
  return convertCurrency(val, from, to, props.exchangeRate);
}

const classRecommendations = computed(() =>
  props.allocation.recommendations
    .filter((r) => r.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((r) => ({
      ...r,
      label: getAssetTypeLabel(r.assetType, undefined, language.value),
      color: getAssetColor(r.assetType),
    })),
);

const selectedClassLabel = computed(() =>
  selectedAllocClass.value ? getAssetTypeLabel(selectedAllocClass.value, undefined, language.value) : '',
);

const drillDownHoldings = computed(() => {
  if (!selectedAllocClass.value) return [];
  const totalPortfolio = props.allocation.totalPortfolioValue || 0;
  const rows = props.openPositions
    .filter((p) => p.assetType === selectedAllocClass.value)
    .map((p) => {
      const value = toDisplay(p.holdingValue, p.currency);
      return {
        symbol: p.symbol,
        displaySymbol: p.displaySymbol || displaySymbol(p.symbol),
        name: getSymbolName(p.symbol, p.name || '', language.value, p.nameTh || '', p.assetType) || p.name || p.symbol,
        assetType: p.assetType,
        shares: p.totalShares,
        value,
        color: getSymbolColor(p.symbol),
      };
    })
    .sort((a, b) => b.value - a.value);
  const classTotal = rows.reduce((acc, r) => acc + r.value, 0);
  return rows.map((r) => ({
    ...r,
    classPercent: classTotal > 0 ? (r.value / classTotal) * 100 : 0,
    portfolioPercent: totalPortfolio > 0 ? (r.value / totalPortfolio) * 100 : 0,
  }));
});

const classTotalValue = computed(() => drillDownHoldings.value.reduce((acc, r) => acc + r.value, 0));
const classPortfolioPercent = computed(() => {
  const match = classRecommendations.value.find((r) => r.assetType === selectedAllocClass.value);
  if (match) return match.actualPercent;
  const total = props.allocation.totalPortfolioValue || 0;
  return total > 0 ? (classTotalValue.value / total) * 100 : 0;
});

const donutSlices = computed(() => {
  if (selectedAllocClass.value) {
    return drillDownHoldings.value.map((h) => ({
      key: h.symbol,
      label: h.displaySymbol,
      percent: h.classPercent,
      color: h.color,
      valueLabel: formatMoney(h.value, props.currency),
    }));
  }
  return classRecommendations.value.map((r) => ({
    key: r.assetType,
    label: r.label,
    percent: r.actualPercent,
    color: r.color,
    valueLabel: formatMoney(r.currentValue, props.currency),
  }));
});

const allConcentration = computed(() => {
  const apiRows = (props.allocation.holdingsConcentration || []).filter((h) => h.value > 0);
  if (apiRows.length > 0) {
    return apiRows.map((h) => ({
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
    value: toDisplay(p.holdingValue, p.currency),
  }));
  const total = converted.reduce((acc, x) => acc + x.value, 0);
  return converted
    .sort((a, b) => b.value - a.value)
    .map((x) => ({ ...x, percent: total > 0 ? (x.value / total) * 100 : 0 }));
});

const displayedConcentration = computed(() =>
  showAllHoldings.value ? allConcentration.value : allConcentration.value.slice(0, 5),
);

function selectClass(assetType: string | null) {
  selectedAllocClass.value = assetType;
}
</script>

<template>
  <div id="asset-allocation-pane" class="space-y-4">
    <!-- Top Row: Donut Distribution & Breakdown Table -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard class="lg:col-span-5">
        <template #header>
          <h2 class="allocation-card-title text-sm font-semibold text-[var(--color-text-primary)]">
            {{ t('alloc.assetDistribution') }}{{ selectedAllocClass ? ` (${selectedClassLabel})` : '' }}
          </h2>
        </template>
        <template #actions>
          <UiAppButton
            v-if="selectedAllocClass"
            id="alloc-reset-filter-btn"
            class="back-class-btn"
            size="xs"
            @click="selectClass(null)"
          >
            ← {{ t('alloc.allAssetClasses') }}
          </UiAppButton>
        </template>

        <div class="allocation-donut-card">
          <UiDonutChart
            :slices="donutSlices"
            :selected-key="selectedAllocClass"
            :center-label="selectedAllocClass ? selectedClassLabel : t('common.totalValue')"
            :center-value="formatMoney(selectedAllocClass ? classTotalValue : allocation.totalPortfolioValue, currency)"
            :center-secondary-amount="selectedAllocClass ? classTotalValue : allocation.totalPortfolioValue"
            :exchange-rate="exchangeRate"
            :has-rate="hasRate"
            legend-layout="grid"
            :size="188"
            @select="(key) => { if (!selectedAllocClass) selectClass(key); }"
          />
        </div>
      </UiAppCard>

      <UiAppCard class="lg:col-span-7">
        <template #header>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="allocation-card-title text-sm font-semibold text-[var(--color-text-primary)]">
              {{
                selectedAllocClass
                  ? t('alloc.symbolAllocationIn', { label: selectedClassLabel })
                  : t('alloc.classBreakdown')
              }}
            </h2>
            <span
              v-if="selectedAllocClass"
              class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
              :style="{
                backgroundColor: `${getAssetColor(selectedAllocClass)}18`,
                color: getAssetColor(selectedAllocClass),
                borderColor: `${getAssetColor(selectedAllocClass)}40`,
              }"
            >
              <span>{{ selectedClassLabel }}</span>
              <button
                type="button"
                class="rounded-full px-0.5 hover:opacity-75"
                :title="t('alloc.clearFilter')"
                :aria-label="t('alloc.clearFilter')"
                @click="selectClass(null)"
              >
                ✕
              </button>
            </span>
          </div>
        </template>

        <!-- All Asset Classes Table -->
        <div v-if="!selectedAllocClass" class="overflow-x-auto">
          <table class="rebalance-list w-full text-left text-xs">
            <thead class="border-b border-[var(--color-border)] text-[11px] uppercase text-[var(--color-text-muted)]">
              <tr>
                <th class="py-2 pr-2">{{ t('alloc.assetClass') }}</th>
                <th class="py-2 px-2 text-right">{{ t('common.value') }}</th>
                <th class="py-2 pl-2 text-right">{{ t('alloc.allocationPct') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr
                v-for="rec in classRecommendations"
                :key="rec.assetType"
                class="clickable-class-row cursor-pointer transition-colors hover:bg-[var(--color-surface-overlay)]"
                @click="selectClass(rec.assetType)"
              >
                <td class="py-2.5 pr-2">
                  <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: rec.color }" />
                    <span class="font-medium text-[var(--color-text-primary)]">{{ rec.label }}</span>
                    <span class="text-[var(--color-text-muted)]" :title="t('alloc.filterBy', { label: rec.label })">›</span>
                  </div>
                </td>
                <td class="px-2 py-2.5 text-right font-mono">
                  <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(rec.currentValue, currency) }}</div>
                  <SecondaryCurrency :amount="rec.currentValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                </td>
                <td class="py-2.5 pl-2 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                  {{ rec.actualPercent.toFixed(1) }}%
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-[var(--color-border)] font-semibold">
              <tr>
                <td class="py-2.5 pr-2 text-[var(--color-text-primary)]">{{ t('common.total') }}</td>
                <td class="px-2 py-2.5 text-right font-mono">
                  <div class="privacy-mask text-[var(--color-text-primary)]">{{ formatMoney(allocation.totalPortfolioValue, currency) }}</div>
                  <SecondaryCurrency :amount="allocation.totalPortfolioValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                </td>
                <td class="py-2.5 pl-2 text-right font-mono text-[var(--color-text-primary)]">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Symbol Drill-Down Table -->
        <div v-else class="symbol-class-list overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="border-b border-[var(--color-border)] text-[11px] uppercase text-[var(--color-text-muted)]">
              <tr>
                <th class="py-2 pr-2">{{ t('common.symbol') }}</th>
                <th class="py-2 px-2 text-right">{{ t('common.shares') }}</th>
                <th class="py-2 px-2 text-right">{{ t('common.value') }}</th>
                <th class="py-2 px-2 text-right">{{ t('alloc.classPct') }}</th>
                <th class="py-2 pl-2 text-right">{{ t('alloc.portfolioPct') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="item in drillDownHoldings" :key="item.symbol" class="symbol-class-item hover:bg-[var(--color-surface-overlay)]">
                <td class="py-2.5 pr-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <SymbolIcon :symbol="item.symbol" :asset-type="item.assetType" :size="22" />
                    {{ ' ' }}
                    <span
                      class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                      :style="{ backgroundColor: `${item.color}18`, color: item.color, borderColor: `${item.color}30` }"
                    >
                      {{ item.displaySymbol }}
                    </span>
                    {{ ' ' }}
                    <span class="symbol-full-name truncate text-[var(--color-text-secondary)]">{{ item.name }}</span>
                  </div>
                </td>
                <td class="privacy-mask px-2 py-2.5 text-right font-mono">
                  {{ item.shares.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}
                </td>
                <td class="px-2 py-2.5 text-right font-mono">
                  <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(item.value, currency) }}</div>
                  <SecondaryCurrency :amount="item.value" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                </td>
                <td class="px-2 py-2.5 text-right font-mono font-semibold text-[var(--color-text-primary)]">
                  {{ item.classPercent.toFixed(1) }}%
                </td>
                <td class="py-2.5 pl-2 text-right font-mono text-[var(--color-text-muted)]">
                  {{ item.portfolioPercent.toFixed(1) }}%
                </td>
              </tr>
              <tr v-if="drillDownHoldings.length === 0">
                <td colspan="5" class="py-6 text-center text-[var(--color-text-muted)]">
                  {{ t('alloc.noHoldingsIn', { label: selectedClassLabel }) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-[var(--color-border)] font-semibold">
              <tr>
                <td class="py-2.5 pr-2 text-[var(--color-text-primary)]">{{ t('alloc.classTotal') }}</td>
                <td class="px-2 py-2.5" />
                <td class="px-2 py-2.5 text-right font-mono">
                  <div class="privacy-mask text-[var(--color-text-primary)]">{{ formatMoney(classTotalValue, currency) }}</div>
                  <SecondaryCurrency :amount="classTotalValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                </td>
                <td class="px-2 py-2.5 text-right font-mono text-[var(--color-text-primary)]">100.0%</td>
                <td class="py-2.5 pl-2 text-right font-mono text-[var(--color-text-muted)]">{{ classPortfolioPercent.toFixed(1) }}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UiAppCard>
    </div>

    <!-- Bottom Row (Hidden during class drill-down): Currency Exposure & Top Holdings Concentration -->
    <div v-if="!selectedAllocClass" id="allocation-bottom-row" class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard id="allocation-currency-card" :title="t('analytics.currencyExposure')" class="lg:col-span-5">
        <div class="space-y-3 text-xs">
          <div class="flex justify-between font-mono">
            <span>USD <span class="text-[var(--color-text-muted)]">({{ allocation.currencyExposure.usdPercent.toFixed(1) }}%)</span></span>
            <span>THB <span class="text-[var(--color-text-muted)]">({{ allocation.currencyExposure.thbPercent.toFixed(1) }}%)</span></span>
          </div>
          <div class="flex h-3 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
            <div class="bg-[var(--color-asset-us-stocks)]" :style="{ width: `${allocation.currencyExposure.usdPercent}%` }" />
            <div class="bg-[var(--color-asset-thai-stocks)]" :style="{ width: `${allocation.currencyExposure.thbPercent}%` }" />
          </div>
          <div class="flex items-start justify-between font-mono text-xs">
            <div>
              <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(allocation.currencyExposure.usd, 'USD') }}</div>
              <SecondaryCurrency
                :amount="allocation.currencyExposure.usd"
                display-currency="USD"
                :exchange-rate="exchangeRate"
                :has-rate="hasRate"
                variant="compact"
              />
            </div>
            <div class="text-right">
              <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(allocation.currencyExposure.thb, 'THB') }}</div>
              <SecondaryCurrency
                :amount="allocation.currencyExposure.thb"
                display-currency="THB"
                :exchange-rate="exchangeRate"
                :has-rate="hasRate"
                variant="compact"
              />
            </div>
          </div>
        </div>
      </UiAppCard>

      <UiAppCard id="allocation-concentration-card" :title="t('analytics.topConcentration')" class="lg:col-span-7">
        <template #actions>
          <UiAppButton v-if="allConcentration.length > 5" size="xs" @click="showAllHoldings = !showAllHoldings">
            {{ showAllHoldings ? t('common.showTop5') : t('common.showAll') }}
          </UiAppButton>
        </template>

        <div class="space-y-2.5">
          <div
            v-for="holding in displayedConcentration"
            :key="holding.symbol"
            class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <SymbolIcon :symbol="holding.symbol" :asset-type="holding.assetType" :size="22" />
                <span
                  class="rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                  :style="{ backgroundColor: `${holding.color}18`, color: holding.color, borderColor: `${holding.color}30` }"
                >
                  {{ holding.displaySymbol }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-right font-mono">
                <div>
                  <div class="privacy-mask font-semibold text-[var(--color-text-primary)]">{{ formatMoney(holding.value, currency) }}</div>
                  <SecondaryCurrency :amount="holding.value" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
                </div>
                <span
                  class="w-12 font-semibold"
                  :class="holding.percent > 15 ? 'pl-negative' : 'text-[var(--color-text-secondary)]'"
                >
                  {{ holding.percent.toFixed(1) }}%
                </span>
              </div>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="h-full rounded-full" :style="{ width: `${Math.min(100, holding.percent)}%`, backgroundColor: holding.color }" />
            </div>
          </div>
        </div>
      </UiAppCard>
    </div>
  </div>
</template>
