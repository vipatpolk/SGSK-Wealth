<script setup lang="ts">
export interface DonutSlice {
  key: string;
  label: string;
  percent: number;
  color: string;
  valueLabel?: string;
}

const props = withDefaults(
  defineProps<{
    slices: DonutSlice[];
    centerLabel?: string;
    centerValue?: string;
    centerSecondaryAmount?: number;
    exchangeRate?: number;
    hasRate?: boolean;
    selectedKey?: string | null;
    size?: number;
    legendLayout?: 'list' | 'pills' | 'grid';
    interactive?: boolean;
  }>(),
  {
    centerLabel: '',
    centerValue: '',
    centerSecondaryAmount: undefined,
    exchangeRate: 0,
    hasRate: false,
    selectedKey: null,
    size: 168,
    legendLayout: 'list',
    interactive: true,
  },
);

const emit = defineEmits<{
  select: [key: string];
}>();

const { t } = useI18n();

const hoveredKey = ref<string | null>(null);
const R = 40;
const CIRC = 2 * Math.PI * R;

const segments = computed(() => {
  let offset = 0;
  return props.slices
    .filter((s) => s.percent > 0)
    .map((s) => {
      const len = (s.percent / 100) * CIRC;
      const seg = {
        ...s,
        dashArray: `${len.toFixed(2)} ${(CIRC - len).toFixed(2)}`,
        dashOffset: `${(-offset).toFixed(2)}`,
      };
      offset += len;
      return seg;
    });
});

const activeSlice = computed(() => {
  const key = hoveredKey.value ?? props.selectedKey;
  return key ? segments.value.find((s) => s.key === key) ?? null : null;
});
</script>

<template>
  <div
    class="flex flex-col items-center gap-4"
    :class="legendLayout === 'list' ? 'sm:flex-row sm:items-center' : ''"
  >
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg viewBox="0 0 100 100" class="donut-svg h-full w-full -rotate-90" role="img" :aria-label="t('ui.allocDonutAria')">
        <circle cx="50" cy="50" :r="R" fill="none" stroke="var(--color-surface-overlay)" stroke-width="11" />
        <circle
          v-for="seg in segments"
          :key="seg.key"
          cx="50"
          cy="50"
          :r="R"
          fill="none"
          :stroke="seg.color"
          :stroke-width="activeSlice?.key === seg.key ? 13 : 11"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
          class="transition-all duration-150"
          :class="interactive ? 'cursor-pointer' : ''"
          :opacity="activeSlice && activeSlice.key !== seg.key ? 0.55 : 1"
          @mouseenter="interactive && (hoveredKey = seg.key)"
          @mouseleave="interactive && (hoveredKey = null)"
          @click="interactive && emit('select', seg.key)"
        />
      </svg>
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span class="donut-center-val privacy-mask font-mono text-sm font-bold text-[var(--color-text-primary)]">
          {{ activeSlice ? `${activeSlice.percent.toFixed(1)}%` : centerValue }}
        </span>
        <SecondaryCurrency
          v-if="!activeSlice && centerSecondaryAmount !== undefined && hasRate"
          :amount="centerSecondaryAmount"
          :exchange-rate="exchangeRate"
          :has-rate="hasRate"
          variant="compact"
        />
        <span class="truncate text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ activeSlice ? activeSlice.label : centerLabel }}
        </span>
      </div>
    </div>

    <div v-if="legendLayout === 'pills'" class="flex w-full flex-wrap justify-center gap-1.5">
      <button
        v-for="seg in segments"
        :key="seg.key"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] transition-colors hover:bg-[var(--color-surface-overlay)]"
        :class="selectedKey === seg.key ? 'ring-1 ring-[var(--color-accent)]' : ''"
        @mouseenter="interactive && (hoveredKey = seg.key)"
        @mouseleave="interactive && (hoveredKey = null)"
        @click="interactive && emit('select', seg.key)"
      >
        <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: seg.color }" />
        <span class="text-[var(--color-text-secondary)]">{{ seg.label }}</span>
        <span class="font-mono font-semibold text-[var(--color-text-primary)]">{{ seg.percent.toFixed(1) }}%</span>
      </button>
    </div>

    <div
      v-else-if="legendLayout === 'grid'"
      class="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2"
    >
      <button
        v-for="seg in segments"
        :key="seg.key"
        type="button"
        class="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[var(--color-surface-overlay)]"
        :class="selectedKey === seg.key ? 'ring-1 ring-[var(--color-accent)]' : ''"
        @mouseenter="interactive && (hoveredKey = seg.key)"
        @mouseleave="interactive && (hoveredKey = null)"
        @click="interactive && emit('select', seg.key)"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: seg.color }" />
          <span class="truncate text-[var(--color-text-primary)]">{{ seg.label }}</span>
        </span>
        <span class="shrink-0 font-mono font-semibold text-[var(--color-text-secondary)]">{{ seg.percent.toFixed(1) }}%</span>
      </button>
    </div>

    <div v-else class="flex w-full min-w-0 flex-1 flex-col gap-1.5">
      <button
        v-for="seg in segments"
        :key="seg.key"
        type="button"
        class="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-left text-xs transition-colors hover:bg-[var(--color-surface-overlay)]"
        :class="selectedKey === seg.key ? 'bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-accent)]' : ''"
        @mouseenter="interactive && (hoveredKey = seg.key)"
        @mouseleave="interactive && (hoveredKey = null)"
        @click="interactive && emit('select', seg.key)"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: seg.color }" />
          <span class="truncate text-[var(--color-text-primary)]">{{ seg.label }}</span>
        </span>
        <span class="shrink-0 font-mono text-[var(--color-text-secondary)]">
          <template v-if="seg.valueLabel">
            <span class="privacy-mask mr-1.5">{{ seg.valueLabel }}</span>
          </template>
          {{ seg.percent.toFixed(1) }}%
        </span>
      </button>
    </div>
  </div>
</template>
