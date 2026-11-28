<script setup lang="ts">
import type { PortfolioPosition } from '@sgsk-wealth/contracts';
import {
  convertCurrency,
  displaySymbol,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  getSymbolName,
} from '@sgsk-wealth/domain';

type RiskTier = 'low' | 'moderate' | 'high' | 'very-high' | 'unknown';
type SortKey = 'value' | 'return' | 'principal' | 'units' | 'risk';

const props = withDefaults(
  defineProps<{
    positions: PortfolioPosition[];
    currency: string;
    exchangeRate: number;
    hasRate?: boolean;
    loading?: boolean;
    privacyMode?: boolean;
  }>(),
  { hasRate: true, loading: false, privacyMode: false },
);

const emit = defineEmits<{
  openFactsheet: [symbol: string, assetType: string, fundName?: string, displayName?: string, displayNameTh?: string];
  refresh: [];
}>();

const { t, language } = useI18n();
const searchQuery = ref('');
const sortBy = ref<SortKey>('value');
const sortDir = ref<'asc' | 'desc'>('desc');
const selectedSlice = ref<string | null>(null);
const riskLevels = [1, 2, 3, 4, 5, 6, 7, 8];
const sortOptions: Array<[SortKey, string]> = [
  ['value', 'pvd.sortByValue'],
  ['return', 'pvd.sortReturnShort'],
  ['principal', 'pvd.sortByPrincipal'],
  ['units', 'pvd.sortByUnits'],
  ['risk', 'pvd.sortByRisk'],
];

function parseRisk(risk?: string | null): { code: string; score: number; label: string; tier: RiskTier } {
  const value = (risk || '').trim().toUpperCase();
  const score = Number(value.match(/(\d)/)?.[1] || 0);
  const label = score >= 1 && score <= 8 ? t(`pvd.rs.${score}`) : t('pvd.rs.unknown');
  const tier: RiskTier =
    score >= 7 ? 'very-high' : score >= 6 ? 'high' : score >= 3 ? 'moderate' : score >= 1 ? 'low' : 'unknown';
  return { code: score >= 1 ? `RS${score}` : value || 'N/A', score, label, tier };
}

function toDisplay(amount: number | undefined | null, fromCurrency: string): number {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  const from = (fromCurrency || 'THB').toUpperCase();
  const to = props.currency.toUpperCase();
  if (from === to) return n;
  return props.exchangeRate > 0 ? convertCurrency(n, from, to, props.exchangeRate) : n;
}

const policies = computed(() => {
  const list = props.positions.filter((p) => p.assetType === 'provident-fund');
  const draft = list.map((position) => {
    const from = position.currency || position.originalCurrency || 'THB';
    const holdingValue = toDisplay(position.holdingValue, from);
    const totalCost = toDisplay(position.totalCost, from);
    const employeeShares = Number(position.employeeShares || 0);
    const employerShares = Number(position.employerShares || 0);
    const explicit =
      position.employeeContribution != null ||
      position.employerMatching != null ||
      position.employeeEarnings != null ||
      position.employerEarnings != null;
    const shares = employeeShares + employerShares;
    const ratio = shares > 0 ? employeeShares / shares : 0.5;
    const fallbackEarn = holdingValue - totalCost;
    const employeePrincipal = explicit ? toDisplay(position.employeeContribution, from) : totalCost * ratio;
    const employeeEarnings = explicit ? toDisplay(position.employeeEarnings, from) : fallbackEarn * ratio;
    const employerPrincipal = explicit ? toDisplay(position.employerMatching, from) : totalCost * (1 - ratio);
    const employerEarnings = explicit ? toDisplay(position.employerEarnings, from) : fallbackEarn * (1 - ratio);
    const principal = employeePrincipal + employerPrincipal || totalCost;
    const earnings = explicit ? employeeEarnings + employerEarnings : holdingValue - totalCost;
    const name =
      getSymbolName(position.symbol, position.name || '', language.value, position.nameTh || '', position.assetType) ||
      position.policyName?.trim() ||
      position.displaySymbol ||
      displaySymbol(position.symbol);
    return {
      position,
      symbol: position.symbol,
      displaySymbol: position.displaySymbol || displaySymbol(position.symbol),
      name,
      nameTh: position.nameTh || '',
      color: getSymbolColor(position.symbol),
      totalShares: Number(position.totalShares || 0),
      employeeShares,
      employerShares,
      currentPrice: toDisplay(position.currentPrice, from),
      averageCost: toDisplay(position.averageCost, from),
      holdingValue,
      employeePrincipal,
      employeeEarnings,
      employeeTotal: employeePrincipal + employeeEarnings,
      employerPrincipal,
      employerEarnings,
      employerTotal: employerPrincipal + employerEarnings,
      principal,
      earnings,
      returnPct: principal > 0 ? (earnings / principal) * 100 : 0,
      pvdFundName: position.pvdFundName || '',
      policyName: position.policyName || '',
      aimcType: position.aimcType || '',
      aimcDescription: position.aimcDescription || '',
      objective: position.objective || '',
      risk: parseRisk(position.riskLevel),
    };
  });
  const totalValue = draft.reduce((acc, p) => acc + p.holdingValue, 0);
  return draft.map((p) => ({
    ...p,
    weightPct: totalValue > 0 ? (p.holdingValue / totalValue) * 100 : 0,
  }));
});

