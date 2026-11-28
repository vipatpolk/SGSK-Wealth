<script setup lang="ts">
import type { CompoundingFrequency, PaymentTiming, TvmSolveMode } from '@sgsk-wealth/contracts';
import {
  COMPOUNDING_FREQUENCIES,
  calculateTVM,
  convertCurrency,
  getCompoundingPeriodsPerYear,
} from '@sgsk-wealth/domain';

const { t } = useI18n();
const { settings } = useUserSettings();
const { holdings, exchangeRate, hasRate } = usePortfolioData();

const tvmMode = ref<TvmSolveMode>('FV');
const tvmPvSource = ref<'custom' | 'market' | 'cost'>('custom');
const tvmSelectedClasses = ref<string[]>([]);
const tvmCompounding = ref<CompoundingFrequency>('monthly');
const tvmPaymentTiming = ref<PaymentTiming>('end');
const isCompoundingMenuOpen = ref(false);
const tvmChartMode = ref<'lines' | 'area'>('area');
const showTvmSchedule = ref(false);

const tvmInput = reactive({
  pv: 10000,
  targetFv: 100000,
  pmt: 500,
  ratePercent: 8,
  years: 10,
});

const solveModes = computed<Array<{ id: TvmSolveMode; label: string }>>(() => [
  { id: 'FV', label: t('tools.tvm.modeFV') },
  { id: 'PMT', label: t('tools.tvm.modePMT') },
  { id: 'PV', label: t('tools.tvm.modePV') },
  { id: 'N', label: t('tools.tvm.modeN') },
  { id: 'RATE', label: t('tools.tvm.modeRATE') },
]);

const assetClassOptions = computed(() => [
  { id: 'us-stock', label: t('asset.usStock') },
  { id: 'thai-stock', label: t('asset.thaiStock') },
  { id: 'crypto', label: t('asset.crypto') },
  { id: 'mutual-fund', label: t('asset.mutualFund') },
  { id: 'bond', label: t('asset.bond') },
]);

const marketPositions = computed(() =>
  holdings.value.openPositions.filter((p) => p.assetType !== 'provident-fund'),
);

const tvmEffectivePv = computed(() => {
  if (tvmPvSource.value === 'custom') return tvmInput.pv;
  const activeSet =
    tvmSelectedClasses.value.length > 0
      ? new Set(tvmSelectedClasses.value)
      : new Set(assetClassOptions.value.map((c) => c.id));
  return marketPositions.value
    .filter((p) => activeSet.has(p.assetType))
    .reduce((acc, p) => {
      const raw = tvmPvSource.value === 'market' ? p.holdingValue : p.totalCost;
      return acc + convertCurrency(raw, p.currency, settings.value.currency, exchangeRate.value || 34.5);
    }, 0);
});

function toggleAssetChip(id: string) {
  tvmSelectedClasses.value = tvmSelectedClasses.value.includes(id)
    ? tvmSelectedClasses.value.filter((x) => x !== id)
    : [...tvmSelectedClasses.value, id];
}

const tvmResult = computed(() =>
  calculateTVM({
    mode: tvmMode.value,
    presentValue: tvmEffectivePv.value,
    targetFutureValue: tvmInput.targetFv,
    payment: tvmInput.pmt,
    annualRatePct: tvmInput.ratePercent,
    years: tvmInput.years,
    compounding: tvmCompounding.value,
    timing: tvmPaymentTiming.value,
  }),
);

const tvmSolvedValue = computed(() => {
  if (tvmMode.value === 'FV') return tvmResult.value.futureValue;
  if (tvmMode.value === 'PMT') return tvmResult.value.payment;
  if (tvmMode.value === 'PV') return tvmResult.value.presentValue;
  if (tvmMode.value === 'N') return tvmResult.value.years;
  return tvmResult.value.annualRatePct;
});

const tvmHeroTitle = computed(() => {
  if (tvmMode.value === 'FV') return t('tools.tvm.titleFV');
  if (tvmMode.value === 'PMT') return t('tools.tvm.titlePMT');
  if (tvmMode.value === 'PV') return t('tools.tvm.titlePV');
  if (tvmMode.value === 'N') return t('tools.tvm.titleN');
  return t('tools.tvm.titleRATE');
});

