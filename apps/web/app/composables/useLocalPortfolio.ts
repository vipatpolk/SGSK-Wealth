import type { LocalTransaction } from '@sgsk-wealth/contracts';
import { parseLocalTransactionsCsv, SAMPLE_LOCAL_TRANSACTIONS } from '@sgsk-wealth/domain';

const STORAGE_KEY = 'sgsk_nuxt_local_portfolio_v1';

function buildInitialTransactions(): LocalTransaction[] {
  const now = new Date().toISOString();
  return SAMPLE_LOCAL_TRANSACTIONS.map((tx, idx) => ({
    ...tx,
    id: `sample-${idx + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
}

export function useLocalPortfolio() {
  const transactions = useState<LocalTransaction[]>('local-portfolio-txs', () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // Fallback to sample transactions
      }
    }
    return [];
  });

  if (import.meta.client) {
    void useNativePlatform()
      .getPreference(STORAGE_KEY)
      .then((nativeRaw) => {
        if (nativeRaw && typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
          try {
            const parsed = JSON.parse(nativeRaw);
            if (Array.isArray(parsed)) {
              transactions.value = parsed;
            }
          } catch {
            // Ignore malformed preference payload
          }
        }
      });
  }

  function persist() {
    const serialized = JSON.stringify(transactions.value);
    void useNativePlatform().setPreference(STORAGE_KEY, serialized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  }

  function addTransaction(input: Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    transactions.value = [
      ...transactions.value,
      {
        ...input,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      },
    ];
    persist();
  }

  function updateTransaction(
    id: string,
    patch: Partial<Omit<LocalTransaction, 'id' | 'createdAt'>>,
  ) {
    const now = new Date().toISOString();
    transactions.value = transactions.value.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: now } : t,
    );
    persist();
  }

  function removeTransaction(id: string) {
    transactions.value = transactions.value.filter((t) => t.id !== id);
    persist();
  }

  function importCsv(csvText: string): { ok: boolean; count: number; error?: string } {
    const parsed = parseLocalTransactionsCsv(csvText);
    if (!parsed || parsed.length === 0) {
      return {
        ok: false,
        count: 0,
        error: 'No valid transaction rows found. Expected Symbol, Date, Quantity, Price, Currency.',
      };
    }
    const now = new Date().toISOString();
    const additions: LocalTransaction[] = parsed.map((tx, idx) => ({
      ...tx,
      id: `local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }));
    transactions.value = [...transactions.value, ...additions];
    persist();
    return { ok: true, count: additions.length };
  }

  function resetToSample() {
    transactions.value = buildInitialTransactions();
    persist();
  }

  function clearAll() {
    transactions.value = [];
    persist();
  }

  function exportJson(): string {
    return JSON.stringify(transactions.value, null, 2);
  }

  return {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    importCsv,
    resetToSample,
    clearAll,
    exportJson,
  };
}