const summary = computed(() => {
  const totalValue = policies.value.reduce((acc, p) => acc + p.holdingValue, 0);
  const principal = policies.value.reduce((acc, p) => acc + p.principal, 0);
  const earnings = policies.value.reduce((acc, p) => acc + p.earnings, 0);
  const empPrincipal = policies.value.reduce((acc, p) => acc + p.employeePrincipal, 0);
  const empEarnings = policies.value.reduce((acc, p) => acc + p.employeeEarnings, 0);
  const emprPrincipal = policies.value.reduce((acc, p) => acc + p.employerPrincipal, 0);
  const emprEarnings = policies.value.reduce((acc, p) => acc + p.employerEarnings, 0);
  const empTotal = empPrincipal + empEarnings;
  const emrTotal = emprPrincipal + emprEarnings;
  const poolDenom = empTotal + emrTotal;
  const empPct = poolDenom > 0 ? (empTotal / poolDenom) * 100 : 50;
  const emprPct = poolDenom > 0 ? 100 - empPct : 50;

  const partDenom =
    Math.max(0, empPrincipal) +
    Math.max(0, empEarnings) +
    Math.max(0, emprPrincipal) +
    Math.max(0, emprEarnings);
  const toPartPct = (val: number) => (partDenom > 0 ? (Math.max(0, val) / partDenom) * 100 : 0);

  const coveredScores = new Set(policies.value.map((p) => p.risk.score).filter((s) => s > 0));
  const weightedRisk =
    totalValue > 0
      ? policies.value.reduce((acc, p) => acc + p.risk.score * p.holdingValue, 0) / totalValue
      : 0;
  const weightedRiskScore = weightedRisk > 0 ? Math.min(8, Math.max(1, Math.round(weightedRisk))) : 0;
  const weightedRiskMeta = parseRisk(weightedRiskScore > 0 ? `RS${weightedRiskScore}` : '');

  const tierMap = new Map<number, { score: number; count: number; weightPct: number; label: string }>();
  for (const pol of policies.value) {
    if (pol.risk.score <= 0) continue;
    const prev = tierMap.get(pol.risk.score) ?? {
      score: pol.risk.score,
      count: 0,
      weightPct: 0,
      label: pol.risk.label,
    };
    prev.count += 1;
    prev.weightPct += pol.weightPct;
    tierMap.set(pol.risk.score, prev);
  }
  const riskTiers = Array.from(tierMap.values()).sort((a, b) => a.score - b.score);

  const masterFundNames = Array.from(
    new Set(policies.value.map((p) => p.pvdFundName).filter((n) => n && n.trim().length > 0)),
  ).join(' · ');

  return {
    totalValue,
    principal,
    earnings,
    returnPct: principal > 0 ? (earnings / principal) * 100 : 0,
    empPrincipal,
    empEarnings,
    emprPrincipal,
    emprEarnings,
    empTotal,
    emrTotal,
    empPct,
    emprPct,
    empPrincipalPct: toPartPct(empPrincipal),
    empEarningsPct: toPartPct(empEarnings),
    emprPrincipalPct: toPartPct(emprPrincipal),
    emprEarningsPct: toPartPct(emprEarnings),
    coveredScores,
    weightedRisk,
    weightedRiskMeta,
    riskTiers,
    masterFundNames,
  };
});

