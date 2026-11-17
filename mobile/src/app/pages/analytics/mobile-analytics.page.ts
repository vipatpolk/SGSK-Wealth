import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
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
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from '@ionic/angular';
import { AnalyticsSubTab } from '@shared/config/asset.constants';
import {
  PortfolioAllocationResponse,
  PortfolioPerformanceResponse,
} from '@shared/models/portfolio.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { PortfolioService } from '@shared/services/portfolio.service';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonBadge,
    IonChip,
    IonSpinner,
  ],
  template: `
    <ion-content>
      <div style="padding:10px 14px 4px;">
        <ion-segment
          id="mobile-analytics-segment"
          [value]="state.analyticsSubTab()"
          (ionChange)="onSegmentChange($event)"
        >
          <ion-segment-button value="overview" id="mobile-analytics-overview">
            <ion-label>{{ 'analytics.tab.overview' | t }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="allocation" id="mobile-analytics-allocation">
            <ion-label>{{ 'analytics.tab.allocation' | t }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="performance" id="mobile-analytics-performance">
            <ion-label>{{ 'analytics.tab.performance' | t }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      @if (loading()) {
        <div class="ion-text-center ion-padding" style="margin-top:32px;">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (state.analyticsSubTab() === 'allocation' && allocation(); as alloc) {
        <ion-card class="mobile-card" id="mobile-currency-exposure">
          <ion-card-header>
            <ion-card-title>{{ 'allocation.currencyExposure' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="metric-grid">
              <div class="metric-box">
                <span class="metric-label">USD ({{ alloc.currencyExposure.usdPercent | number: '1.1-1' }}%)</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ alloc.currencyExposure.usd | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">THB ({{ alloc.currencyExposure.thbPercent | number: '1.1-1' }}%)</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ alloc.currencyExposure.thb | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="mobile-card" id="mobile-rebalance-recommendations">
          <ion-card-header>
            <ion-card-title>{{ 'allocation.rebalancePlan' | t }}</ion-card-title>
          </ion-card-header>
          <ion-list lines="full">
            @for (rec of alloc.recommendations; track rec.assetType) {
              <ion-item>
                <ion-label>
                  <h3>{{ rec.label }}</h3>
                  <p class="font-mono">
                    {{ rec.actualPercent | number: '1.1-1' }}% â†’ {{ rec.targetPercent | number: '1.1-1' }}%
                  </p>
                </ion-label>
                <ion-badge
                  slot="end"
                  [color]="rec.action === 'BUY' ? 'success' : rec.action === 'SELL' ? 'danger' : 'medium'"
                >
                  {{ rec.action }}
                </ion-badge>
              </ion-item>
            }
          </ion-list>
        </ion-card>
      } @else if (performance(); as perf) {
        @if (state.analyticsSubTab() === 'performance') {
          <div class="chip-scroll" id="mobile-timeframe-chips">
            @for (tf of timeframes; track tf) {
              <ion-chip
                [color]="timeframe() === tf ? 'primary' : 'medium'"
                [outline]="timeframe() !== tf"
                (click)="setTimeframe(tf)"
              >
                {{ tf }}
              </ion-chip>
            }
          </div>
        }

        <ion-card class="mobile-card" id="mobile-performance-summary">
          <ion-card-header>
            <ion-card-title>{{ 'performance.title' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="metric-grid">
              <div class="metric-box">
                <span class="metric-label">{{ 'common.totalInvested' | t }}</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ perf.summary.totalInvested | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'summary.holdingValue' | t }}</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ perf.summary.totalValue | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'performance.totalReturn' | t }}</span>
                <span
                  class="metric-value font-mono privacy-mask"
                  [class.pl-positive]="perf.summary.totalReturn >= 0"
                  [class.pl-negative]="perf.summary.totalReturn < 0"
                >
                  {{ perf.summary.totalReturn >= 0 ? '+' : ''
                  }}{{ perf.summary.totalReturn | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'performance.returnPct' | t }}</span>
                <span
                  class="metric-value font-mono"
                  [class.pl-positive]="perf.summary.totalReturnPercent >= 0"
                  [class.pl-negative]="perf.summary.totalReturnPercent < 0"
                >
                  {{ perf.summary.totalReturnPercent >= 0 ? '+' : ''
                  }}{{ perf.summary.totalReturnPercent | number: '1.2-2' }}%
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="mobile-card">
          <ion-card-header>
            <ion-card-title>{{ 'performance.topGainers' | t }}</ion-card-title>
          </ion-card-header>
          <ion-list lines="full">
            @for (item of perf.topGainers.slice(0, 5); track item.symbol) {
              <ion-item>
                <ion-label>
                  <h3>{{ item.displaySymbol }}</h3>
                  <p>{{ item.name }}</p>
                </ion-label>
                <span slot="end" class="font-mono pl-positive">
                  +{{ item.totalReturnPercent | number: '1.2-2' }}%
                </span>
              </ion-item>
            }
          </ion-list>
        </ion-card>
      }
    </ion-content>
  `,
})
export class MobileAnalyticsPage {
  readonly state = inject(MobileStateService);
  private readonly portfolioService = inject(PortfolioService);

  readonly timeframes = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const;
  readonly timeframe = signal<string>('ALL');
  readonly loading = signal<boolean>(false);
  readonly performance = signal<PortfolioPerformanceResponse | null>(null);
  readonly allocation = signal<PortfolioAllocationResponse | null>(null);

  constructor() {
    effect(() => {
      const currency = this.state.displayCurrency();
      const tf = this.timeframe();
      this.loadAnalytics(currency, tf);
    });
  }

  onSegmentChange(event: CustomEvent): void {
    const next = (event.detail.value as AnalyticsSubTab) || 'overview';
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.state.analyticsSubTab.set(next);
  }

  setTimeframe(tf: string): void {
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.timeframe.set(tf);
  }

  private loadAnalytics(currency: 'USD' | 'THB', tf: string): void {
    this.loading.set(true);
    this.portfolioService.fetchPerformance(tf, '', '', currency).subscribe({
      next: (perf) => {
        this.performance.set(perf);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.portfolioService.fetchAllocation(undefined, currency).subscribe({
      next: (alloc) => this.allocation.set(alloc),
    });
  }
}
