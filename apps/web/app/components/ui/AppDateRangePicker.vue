<script setup lang="ts">
export interface DateRangeValue {
  timeframe: string;
  startDate: string;
  endDate: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }>(),
  {
    timeframe: 'ALL',
    startDate: '',
    endDate: '',
  },
);

const emit = defineEmits<{
  change: [value: DateRangeValue];
}>();

const { t, language } = useI18n();

const isOpen = ref(false);
const tempStart = ref(props.startDate);
const tempEnd = ref(props.endDate);
const hoverDate = ref('');
const selectedPresetId = ref('all');
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface PresetItem {
  id: string;
  timeframe: string;
  label: string;
  triggerLabel: string;
  getRange: (now?: Date) => { startDate: string; endDate: string };
}

const presets: PresetItem[] = [
  { id: 'all', timeframe: 'ALL', label: 'All Time', triggerLabel: 'All Dates', getRange: () => ({ startDate: '', endDate: '' }) },
  {
    id: '7d',
    timeframe: '1W',
    label: 'Last 7 Days',
    triggerLabel: 'Last 7 Days',
    getRange: (now = new Date()) => {
      const s = new Date(now);
      s.setDate(now.getDate() - 7);
      return { startDate: formatIso(s), endDate: formatIso(now) };
    },
  },
  {
    id: '30d',
    timeframe: '1M',
    label: 'Last 30 Days',
    triggerLabel: 'Last 30 Days',
    getRange: (now = new Date()) => {
      const s = new Date(now);
      s.setDate(now.getDate() - 30);
      return { startDate: formatIso(s), endDate: formatIso(now) };
    },
  },
  {
    id: '90d',
    timeframe: '3M',
    label: 'Last 90 Days',
    triggerLabel: 'Last 90 Days',
    getRange: (now = new Date()) => {
      const s = new Date(now);
      s.setDate(now.getDate() - 90);
      return { startDate: formatIso(s), endDate: formatIso(now) };
    },
  },
  {
    id: 'this-month',
    timeframe: 'MTD',
    label: 'This Month',
    triggerLabel: 'This Month',
    getRange: (now = new Date()) => ({
      startDate: formatIso(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: formatIso(now),
    }),
  },
  {
    id: 'last-month',
    timeframe: 'LM',
    label: 'Last Month',
    triggerLabel: 'Last Month',
    getRange: (now = new Date()) => ({
      startDate: formatIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: formatIso(new Date(now.getFullYear(), now.getMonth(), 0)),
    }),
  },
  {
    id: 'ytd',
    timeframe: 'YTD',
    label: 'YTD',
    triggerLabel: 'YTD',
    getRange: (now = new Date()) => ({
      startDate: formatIso(new Date(now.getFullYear(), 0, 1)),
      endDate: formatIso(now),
    }),
  },
  {
    id: 'last-year',
    timeframe: '1Y',
    label: 'Last Year',
    triggerLabel: 'Last Year',
    getRange: (now = new Date()) => ({
      startDate: formatIso(new Date(now.getFullYear() - 1, 0, 1)),
      endDate: formatIso(new Date(now.getFullYear() - 1, 11, 31)),
    }),
  },
];

const triggerLabel = computed(() => {
  const preset = presets.find((p) => p.id === selectedPresetId.value);
  if (preset && selectedPresetId.value !== 'custom') {
    return preset.triggerLabel;
  }
  if (props.startDate && props.endDate) {
    return `${props.startDate} → ${props.endDate}`;
  }
  if (props.startDate) {
    return `${props.startDate} → …`;
  }
  return 'All Dates';
});

const weekDays = computed(() => [
  t('date.su'),
  t('date.mo'),
  t('date.tu'),
  t('date.we'),
  t('date.th'),
  t('date.fr'),
  t('date.sa'),
]);

const monthHeading = computed(() =>
  new Intl.DateTimeFormat(language.value === 'th' ? 'th-TH' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewYear.value, viewMonth.value, 1)),
);

