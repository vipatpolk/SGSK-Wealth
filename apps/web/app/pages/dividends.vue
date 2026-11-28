<script setup lang="ts">
import { displaySymbol, getAssetColor, getSymbolName, normalizeAssetType } from '@sgsk-wealth/domain';

const { t } = useI18n();
const { settings } = useUserSettings();
const { dividends, exchangeRate, hasRate } = usePortfolioData();

const selectedAssetType = ref('all');
const selectedYear = ref<'ALL' | number>('ALL');
const searchQuery = ref('');
const sortField = ref<'symbol' | 'net' | 'yoc' | 'yield' | 'projected'>('net');
const sortDir = ref<'asc' | 'desc'>('desc');
const ledgerSymbol = ref<string | null>(null);

const availableYears = computed(() => {
  const years = new Set<number>();
  for (const r of dividends.value.records) {
    const y = Number(r.date?.slice(0, 4));
    if (y > 2000) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
});

const filteredRecords = computed(() =>
  dividends.value.records.filter((r) => {
    if (selectedAssetType.value !== 'all' && r.assetType !== selectedAssetType.value) return false;
    if (selectedYear.value !== 'ALL' && !r.date.startsWith(String(selectedYear.value))) return false;
    return true;
  }),
);

function symName(sym: { symbol: string; name: string; nameTh?: string | null; assetType: string }) {
  return getSymbolName(sym.symbol, sym.name, settings.value.language, sym.nameTh || '', sym.assetType) || sym.name;
}

const filteredSymbolSummaries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const mult = sortDir.value === 'asc' ? 1 : -1;
  return [...dividends.value.symbolSummaries]
    .filter((s) => {
      if (selectedAssetType.value !== 'all' && s.assetType !== selectedAssetType.value) return false;
      if (
        q &&
        !s.symbol.toLowerCase().includes(q) &&
        !s.name.toLowerCase().includes(q) &&
        !(s.nameTh || '').toLowerCase().includes(q) &&
        !symName(s).toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField.value === 'symbol') return a.symbol.localeCompare(b.symbol) * mult;
      if (sortField.value === 'yoc') return ((a.yieldOnCostPercent ?? 0) - (b.yieldOnCostPercent ?? 0)) * mult;
      if (sortField.value === 'yield') return ((a.currentYieldPercent ?? 0) - (b.currentYieldPercent ?? 0)) * mult;
      if (sortField.value === 'projected') return ((a.projectedAnnualIncome ?? 0) - (b.projectedAnnualIncome ?? 0)) * mult;
      return ((a.convertedNetDividends ?? 0) - (b.convertedNetDividends ?? 0)) * mult;
    });
});

const activeNetTotal = computed(() =>
  dividends.value.records.length > 0
    ? filteredRecords.value.reduce((acc, r) => acc + r.convertedNetAmount, 0)
    : dividends.value.totalNetDividends,
);
const activeGrossTotal = computed(() =>
  dividends.value.records.length > 0
    ? filteredRecords.value.reduce((acc, r) => acc + r.convertedGrossAmount, 0)
    : dividends.value.totalGrossDividends,
);
const activeWhtTotal = computed(() =>
  dividends.value.records.length > 0
    ? filteredRecords.value.reduce((acc, r) => acc + r.convertedWithholdingTax, 0)
    : dividends.value.totalWithholdingTax,
);
const activeEffectiveTaxRate = computed(() =>
  activeGrossTotal.value > 0 ? (activeWhtTotal.value / activeGrossTotal.value) * 100 : dividends.value.effectiveTaxRate,
);

const activeProjectedAnnualDividends = computed(() => {
  if (selectedAssetType.value === 'all' && selectedYear.value === 'ALL') {
    return dividends.value.projectedAnnualDividends;
  }
  return filteredSymbolSummaries.value.reduce((acc, s) => acc + (s.projectedAnnualIncome || 0), 0);
});

const activeYieldOnCost = computed(() => {
  if (selectedAssetType.value === 'all' && selectedYear.value === 'ALL') {
    return dividends.value.portfolioYieldOnCost;
  }
  const totalCost = filteredSymbolSummaries.value.reduce((acc, s) => acc + (s.currentCostBasis || 0), 0);
  return totalCost > 0 ? (activeProjectedAnnualDividends.value / totalCost) * 100 : 0;
});

