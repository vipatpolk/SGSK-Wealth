<script setup lang="ts">
import { buildDisplayedPageNumbers } from '@sgsk-wealth/domain';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    pageSize: number;
    totalItems: number;
  }>(),
  {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
  },
);

const emit = defineEmits<{
  'update:currentPage': [page: number];
  'update:pageSize': [size: number];
}>();

const { t } = useI18n();

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)));
const startIndex = computed(() => (props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1));
const endIndex = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems));
const pageNumbers = computed(() => buildDisplayedPageNumbers(props.currentPage, totalPages.value));

function onSizeChange(event: Event) {
  const next = Number((event.target as HTMLSelectElement).value);
  emit('update:pageSize', next);
  emit('update:currentPage', 1);
}
</script>

<template>
  <div
    data-testid="tx-pagination"
    class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-secondary)]"
  >
    <div class="flex items-center gap-2">
      <span>{{ t('tx.rowsPerPage') }}</span>
      <select
        id="tx-page-size-select"
        :value="pageSize"
        :aria-label="t('tx.rowsPerPage')"
        class="h-7 rounded border border-[var(--color-border)] bg-[var(--color-component-input)] px-2 font-mono text-xs text-[var(--color-text-primary)]"
        @change="onSizeChange"
      >
        <option :value="10">10</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
      <span class="font-mono text-[var(--color-text-muted)]">
        {{ startIndex }}–{{ endIndex }} / {{ totalItems }}
      </span>
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <button
        type="button"
        class="h-7 rounded border border-[var(--color-border)] px-2 hover:bg-[var(--color-surface-overlay)] disabled:opacity-40"
        :disabled="currentPage <= 1"
        @click="emit('update:currentPage', currentPage - 1)"
      >
        ‹
      </button>
      <template v-for="(item, idx) in pageNumbers" :key="`${item}-${idx}`">
        <span v-if="item === '...'" class="px-1.5 text-[var(--color-text-muted)]">…</span>
        <button
          v-else
          type="button"
          class="h-7 min-w-7 rounded border px-2 font-mono transition-colors"
          :class="
            item === currentPage
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]'
              : 'border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)]'
          "
          @click="emit('update:currentPage', item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="h-7 rounded border border-[var(--color-border)] px-2 hover:bg-[var(--color-surface-overlay)] disabled:opacity-40"
        :disabled="currentPage >= totalPages"
        @click="emit('update:currentPage', currentPage + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>