const tvmHeroSubtitle = computed(() => {
  if (tvmMode.value === 'FV') return t('tools.tvm.heroFV', { years: tvmResult.value.years.toFixed(0) });
  if (tvmMode.value === 'PMT') return t('tools.tvm.heroPMT');
  if (tvmMode.value === 'PV') return t('tools.tvm.heroPV');
  if (tvmMode.value === 'N') return t('tools.tvm.heroN', { target: formatMoney(tvmInput.targetFv, settings.value.currency) });
  return t('tools.tvm.heroRATE');
});

const composition = computed(() => {
  const total = Math.max(1e-6, tvmResult.value.futureValue);
  const pvPct = Math.min(100, Math.max(0, (tvmResult.value.totalPrincipal / total) * 100));
  const pmtPct = Math.min(100 - pvPct, Math.max(0, (tvmResult.value.totalContributions / total) * 100));
  const intPct = Math.max(0, 100 - pvPct - pmtPct);
  return { pvPct, pmtPct, intPct };
});

const ratePresets = computed(() => [
  { val: 4, label: t('tools.tvm.rateSafe') },
  { val: 7, label: t('tools.tvm.rateSpAvg') },
  { val: 10, label: t('tools.tvm.rateGrowth') },
  { val: 12, label: t('tools.tvm.rateHigh') },
  { val: 15, label: t('tools.tvm.rateAggressive') },
]);

const totalCompPeriods = computed(() =>
  Math.round((tvmInput.years || 0) * getCompoundingPeriodsPerYear(tvmCompounding.value)),
);

function formatAxisCompact(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
  return String(Math.round(val));
}

const chartData = computed(() => {
  const sched = tvmResult.value.schedule || [];
  if (sched.length === 0) {
    return { endLine: '', contribLine: '', areaPath: '', yTicks: [] as string[], xTicks: [] as string[] };
  }
  const maxVal = Math.max(1, ...sched.map((s) => s.endBalance));
  const w = 480;
  const h = 140;
  const pts = sched.map((s, idx) => {
    const x = sched.length === 1 ? w : (idx / (sched.length - 1)) * w;
    const yEnd = h - (s.endBalance / maxVal) * (h - 12) - 4;
    const yContrib = h - (s.totalContributionsToDate / maxVal) * (h - 12) - 4;
    return { x, yEnd, yContrib };
  });
  const endLine = pts.map((p) => `${p.x.toFixed(1)},${p.yEnd.toFixed(1)}`).join(' ');
  const contribLine = pts.map((p) => `${p.x.toFixed(1)},${p.yContrib.toFixed(1)}`).join(' ');
  const areaPath = `M 0,${h} L ${pts.map((p) => `${p.x.toFixed(1)},${p.yEnd.toFixed(1)}`).join(' L ')} L ${w},${h} Z`;
  const yTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0].map(formatAxisCompact);
  const lastYr = sched[sched.length - 1]?.year ?? 0;
  const midYr = Math.max(1, Math.round(lastYr / 2));
  const xTicks = [t('tools.tvm.startTick'), t('tools.tvm.yrTick', { year: midYr }), t('tools.tvm.yrTick', { year: lastYr })];
  return { endLine, contribLine, areaPath, yTicks, xTicks };
});
</script>