const activeMarketYield = computed(() => {
  if (selectedAssetType.value === 'all' && selectedYear.value === 'ALL') {
    return dividends.value.portfolioDividendYield;
  }
  const totalVal = filteredSymbolSummaries.value.reduce((acc, s) => acc + (s.currentValue || 0), 0);
  return totalVal > 0 ? (activeProjectedAnnualDividends.value / totalVal) * 100 : 0;
});

const ASSET_STACK_ORDER = [
  'us-stock',
  'thai-stock',
  'mutual-fund',
  'bond',
  'crypto',
  'provident-fund',
] as const;

function assetBarColor(assetType: string): string {
  switch (assetType) {
    case 'us-stock':
      return 'var(--color-asset-us-stocks)';
    case 'thai-stock':
      return 'var(--color-asset-thai-stocks)';
    case 'mutual-fund':
      return 'var(--color-asset-mutual-funds)';
    case 'bond':
      return 'var(--color-asset-bond)';
    case 'crypto':
      return 'var(--color-asset-crypto)';
    case 'provident-fund':
      return 'var(--color-asset-provident-fund)';
    default:
      return getAssetColor(assetType);
  }
}

function assetTypeLabel(assetType: string): string {
  switch (assetType) {
    case 'us-stock':
      return t('asset.usStocks');
    case 'thai-stock':
      return t('asset.thaiStocks');
    case 'mutual-fund':
      return t('asset.mutualFunds');
    case 'bond':
      return t('asset.bonds');
    case 'crypto':
      return t('asset.crypto');
    case 'provident-fund':
      return t('asset.providentFund');
    default:
      return assetType;
  }
}

const monthlyBars = computed(() => {
  const list = dividends.value.monthlyDividends.filter(
    (m) => selectedYear.value === 'ALL' || m.year === selectedYear.value,
  );

  const entries = list
    .map((m) => {
      const byType = new Map<string, number>();
      if (m.byAssetType && Object.keys(m.byAssetType).length > 0) {
        for (const [rawType, rawVal] of Object.entries(m.byAssetType)) {
          const val = Number(rawVal) || 0;
          if (val <= 0) continue;
          const norm = normalizeAssetType(rawType) || rawType;
          byType.set(norm, (byType.get(norm) ?? 0) + val);
        }
      } else {
        for (const rec of dividends.value.records) {
          if (rec.date?.startsWith(m.yearMonth) && rec.convertedNetAmount > 0) {
            const norm = normalizeAssetType(rec.assetType) || rec.assetType;
            byType.set(norm, (byType.get(norm) ?? 0) + rec.convertedNetAmount);
          }
        }
      }

      if (selectedAssetType.value !== 'all') {
        const filteredVal = byType.get(selectedAssetType.value) ?? 0;
        byType.clear();
        if (filteredVal > 0) {
          byType.set(selectedAssetType.value, filteredVal);
        }
      }

      const segmentedSum = [...byType.values()].reduce((acc, v) => acc + v, 0);
      const netAmount =
        selectedAssetType.value !== 'all'
          ? segmentedSum
          : segmentedSum > 0
            ? segmentedSum
            : m.netAmount;

      return { ...m, netAmount, byType };
    })
    .filter((entry) => selectedAssetType.value === 'all' || entry.netAmount > 0);

  const maxVal = Math.max(1, ...entries.map((e) => e.netAmount));

  return entries.map((entry) => {
    const orderedKeys = [
      ...ASSET_STACK_ORDER.filter((k) => (entry.byType.get(k) ?? 0) > 0),
      ...[...entry.byType.keys()].filter(
        (k) => !ASSET_STACK_ORDER.includes(k as (typeof ASSET_STACK_ORDER)[number]) && (entry.byType.get(k) ?? 0) > 0,
      ),
    ];

    const segments =
      orderedKeys.length > 0 && entry.netAmount > 0
        ? orderedKeys.map((assetType) => {
            const amount = entry.byType.get(assetType) ?? 0;
            return {
              assetType,
              label: assetTypeLabel(assetType),
              amount,
              color: assetBarColor(assetType),
              pctOfMonth: (amount / entry.netAmount) * 100,
            };
          })
        : entry.netAmount > 0
          ? [
              {
                assetType: selectedAssetType.value !== 'all' ? selectedAssetType.value : 'us-stock',
                label:
                  selectedAssetType.value !== 'all'
                    ? assetTypeLabel(selectedAssetType.value)
                    : t('div.netDividends'),
                amount: entry.netAmount,
                color:
                  selectedAssetType.value !== 'all'
                    ? assetBarColor(selectedAssetType.value)
                    : 'var(--color-pl-positive)',
                pctOfMonth: 100,
              },
            ]
          : [];

    return {
      ...entry,
      heightPct: entry.netAmount > 0 ? Math.max(4, (entry.netAmount / maxVal) * 100) : 0,
      segments,
    };
  });
});

