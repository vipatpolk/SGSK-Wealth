<script setup lang="ts">
import type { LocalTransaction } from '@sgsk-wealth/contracts';
import { generateTransactionsCsv } from '@sgsk-wealth/domain';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const {
  transactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
  importCsv,
  resetToSample,
  clearAll,
  exportJson,
} = useLocalPortfolio();
const { t } = useI18n();

const activeTab = ref<'add' | 'list' | 'import'>('add');
const editingId = ref<string | null>(null);
const csvInput = ref('');
const statusMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const confirmClear = ref(false);

const assetClasses = [
  { id: 'us-stock', label: 'U.S. Stock' },
  { id: 'thai-stock', label: 'Thai Stock' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'mutual-fund', label: 'Mutual Fund' },
  { id: 'bond', label: 'Bond' },
];

const form = reactive({
  symbol: '',
  assetType: 'us-stock',
  txType: 'BUY' as 'BUY' | 'SELL' | 'DIVIDEND',
  date: new Date().toISOString().slice(0, 10),
  quantity: 10,
  price: 100,
  currency: 'USD' as 'USD' | 'THB',
  fee: 0,
  note: '',
});

const sortedTransactions = computed(() =>
  [...transactions.value].sort((a, b) => b.date.localeCompare(a.date)),
);

function resetForm() {
  editingId.value = null;
  form.symbol = '';
  form.assetType = 'us-stock';
  form.txType = 'BUY';
  form.date = new Date().toISOString().slice(0, 10);
  form.quantity = 10;
  form.price = 100;
  form.currency = 'USD';
  form.fee = 0;
  form.note = '';
}

function startEdit(tx: LocalTransaction) {
  editingId.value = tx.id;
  form.symbol = tx.symbol;
  form.assetType = tx.assetType;
  form.txType = (tx.txType || (tx.quantity < 0 ? 'SELL' : 'BUY')) as 'BUY' | 'SELL' | 'DIVIDEND';
  form.date = tx.date;
  form.quantity = Math.abs(tx.quantity);
  form.price = tx.price;
  form.currency = (tx.currency === 'THB' ? 'THB' : 'USD') as 'USD' | 'THB';
  form.fee = tx.fee ?? 0;
  form.note = tx.note ?? '';
  activeTab.value = 'add';
  errorMessage.value = null;
  statusMessage.value = null;
}

function onAssetTypeChange(nextType: string) {
  form.assetType = nextType;
  form.currency = nextType === 'thai-stock' || nextType === 'mutual-fund' || nextType === 'bond' ? 'THB' : 'USD';
}

function submit() {
  errorMessage.value = null;
  statusMessage.value = null;
  if (!form.symbol.trim() || form.quantity <= 0 || form.price < 0) {
    errorMessage.value = 'Please enter a valid symbol, quantity, and price.';
    return;
  }
  const qty = form.txType === 'SELL' ? -Math.abs(form.quantity) : Math.abs(form.quantity);
  const payload = {
    symbol: form.symbol.trim().toUpperCase(),
    date: form.date,
    quantity: qty,
    price: form.price,
    currency: form.currency,
    assetType: form.assetType,
    txType: form.txType,
    fee: form.fee > 0 ? form.fee : undefined,
    note: form.note.trim() || undefined,
  };

  if (editingId.value) {
    updateTransaction(editingId.value, payload);
    statusMessage.value = `Updated ${payload.txType} ${payload.symbol}.`;
    resetForm();
  } else {
    addTransaction(payload);
    statusMessage.value = `Saved ${payload.txType} ${payload.symbol}.`;
    form.symbol = '';
    form.fee = 0;
    form.note = '';
  }
}

function handleImportCsv() {
  errorMessage.value = null;
  statusMessage.value = null;
  const res = importCsv(csvInput.value);
  if (!res.ok) {
    errorMessage.value = res.error ?? 'Failed to import CSV.';
    return;
  }
  statusMessage.value = `Imported ${res.count} transaction(s).`;
  csvInput.value = '';
}

function handleFileUpload(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    csvInput.value = String(reader.result || '');
    handleImportCsv();
  };
  reader.readAsText(file);
  input.value = '';
}

