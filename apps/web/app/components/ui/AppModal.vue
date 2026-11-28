<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    modalId?: string;
    backdropId?: string;
    closeBtnId?: string;
    maxWidthClass?: string;
  }>(),
  {
    title: '',
    modalId: undefined,
    backdropId: undefined,
    closeBtnId: undefined,
    maxWidthClass: 'max-w-2xl',
  },
);

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

function onKeydown(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown);
  }
});
</script>

<template>
  <div
    v-if="open"
    :id="backdropId"
    class="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    @click.self="emit('close')"
  >
    <div
      :id="modalId"
      role="dialog"
      aria-modal="true"
      class="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-component-modal)] shadow-2xl sm:rounded-[var(--radius-lg)]"
      :class="maxWidthClass"
    >
      <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <slot name="header">
          <h2 class="text-base font-semibold text-[var(--color-text-primary)]">{{ title }}</h2>
        </slot>
        <div class="flex items-center gap-2">
          <slot name="header-actions" />
          <button
            :id="closeBtnId"
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]"
            :aria-label="t('common.closeModal')"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <slot />
      </div>
    </div>
  </div>
</template>
