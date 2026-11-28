<script setup lang="ts">
import type { FundFactsheetResponse } from '@sgsk-wealth/contracts';
import { displaySymbol } from '@sgsk-wealth/domain';

const props = defineProps<{
  open: boolean;
  symbol: string | null;
  assetType?: string;
}>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { settings } = useUserSettings();
const { authState } = useAuth();
const { request } = useApiClient();

const loading = ref(false);
const factsheet = ref<FundFactsheetResponse | null>(null);
const error = ref<string | null>(null);

async function loadFactsheet() {
  if (!props.open || !props.symbol) return;
  loading.value = true;
  error.value = null;
  factsheet.value = null;
  try {
    factsheet.value = await request<FundFactsheetResponse>('/nav/factsheet', {
      query: { symbol: String(props.symbol), asset_type: props.assetType || 'mutual-fund' },
      bearerToken: authState.value.accessToken,
      userId: authState.value.userId,
    });
  } catch {
    error.value = t('factsheet.error');
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.symbol],
  ([isOpen, sym]) => {
    if (isOpen && sym) {
      void loadFactsheet();
    }
  },
);

const fundTitle = computed(() => {
  const fs = factsheet.value;
  if (!fs) return props.symbol || '';
  if (settings.value.language === 'th' && fs.fundNameTh) return fs.fundNameTh;
  return fs.fundName || fs.fundNameTh || props.symbol || '';
});

const amcTitle = computed(() => {
  const fs = factsheet.value;
  if (!fs) return '';
  if (settings.value.language === 'th' && fs.amcNameTh) return fs.amcNameTh;
  return fs.amcName || fs.amcNameTh || '';
});

const riskTone = computed<'negative' | 'warning' | 'positive' | 'neutral'>(() => {
  const m = factsheet.value?.riskLevel?.match(/\d+/);
  const lvl = m ? Number(m[0]) : 0;
  if (lvl >= 6) return 'negative';
  if (lvl >= 4) return 'warning';
  if (lvl >= 1) return 'positive';
  return 'neutral';
});

const formattedDividendPolicy = computed(() => {
  const raw = factsheet.value?.dividendPolicy?.trim();
  if (!raw) return '';
  if (raw.toUpperCase() === 'Y') return t('factsheet.dividendYes');
  if (raw.toUpperCase() === 'N') return t('factsheet.dividendNo');
  return raw;
});

const hasStatistics = computed(() => {
  const s = factsheet.value?.statistics;
  if (!s) return false;
  return (
    s.maxDrawdown != null ||
    s.sharpeRatio != null ||
    s.trackingError != null ||
    Boolean(s.fxHedging) ||
    s.turnoverRatio != null ||
    s.beta != null ||
    s.alpha != null ||
    s.yieldToMaturity != null ||
    Boolean(s.portfolioDuration) ||
    Boolean(s.recoveringPeriod)
  );
});

const hasTradeConditions = computed(() => {
  const tc = factsheet.value?.tradeConditions;
  if (!tc) return false;
  return (
    tc.minimumInitialSub != null ||
    tc.minimumNextSub != null ||
    tc.minimumRedempt != null ||
    Boolean(tc.subscriptionPeriod) ||
    Boolean(tc.redemptionPeriod) ||
    Boolean(tc.settlementPeriod)
  );
});
</script>