function exportLocalCsv() {
  if (typeof window === 'undefined') return;
  const csv = generateTransactionsCsv(
    transactions.value.map((tx) => ({
      symbol: tx.symbol,
      date: tx.date,
      quantity: Math.abs(tx.quantity),
      rawQuantity: tx.quantity,
      price: tx.price,
      currency: tx.currency,
      assetType: tx.assetType,
      type: (tx.txType || (tx.quantity < 0 ? 'SELL' : 'BUY')) as 'BUY' | 'SELL' | 'EXCHANGE_IN' | 'EXCHANGE_OUT',
    })),
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sgsk-wealth-local-portfolio.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportLocalJson() {
  if (typeof window === 'undefined') return;
  const blob = new Blob([exportJson()], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sgsk-wealth-local-portfolio.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleClearAll() {
  if (!confirmClear.value) {
    confirmClear.value = true;
    return;
  }
  clearAll();
  confirmClear.value = false;
  statusMessage.value = 'Cleared all local transactions.';
}
</script>

<template>
  <UiAppModal
    :open="props.open"
    modal-id="local-portfolio-modal"
    close-btn-id="local-close-btn"
    :title="t('localPortfolio.modalTitle')"
    max-width-class="max-w-2xl"
    @close="emit('close')"
  >
    <div class="mb-4 grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="tablist">
      <button
        id="local-tab-add"
        type="button"
        role="tab"
        class="rounded-[var(--radius-sm)] py-1.5 text-xs font-semibold transition-colors"
        :class="activeTab === 'add' ? 'active bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'"
        :aria-selected="activeTab === 'add'"
        @click="activeTab = 'add'"
      >
        {{ t('localPortfolio.tabAdd') }}
      </button>
      <button
        id="local-tab-list"
        type="button"
        role="tab"
        class="rounded-[var(--radius-sm)] py-1.5 text-xs font-semibold transition-colors"
        :class="activeTab === 'list' ? 'active bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'"
        :aria-selected="activeTab === 'list'"
        @click="activeTab = 'list'"
      >
        {{ t('localPortfolio.tabList', { count: transactions.length }) }}
      </button>
      <button
        id="local-tab-import"
        type="button"
        role="tab"
        class="rounded-[var(--radius-sm)] py-1.5 text-xs font-semibold transition-colors"
        :class="activeTab === 'import' ? 'active bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'"
        :aria-selected="activeTab === 'import'"
        @click="activeTab = 'import'"
      >
        {{ t('localPortfolio.tabImportExport') }}
      </button>
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-pl-negative-border)] bg-[var(--color-pl-negative-soft)] px-3 py-2 text-xs text-[var(--color-pl-negative)]" role="alert">
      {{ errorMessage }}
    </div>
    <div v-if="statusMessage" class="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-pl-positive-border)] bg-[var(--color-pl-positive-soft)] px-3 py-2 text-xs text-[var(--color-pl-positive)]" role="status">
      {{ statusMessage }}
    </div>

    <form v-if="activeTab === 'add'" class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block space-y-1 text-xs" for="local-tx-symbol">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.symbol') }}</span>
          <input id="local-tx-symbol" v-model="form.symbol" name="symbol" type="text" placeholder="AAPL, PTT.BK, BTC.CRYPTO" required class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]" />
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-asset-type">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.assetType') }}</span>
          <select id="local-tx-asset-type" :value="form.assetType" name="assetType" class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]" @change="onAssetTypeChange(($event.target as HTMLSelectElement).value)">
            <option v-for="asset in assetClasses" :key="asset.id" :value="asset.id">{{ asset.label }}</option>
          </select>
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-action">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.action') }}</span>
          <select id="local-tx-action" v-model="form.txType" name="action" class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]">
            <option value="BUY">{{ t('common.buy') }}</option>
            <option value="SELL">{{ t('common.sell') }}</option>
            <option value="DIVIDEND">{{ t('common.dividend') }}</option>
          </select>
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-date">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.date') }}</span>
          <input id="local-tx-date" v-model="form.date" name="date" type="date" required class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 font-mono text-sm text-[var(--color-text-primary)]" />
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-qty">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.quantity') }}</span>
          <input id="local-tx-qty" v-model.number="form.quantity" name="quantity" type="number" step="any" min="0.0000001" required class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 font-mono text-sm text-[var(--color-text-primary)]" />
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-price">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.price') }}</span>
          <input id="local-tx-price" v-model.number="form.price" name="price" type="number" step="any" min="0" required class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 font-mono text-sm text-[var(--color-text-primary)]" />
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-currency">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.currency') }}</span>
          <select id="local-tx-currency" v-model="form.currency" name="currency" class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]">
            <option value="USD">USD</option>
            <option value="THB">THB</option>
          </select>
        </label>

        <label class="block space-y-1 text-xs" for="local-tx-fee">
          <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.fee') }}</span>
          <input id="local-tx-fee" v-model.number="form.fee" name="fee" type="number" step="any" min="0" class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 font-mono text-sm text-[var(--color-text-primary)]" />
        </label>
      </div>

      <label class="block space-y-1 text-xs" for="local-tx-note">
        <span class="font-medium text-[var(--color-text-secondary)]">{{ t('localPortfolio.note') }}</span>
        <input id="local-tx-note" v-model="form.note" name="note" type="text" class="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] px-3 text-sm text-[var(--color-text-primary)]" />
      </label>

      <div class="flex justify-end gap-2">
        <UiAppButton v-if="editingId" id="local-cancel-edit-btn" @click="resetForm">
          {{ t('localPortfolio.cancelEdit') }}
        </UiAppButton>
        <UiAppButton id="local-save-tx-btn" type="submit" variant="primary">
          {{ editingId ? t('localPortfolio.updateTx') : t('localPortfolio.saveTx') }}
        </UiAppButton>
      </div>
    </form>

    <div v-else-if="activeTab === 'list'" class="space-y-2">
      <div v-if="sortedTransactions.length === 0" class="py-10 text-center text-sm text-[var(--color-text-muted)]">
        {{ t('localPortfolio.emptyList') }}
      </div>
      <div
        v-for="tx in sortedTransactions"
        :key="tx.id"
        :data-tx-id="tx.id"
        class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-semibold text-[var(--color-text-primary)]">{{ tx.symbol }}</span>
            <UiAppBadge :tone="tx.quantity < 0 || tx.txType === 'SELL' ? 'negative' : tx.txType === 'DIVIDEND' ? 'info' : 'positive'">
              {{ tx.txType || (tx.quantity < 0 ? 'SELL' : 'BUY') }}
            </UiAppBadge>
            <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ tx.date }}</span>
          </div>
          <div class="flex flex-wrap gap-3 font-mono text-xs text-[var(--color-text-secondary)]">
            <span>{{ t('localPortfolio.qtyShort') }} {{ tx.quantity }}</span>
            <span>{{ t('localPortfolio.priceShort') }} {{ tx.price }} {{ tx.currency }}</span>
            <span>{{ tx.assetType }}</span>
            <span v-if="tx.fee">{{ t('localPortfolio.feeShort') }} {{ tx.fee }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <UiAppButton size="xs" @click="startEdit(tx)">{{ t('localPortfolio.edit') }}</UiAppButton>
          <UiAppButton variant="danger" size="xs" @click="removeTransaction(tx.id)">{{ t('localPortfolio.delete') }}</UiAppButton>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="space-y-1.5">
        <label for="local-csv-textarea" class="block text-xs font-semibold text-[var(--color-text-primary)]">
          {{ t('localPortfolio.importTitle') }}
        </label>
        <p class="text-xs text-[var(--color-text-muted)]">{{ t('localPortfolio.importHint') }}</p>
        <textarea
          id="local-csv-textarea"
          v-model="csvInput"
          name="csvInput"
          rows="4"
          :placeholder="t('localPortfolio.importPlaceholder')"
          class="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-component-input)] p-3 font-mono text-xs text-[var(--color-text-primary)]"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UiAppButton id="local-import-csv-btn" variant="primary" size="sm" @click="handleImportCsv">
          {{ t('localPortfolio.importBtn') }}
        </UiAppButton>
        <label class="inline-flex h-8 cursor-pointer items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]">
          <span>{{ t('localPortfolio.uploadCsvFile') }}</span>
          <input type="file" accept=".csv,text/csv" class="hidden" @change="handleFileUpload" />
        </label>
      </div>

      <div class="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        <UiAppButton id="local-sample-btn" size="sm" @click="resetToSample(); statusMessage = 'Loaded sample portfolio.'">
          {{ t('localPortfolio.loadSampleBtn') }}
        </UiAppButton>
        <UiAppButton id="local-export-csv-btn" size="sm" @click="exportLocalCsv">
          {{ t('localPortfolio.exportCsv') }}
        </UiAppButton>
        <UiAppButton id="local-export-json-btn" size="sm" @click="exportLocalJson">
          {{ t('localPortfolio.exportJson') }}
        </UiAppButton>
        <UiAppButton id="local-clear-btn" variant="danger" size="sm" @click="handleClearAll">
          {{ confirmClear ? t('localPortfolio.confirmClear') : t('localPortfolio.clearAll') }}
        </UiAppButton>
      </div>
    </div>
  </UiAppModal>
</template>