const donutSlices = computed(() =>
  policies.value.map((p) => ({
    key: p.symbol,
    label: p.displaySymbol,
    percent: p.weightPct,
    color: p.color,
    valueLabel: formatMoney(p.holdingValue, props.currency),
  })),
);

const filteredPolicies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const mult = sortDir.value === 'asc' ? 1 : -1;
  return [...policies.value]
    .filter(
      (p) =>
        (!selectedSlice.value || p.symbol === selectedSlice.value) &&
        (!q ||
          p.symbol.toLowerCase().includes(q) ||
          p.displaySymbol.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.nameTh.toLowerCase().includes(q) ||
          p.pvdFundName.toLowerCase().includes(q) ||
          p.aimcType.toLowerCase().includes(q) ||
          p.aimcDescription.toLowerCase().includes(q) ||
          p.risk.code.toLowerCase().includes(q) ||
          p.objective.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      if (sortBy.value === 'return') return (a.returnPct - b.returnPct) * mult;
      if (sortBy.value === 'principal') return (a.principal - b.principal) * mult;
      if (sortBy.value === 'units') return (a.totalShares - b.totalShares) * mult;
      if (sortBy.value === 'risk') return (a.risk.score - b.risk.score) * mult;
      return (a.holdingValue - b.holdingValue) * mult;
    });
});

function setSort(key: SortKey) {
  if (sortBy.value === key) sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc';
  else {
    sortBy.value = key;
    sortDir.value = 'desc';
  }
}

function getPriceDigits(sym: string): number {
  return getPriceFormat(sym, 'provident-fund') === '1.2-4' ? 4 : 2;
}

function getQtyDigits(sym: string): number {
  return getQuantityFormat(sym, 'provident-fund') === '1.0-10' ? 10 : 4;
}
</script>

