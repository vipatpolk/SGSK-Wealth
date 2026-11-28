<script setup lang="ts">
import { displaySymbol, getAssetColor, getAssetType, getAssetTypeLabel, getSymbolName } from '@sgsk-wealth/domain';

const { t } = useI18n();
const { settings } = useUserSettings();
const { holdings, dividends, allocation, transactionSummaries, exchangeRate, hasRate, refreshAll } = usePortfolioData();

const factsheetTarget = ref<{ symbol: string; assetType: string } | null>(null);

const summary = computed(() => holdings.value.summary);
const netWorth = computed(() => (summary.value.totalValue > 0 ? summary.value.totalValue : summary.value.totalInvested));
const marketPositions = computed(() => holdings.value.openPositions.filter((p) => p.assetType !== 'provident-fund'));
const pvdPositions = computed(() => holdings.value.openPositions.filter((p) => p.assetType === 'provident-fund'));
const pvdTotal = computed(() => pvdPositions.value.reduce((acc, p) => acc + (p.holdingValue || p.totalCost), 0));
const pvdEmployee = computed(() => pvdPositions.value.reduce((acc, p) => acc + (p.employeeContribution ?? 0), 0));
const pvdEmployer = computed(() => pvdPositions.value.reduce((acc, p) => acc + (p.employerMatching ?? 0), 0));
const pvdMasterFund = computed(() => pvdPositions.value.find((p) => p.pvdFundName)?.pvdFundName || '');

