import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  FactsheetRequestTarget,
  FundFactsheetResponse,
} from '../../models/factsheet.model';
import { NavService } from '../../services/nav.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SymbolIconComponent } from '../symbol-icon/symbol-icon.component';
import { displaySymbol } from '../../utils/format.utils';

@Component({
  selector: 'app-fund-factsheet-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TranslatePipe, SymbolIconComponent],
  templateUrl: './fund-factsheet-modal.component.html',
  styleUrl: './fund-factsheet-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FundFactsheetModalComponent {
  private readonly navService = inject(NavService);
  readonly i18n = inject(I18nService);

  readonly target = input<FactsheetRequestTarget | null>(null);
  readonly closeModal = output<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);
  readonly factsheet = signal<FundFactsheetResponse | null>(null);

  private activeSub: Subscription | null = null;

  constructor() {
    effect((onCleanup) => {
      const currentTarget = this.target();
      if (!currentTarget) {
        this.activeSub?.unsubscribe();
        this.activeSub = null;
        this.loading.set(false);
        this.error.set(false);
        this.factsheet.set(null);
        return;
      }

      untracked(() => {
        this.fetchFactsheet(currentTarget, false);
      });

      onCleanup(() => {
        this.activeSub?.unsubscribe();
        this.activeSub = null;
      });
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.target()) {
      this.onClose();
    }
  }

  readonly headerSymbol = computed<string>(() => {
    const data = this.factsheet();
    const tgt = this.target();
    if (data?.displaySymbol) return data.displaySymbol;
    if (tgt?.symbol) return displaySymbol(tgt.symbol);
    return '';
  });

  readonly displayFundTitle = computed<string>(() => {
    const data = this.factsheet();
    const tgt = this.target();
    const isTh = this.i18n.lang() === 'th';
    if (isTh) {
      return (
        data?.fundNameTh ||
        tgt?.displayNameTh ||
        data?.fundName ||
        tgt?.displayName ||
        this.headerSymbol()
      );
    }
    return (
      data?.fundName ||
      tgt?.displayName ||
      data?.fundNameTh ||
      tgt?.displayNameTh ||
      this.headerSymbol()
    );
  });

  readonly displayAmcTitle = computed<string>(() => {
    const data = this.factsheet();
    if (!data) return '';
    if (this.i18n.lang() === 'th') {
      return data.amcNameTh || data.amcName || '';
    }
    return data.amcName || data.amcNameTh || '';
  });

  readonly safePdfUrl = computed<string | null>(() => this.sanitizeUrl(this.factsheet()?.pdfUrl));
  readonly safeAmcUrl = computed<string | null>(() => this.sanitizeUrl(this.factsheet()?.amcUrl));

  readonly formattedDividendPolicy = computed<string | null>(() => {
    const raw = (this.factsheet()?.dividendPolicy || '').trim();
    if (!raw) return null;
    if (raw.toUpperCase() === 'Y') return this.i18n.t('factsheet.dividendYes');
    if (raw.toUpperCase() === 'N') return this.i18n.t('factsheet.dividendNo');
    return raw;
  });

  readonly riskTierClass = computed<string>(() => {
    const code = (this.factsheet()?.riskLevel || '').toUpperCase().trim();
    if (!code) return 'unknown';
    const match = /\d+/.exec(code);
    const num = match ? Number(match[0]) : 0;
    if (code === 'RS81' || num >= 8) return 'very-high';
    if (num >= 6) return 'high';
    if (num >= 4) return 'moderate';
    if (num >= 1) return 'low';
    return 'unknown';
  });

  readonly hasStatistics = computed<boolean>(() => {
    const s = this.factsheet()?.statistics;
    if (!s) return false;
    return (
      s.maxDrawdown != null ||
      s.sharpeRatio != null ||
      s.trackingError != null ||
      !!s.fxHedging ||
      s.turnoverRatio != null ||
      s.beta != null ||
      s.alpha != null ||
      s.yieldToMaturity != null ||
      !!s.portfolioDuration ||
      !!s.recoveringPeriod
    );
  });

  readonly hasTradeConditions = computed<boolean>(() => {
    const t = this.factsheet()?.tradeConditions;
    if (!t) return false;
    return (
      t.minimumInitialSub != null ||
      t.minimumNextSub != null ||
      t.minimumRedempt != null ||
      !!t.subscriptionPeriod ||
      !!t.redemptionPeriod ||
      !!t.settlementPeriod
    );
  });

  retry(): void {
    const current = this.target();
    if (current) {
      this.fetchFactsheet(current, true);
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  private fetchFactsheet(target: FactsheetRequestTarget, forceRefresh: boolean): void {
    this.activeSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.factsheet.set(null);

    this.activeSub = this.navService
      .fetchFundFactsheet(target.symbol, target.assetType, target.fundName, forceRefresh)
      .subscribe({
        next: (res) => {
          this.factsheet.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  private sanitizeUrl(raw?: string | null): string | null {
    const trimmed = (raw || '').trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return null;
  }
}