<template>
  <div id="pvd-holdings-screen" class="space-y-4">
    <!-- Hero Summary -->
    <section id="pvd-hero-card" class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('pvd.eyebrow') }}</span>
            <UiAppBadge v-if="summary.masterFundNames" tone="info">{{ summary.masterFundNames }}</UiAppBadge>
          </div>
          <div class="flex flex-wrap items-baseline gap-3">
            <h3 class="hero-total-val font-mono text-2xl font-bold text-[var(--color-text-primary)]">
              {{ formatMoney(summary.totalValue, currency) }}
            </h3>
            <SecondaryCurrency :amount="summary.totalValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="hero" parens />
            <UiAppBadge :tone="summary.earnings >= 0 ? 'positive' : 'negative'" class="font-mono">
              {{ formatSignedMoney(summary.earnings, currency) }} ({{ formatPercent(summary.returnPct) }})
            </UiAppBadge>
          </div>
          <div class="text-xs text-[var(--color-text-muted)]">
            {{ t('pvd.activePolicies', {
              count: policies.length,
              unit: policies.length === 1 ? t('pvd.policySingular') : t('pvd.policiesPlural'),
              currency,
            }) }}
          </div>
        </div>
        <UiAppButton id="pvd-refresh-btn" size="sm" :disabled="loading" :title="t('pvd.refreshTitle')" @click="emit('refresh')">
          {{ loading ? t('pvd.syncingNav') : t('pvd.refreshNav') }}
        </UiAppButton>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UiKpiStatCard
          :label="t('pvd.totalPrincipal')"
          :value="formatMoney(summary.principal, currency)"
          :subtext="t('pvd.totalPrincipalHint')"
          masked
        />
        <UiKpiStatCard
          :label="t('pvd.totalEarnings')"
          :value="formatSignedMoney(summary.earnings, currency)"
          :subtext="t('pvd.returnOnCost', { pct: formatPercent(summary.returnPct) })"
          :tone="summary.earnings >= 0 ? 'positive' : 'negative'"
          masked
        />
        <UiKpiStatCard
          :label="t('pvd.empPoolLabel', { pct: summary.empPct.toFixed(1) })"
          :value="formatMoney(summary.empTotal, currency)"
          :subtext="`${t('pvd.principalShort')} ${formatMoney(summary.empPrincipal, currency)} · ${t('pvd.earningsShort')} ${formatSignedMoney(summary.empEarnings, currency)}`"
          masked
        />
        <UiKpiStatCard
          :label="t('pvd.emprPoolLabel', { pct: summary.emprPct.toFixed(1) })"
          :value="formatMoney(summary.emrTotal, currency)"
          :subtext="`${t('pvd.principalShort')} ${formatMoney(summary.emprPrincipal, currency)} · ${t('pvd.earningsShort')} ${formatSignedMoney(summary.emprEarnings, currency)}`"
          masked
        />
      </div>

      <!-- 4-Part Fund Split Bar -->
      <div id="pvd-overall-split-bar" class="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span class="font-semibold text-[var(--color-text-primary)]">{{ t('pvd.splitBarTitle') }}</span>
          <span class="font-mono text-[11px] text-[var(--color-text-muted)]">
            {{ t('pvd.splitRatioVs', { empPct: summary.empPct.toFixed(1), emprPct: summary.emprPct.toFixed(1) }) }}
          </span>
        </div>
        <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div class="h-full bg-sky-500 transition-all" :style="{ width: `${summary.empPrincipalPct}%` }" />
          <div class="h-full bg-emerald-400 transition-all" :style="{ width: `${summary.empEarningsPct}%` }" />
          <div class="h-full bg-amber-500 transition-all" :style="{ width: `${summary.emprPrincipalPct}%` }" />
          <div class="h-full bg-yellow-300 transition-all" :style="{ width: `${summary.emprEarningsPct}%` }" />
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-sky-500" />
            <span class="text-[var(--color-text-secondary)]">{{ t('pvd.empContrib') }}</span>
            <span class="ml-auto font-mono font-semibold">{{ summary.empPrincipalPct.toFixed(1) }}%</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            <span class="text-[var(--color-text-secondary)]">{{ t('pvd.empEarningsShort') }}</span>
            <span class="ml-auto font-mono font-semibold">{{ summary.empEarningsPct.toFixed(1) }}%</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-500" />
            <span class="text-[var(--color-text-secondary)]">{{ t('pvd.emprContrib') }}</span>
            <span class="ml-auto font-mono font-semibold">{{ summary.emprPrincipalPct.toFixed(1) }}%</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-yellow-300" />
            <span class="text-[var(--color-text-secondary)]">{{ t('pvd.emprEarningsShort') }}</span>
            <span class="ml-auto font-mono font-semibold">{{ summary.emprEarningsPct.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Policy Allocation Donut & Risk Spectrum -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <UiAppCard id="pvd-policy-allocation-card" :title="t('pvd.policyWeightTitle')" :subtitle="t('pvd.policyWeightSub')" class="lg:col-span-7">
        <UiDonutChart
          :slices="donutSlices"
          :selected-key="selectedSlice"
          :center-label="t('pvd.totalPvdCenter')"
          :center-value="formatMoney(summary.totalValue, currency)"
          @select="(key) => { selectedSlice = selectedSlice === key ? null : key; }"
        />
        <div class="mt-3 space-y-1.5">
          <div
            v-for="pol in policies"
            :key="`alloc-${pol.symbol}`"
            class="pvd-alloc-row flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs hover:bg-[var(--color-surface-overlay)]"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: pol.color }" />
              <span class="font-mono font-semibold">{{ pol.displaySymbol }}</span>
              {{ ' ' }}
              <span class="pvd-alloc-name truncate text-[var(--color-text-secondary)]">{{ pol.name }}</span>
            </div>
            <div class="flex shrink-0 items-center gap-3 font-mono">
              <span class="privacy-mask text-[var(--color-text-primary)]">{{ formatMoney(pol.holdingValue, currency) }}</span>
              <span class="w-12 text-right text-[var(--color-text-muted)]">{{ pol.weightPct.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </UiAppCard>

      <UiAppCard id="pvd-risk-summary-card" :title="t('pvd.secRiskTitle')" :subtitle="t('pvd.secRiskSub')" class="lg:col-span-5">
        <div class="space-y-3">
          <div v-if="summary.weightedRisk > 0" class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs">
            <span class="text-[var(--color-text-secondary)]">{{ t('pvd.weightedRiskCaption') }}</span>
            <div class="flex items-center gap-2 font-mono">
              <strong class="text-[var(--color-text-primary)]">{{ summary.weightedRisk.toFixed(1) }} / 8 · {{ summary.weightedRiskMeta.code }}</strong>
              <UiAppBadge :tone="summary.weightedRiskMeta.tier === 'high' || summary.weightedRiskMeta.tier === 'very-high' ? 'negative' : summary.weightedRiskMeta.tier === 'moderate' ? 'warning' : 'positive'">
                {{ summary.weightedRiskMeta.label }}
              </UiAppBadge>
            </div>
          </div>
          <div class="pvd-rs-scale grid grid-cols-8 gap-1">
            <div
              v-for="lvl in riskLevels"
              :key="lvl"
              class="pvd-rs-step flex h-8 items-center justify-center rounded font-mono text-[11px] font-bold border"
              :class="
                summary.coveredScores.has(lvl)
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-50'
              "
            >
              RS{{ lvl }}
            </div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>{{ t('pvd.rs1Label') }}</span>
            <span>{{ t('pvd.rs4Label') }}</span>
            <span>{{ t('pvd.rs8Label') }}</span>
          </div>
          <div v-if="summary.riskTiers.length > 0" class="space-y-1 border-t border-[var(--color-border)] pt-2.5 text-xs">
            <div v-for="tier in summary.riskTiers" :key="`tier-${tier.score}`" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-mono font-semibold text-[var(--color-text-primary)]">RS{{ tier.score }}</span>
                <span class="text-[var(--color-text-secondary)]">{{ tier.label }}</span>
                <span class="text-[11px] text-[var(--color-text-muted)]">({{ tier.count }} {{ tier.count === 1 ? t('pvd.policyLower') : t('pvd.policiesLower') }})</span>
              </div>
              <span class="font-mono text-[var(--color-text-primary)]">{{ tier.weightPct.toFixed(1) }}%</span>
            </div>
          </div>
          <div v-else class="text-xs text-[var(--color-text-muted)]">
            {{ t('pvd.noRiskMeta') }}
          </div>
        </div>
      </UiAppCard>
    </div>

    <!-- Search & Sort Controls -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full sm:w-72">
        <input
          id="pvd-search-input"
          v-model="searchQuery"
          type="search"
          :placeholder="t('pvd.searchPlaceholder')"
          class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 pr-8 text-sm text-[var(--color-text-primary)]"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="pvd-search-clear absolute right-2 top-2 text-xs text-[var(--color-text-muted)]"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="[key, labelKey] in sortOptions"
          :id="`pvd-sort-${key}`"
          :key="key"
          type="button"
          :data-sort-dir="sortBy === key ? sortDir : undefined"
          class="pvd-sort-btn sort-pill rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            sortBy === key
              ? 'active sort-pill-active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]'
          "
          @click="setSort(key)"
        >
          {{ t(labelKey) }}
        </button>
      </div>
    </div>

    <!-- Policy Cards -->
    <div id="pvd-policies-section" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-bold text-[var(--color-text-primary)]">{{ t('pvd.subPolicyHeading') }}</h4>
        <span class="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 font-mono text-xs text-[var(--color-text-muted)]">
          {{ filteredPolicies.length }} / {{ policies.length }}
        </span>
      </div>

      <div
        v-for="pol in filteredPolicies"
        :id="`pvd-policy-${pol.symbol}`"
        :key="pol.symbol"
        class="pvd-policy-card rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 space-y-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <SymbolIcon :symbol="pol.symbol" asset-type="provident-fund" :size="36" :fund-name="pol.pvdFundName" />
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-mono text-xs font-bold text-[var(--color-accent)]">{{ pol.displaySymbol }}</span>
                <UiAppBadge tone="neutral">{{ t('pvd.weightPctLabel', { pct: pol.weightPct.toFixed(1) }) }}</UiAppBadge>
                <UiAppBadge :tone="pol.risk.tier === 'high' || pol.risk.tier === 'very-high' ? 'negative' : pol.risk.tier === 'moderate' ? 'warning' : 'positive'">
                  {{ pol.risk.code }} · {{ pol.risk.label }}
                </UiAppBadge>
                <UiAppBadge v-if="pol.aimcType">AIMC: {{ pol.aimcType }}</UiAppBadge>
                <span v-if="pol.aimcDescription" class="text-[11px] text-[var(--color-text-muted)]">{{ pol.aimcDescription }}</span>
              </div>
              <div class="pvd-policy-name text-sm font-semibold text-[var(--color-text-primary)]">{{ pol.name }}</div>
              <div v-if="pol.pvdFundName" class="text-xs text-[var(--color-text-muted)]">{{ pol.pvdFundName }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right font-mono">
              <div class="privacy-mask text-base font-bold text-[var(--color-text-primary)]">{{ formatMoney(pol.holdingValue, currency) }}</div>
              <SecondaryCurrency :amount="pol.holdingValue" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="compact" />
              <div class="text-xs font-semibold" :class="pol.returnPct >= 0 ? 'pl-positive' : 'pl-negative'">
                {{ formatSignedMoney(pol.earnings, currency) }} ({{ formatPercent(pol.returnPct) }})
              </div>
            </div>
            <UiAppButton
              :id="`btn-pvd-factsheet-${pol.symbol}`"
              size="xs"
              @click="emit('openFactsheet', pol.symbol, 'provident-fund', pol.pvdFundName, pol.name, pol.nameTh)"
            >
              {{ t('factsheet.viewBtn') }}
            </UiAppButton>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5 border-t border-[var(--color-border)] pt-3 text-xs sm:grid-cols-4">
          <div>
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('summary.totalUnits') }}</div>
            <div class="privacy-mask font-mono font-semibold">{{ pol.totalShares.toLocaleString(undefined, { maximumFractionDigits: getQtyDigits(pol.symbol) }) }}</div>
          </div>
          <div>
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('pvd.currentNav') }}</div>
            <div class="font-mono font-semibold">{{ pol.currentPrice.toFixed(getPriceDigits(pol.symbol)) }}</div>
          </div>
          <div>
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('pvd.principalCost') }}</div>
            <div class="privacy-mask font-mono font-semibold">{{ formatMoney(pol.principal, currency) }}</div>
          </div>
          <div>
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('pvd.avgUnitCost') }}</div>
            <div class="font-mono font-semibold">{{ pol.averageCost.toFixed(getPriceDigits(pol.symbol)) }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          <div class="pvd-pool-box emp rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-1.5">
            <div class="flex items-center justify-between font-semibold text-[var(--color-text-primary)]">
              <span>{{ t('pvd.empPoolTitle') }}</span>
              <span class="privacy-mask font-mono">{{ formatMoney(pol.employeeTotal, currency) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.empContribPrincipal') }}</div>
                <div class="privacy-mask font-mono font-medium">{{ formatMoney(pol.employeePrincipal, currency) }}</div>
              </div>
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.empContribEarnings') }}</div>
                <div class="privacy-mask font-mono font-medium" :class="pol.employeeEarnings >= 0 ? 'pl-positive' : 'pl-negative'">
                  {{ formatSignedMoney(pol.employeeEarnings, currency) }}
                </div>
              </div>
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.unitsLabel') }}</div>
                <div class="privacy-mask font-mono font-medium">{{ pol.employeeShares.toLocaleString(undefined, { maximumFractionDigits: getQtyDigits(pol.symbol) }) }}</div>
              </div>
            </div>
          </div>

          <div class="pvd-pool-box empr rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-1.5">
            <div class="flex items-center justify-between font-semibold text-[var(--color-text-primary)]">
              <span>{{ t('pvd.emprPoolTitle') }}</span>
              <span class="privacy-mask font-mono">{{ formatMoney(pol.employerTotal, currency) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.emprMatchPrincipal') }}</div>
                <div class="privacy-mask font-mono font-medium">{{ formatMoney(pol.employerPrincipal, currency) }}</div>
              </div>
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.emprMatchEarnings') }}</div>
                <div class="privacy-mask font-mono font-medium" :class="pol.employerEarnings >= 0 ? 'pl-positive' : 'pl-negative'">
                  {{ formatSignedMoney(pol.employerEarnings, currency) }}
                </div>
              </div>
              <div>
                <div class="text-[var(--color-text-muted)]">{{ t('pvd.unitsLabel') }}</div>
                <div class="privacy-mask font-mono font-medium">{{ pol.employerShares.toLocaleString(undefined, { maximumFractionDigits: getQtyDigits(pol.symbol) }) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pol.objective" class="border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-secondary)]">
          <span class="font-semibold text-[var(--color-text-primary)]">{{ t('pvd.secObjective') }}</span> {{ pol.objective }}
        </div>
      </div>
    </div>
  </div>
</template>
