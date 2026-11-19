import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ASSET_TABS } from '@shared/config/asset.constants';
import { LocalTransaction } from '@shared/models/local-portfolio.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { LocalPortfolioService } from '@shared/services/local-portfolio.service';

type LocalModalTab = 'add' | 'list' | 'import';
type TxAction = 'BUY' | 'SELL' | 'DIVIDEND';

@Component({
  selector: 'app-local-portfolio-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './local-portfolio-modal.component.html',
  styleUrl: './local-portfolio-modal.component.css',
})
export class LocalPortfolioModalComponent {
  readonly localPortfolio = inject(LocalPortfolioService);

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  readonly assetClasses = ASSET_TABS.filter((t) => t.id !== 'all');

  readonly activeTab = signal<LocalModalTab>('add');
  readonly editingId = signal<string | null>(null);

  readonly symbolInput = signal<string>('');
  readonly assetTypeInput = signal<string>('us-stock');
  readonly actionInput = signal<TxAction>('BUY');
  readonly dateInput = signal<string>(new Date().toISOString().slice(0, 10));
  readonly quantityInput = signal<number | null>(null);
  readonly priceInput = signal<number | null>(null);
  readonly currencyInput = signal<'USD' | 'THB'>('USD');
  readonly feeInput = signal<number | null>(null);
  readonly noteInput = signal<string>('');

  readonly csvText = signal<string>('');
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly confirmClear = signal<boolean>(false);

  readonly sortedTransactions = computed(() =>
    [...this.localPortfolio.transactions()].sort((a, b) => b.date.localeCompare(a.date))
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  onAssetTypeChange(assetType: string): void {
    this.assetTypeInput.set(assetType);
    if (!this.editingId()) {
      if (assetType === 'thai-stock' || assetType === 'mutual-fund' || assetType === 'provident-fund') {
        this.currencyInput.set('THB');
      } else if (assetType === 'us-stock' || assetType === 'bond') {
        this.currencyInput.set('USD');
      }
    }
  }

  onSaveTransaction(): void {
    this.statusMessage.set(null);
    this.errorMessage.set(null);

    const symbol = this.symbolInput().trim().toUpperCase();
    const qty = Number(this.quantityInput());
    const price = Number(this.priceInput());
    const date = this.dateInput().trim();

    if (!symbol) {
      this.errorMessage.set('Symbol is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.errorMessage.set('Date must use YYYY-MM-DD format.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      this.errorMessage.set('Quantity must be greater than zero.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage.set('Price must be zero or greater.');
      return;
    }

    const action = this.actionInput();
    const signedQty = action === 'SELL' ? -Math.abs(qty) : Math.abs(qty);
    const feeVal = this.feeInput();
    const fee = feeVal !== null && Number.isFinite(Number(feeVal)) && Number(feeVal) > 0 ? Number(feeVal) : undefined;
    const note = this.noteInput().trim() || undefined;

    const editId = this.editingId();
    if (editId) {
      this.localPortfolio.updateTransaction(editId, {
        symbol,
        assetType: this.assetTypeInput(),
        txType: action,
        date,
        quantity: signedQty,
        price,
        currency: this.currencyInput(),
        fee,
        note,
      });
      this.statusMessage.set(`Updated ${symbol} (${action}).`);
      this.resetForm();
    } else {
      this.localPortfolio.addTransaction({
        symbol,
        assetType: this.assetTypeInput(),
        txType: action,
        date,
        quantity: signedQty,
        price,
        currency: this.currencyInput(),
        fee,
        note,
      });
      this.statusMessage.set(`Saved ${symbol} (${action}).`);
      this.resetForm();
    }

    this.dataChanged.emit();
  }

  startEdit(tx: LocalTransaction): void {
    this.editingId.set(tx.id);
    this.symbolInput.set(tx.symbol);
    this.assetTypeInput.set(tx.assetType);
    const inferredAction: TxAction =
      tx.txType === 'DIVIDEND' ? 'DIVIDEND' : tx.quantity < 0 || tx.txType === 'SELL' ? 'SELL' : 'BUY';
    this.actionInput.set(inferredAction);
    this.dateInput.set(tx.date);
    this.quantityInput.set(Math.abs(tx.quantity));
    this.priceInput.set(tx.price);
    this.currencyInput.set(tx.currency === 'THB' ? 'THB' : 'USD');
    this.feeInput.set(tx.fee ?? null);
    this.noteInput.set(tx.note ?? '');
    this.activeTab.set('add');
    this.statusMessage.set(null);
    this.errorMessage.set(null);
  }

  onDelete(id: string): void {
    this.localPortfolio.deleteTransaction(id);
    if (this.editingId() === id) {
      this.resetForm();
    }
    this.statusMessage.set('Transaction removed.');
    this.dataChanged.emit();
  }

  resetForm(): void {
    this.editingId.set(null);
    this.symbolInput.set('');
    this.actionInput.set('BUY');
    this.quantityInput.set(null);
    this.priceInput.set(null);
    this.feeInput.set(null);
    this.noteInput.set('');
  }

  onImportCsv(): void {
    this.statusMessage.set(null);
    this.errorMessage.set(null);
    const text = this.csvText().trim();
    if (!text) {
      this.errorMessage.set('Paste CSV rows before importing.');
      return;
    }
    const res = this.localPortfolio.importCsv(text, this.assetTypeInput());
    if (res.error) {
      this.errorMessage.set(res.error);
      return;
    }
    this.statusMessage.set(`Imported ${res.importedCount} local transaction(s).`);
    this.csvText.set('');
    this.dataChanged.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      this.csvText.set(content);
      this.onImportCsv();
    };
    reader.readAsText(file);
    input.value = '';
  }

  onExportCsv(): void {
    const csv = this.localPortfolio.exportCsv();
    this.downloadFile(csv, 'sgsk-local-portfolio.csv', 'text/csv;charset=utf-8;');
  }

  onExportJson(): void {
    const json = this.localPortfolio.exportJson();
    this.downloadFile(json, 'sgsk-local-portfolio.json', 'application/json;charset=utf-8;');
  }

  onLoadSample(): void {
    this.statusMessage.set(null);
    this.errorMessage.set(null);
    this.localPortfolio.loadSamplePortfolio();
    this.statusMessage.set('Sample portfolio loaded on this device.');
    this.confirmClear.set(false);
    this.dataChanged.emit();
  }

  onClearAll(): void {
    if (!this.confirmClear()) {
      this.confirmClear.set(true);
      return;
    }
    this.localPortfolio.clearAll();
    this.confirmClear.set(false);
    this.resetForm();
    this.statusMessage.set('All local portfolio transactions cleared.');
    this.dataChanged.emit();
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