<template>
  <UiAppModal
    :open="Boolean(open && symbol)"
    backdrop-id="fund-factsheet-modal-backdrop"
    modal-id="fund-factsheet-modal"
    close-btn-id="btn-close-factsheet-modal"
    max-width-class="max-w-3xl"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <SymbolIcon v-if="symbol" :symbol="symbol" :asset-type="assetType" :size="40" />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <span id="factsheet-symbol-badge" class="rounded bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-accent)]">
              {{ displaySymbol(symbol || '') }}
            </span>
            <UiAppBadge v-if="factsheet?.riskLevel" id="factsheet-risk-badge" :tone="riskTone" class="font-mono">
              {{ factsheet.riskLevel }}
            </UiAppBadge>
            <UiAppBadge v-if="factsheet?.aimcType">AIMC: {{ factsheet.aimcType }}</UiAppBadge>
            <UiAppBadge v-if="factsheet?.taxIncentiveType" tone="info">{{ factsheet.taxIncentiveType }}</UiAppBadge>
          </div>
          <h3 id="factsheet-fund-title" class="mt-1 truncate text-base font-bold text-[var(--color-text-primary)]">
            {{ fundTitle }}
          </h3>
          <p v-if="amcTitle" id="factsheet-amc-name" class="truncate text-xs text-[var(--color-text-muted)]">
            {{ amcTitle }}
          </p>
        </div>
      </div>
    </template>

    <template #header-actions>
      <a
        v-if="factsheet?.pdfUrl"
        id="btn-factsheet-pdf"
        :href="factsheet.pdfUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
      >
        {{ t('factsheet.openPdf') }}
      </a>
      <a
        v-if="factsheet?.amcUrl"
        id="btn-factsheet-amc-url"
        :href="factsheet.amcUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]"
      >
        {{ t('factsheet.openAmc') }}
      </a>
    </template>

    <div
      v-if="loading"
      id="factsheet-loading"
      role="status"
      aria-live="polite"
      :aria-label="t('factsheet.loading')"
      class="flex items-center justify-center py-12"
    >
      <div class="relative flex h-16 w-16 items-center justify-center">
        <div class="absolute inset-0 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        <div class="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-md">
          <img src="/brand-logo.png" alt="SGSK Wealth" class="h-7 w-7 object-contain" />
        </div>
      </div>
    </div>

    <div v-else-if="error" id="factsheet-error" class="space-y-3 py-10 text-center">
      <p class="text-sm text-[var(--color-pl-negative)]">{{ error }}</p>
      <UiAppButton id="btn-retry-factsheet" size="sm" @click="loadFactsheet">{{ t('factsheet.retry') }}</UiAppButton>
    </div>

    <div v-else-if="factsheet" class="space-y-5">
      <div v-if="factsheet.asOfDate" class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
        <span>{{ t('factsheet.asOfDate', { date: factsheet.asOfDate }) }}</span>
        <span v-if="factsheet.projId" class="font-mono">SEC ID: {{ factsheet.projId }}</span>
      </div>

      <section id="factsheet-section-overview" class="space-y-3">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.overviewSection') }}</h4>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-if="factsheet.policyDesc" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.policyDesc') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.policyDesc }}</div>
          </div>
          <div v-if="factsheet.managementStyle" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.managementStyle') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.managementStyle }}</div>
          </div>
          <div v-if="factsheet.riskLevel || factsheet.riskDescription" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.riskLevel') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">
              {{ factsheet.riskLevel }}{{ factsheet.riskDescription ? ` — ${factsheet.riskDescription}` : '' }}
            </div>
          </div>
          <div v-if="factsheet.aimcDescription || factsheet.aimcType" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.aimcCategory') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.aimcDescription || factsheet.aimcType }}</div>
          </div>
          <div v-if="factsheet.benchmark" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:col-span-2">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.benchmark') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">
              {{ factsheet.benchmark }}
              <span v-if="factsheet.benchmarkRemark" class="text-[var(--color-text-muted)]"> ({{ factsheet.benchmarkRemark }})</span>
            </div>
          </div>
          <div v-if="formattedDividendPolicy" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.dividendPolicy') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">{{ formattedDividendPolicy }}</div>
          </div>
          <div v-if="factsheet.fxHedgingPolicy" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.fxHedgingPolicy') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.fxHedgingPolicy }}</div>
          </div>
          <div v-if="factsheet.feederMasterFund" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.feederFund') }}</div>
            <div class="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">
              {{ factsheet.feederMasterFund }}{{ factsheet.feederCountry ? ` (${factsheet.feederCountry})` : '' }}
            </div>
          </div>
          <div v-if="factsheet.inceptionDate" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.inceptionDate') }}</div>
            <div class="mt-0.5 font-mono text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.inceptionDate }}</div>
          </div>
          <div v-if="factsheet.isinCode" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.isinCode') }}</div>
            <div class="mt-0.5 font-mono text-xs font-medium text-[var(--color-text-primary)]">{{ factsheet.isinCode }}</div>
          </div>
        </div>
        <div v-if="factsheet.objective || factsheet.investmentPolicyDesc" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.objective') }}</div>
          <p class="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{{ factsheet.objective || factsheet.investmentPolicyDesc }}</p>
        </div>
      </section>

      <section v-if="factsheet.performance.length > 0" id="factsheet-section-performance" class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.performanceSection') }}</h4>
        <div class="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <table class="w-full text-left text-xs">
            <thead class="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th class="px-3 py-2">{{ t('factsheet.perfCategory') }}</th>
                <th class="px-3 py-2">{{ t('factsheet.perfPeriod') }}</th>
                <th class="px-3 py-2 text-right">{{ t('factsheet.perfValue') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="(item, idx) in factsheet.performance" :key="idx">
                <td class="px-3 py-2">{{ item.category }}</td>
                <td class="px-3 py-2 font-mono">{{ item.period }}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold" :class="(item.value ?? 0) > 0 ? 'pl-positive' : (item.value ?? 0) < 0 ? 'pl-negative' : ''">
                  {{ item.value != null ? `${item.value > 0 ? '+' : ''}${item.value.toFixed(2)}%` : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="factsheet.assetAllocation.length > 0 || factsheet.topHoldings.length > 0" id="factsheet-section-allocation" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-if="factsheet.assetAllocation.length > 0" class="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.allocationSection') }}</h4>
          <div v-for="(alloc, idx) in factsheet.assetAllocation" :key="idx" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span>{{ alloc.name }}</span>
              <span class="font-mono font-semibold">{{ alloc.ratio.toFixed(2) }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="h-full rounded-full bg-[var(--color-accent)]" :style="{ width: `${Math.min(100, Math.max(0, alloc.ratio))}%` }" />
            </div>
          </div>
        </div>

        <div v-if="factsheet.topHoldings.length > 0" class="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.topHoldingsSection') }}</h4>
          <div v-for="(holding, idx) in factsheet.topHoldings" :key="idx" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="truncate">{{ holding.seq }}. {{ holding.name }}</span>
              <span class="font-mono font-semibold">{{ holding.ratio.toFixed(2) }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-overlay)]">
              <div class="h-full rounded-full bg-[var(--color-secondary)]" :style="{ width: `${Math.min(100, Math.max(0, holding.ratio))}%` }" />
            </div>
          </div>
        </div>
      </section>

      <section v-if="hasStatistics && factsheet.statistics" id="factsheet-section-stats" class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.statisticsSection') }}</h4>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div v-if="factsheet.statistics.maxDrawdown != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.maxDrawdown') }}</div>
            <div class="font-mono text-sm font-semibold pl-negative">{{ factsheet.statistics.maxDrawdown.toFixed(2) }}%</div>
          </div>
          <div v-if="factsheet.statistics.sharpeRatio != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.sharpeRatio') }}</div>
            <div class="font-mono text-sm font-semibold">{{ factsheet.statistics.sharpeRatio.toFixed(2) }}</div>
          </div>
          <div v-if="factsheet.statistics.trackingError != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.trackingError') }}</div>
            <div class="font-mono text-sm font-semibold">{{ factsheet.statistics.trackingError.toFixed(2) }}%</div>
          </div>
          <div v-if="factsheet.statistics.fxHedging" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.fxHedging') }}</div>
            <div class="font-mono text-sm font-semibold">{{ factsheet.statistics.fxHedging }}</div>
          </div>
          <div v-if="factsheet.statistics.turnoverRatio != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.turnoverRatio') }}</div>
            <div class="font-mono text-sm font-semibold">{{ factsheet.statistics.turnoverRatio.toFixed(2) }}%</div>
          </div>
          <div v-if="factsheet.statistics.beta != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.beta') }}</div>
            <div class="font-mono text-sm font-semibold">{{ factsheet.statistics.beta.toFixed(2) }}</div>
          </div>
        </div>
      </section>

      <section v-if="factsheet.fees.length > 0 || hasTradeConditions" id="factsheet-section-fees" class="space-y-3">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{{ t('factsheet.feesSection') }}</h4>
        <div v-if="factsheet.fees.length > 0" class="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <table class="w-full text-left text-xs">
            <thead class="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th class="px-3 py-2">{{ t('factsheet.feeType') }}</th>
                <th class="px-3 py-2 text-right">{{ t('factsheet.ceilingRate') }}</th>
                <th class="px-3 py-2 text-right">{{ t('factsheet.actualRate') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr v-for="(fee, idx) in factsheet.fees" :key="idx">
                <td class="px-3 py-2">{{ fee.description }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ fee.ceilingRate || '—' }}</td>
                <td class="px-3 py-2 text-right font-mono">{{ fee.actualRate || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="hasTradeConditions && factsheet.tradeConditions" class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div v-if="factsheet.tradeConditions.minimumInitialSub != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.minInitialSub') }}</div>
            <div class="font-mono text-xs font-semibold">{{ factsheet.tradeConditions.minimumInitialSub.toLocaleString() }} {{ factsheet.tradeConditions.currency || '' }}</div>
          </div>
          <div v-if="factsheet.tradeConditions.minimumNextSub != null" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.minNextSub') }}</div>
            <div class="font-mono text-xs font-semibold">{{ factsheet.tradeConditions.minimumNextSub.toLocaleString() }} {{ factsheet.tradeConditions.currency || '' }}</div>
          </div>
          <div v-if="factsheet.tradeConditions.settlementPeriod" class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
            <div class="text-[11px] text-[var(--color-text-muted)]">{{ t('factsheet.settlementPeriod') }}</div>
            <div class="font-mono text-xs font-semibold">{{ factsheet.tradeConditions.settlementPeriod }}</div>
          </div>
        </div>
      </section>
    </div>
  </UiAppModal>
</template>
