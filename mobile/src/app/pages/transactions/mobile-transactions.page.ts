import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
} from '@ionic/angular';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SymbolTransaction } from '@shared/models/transaction.model';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    LocalizedDatePipe,
    IonContent,
    IonButton,
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
  ],
  template: `
    <ion-content>
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px 0;">
        <ion-button fill="clear" size="small" (click)="backToHoldings()">
          â† {{ 'nav.holdings' | t }}
        </ion-button>
        @if (state.selectedHistorySymbol()) {
          <ion-badge color="primary">{{ state.selectedHistorySymbol() }}</ion-badge>
        }
      </div>

      <div style="padding:0 10px;">
        <ion-searchbar
          id="mobile-tx-search"
          [value]="query() || state.selectedHistorySymbol()"
          (ionInput)="onSearch($event)"
          [placeholder]="'common.searchPlaceholder' | t"
        ></ion-searchbar>
      </div>

      <ion-card class="mobile-card" id="mobile-tx-list">
        <ion-list lines="full">
          @for (tx of transactions(); track tx.id) {
            <ion-item>
              <ion-label>
                <h3>
                  <ion-badge [color]="tx.type === 'BUY' ? 'primary' : 'warning'" style="margin-right:6px;">
                    {{ tx.type }}
                  </ion-badge>
                  {{ tx.symbol }}
                </h3>
                <p class="font-mono">
                  {{ tx.date | ldate: 'medium' }} Â· {{ tx.quantity | number: '1.0-4' }} @
                  {{ tx.price | number: '1.2-2' }}
                </p>
              </ion-label>
              <div slot="end" style="text-align:right;">
                <div class="font-mono privacy-mask">
                  {{ tx.totalAmount | currency: tx.currency : 'symbol-narrow' : '1.2-2' }}
                </div>
                @if (tx.realizedPL != null && tx.realizedPL !== 0) {
                  <div
                    class="font-mono"
                    style="font-size:12px;"
                    [class.pl-positive]="tx.realizedPL >= 0"
                    [class.pl-negative]="tx.realizedPL < 0"
                  >
                    {{ tx.realizedPL >= 0 ? '+' : ''
                    }}{{ tx.realizedPL | currency: tx.currency : 'symbol-narrow' : '1.2-2' }}
                  </div>
                }
              </div>
            </ion-item>
          } @empty {
            <ion-card-content>{{ 'tx.emptyFeed' | t }}</ion-card-content>
          }
        </ion-list>
      </ion-card>
    </ion-content>
  `,
})
export class MobileTransactionsPage {
  readonly state = inject(MobileStateService);
  private readonly router = inject(Router);
  readonly query = signal<string>('');

  readonly transactions = computed<SymbolTransaction[]>(() => {
    const summaries = this.state.portfolioData()?.transactionSummaries ?? [];
    const all: SymbolTransaction[] = [];
    for (const s of summaries) {
      if (s.assetType === 'provident-fund') continue;
      for (const tx of s.transactions) {
        all.push(tx);
      }
    }
    const q = (this.query() || this.state.selectedHistorySymbol()).trim().toUpperCase();
    const filtered = q ? all.filter((t) => t.symbol.toUpperCase().includes(q)) : all;
    return filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
  });

  onSearch(event: CustomEvent): void {
    const val = event.detail.value ?? '';
    this.state.selectedHistorySymbol.set('');
    this.query.set(val);
  }

  backToHoldings(): void {
    this.state.selectedHistorySymbol.set('');
    void this.router.navigateByUrl('/holdings');
  }
}
