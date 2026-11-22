import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { FactsheetRequestTarget, FundFactsheetResponse } from '@shared/models/factsheet.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@shared/services/i18n.service';
import { NavService } from '@shared/services/nav.service';
import { displaySymbol } from '@shared/utils/format.utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mobile-factsheet-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    TranslatePipe,
    SymbolIconComponent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSpinner,
  ],
  templateUrl: './mobile-factsheet-modal.component.html',
  styleUrl: './mobile-factsheet-modal.component.css',
})
export class MobileFactsheetModalComponent {
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

  reload(): void {
    const current = this.target();
    if (current) {
      this.fetchFactsheet(current, true);
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