const calendarDays = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = new Date(viewYear.value, viewMonth.value, 1 - startDow);
  const todayIso = formatIso(new Date());
  const days: Array<{
    date: string;
    day: number;
    inMonth: boolean;
    isToday: boolean;
    isStart: boolean;
    isEnd: boolean;
    inRange: boolean;
  }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = formatIso(d);
    const effectiveEnd = tempEnd.value || (tempStart.value && hoverDate.value >= tempStart.value ? hoverDate.value : '');
    days.push({
      date: iso,
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.value,
      isToday: iso === todayIso,
      isStart: Boolean(tempStart.value && iso === tempStart.value),
      isEnd: Boolean(tempEnd.value && iso === tempEnd.value),
      inRange: Boolean(tempStart.value && effectiveEnd && iso > tempStart.value && iso < effectiveEnd),
    });
  }
  return days;
});

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
}

function selectPreset(preset: PresetItem) {
  selectedPresetId.value = preset.id;
  const { startDate, endDate } = preset.getRange();
  tempStart.value = startDate;
  tempEnd.value = endDate;
  isOpen.value = false;
  emit('change', {
    timeframe: preset.timeframe,
    startDate,
    endDate,
    label: preset.triggerLabel,
  });
}

function onDayClick(iso: string) {
  selectedPresetId.value = 'custom';
  if (!tempStart.value || (tempStart.value && tempEnd.value)) {
    tempStart.value = iso;
    tempEnd.value = '';
    return;
  }
  if (iso < tempStart.value) {
    tempEnd.value = tempStart.value;
    tempStart.value = iso;
  } else {
    tempEnd.value = iso;
  }
  isOpen.value = false;
  emit('change', {
    timeframe: 'CUSTOM',
    startDate: tempStart.value,
    endDate: tempEnd.value,
    label: `${tempStart.value} → ${tempEnd.value}`,
  });
}
</script>

<template>
  <div class="relative inline-block">
    <button
      id="datepicker-trigger-btn"
      type="button"
      class="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-overlay)]"
      @click="isOpen = !isOpen"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span>{{ triggerLabel }}</span>
    </button>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-[var(--z-backdrop)] bg-transparent"
      @click="isOpen = false"
    />

    <div
      v-if="isOpen"
      class="datepicker-popover absolute left-0 top-[calc(100%+6px)] z-[var(--z-popover)] flex w-[min(92vw,460px)] flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 shadow-2xl sm:flex-row"
    >
      <div class="flex shrink-0 flex-row flex-wrap gap-1 border-b border-[var(--color-border)] pb-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r sm:pb-0 sm:pr-2">
        <button
          v-for="p in presets"
          :key="p.id"
          type="button"
          class="preset-item rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
          :class="
            selectedPresetId === p.id
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]'
          "
          @click="selectPreset(p)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="flex-1">
        <div class="mb-2 flex items-center justify-between">
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            :aria-label="t('ui.prevMonth')"
            @click="prevMonth"
          >
            ‹
          </button>
          <span class="text-xs font-semibold text-[var(--color-text-primary)]">{{ monthHeading }}</span>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)]"
            :aria-label="t('ui.nextMonth')"
            @click="nextMonth"
          >
            ›
          </button>
        </div>

        <div class="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-[var(--color-text-muted)]">
          <span v-for="wd in weekDays" :key="wd" class="py-1">{{ wd }}</span>
        </div>

        <div class="mt-1 grid grid-cols-7 gap-0.5">
          <button
            v-for="cell in calendarDays"
            :key="cell.date"
            type="button"
            class="h-7 rounded text-[11px] font-mono transition-colors"
            :class="[
              !cell.inMonth ? 'text-[var(--color-text-muted)] opacity-40' : 'text-[var(--color-text-primary)]',
              cell.isStart || cell.isEnd
                ? 'bg-[var(--color-accent)] font-bold text-white'
                : cell.inRange
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'hover:bg-[var(--color-surface-overlay)]',
              cell.isToday && !cell.isStart && !cell.isEnd ? 'ring-1 ring-[var(--color-accent)]' : '',
            ]"
            @mouseenter="hoverDate = cell.date"
            @click="onDayClick(cell.date)"
          >
            {{ cell.day }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
