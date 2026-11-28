<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();

const activeTool = ref<'avg-cost' | 'tvm' | 'rebalance'>('avg-cost');
const isMobileToolMenuOpen = ref(false);

const toolTabs = computed(() => [
  {
    id: 'avg-cost' as const,
    tabId: 'tool-tab-avg-cost',
    dropdownId: 'tool-dropdown-avg-cost',
    shortLabel: t('tools.avgCost.short'),
    fullTitle: t('tools.avgCost.title'),
    desc: t('tools.avgCost.desc'),
  },
  {
    id: 'tvm' as const,
    tabId: 'tool-tab-tvm-calculator',
    dropdownId: 'tool-dropdown-tvm-calculator',
    shortLabel: t('tools.tvm.short'),
    fullTitle: t('tools.tvm.title'),
    desc: t('tools.tvm.desc'),
  },
  {
    id: 'rebalance' as const,
    tabId: 'tool-tab-rebalance-planner',
    dropdownId: 'tool-dropdown-rebalance-planner',
    shortLabel: t('tools.rebalance.short'),
    fullTitle: t('tools.rebalance.title'),
    desc: t('tools.rebalance.desc'),
  },
]);

const activeToolMeta = computed(
  () => toolTabs.value.find((tab) => tab.id === activeTool.value) ?? toolTabs.value[0]!,
);

watch(
  () => route.query.tool,
  (tool) => {
    if (tool === 'avg-cost' || tool === 'tvm' || tool === 'rebalance') {
      activeTool.value = tool;
    }
  },
  { immediate: true },
);

function selectTool(tool: 'avg-cost' | 'tvm' | 'rebalance') {
  activeTool.value = tool;
  isMobileToolMenuOpen.value = false;
}
</script>

<template>
  <div id="tools-page" class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="tools-hero-title text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          {{ t('tools.heroTitle') }}
        </h2>
        <p class="text-xs text-[var(--color-text-muted)]">{{ t('tools.heroSubtitle') }}</p>
      </div>

      <!-- Desktop Tool Tabs -->
      <div
        class="hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5 lg:inline-flex"
        role="tablist"
      >
        <button
          v-for="tab in toolTabs"
          :id="tab.tabId"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTool === tab.id"
          :title="tab.fullTitle"
          class="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          :class="
            activeTool === tab.id
              ? 'active bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          "
          @click="selectTool(tab.id)"
        >
          {{ tab.shortLabel }}
        </button>
      </div>

      <!-- Mobile Tool Dropdown -->
      <div class="relative w-full space-y-1 lg:hidden">
        <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {{ t('tools.activeToolLabel') }}
        </span>
        <button
          id="tools-mobile-dropdown-trigger"
          type="button"
          class="flex h-10 w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-xs font-semibold text-[var(--color-text-primary)]"
          @click="isMobileToolMenuOpen = !isMobileToolMenuOpen"
        >
          <span>{{ activeToolMeta.fullTitle }}</span>
          <span class="text-[var(--color-text-muted)]">▾</span>
        </button>
        <div
          v-if="isMobileToolMenuOpen"
          class="absolute left-0 right-0 top-[calc(100%+4px)] z-[var(--z-popover)] space-y-0.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1.5 shadow-2xl"
        >
          <button
            v-for="tab in toolTabs"
            :id="tab.dropdownId"
            :key="tab.id"
            type="button"
            class="flex w-full flex-col rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-overlay)]"
            :class="activeTool === tab.id ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : ''"
            @click="selectTool(tab.id)"
          >
            <span class="text-xs font-semibold">{{ tab.fullTitle }}</span>
            <span class="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{{ tab.desc }}</span>
          </button>
        </div>
      </div>
    </div>

    <ToolsAvgCostCalculator v-if="activeTool === 'avg-cost'" />
    <ToolsTvmCalculator v-else-if="activeTool === 'tvm'" />
    <ToolsRebalancePlanner v-else />
  </div>
</template>