const allocSlices = computed(() =>
  allocation.value.recommendations
    .filter((r) => r.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((r) => ({
      key: r.assetType,
      label: getAssetTypeLabel(r.assetType, undefined, settings.value.language),
      percent: r.actualPercent,
      color: getAssetColor(r.assetType),
      valueLabel: formatMoney(r.currentValue, settings.value.currency),
    })),
);

const topMovers = computed(() =>
  [...marketPositions.value].sort((a, b) => Math.abs(b.unrealizedPLPercent) - Math.abs(a.unrealizedPLPercent)).slice(0, 5),
);

const recentTrades = computed(() => {
  const list: Array<{
    id: string;
    symbol: string;
    displaySymbol: string;
    name: string;
    assetType: string;
    type: 'BUY' | 'SELL' | 'EX-IN' | 'EX-OUT';
    date: string;
    totalAmount: number;
    currency: string;
  }> = [];

  for (const s of transactionSummaries.value) {
    if (getAssetType(s.assetType, s.symbol) === 'provident-fund') continue;
    for (const tx of s.transactions || []) {
      const at = tx.assetType || s.assetType;
      if (getAssetType(at, tx.symbol || s.symbol) === 'provident-fund' || !tx.quantity || !tx.date) continue;
      const raw = (tx.type || 'BUY').toUpperCase();
      const normalizedType =
        raw === 'SELL' ? 'SELL' : raw === 'EXCHANGE_IN' || raw === 'EXCHANGE' ? 'EX-IN' : raw === 'EXCHANGE_OUT' ? 'EX-OUT' : 'BUY';
      const sym = tx.symbol || s.symbol;
      list.push({
        id: tx.id || `${sym}-${tx.date}-${tx.quantity}`,
        symbol: sym,
        displaySymbol: displaySymbol(sym),
        name: getSymbolName(sym, '', settings.value.language, '', at) || displaySymbol(sym),
        assetType: at,
        type: normalizedType,
        date: tx.date,
        totalAmount: tx.totalAmount || tx.quantity * tx.price,
        currency: tx.currency || s.currency,
      });
    }
  }
  return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
});

function posName(pos: { symbol: string; name: string; nameTh?: string; assetType: string }) {
  return getSymbolName(pos.symbol, pos.name, settings.value.language, pos.nameTh, pos.assetType) || pos.name;
}
</script>

<template>
  <div id="dashboard-view" class="space-y-5">
    <!-- Hero Executive Summary -->
    <section id="dashboard-net-worth" class="dashboard-hero-card rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div class="space-y-1">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {{ t('dash.totalNetValue') }}
          </span>
          <div class="flex flex-wrap items-baseline gap-3">
            <h2 class="hero-total-val font-mono text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              {{ formatMoney(netWorth, settings.currency) }}
            </h2>
            <SecondaryCurrency :amount="netWorth" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="hero" parens />
          </div>
        </div>
        <UiAppButton size="sm" @click="refreshAll">
          {{ t('app.refreshShort') }}
        </UiAppButton>
      </div>

      <div class="hero-kpi-grid mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <UiKpiStatCard
          id="kpi-invested"
          :label="t('dash.investedCapital')"
          :value="formatMoney(summary.totalInvested, settings.currency)"
          :secondary-amount="summary.totalInvested"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          masked
        />
        <UiKpiStatCard
          id="kpi-unrealized"
          :label="t('common.unrealizedPL')"
          :value="formatSignedMoney(summary.totalUnrealizedPL, settings.currency)"
          :subtext="formatPercent(summary.totalUnrealizedPLPercent)"
          :tone="summary.totalUnrealizedPL >= 0 ? 'positive' : 'negative'"
          :secondary-amount="summary.totalUnrealizedPL"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          secondary-signed
          masked
        />
        <UiKpiStatCard
          id="kpi-realized"
          :label="t('common.realizedPL')"
          :value="formatSignedMoney(summary.totalRealizedPL, settings.currency)"
          :subtext="formatPercent(summary.totalRealizedPLPercent)"
          :tone="summary.totalRealizedPL >= 0 ? 'positive' : 'negative'"
          :secondary-amount="summary.totalRealizedPL"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          secondary-signed
          masked
        />
        <UiKpiStatCard
          :label="t('common.totalReturn')"
          :value="formatSignedMoney(summary.totalReturn, settings.currency)"
          :subtext="formatPercent(summary.totalReturnPercent)"
          :tone="summary.totalReturn >= 0 ? 'positive' : 'negative'"
          :secondary-amount="summary.totalReturn"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          secondary-signed
          masked
        />
        <UiKpiStatCard
          id="kpi-dividends"
          :label="t('div.projected12m')"
          :value="formatMoney(dividends.projectedAnnualDividends, settings.currency)"
          :subtext="`YOC ${dividends.portfolioYieldOnCost.toFixed(2)}%`"
          :secondary-amount="dividends.projectedAnnualDividends"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          masked
        />
      </div>
    </section>

    <!-- Allocation + Top Movers -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard id="dashboard-allocation-card" :title="t('dash.assetAllocation')" class="lg:col-span-6">
        <template #actions>
          <NuxtLink id="btn-goto-allocation" to="/analytics?tab=allocation" class="text-xs font-medium text-[var(--color-accent)] hover:underline">
            {{ t('nav.allocation') }} →
          </NuxtLink>
        </template>
        <UiDonutChart
          :slices="allocSlices"
          :center-label="t('common.totalValue')"
          :center-value="`${allocSlices.length} ${t('dash.classes')}`"
          @select="(key) => navigateTo(`/holdings?tab=${encodeURIComponent(key)}`)"
        />
      </UiAppCard>

      <UiAppCard id="dashboard-performance-card" :title="t('perf.topMovers')" class="lg:col-span-6">
        <template #actions>
          <NuxtLink id="btn-goto-performance" to="/analytics?tab=performance" class="text-xs font-medium text-[var(--color-accent)] hover:underline">
            {{ t('nav.performance') }} →
          </NuxtLink>
        </template>
        <div class="divide-y divide-[var(--color-border)]">
          <NuxtLink
            v-for="pos in topMovers"
            :key="pos.symbol"
            :to="`/holdings?symbol=${encodeURIComponent(pos.symbol)}`"
            class="mover-row flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-[var(--color-surface-overlay)] px-2 -mx-2 rounded-[var(--radius-sm)]"
          >
            <div class="flex min-w-0 items-center gap-2.5">
              <SymbolIcon :symbol="pos.symbol" :asset-type="pos.assetType" :size="30" />
              {{ ' ' }}
              <div class="min-w-0">
                <div class="mover-display-symbol font-mono text-xs font-bold text-[var(--color-text-primary)]">{{ displaySymbol(pos.symbol) }}</div>
                <div class="mover-name truncate text-[11px] text-[var(--color-text-muted)]">{{ posName(pos) }}</div>
              </div>
            </div>
            <div class="text-right font-mono">
              <div class="privacy-mask text-xs font-semibold text-[var(--color-text-primary)]">{{ formatMoney(pos.holdingValue, pos.currency) }}</div>
              <div class="text-[11px] font-semibold" :class="pos.unrealizedPLPercent >= 0 ? 'pl-positive' : 'pl-negative'">
                {{ formatPercent(pos.unrealizedPLPercent) }}
              </div>
            </div>
          </NuxtLink>
        </div>
      </UiAppCard>
    </div>

    <!-- PVD Snapshot + Recent Trades -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard v-if="pvdPositions.length > 0" id="dashboard-retirement-card" :title="t('holdings.subtabPvd')" :subtitle="pvdMasterFund" class="lg:col-span-5">
        <template #actions>
          <NuxtLink id="btn-goto-pvd-holdings" to="/holdings?tab=provident-fund" class="text-xs font-medium text-[var(--color-accent)] hover:underline">
            {{ t('nav.holdings') }} →
          </NuxtLink>
        </template>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('common.totalValue') }}</div>
              <div class="privacy-mask font-mono text-sm font-bold text-[var(--color-text-primary)]">{{ formatMoney(pvdTotal, settings.currency) }}</div>
            </div>
            <div class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('pvd.empPoolTitle') }}</div>
              <div class="privacy-mask font-mono text-sm font-semibold text-[var(--color-text-primary)]">{{ formatMoney(pvdEmployee, settings.currency) }}</div>
            </div>
            <div class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
              <div class="text-[10px] uppercase text-[var(--color-text-muted)]">{{ t('pvd.emprPoolTitle') }}</div>
              <div class="privacy-mask font-mono text-sm font-semibold text-[var(--color-text-primary)]">{{ formatMoney(pvdEmployer, settings.currency) }}</div>
            </div>
          </div>
          <div class="pvd-positions-mini-list space-y-1.5">
            <div
              v-for="pvd in pvdPositions"
              :key="pvd.symbol"
              class="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              <div class="min-w-0">
                <div class="font-mono font-semibold text-[var(--color-text-primary)]">{{ displaySymbol(pvd.symbol) }}</div>
                <div class="truncate text-[11px] text-[var(--color-text-muted)]">{{ posName(pvd) }}</div>
              </div>
              <button
                :id="`btn-dash-pvd-factsheet-${pvd.symbol}`"
                type="button"
                class="factsheet-icon-btn inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                :title="t('factsheet.viewBtn')"
                :aria-label="t('factsheet.viewBtn')"
                @click="factsheetTarget = { symbol: pvd.symbol, assetType: pvd.assetType }"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </UiAppCard>

      <UiAppCard :title="t('dash.recentActivity')" :class="pvdPositions.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'">
        <template #actions>
          <NuxtLink to="/transactions" class="text-xs font-medium text-[var(--color-accent)] hover:underline">
            {{ t('nav.transactions') }} →
          </NuxtLink>
        </template>
        <div class="divide-y divide-[var(--color-border)]">
          <NuxtLink
            v-for="tx in recentTrades"
            :key="tx.id"
            :to="`/transactions?symbol=${encodeURIComponent(tx.symbol)}`"
            class="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-overlay)]"
          >
            <div class="flex items-center gap-2.5">
              <SymbolIcon :symbol="tx.symbol" :asset-type="tx.assetType" :size="26" />
              {{ ' ' }}
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-xs font-bold text-[var(--color-text-primary)]">{{ tx.displaySymbol }}</span>
                  <UiAppBadge :tone="tx.type === 'SELL' ? 'negative' : tx.type === 'BUY' ? 'positive' : 'neutral'">
                    {{ tx.type }}
                  </UiAppBadge>
                </div>
                <div class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ tx.date }}</div>
              </div>
            </div>
            <div class="privacy-mask font-mono text-xs font-semibold text-[var(--color-text-primary)]">
              {{ formatMoney(tx.totalAmount, tx.currency) }}
            </div>
          </NuxtLink>
        </div>
      </UiAppCard>
    </div>

    <!-- Quick Tools Launcher -->
    <UiAppCard id="dashboard-tools-card" :title="t('nav.tools')">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NuxtLink
          id="launch-avg-cost-calculator"
          to="/tools?tool=avg-cost"
          class="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition-colors hover:border-[var(--color-accent)]"
        >
          <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.avgCost.title') }}</div>
          <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ t('tools.avgCost.desc') }}</div>
        </NuxtLink>
        <NuxtLink
          id="launch-tvm-calculator"
          to="/tools?tool=tvm"
          class="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition-colors hover:border-[var(--color-accent)]"
        >
          <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.tvm.title') }}</div>
          <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ t('tools.tvm.desc') }}</div>
        </NuxtLink>
        <NuxtLink
          id="launch-rebalance-planner"
          to="/tools?tool=rebalance"
          class="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition-colors hover:border-[var(--color-accent)]"
        >
          <div class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.rebalance.title') }}</div>
          <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ t('tools.rebalance.desc') }}</div>
        </NuxtLink>
      </div>
    </UiAppCard>

    <FundFactsheetModal
      :open="Boolean(factsheetTarget)"
      :symbol="factsheetTarget?.symbol ?? null"
      :asset-type="factsheetTarget?.assetType"
      @close="factsheetTarget = null"
    />
  </div>
</template>
