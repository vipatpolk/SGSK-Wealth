import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { FactsheetRequestTarget, FundFactsheetResponse } from '@shared/models/factsheet.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@shared/services/i18n.service';
import { NavService } from '@shared/services/nav.service';

@Component({
  selector: 'app-mobile-factsheet-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
  ],
  template: `
    <ion-modal [isOpen]="target() !== null" (didDismiss)="closeModal.emit()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ target()?.symbol }} Â· {{ 'factsheet.title' | t }}</ion-title>
            <ion-buttons slot="end">
              <ion-button id="mobile-factsheet-close" (click)="closeModal.emit()">
                {{ 'common.close' | t }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          @if (loading()) {
            <div class="ion-text-center ion-padding">
              <ion-spinner name="crescent"></ion-spinner>
              <p>{{ 'factsheet.loading' | t }}</p>
            </div>
          } @else if (error()) {
            <ion-card class="mobile-card">
              <ion-card-content>
                <p class="pl-negative">{{ error() }}</p>
                <ion-button expand="block" fill="outline" (click)="reload()">
                  {{ 'common.retry' | t }}
                </ion-button>
              </ion-card-content>
            </ion-card>
          } @else if (factsheet(); as fs) {
            <ion-card class="mobile-card">
              <ion-card-header>
                <ion-card-title>
                  {{ i18n.lang() === 'th' ? (fs.fundNameTh || fs.fundName || fs.displaySymbol) : (fs.fundName || fs.displaySymbol) }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @if (fs.amcName || fs.amcNameTh) {
                  <p>{{ i18n.lang() === 'th' ? (fs.amcNameTh || fs.amcName) : (fs.amcName || fs.amcNameTh) }}</p>
                }
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                  @if (fs.riskLevel) {
                    <ion-badge color="warning">Risk {{ fs.riskLevel }}</ion-badge>
                  }
                  @if (fs.aimcType) {
                    <ion-badge color="primary">{{ fs.aimcType }}</ion-badge>
                  }
                  @if (fs.taxIncentiveType) {
                    <ion-badge color="success">{{ fs.taxIncentiveType }}</ion-badge>
                  }
                </div>
                @if (fs.policyDesc || fs.investmentPolicyDesc) {
                  <p style="margin-top:10px; font-size:13px; color:var(--sgsk-text-secondary);">
                    {{ fs.policyDesc || fs.investmentPolicyDesc }}
                  </p>
                }
                @if (fs.pdfUrl) {
                  <ion-button
                    expand="block"
                    fill="outline"
                    size="small"
                    [href]="fs.pdfUrl"
                    target="_blank"
                    style="margin-top:12px;"
                  >
                    {{ 'factsheet.officialPdf' | t }}
                  </ion-button>
                }
              </ion-card-content>
            </ion-card>

            @if (fs.assetAllocation.length > 0) {
              <ion-card class="mobile-card">
                <ion-card-header>
                  <ion-card-title>{{ 'factsheet.assetAllocation' | t }}</ion-card-title>
                </ion-card-header>
                <ion-list lines="full">
                  @for (item of fs.assetAllocation; track item.seq) {
                    <ion-item>
                      <ion-label>{{ item.name }}</ion-label>
                      <span slot="end" class="font-mono">{{ item.ratio | number: '1.2-2' }}%</span>
                    </ion-item>
                  }
                </ion-list>
              </ion-card>
            }

            @if (fs.topHoldings.length > 0) {
              <ion-card class="mobile-card">
                <ion-card-header>
                  <ion-card-title>{{ 'factsheet.topHoldings' | t }}</ion-card-title>
                </ion-card-header>
                <ion-list lines="full">
                  @for (holding of fs.topHoldings; track holding.seq) {
                    <ion-item>
                      <ion-label>
                        <h3>{{ holding.name }}</h3>
                        @if (holding.isin) {
                          <p class="font-mono">{{ holding.isin }}</p>
                        }
                      </ion-label>
                      <span slot="end" class="font-mono">{{ holding.ratio | number: '1.2-2' }}%</span>
                    </ion-item>
                  }
                </ion-list>
              </ion-card>
            }

            @if (fs.tradeConditions; as tc) {
              <ion-card class="mobile-card">
                <ion-card-header>
                  <ion-card-title>{{ 'factsheet.tradeConditions' | t }}</ion-card-title>
                </ion-card-header>
                <ion-list lines="full">
                  @if (tc.minimumInitialSub != null) {
                    <ion-item>
                      <ion-label>{{ 'factsheet.minInitial' | t }}</ion-label>
                      <span slot="end" class="font-mono">
                        {{ tc.minimumInitialSub | currency: (tc.currency || 'THB') : 'symbol-narrow' : '1.0-0' }}
                      </span>
                    </ion-item>
                  }
                  @if (tc.settlementPeriod) {
                    <ion-item>
                      <ion-label>{{ 'factsheet.settlement' | t }}</ion-label>
                      <span slot="end">{{ tc.settlementPeriod }}</span>
                    </ion-item>
                  }
                </ion-list>
              </ion-card>
            }
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
})
export class MobileFactsheetModalComponent {
  private readonly navService = inject(NavService);
  readonly i18n = inject(I18nService);

  readonly target = input<FactsheetRequestTarget | null>(null);
  readonly closeModal = output<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly factsheet = signal<FundFactsheetResponse | null>(null);

  constructor() {
    effect(() => {
      const t = this.target();
      if (t) {
        this.loadFactsheet(t);
      } else {
        this.factsheet.set(null);
        this.error.set(null);
      }
    });
  }

  reload(): void {
    const t = this.target();
    if (t) {
      this.loadFactsheet(t, true);
    }
  }

  private loadFactsheet(target: FactsheetRequestTarget, forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);
    this.navService
      .fetchFundFactsheet(target.symbol, target.assetType, target.fundName, forceRefresh)
      .subscribe({
        next: (res) => {
          this.factsheet.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Unable to load fund factsheet.');
          this.loading.set(false);
        },
      });
  }
}
