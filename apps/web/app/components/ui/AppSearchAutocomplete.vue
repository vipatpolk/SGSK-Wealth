<script setup lang="ts">
export interface AutocompleteOption {
  symbol: string;
  displaySymbol: string;
  name: string;
  subtitle?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    items: AutocompleteOption[];
    placeholder?: string;
    inputId?: string;
    dropdownId?: string;
    clearBtnId?: string;
    backdropClass?: string;
    inputClass?: string;
    itemClass?: string;
    itemNameClass?: string;
    align?: 'left' | 'right';
  }>(),
  {
    placeholder: '',
    inputId: undefined,
    dropdownId: undefined,
    clearBtnId: undefined,
    backdropClass: 'search-backdrop',
    inputClass: '',
    itemClass: 'autocomplete-item',
    itemNameClass: 'item-name',
    align: 'left',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [item: AutocompleteOption];
}>();

const { t } = useI18n();
const isOpen = ref(false);
const activeIndex = ref(-1);

function onInput(event: Event) {
  const val = (event.target as HTMLInputElement).value;
  emit('update:modelValue', val);
  isOpen.value = true;
  activeIndex.value = -1;
}

function selectItem(item: AutocompleteOption) {
  emit('update:modelValue', item.displaySymbol || item.symbol);
  emit('select', item);
  isOpen.value = false;
  activeIndex.value = -1;
}

function clearSearch() {
  emit('update:modelValue', '');
  isOpen.value = false;
  activeIndex.value = -1;
}

function onKeydown(event: KeyboardEvent) {
  if (!isOpen.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    isOpen.value = true;
  }
  if (event.key === 'ArrowDown' && props.items.length > 0) {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % props.items.length;
  } else if (event.key === 'ArrowUp' && props.items.length > 0) {
    event.preventDefault();
    activeIndex.value = activeIndex.value <= 0 ? props.items.length - 1 : activeIndex.value - 1;
  } else if (event.key === 'Enter' && isOpen.value && activeIndex.value >= 0 && props.items[activeIndex.value]) {
    event.preventDefault();
    selectItem(props.items[activeIndex.value]!);
  } else if (event.key === 'Escape') {
    isOpen.value = false;
    activeIndex.value = -1;
  }
}
</script>

<template>
  <div class="relative w-full">
    <div class="relative flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-text-muted)]"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        :id="inputId"
        :value="modelValue"
        type="search"
        :placeholder="placeholder"
        :class="inputClass"
        class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] pl-9 pr-8 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        @focus="isOpen = true"
        @input="onInput"
        @keydown="onKeydown"
      />
      <button
        v-if="modelValue"
        :id="clearBtnId"
        type="button"
        class="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]"
        :aria-label="t('common.clearSearch')"
        @click="clearSearch"
      >
        ✕
      </button>
    </div>

    <div
      v-if="isOpen && modelValue.trim().length > 0"
      :class="backdropClass"
      class="fixed inset-0 z-[var(--z-backdrop)] bg-transparent"
      @mousedown="isOpen = false"
    />

    <div
      v-if="isOpen && modelValue.trim().length > 0"
      :id="dropdownId"
      class="symbol-dropdown-menu absolute top-[calc(100%+4px)] z-[var(--z-popover)] max-h-72 min-w-[260px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1.5 shadow-xl"
      :class="align === 'right' ? 'right-0' : 'left-0 right-0'"
    >
      <div v-if="items.length === 0" class="px-3 py-2 text-xs text-[var(--color-text-muted)]">
        {{ t('holdings.noSymbolsMatch') }}
      </div>
      <button
        v-for="(item, idx) in items"
        :key="item.symbol"
        type="button"
        :class="[
          itemClass,
          idx === activeIndex ? 'bg-[var(--color-surface-overlay)]' : '',
        ]"
        class="dropdown-option-item flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs hover:bg-[var(--color-surface-overlay)]"
        @click="selectItem(item)"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span class="font-mono font-semibold text-[var(--color-text-primary)]">{{ item.displaySymbol }}</span>
          {{ ' ' }}
          <span :class="itemNameClass" class="truncate text-[var(--color-text-secondary)]">{{ item.name }}</span>
        </div>
        <span v-if="item.subtitle" class="shrink-0 font-mono text-[11px] text-[var(--color-text-muted)]">
          {{ item.subtitle }}
        </span>
      </button>
    </div>
  </div>
</template>