<template>
  <div id="tvm-calculator" class="space-y-4">
    <!-- Dedicated Top Bar: Calculation Goal & Compounding Frequency -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('tools.tvm.calcGoal') }}
        </span>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="m in solveModes"
            :id="`mode-solve-${m.id.toLowerCase()}`"
            :key="m.id"
            type="button"
            class="rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold transition-colors"
            :class="
              tvmMode === m.id
                ? 'active border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            "
            @click="tvmMode = m.id"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('tools.tvm.compoundingLabel') }}
        </span>
        <div class="relative">
          <button
            id="compounding-dropdown-btn"
            type="button"
            class="inline-flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium"
            @click="isCompoundingMenuOpen = !isCompoundingMenuOpen"
          >
            <span class="compounding-active-text">{{ t(`tools.tvm.freq.${tvmCompounding}`) }}</span>
            <span>▾</span>
          </button>
          <div
            v-if="isCompoundingMenuOpen"
            class="compounding-menu symbol-dropdown-menu absolute right-0 top-[calc(100%+4px)] z-[var(--z-popover)] w-52 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1 shadow-xl"
          >
            <button
              v-for="freq in COMPOUNDING_FREQUENCIES"
              :key="freq.id"
              type="button"
              class="dropdown-option-item compounding-menu-item flex w-full rounded px-2.5 py-1.5 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
              @click="tvmCompounding = freq.id; isCompoundingMenuOpen = false"
            >
              {{ t(`tools.tvm.freq.${freq.id}`) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- Left Parameters Panel -->
      <UiAppCard :title="t('tools.tvm.paramsTitle')" class="lg:col-span-5">
        <template #actions>
          <UiAppBadge tone="info">{{ t('tools.tvm.interactiveTag') }}</UiAppBadge>
        </template>

        <div class="space-y-4">
          <!-- Present Value (Starting Principal) -->
          <div v-if="tvmMode !== 'PV'" class="space-y-2 border-b border-[var(--color-border)] pb-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.tvm.pvLabel') }}</span>
              <UiAppBadge>{{ settings.currency }}</UiAppBadge>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <button type="button" class="pv-source-btn rounded border px-2.5 py-1 text-xs" :class="tvmPvSource === 'market' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="tvmPvSource = 'market'">
                {{ t('tools.tvm.marketValue') }}
              </button>
              <button type="button" class="pv-source-btn rounded border px-2.5 py-1 text-xs" :class="tvmPvSource === 'cost' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="tvmPvSource = 'cost'">
                {{ t('tools.tvm.investedCost') }}
              </button>
              <button type="button" class="pv-source-btn rounded border px-2.5 py-1 text-xs" :class="tvmPvSource === 'custom' ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'" @click="tvmPvSource = 'custom'">
                {{ t('tools.tvm.customInput') }}
              </button>
            </div>

            <div class="space-y-1">
              <span class="text-[11px] text-[var(--color-text-muted)]">{{ t('tools.tvm.selectAssetTypes') }}</span>
              <div class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class="rounded-full border px-2 py-0.5 text-[11px]"
                  :class="tvmSelectedClasses.length === 0 ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
                  @click="tvmSelectedClasses = []"
                >
                  {{ t('asset.allClasses') }}
                </button>
                <button
                  v-for="chip in assetClassOptions"
                  :key="chip.id"
                  type="button"
                  class="asset-type-chip rounded-full border px-2 py-0.5 text-[11px]"
                  :class="tvmSelectedClasses.includes(chip.id) ? 'active border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)]'"
                  @click="toggleAssetChip(chip.id)"
                >
                  {{ chip.label }}
                </button>
              </div>
            </div>

            <input
              v-if="tvmPvSource === 'custom'"
              id="input-present-value"
              v-model.number="tvmInput.pv"
              type="number"
              step="any"
              class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs"
            />
            <div v-else class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs font-semibold">
              {{ formatMoney(tvmEffectivePv, settings.currency) }}
            </div>

            <div v-if="tvmPvSource === 'custom'" class="flex flex-wrap gap-1">
              <button v-for="amt in [10000, 50000, 100000, 500000]" :key="amt" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="tvmInput.pv += amt">
                +{{ amt >= 1000 ? `${amt / 1000}k` : amt }}
              </button>
              <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] hover:border-[var(--color-accent)]" @click="tvmInput.pv = 0">
                {{ t('common.clear') }}
              </button>
            </div>
          </div>

          <!-- Target FV (when solving PMT/PV/N/RATE) -->
          <label v-if="tvmMode !== 'FV'" class="block space-y-1 border-b border-[var(--color-border)] pb-3 text-xs">
            <span class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.tvm.targetFvLabel') }}</span>
            <input id="input-target-fv" v-model.number="tvmInput.targetFv" type="number" step="any" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
          </label>

          <!-- Periodic Payment -->
          <div v-if="tvmMode !== 'PMT'" class="space-y-2 border-b border-[var(--color-border)] pb-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.tvm.pmtLabel') }}</span>
              <div class="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-[11px]">
                <button type="button" class="rounded px-2 py-0.5" :class="tvmPaymentTiming === 'end' ? 'bg-[var(--color-accent)] text-white' : ''" @click="tvmPaymentTiming = 'end'">
                  {{ t('tools.tvm.endOfPeriod') }}
                </button>
                <button type="button" class="rounded px-2 py-0.5" :class="tvmPaymentTiming === 'beginning' ? 'bg-[var(--color-accent)] text-white' : ''" @click="tvmPaymentTiming = 'beginning'">
                  {{ t('tools.tvm.beginning') }}
                </button>
              </div>
            </div>
            <input id="input-payment" v-model.number="tvmInput.pmt" type="number" step="any" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
            <div class="flex flex-wrap gap-1">
              <button v-for="amt in [1000, 5000, 10000, 25000]" :key="amt" type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="tvmInput.pmt += amt">
                +{{ amt / 1000 }}k
              </button>
              <button type="button" class="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] hover:border-[var(--color-accent)]" @click="tvmInput.pmt = 0">
                0
              </button>
            </div>
          </div>

          <!-- Annual Rate -->
          <div v-if="tvmMode !== 'RATE'" class="space-y-2 border-b border-[var(--color-border)] pb-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.tvm.annualRateLabel') }}</span>
              <span class="font-mono text-[11px] text-[var(--color-accent)]">
                {{ t('tools.tvm.earPrefix') }} {{ tvmResult.effectiveAnnualRatePct.toFixed(2) }}%
              </span>
            </div>
            <input id="input-annual-rate" v-model.number="tvmInput.ratePercent" type="number" step="any" class="h-9 w-full rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2.5 font-mono text-xs" />
            <div class="flex flex-wrap gap-1">
              <button
                v-for="rp in ratePresets"
                :key="rp.val"
                type="button"
                class="rounded border px-2 py-0.5 text-[10px]"
                :class="tvmInput.ratePercent === rp.val ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'"
                @click="tvmInput.ratePercent = rp.val"
              >
                {{ rp.label }}
              </button>
            </div>
          </div>

          <!-- Investment Horizon -->
          <div v-if="tvmMode !== 'N'" class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-[var(--color-text-secondary)]">{{ t('tools.tvm.horizonLabel') }}</span>
              <span class="font-mono text-[11px] text-[var(--color-text-muted)]">
                {{ t('tools.tvm.totalCompPeriods', { count: totalCompPeriods }) }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <input v-model.number="tvmInput.years" type="range" min="1" max="50" class="flex-1 accent-[var(--color-accent)]" />
              <div class="flex items-center gap-1">
                <input id="input-years" v-model.number="tvmInput.years" type="number" min="1" max="100" class="h-8 w-16 rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 text-right font-mono text-xs" />
                <span class="text-xs text-[var(--color-text-muted)]">{{ t('tools.tvm.yearsUnit') }}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="yr in [1, 3, 5, 10, 20, 30]"
                :key="yr"
                type="button"
                class="rounded border px-2 py-0.5 font-mono text-[10px]"
                :class="tvmInput.years === yr ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'"
                @click="tvmInput.years = yr"
              >
                {{ t('tools.tvm.yearChip', { n: yr }) }}
              </button>
            </div>
          </div>
        </div>
      </UiAppCard>

      <!-- Right Results Panel -->
      <div class="space-y-4 lg:col-span-7">
        <UiAppCard class="tvm-results-card space-y-4">
          <!-- Hero Display -->
          <div class="tvm-hero-display flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="tvm-hero-title card-title text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {{ tvmHeroTitle }}
                </h3>
                <UiAppBadge>{{ settings.currency }}</UiAppBadge>
              </div>
              <div class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ tvmHeroSubtitle }}</div>
              <div class="hero-main-value mt-1 font-mono text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                {{
                  tvmMode === 'N'
                    ? t('tools.tvm.yearsValue', { years: tvmResult.years.toFixed(2) })
                    : tvmMode === 'RATE'
                      ? `${tvmResult.annualRatePct.toFixed(2)}%`
                      : formatMoney(tvmSolvedValue, settings.currency)
                }}
              </div>
              <SecondaryCurrency
                v-if="tvmMode !== 'N' && tvmMode !== 'RATE'"
                :amount="tvmSolvedValue"
                :exchange-rate="exchangeRate"
                :has-rate="hasRate"
                variant="hero"
              />
            </div>

            <div class="text-right">
              <UiAppBadge tone="positive" class="font-mono">
                {{ t('tools.tvm.returnMultiple', { mult: tvmResult.multiplier.toFixed(2) }) }}
              </UiAppBadge>
              <div v-if="!tvmResult.isValid" class="mt-2 rounded bg-[var(--color-pl-negative-soft)] px-2.5 py-1 text-xs text-[var(--color-pl-negative)]">
                {{ tvmResult.errorKey ? t(tvmResult.errorKey, tvmResult.errorParams) : (tvmResult.errorMessage || t('tools.tvm.unableSolve')) }}
              </div>
            </div>
          </div>

          <!-- Capital Composition 3-Segment Stacked Bar -->
          <div id="tvm-composition-bar" class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-[var(--color-text-primary)]">{{ t('tools.tvm.capitalComposition') }}</span>
              <span class="font-mono text-[var(--color-text-muted)]">{{ t('tools.tvm.totalLabel', { value: formatMoney(tvmResult.futureValue, settings.currency) }) }}</span>
            </div>
            <div class="flex h-3 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="bg-[var(--color-accent)]" :style="{ width: `${composition.pvPct}%` }" :title="t('tools.tvm.startingPrincipalTooltip', { pct: composition.pvPct.toFixed(1) })" />
              <div class="bg-[var(--color-asset-us-stocks)]" :style="{ width: `${composition.pmtPct}%` }" :title="t('tools.tvm.totalContribTooltip', { pct: composition.pmtPct.toFixed(1) })" />
              <div class="bg-[var(--color-pl-positive)]" :style="{ width: `${composition.intPct}%` }" :title="t('tools.tvm.compoundInterestTooltip', { pct: composition.intPct.toFixed(1) })" />
            </div>
            <div class="flex flex-wrap gap-4 font-mono text-[11px] text-[var(--color-text-secondary)]">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                {{ t('tools.tvm.startingPrincipalColon') }} {{ composition.pvPct.toFixed(1) }}%
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-[var(--color-asset-us-stocks)]" />
                {{ t('tools.tvm.contributionsColon') }} {{ composition.pmtPct.toFixed(1) }}%
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-[var(--color-pl-positive)]" />
                {{ t('tools.tvm.compoundInterestColon') }} {{ composition.intPct.toFixed(1) }}%
              </span>
            </div>
          </div>

          <!-- 6-Card KPI Grid -->
          <div id="tvm-kpi-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <UiKpiStatCard
              :label="t('tools.tvm.kpiPVLabel')"
              :value="formatMoney(tvmResult.totalPrincipal, settings.currency)"
              :subtext="t('tools.tvm.pctOfTotal', { pct: composition.pvPct.toFixed(1) })"
              :secondary-amount="tvmResult.totalPrincipal"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
            />
            <UiKpiStatCard
              :label="t('tools.tvm.kpiPMTLabel')"
              :value="formatMoney(tvmResult.totalContributions, settings.currency)"
              :subtext="t('tools.tvm.depositsOf', { periods: tvmResult.totalPeriods, amount: formatMoney(tvmResult.payment, settings.currency) })"
              :secondary-amount="tvmResult.totalContributions"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
            />
            <UiKpiStatCard
              :label="t('tools.tvm.kpiInvestedLabel')"
              :value="formatMoney(tvmResult.totalInvested, settings.currency)"
              :subtext="t('tools.tvm.principalPlusDeposits')"
              :secondary-amount="tvmResult.totalInvested"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
            />
            <UiKpiStatCard
              :label="t('tools.tvm.kpiInterestLabel')"
              :value="formatSignedMoney(tvmResult.totalInterestEarned, settings.currency)"
              :subtext="t('tools.tvm.pctOfTotal', { pct: composition.intPct.toFixed(1) })"
              tone="positive"
              :secondary-amount="tvmResult.totalInterestEarned"
              :exchange-rate="exchangeRate"
              :has-rate="hasRate"
              secondary-signed
            />
            <UiKpiStatCard
              :label="t('tools.tvm.kpiEffectiveApy')"
              :value="`${tvmResult.effectiveAnnualRatePct.toFixed(2)}%`"
              :subtext="t('tools.tvm.compoundedWith', { label: t(`tools.tvm.freq.${tvmCompounding}`) })"
            />
            <UiKpiStatCard
              :label="t('tools.tvm.kpiMultiplierLabel')"
              :value="`${tvmResult.multiplier.toFixed(2)}x`"
              :subtext="t('tools.tvm.fvDivInvested')"
            />
          </div>

          <!-- Interactive Trajectory Chart -->
          <div class="tvm-chart-card rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.tvm.chartTitle') }}</h3>
                <p class="text-[11px] text-[var(--color-text-muted)]">{{ t('tools.tvm.chartSubtitle', { years: tvmResult.years.toFixed(0) }) }}</p>
              </div>
              <div class="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5 text-xs">
                <button type="button" class="chart-mode-btn rounded px-2.5 py-1" :class="tvmChartMode === 'area' ? 'active bg-[var(--color-accent)] text-white' : ''" :title="t('tools.tvm.areaTitle')" @click="tvmChartMode = 'area'">
                  {{ t('tools.tvm.areaBtn') }}
                </button>
                <button type="button" class="chart-mode-btn rounded px-2.5 py-1" :class="tvmChartMode === 'lines' ? 'active bg-[var(--color-accent)] text-white' : ''" :title="t('tools.tvm.linesTitle')" @click="tvmChartMode = 'lines'">
                  {{ t('tools.tvm.linesBtn') }}
                </button>
              </div>
            </div>

            <div class="flex gap-2">
              <div class="flex flex-col justify-between py-1 font-mono text-[10px] text-[var(--color-text-muted)]">
                <span v-for="(tick, idx) in chartData.yTicks" :key="idx">{{ tick }}</span>
              </div>
              <div class="flex-1">
                <svg viewBox="0 0 480 140" class="tvm-growth-svg h-36 w-full" role="img" :aria-label="t('ui.tvmChartAria')">
                  <path v-if="tvmChartMode === 'area' && chartData.areaPath" :d="chartData.areaPath" class="chart-area-balance" fill="var(--color-accent-soft)" />
                  <polyline v-if="chartData.contribLine" :points="chartData.contribLine" class="chart-line-invested" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-dasharray="4 3" />
                  <polyline v-if="chartData.endLine" :points="chartData.endLine" class="chart-line-balance" fill="none" stroke="var(--color-accent)" stroke-width="2.2" />
                </svg>
                <div class="mt-1 flex justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
                  <span v-for="(xt, idx) in chartData.xTicks" :key="idx">{{ xt }}</span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-2 text-[11px] text-[var(--color-text-secondary)]">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-0.5 w-4 bg-[var(--color-accent)]" />
                {{ t('tools.tvm.legendBalance') }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-0.5 w-4 border-t border-dashed border-[var(--color-text-muted)]" />
                {{ t('tools.tvm.legendInvested') }}
              </span>
            </div>
          </div>

          <!-- 6-Column Expandable Schedule -->
          <div class="space-y-2 border-t border-[var(--color-border)] pt-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-semibold text-[var(--color-text-primary)]">{{ t('tools.tvm.scheduleTitle') }}</h3>
                <p class="text-[11px] text-[var(--color-text-muted)]">{{ t('tools.tvm.scheduleSub', { years: tvmResult.years.toFixed(0) }) }}</p>
              </div>
              <UiAppButton id="btn-toggle-tvm-schedule" size="xs" @click="showTvmSchedule = !showTvmSchedule">
                {{ showTvmSchedule ? t('tools.tvm.collapseTable') : t('tools.tvm.expandSchedule', { years: tvmResult.years.toFixed(0) }) }}
              </UiAppButton>
            </div>

            <div v-if="showTvmSchedule" class="schedule-table mt-2 max-h-72 overflow-auto rounded border border-[var(--color-border)]">
              <table class="w-full text-left text-xs">
                <thead class="bg-[var(--color-surface)] text-[11px] uppercase text-[var(--color-text-muted)]">
                  <tr>
                    <th class="px-3 py-2">{{ t('tools.tvm.thYear') }}</th>
                    <th class="px-3 py-2 text-right">{{ t('tools.tvm.thStartBal') }}</th>
                    <th class="px-3 py-2 text-right">{{ t('tools.tvm.thAnnualDeposits') }}</th>
                    <th class="px-3 py-2 text-right">{{ t('tools.tvm.thInterestEarned') }}</th>
                    <th class="px-3 py-2 text-right">{{ t('tools.tvm.thEndBal') }}</th>
                    <th class="px-3 py-2 text-right">{{ t('tools.tvm.thCumInterest') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--color-border)] font-mono">
                  <tr v-for="row in tvmResult.schedule" :key="row.period" class="hover:bg-[var(--color-surface-overlay)]">
                    <td class="px-3 py-2">{{ row.year }}</td>
                    <td class="px-3 py-2 text-right">
                      <div>{{ formatMoney(row.startBalance, settings.currency) }}</div>
                      <SecondaryCurrency :amount="row.startBalance" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div>{{ formatMoney(row.contributions, settings.currency) }}</div>
                      <SecondaryCurrency :amount="row.contributions" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                    </td>
                    <td class="px-3 py-2 text-right pl-positive">
                      <div>{{ formatMoney(row.interestEarned, settings.currency) }}</div>
                      <SecondaryCurrency :amount="row.interestEarned" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                    </td>
                    <td class="px-3 py-2 text-right font-semibold">
                      <div>{{ formatMoney(row.endBalance, settings.currency) }}</div>
                      <SecondaryCurrency :amount="row.endBalance" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div>{{ formatMoney(row.totalInterestToDate, settings.currency) }}</div>
                      <SecondaryCurrency :amount="row.totalInterestToDate" :exchange-rate="exchangeRate" :has-rate="hasRate" variant="table" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UiAppCard>
      </div>
    </div>
  </div>
</template>