function recordsForSymbol(symbol: string) {
  return filteredRecords.value.filter((r) => r.symbol === symbol);
}

function toggleSort(field: typeof sortField.value) {
  if (sortField.value === field) sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc';
  else {
    sortField.value = field;
    sortDir.value = field === 'symbol' ? 'asc' : 'desc';
  }
}
</script>

<template>
  <div id="dividends-view" class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">{{ t('div.title') }}</h2>
        <p class="text-xs text-[var(--color-text-muted)]">{{ t('div.subtitle') }}</p>
      </div>
    </div>

    <!-- Asset Type & Year Filters -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="pill in [
            ['all', t('div.allAssets')],
            ['us-stock', t('asset.usStocks')],
            ['thai-stock', t('asset.thaiStocks')],
            ['mutual-fund', t('asset.mutualFunds')],
            ['bond', t('asset.bonds')],
          ]"
          :key="pill[0]"
          type="button"
          class="global-pill-btn rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            selectedAssetType === pill[0]
              ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
          "
          @click="selectedAssetType = pill[0]"
        >
          {{ pill[1] }}
        </button>
      </div>

      <div class="year-pills flex flex-wrap gap-1.5">
        <button
          type="button"
          class="year-pill-btn rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium"
          :class="selectedYear === 'ALL' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'"
          @click="selectedYear = 'ALL'"
        >
          {{ t('div.allTime') }}
        </button>
        <button
          v-for="yr in availableYears"
          :key="yr"
          type="button"
          class="year-pill-btn rounded-[var(--radius-sm)] border px-2.5 py-1 font-mono text-xs font-medium"
          :class="selectedYear === yr ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'"
          @click="selectedYear = yr"
        >
          {{ yr }}
        </button>
      </div>
    </div>

    <!-- 5 Executive Dividend KPI Cards -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div class="div-summary-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <span class="div-summary-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('div.netDividends') }}</span>
        <span class="div-summary-value privacy-mask font-mono text-xl font-bold pl-positive">{{ formatMoney(activeNetTotal, settings.currency) }}</span>
        <SecondaryCurrency :amount="activeNetTotal" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="kpi" />
      </div>

      <div class="div-summary-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <span class="div-summary-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('div.grossDividends') }}</span>
        <span class="div-summary-value privacy-mask font-mono text-xl font-bold text-[var(--color-text-primary)]">{{ formatMoney(activeGrossTotal, settings.currency) }}</span>
        <SecondaryCurrency :amount="activeGrossTotal" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="kpi" />
      </div>

      <div class="div-summary-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <span class="div-summary-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('div.yocCardLabel') }}</span>
        <span class="div-summary-value yoc-value font-mono text-xl font-bold pl-positive">{{ activeYieldOnCost.toFixed(2) }}%</span>
        <span class="div-summary-sub text-[11px] text-[var(--color-text-muted)]">{{ t('div.marketYield') }}: {{ activeMarketYield.toFixed(2) }}%</span>
      </div>

      <div class="div-summary-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <span class="div-summary-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('div.projected12m') }}</span>
        <span class="div-summary-value privacy-mask font-mono text-xl font-bold text-[var(--color-accent)]">{{ formatMoney(activeProjectedAnnualDividends, settings.currency) }}</span>
        <SecondaryCurrency :amount="activeProjectedAnnualDividends" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="kpi" />
      </div>

      <div class="div-summary-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <span class="div-summary-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('div.withholdingTax') }}</span>
        <span class="div-summary-value privacy-mask font-mono text-xl font-bold text-[var(--color-text-primary)]">{{ formatMoney(activeWhtTotal, settings.currency) }}</span>
        <span class="div-summary-sub font-mono text-[11px] text-[var(--color-text-muted)]">
          {{ t('div.effectiveRateShort', { rate: activeEffectiveTaxRate.toFixed(1) }) }}
        </span>
      </div>
    </div>

    <!-- Asset Class Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="asset in dividends.assetTypeSummaries"
        :key="asset.assetType"
        class="div-asset-card rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 text-xs"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-[var(--color-text-primary)]">{{ asset.assetTypeLabel }}</span>
          <UiAppBadge :color="getAssetColor(asset.assetType)">{{ asset.percentageOfTotal.toFixed(1) }}%</UiAppBadge>
        </div>
        <div class="mt-2 privacy-mask font-mono text-base font-bold pl-positive">
          {{ formatMoney(asset.totalNetDividends, settings.currency) }}
        </div>
        <div class="asset-card-metrics mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
          YOC: {{ asset.yieldOnCostPercent.toFixed(2) }}% · {{ asset.symbolCount }} {{ t('common.symbols') }}
        </div>
      </div>
    </div>

    <!-- Monthly Cashflow Timeline -->
    <UiAppCard :title="t('div.monthlyTrend')" class="div-chart-card">
      <template #actions>
        <div class="div-legend flex flex-wrap gap-3 text-[11px] text-[var(--color-text-secondary)]">
          <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-[var(--color-asset-us-stocks)]" /> {{ t('asset.usStocks') }}</span>
          <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-[var(--color-asset-thai-stocks)]" /> {{ t('asset.thaiStocks') }}</span>
          <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-[var(--color-asset-mutual-funds)]" /> {{ t('asset.mutualFunds') }}</span>
          <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-[var(--color-asset-bond)]" /> {{ t('asset.bonds') }}</span>
        </div>
      </template>

      <div class="flex h-40 items-end gap-2 overflow-x-auto pt-4">
        <div v-for="bar in monthlyBars" :key="bar.yearMonth" class="flex min-w-[44px] flex-1 flex-col items-center gap-1">
          <span class="privacy-mask font-mono text-[10px] text-[var(--color-text-muted)]">{{ formatMoney(bar.netAmount, settings.currency) }}</span>
          <div class="flex h-24 w-full max-w-[32px] items-end rounded-t bg-[var(--color-surface)]">
            <div
              class="flex w-full flex-col-reverse overflow-hidden rounded-t"
              :style="{ height: `${bar.heightPct}%` }"
            >
              <div
                v-for="seg in bar.segments"
                :key="seg.assetType"
                class="div-bar-segment w-full transition-all"
                :data-asset-type="seg.assetType"
                :style="{ height: `${seg.pctOfMonth}%`, backgroundColor: seg.color }"
                :title="`${seg.label}: ${formatMoney(seg.amount, settings.currency)} (${seg.pctOfMonth.toFixed(1)}%)`"
              />
            </div>
          </div>
          <span class="font-mono text-[10px] text-[var(--color-text-secondary)]">{{ bar.yearMonth }}</span>
        </div>
      </div>
    </UiAppCard>

    <!-- Sortable Breakdown Table -->
    <UiAppCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 class="text-sm font-semibold text-[var(--color-text-primary)]">{{ t('div.yieldBreakdownTitle') }}</h3>
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="t('common.searchPlaceholder')"
          class="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-xs sm:w-64"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="div-table w-full text-left text-xs">
          <thead class="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] uppercase text-[var(--color-text-muted)]">
            <tr>
              <th class="cursor-pointer px-4 py-2.5" @click="toggleSort('symbol')">{{ t('div.symbolAndAsset') }}</th>
              <th class="cursor-pointer px-4 py-2.5 text-right" @click="toggleSort('net')">{{ t('div.netReceived') }}</th>
              <th class="px-4 py-2.5 text-right">{{ t('div.trailingDps') }}</th>
              <th class="cursor-pointer px-4 py-2.5 text-right pl-positive" @click="toggleSort('yoc')">{{ t('div.yieldOnCost') }}</th>
              <th class="cursor-pointer px-4 py-2.5 text-right" @click="toggleSort('yield')">{{ t('div.marketYield') }}</th>
              <th class="cursor-pointer px-4 py-2.5 text-right" @click="toggleSort('projected')">{{ t('div.projected12m') }}</th>
              <th class="px-4 py-2.5 text-center">{{ t('div.ledger') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr v-for="sym in filteredSymbolSummaries" :key="sym.symbol" class="hover:bg-[var(--color-surface-overlay)]">
              <td class="px-4 py-2.5">
                <div class="symbol-col flex items-center gap-2.5">
                  <SymbolIcon :symbol="sym.symbol" :asset-type="sym.assetType" :size="26" />
                  {{ ' ' }}
                  <div>
                    <div class="symbol-main font-mono font-semibold text-[var(--color-text-primary)]">{{ displaySymbol(sym.symbol) }}</div>
                    {{ ' ' }}
                    <div class="symbol-name-sub text-[11px] text-[var(--color-text-muted)]">{{ symName(sym) }}</div>
                  </div>
                </div>
              </td>
              <td class="privacy-mask px-4 py-2.5 text-right font-mono font-bold pl-positive">{{ formatMoney(sym.convertedNetDividends, settings.currency) }}</td>
              <td class="px-4 py-2.5 text-right font-mono">{{ sym.trailingAnnualDPS > 0 ? `${sym.trailingAnnualDPS.toFixed(4)} ${sym.currency}` : '—' }}</td>
              <td class="px-4 py-2.5 text-right font-mono">
                <UiAppBadge v-if="sym.yieldOnCostPercent > 0" tone="positive">{{ sym.yieldOnCostPercent.toFixed(2) }}%</UiAppBadge>
                <span v-else>—</span>
              </td>
              <td class="px-4 py-2.5 text-right font-mono">{{ sym.currentYieldPercent > 0 ? `${sym.currentYieldPercent.toFixed(2)}%` : '—' }}</td>
              <td class="privacy-mask px-4 py-2.5 text-right font-mono font-semibold text-[var(--color-accent)]">
                {{ sym.projectedAnnualIncome > 0 ? formatMoney(sym.projectedAnnualIncome, settings.currency) : '—' }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <UiAppButton size="xs" @click="ledgerSymbol = sym.symbol">
                  {{ t('div.ledger') }} ({{ recordsForSymbol(sym.symbol).length }})
                </UiAppButton>
              </td>
            </tr>
            <tr v-if="filteredSymbolSummaries.length === 0">
              <td colspan="7" class="py-8 text-center text-[var(--color-text-muted)]">{{ t('div.emptySymbols') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiAppCard>

    <!-- Holding Payout Ledger Modal -->
    <UiAppModal
      :open="Boolean(ledgerSymbol)"
      :title="ledgerSymbol ? `${displaySymbol(ledgerSymbol)} — ${t('div.ledger')}` : ''"
      @close="ledgerSymbol = null"
    >
      <table v-if="ledgerSymbol" class="w-full text-left text-xs">
        <thead class="border-b border-[var(--color-border)] text-[11px] uppercase text-[var(--color-text-muted)]">
          <tr>
            <th class="py-2">{{ t('div.payoutDate') }}</th>
            <th class="py-2 text-right">{{ t('div.sharesHeld') }}</th>
            <th class="py-2 text-right">{{ t('div.grossAmount') }}</th>
            <th class="py-2 text-right">{{ t('div.whtShort') }}</th>
            <th class="py-2 text-right">{{ t('div.netReceived') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-border)]">
          <tr v-for="rec in recordsForSymbol(ledgerSymbol)" :key="rec.id">
            <td class="py-2 font-mono">{{ rec.date }}</td>
            <td class="py-2 text-right font-mono">{{ rec.shares }}</td>
            <td class="privacy-mask py-2 text-right font-mono">{{ formatMoney(rec.grossAmount, rec.currency) }}</td>
            <td class="py-2 text-right font-mono">{{ rec.withholdingTaxRate.toFixed(1) }}%</td>
            <td class="privacy-mask py-2 text-right font-mono font-semibold pl-positive">{{ formatMoney(rec.netAmount, rec.currency) }}</td>
          </tr>
        </tbody>
      </table>
    </UiAppModal>
  </div>
</template>
