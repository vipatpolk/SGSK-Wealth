<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
    size?: 'xs' | 'sm' | 'md';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
  },
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50"
    :class="[
      size === 'xs' ? 'h-7 px-2 text-xs' : size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm',
      variant === 'primary'
        ? 'bg-[var(--color-component-primary-btn)] text-[var(--color-component-primary-btn-text)] hover:bg-[var(--color-component-primary-btn-hover)] border border-transparent'
        : variant === 'danger'
          ? 'bg-[var(--color-pl-negative-soft)] text-[var(--color-pl-negative)] border border-[var(--color-pl-negative-border)] hover:opacity-90'
          : variant === 'ghost'
            ? 'bg-transparent text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]'
            : variant === 'subtle'
              ? 'bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border-hover)]'
              : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-overlay)] hover:border-[var(--color-border-hover)]',
    ]"
  >
    <span
      v-if="loading"
      class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
