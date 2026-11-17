import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/angular';
import { LocalizedDatePipe } from '@shared/pipes/localized-date.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-dividends',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    LocalizedDatePipe,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (state.dividendLoading() && !state.localizedDividendData()) {
        <div class="ion-text-center ion-padding" style="margin-top:40px;">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (state.localizedDividendData(); as div) {
        <ion-card class="mobile-card hero-gradient-card" id="mobile-dividends-hero">
          <ion-card-header>
            <ion-card-title>{{ 'dividend.title' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="font-size:26px; font-weight:800;" class="font-mono pl-positive privacy-mask">
              {{ div.totalNetDividends | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
            </div>
            <div class="metric-grid">
              <div class="metric-box">
                <span class="metric-label">{{ 'dividend.grossTotal' | t }}</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ div.totalGrossDividends | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'dividend.taxWithheld' | t }}</span>
                <span class="metric-value font-mono privacy-mask pl-negative">
                  {{ div.totalWithholdingTax | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'dividend.yieldOnCost' | t }}</span>
                <span class="metric-value font-mono">
                  {{ div.portfolioYieldOnCost | number: '1.2-2' }}%
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'dividend.projectedAnnual' | t }}</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ div.projectedAnnualDividends | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="chip-scroll">
          <ion-chip
            [color]="selectedYear() === 'all' ? 'primary' : 'medium'"
            [outline]="selectedYear() !== 'all'"
            (click)="selectedYear.set('all')"
          >
            {{ 'common.all' | t }}
          </ion-chip>
          @for (yr of availableYears(); track yr) {
            <ion-chip
              [color]="selectedYear() === yr ? 'primary' : 'medium'"
              [outline]="selectedYear() !== yr"
              (click)="selectedYear.set(yr)"
            >
              {{ yr }}
            </ion-chip>
          }
        </div>

        <div class="section-header">
          <span>{{ 'dividend.bySymbol' | t }}</span>
        </div>
        <ion-card class="mobile-card" id="mobile-dividend-symbols">
          <ion-list lines="full">
            @for (sym of div.symbolSummaries.slice(0, 10); track sym.symbol) {
              <ion-item>
                <ion-label>
                  <h3>{{ sym.displaySymbol }}</h3>
                  <p>{{ sym.name }} Â· {{ sym.dividendCount }} payouts</p>
                </ion-label>
                <div slot="end" style="text-align:right;">
                  <div class="font-mono pl-positive privacy-mask" style="font-weight:700;">
                    {{ sym.convertedNetDividends | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                  </div>
                  <div class="font-mono" style="font-size:12px; color:var(--sgsk-text-secondary);">
                    YoC {{ sym.yieldOnCostPercent | number: '1.2-2' }}%
                  </div>
                </div>
              </ion-item>
            }
          </ion-list>
        </ion-card>

        <div class="section-header">
          <span>{{ 'dividend.ledgerTitle' | t }}</span>
        </div>
        <ion-card class="mobile-card" id="mobile-dividend-ledger">
          <ion-list lines="full">
            @for (rec of filteredRecords().slice(0, 20); track rec.id) {
              <ion-item>
                <ion-label>
                  <h3>{{ rec.displaySymbol }}</h3>
                  <p>{{ rec.date | ldate: 'medium' }} Â· Tax {{ rec.withholdingTaxRate | number: '1.0-1' }}%</p>
                </ion-label>
                <ion-badge slot="end" color="success" class="font-mono privacy-mask">
                  +{{ rec.convertedNetAmount | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </ion-badge>
              </ion-item>
            }
          </ion-list>
        </ion-card>
      }
    </ion-content>
  `,
})
export class MobileDividendsPage {
  readonly state = inject(MobileStateService);
  readonly selectedYear = signal<string>('all');

  readonly availableYears = computed(() => {
    const annual = this.state.localizedDividendData()?.annualDividends ?? [];
    return annual.map((a) => String(a.year)).sort((a, b) => Number(b) - Number(a));
  });

  readonly filteredRecords = computed(() => {
    const records = this.state.localizedDividendData()?.records ?? [];
    const year = this.selectedYear();
    if (year === 'all') return records;
    return records.filter((r) => r.date.startsWith(year));
  });

  onRefresh(event: CustomEvent): void {
    this.state.loadDividendData(this.state.displayCurrency());
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 400);
  }
}
