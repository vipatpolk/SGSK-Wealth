import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
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
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { convertCurrency, getAssetTypeLabel } from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonChip,
    IonSpinner,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (state.loading() && !state.portfolioData()) {
        <div class="ion-text-center ion-padding" style="margin-top:48px;">
          <ion-spinner name="crescent"></ion-spinner>
          <p style="color:var(--sgsk-text-secondary); margin-top:12px;">
            {{ 'loading.prepDashboard' | t }}
          </p>
        </div>
      } @else if (state.error()) {
        <ion-card class="mobile-card" id="mobile-error-card">
          <ion-card-header>
            <ion-card-title>{{ 'app.error.unableData' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="pl-negative">{{ state.error() }}</p>
            <ion-button expand="block" (click)="state.refresh()" style="margin-top:12px;">
              {{ 'common.retry' | t }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      } @else {
        <!-- Net Worth Hero Card -->
        <ion-card class="mobile-card hero-gradient-card" id="mobile-dashboard-hero">
          <ion-card-header>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <ion-chip color="primary" style="margin:0; height:24px; font-size:11px;">
                {{ 'holdings.heroBadge' | t }}
              </ion-chip>
              @if (state.hasRate()) {
                <span class="font-mono" style="font-size:12px; color:var(--sgsk-text-secondary);">
                  USD/THB {{ state.exchangeRate() | number: '1.2-2' }}
                </span>
              }
            </div>
            <ion-card-title style="font-size:28px; margin-top:10px;" class="font-mono privacy-mask">
              {{ netWorth() | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="display:flex; align-items:center; gap:8px;">
              <ion-badge [color]="totalReturn() >= 0 ? 'success' : 'danger'" class="font-mono">
                {{ totalReturn() >= 0 ? '+' : '' }}{{ returnPct() | number: '1.2-2' }}%
              </ion-badge>
              <span
                class="font-mono privacy-mask"
                [class.pl-positive]="totalReturn() >= 0"
                [class.pl-negative]="totalReturn() < 0"
              >
                {{ totalReturn() >= 0 ? '+' : ''
                }}{{ totalReturn() | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
              </span>
            </div>

            <div class="metric-grid">
              <div class="metric-box">
                <span class="metric-label">{{ 'common.totalInvested' | t }}</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ investedCost() | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'holdings.realizedReturn' | t }}</span>
                <span
                  class="metric-value font-mono privacy-mask"
                  [class.pl-positive]="realizedPL() >= 0"
                  [class.pl-negative]="realizedPL() < 0"
                >
                  {{ realizedPL() >= 0 ? '+' : ''
                  }}{{ realizedPL() | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'holdings.openPositions' | t }}</span>
                <span class="metric-value font-mono">{{ openPositions().length }}</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">{{ 'nav.dividends' | t }}</span>
                <span class="metric-value font-mono privacy-mask pl-positive">
                  {{ netDividends() | currency: state.dc() : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Actions -->
        <div class="chip-scroll">
          <ion-chip (click)="goTo('/holdings', false)" id="mobile-quick-holdings">
            {{ 'nav.holdings' | t }}
          </ion-chip>
          <ion-chip (click)="goTo('/holdings', true)" id="mobile-quick-pvd">
            {{ 'holdings.subtabPvd' | t }}
          </ion-chip>
          <ion-chip (click)="goTo('/analytics')" id="mobile-quick-analytics">
            {{ 'nav.analytics' | t }}
          </ion-chip>
          <ion-chip (click)="goTo('/dividends')" id="mobile-quick-dividends">
            {{ 'nav.dividends' | t }}
          </ion-chip>
          <ion-chip (click)="goTo('/tools')" id="mobile-quick-tools">
            {{ 'nav.tools' | t }}
          </ion-chip>
          <ion-chip (click)="goTo('/transactions')" id="mobile-quick-transactions">
            {{ 'nav.transactions' | t }}
          </ion-chip>
        </div>

        <!-- Asset Class Breakdown -->
        <div class="section-header">
          <span>{{ 'dashboard.assetAllocation' | t }}</span>
          <ion-button fill="clear" size="small" (click)="goTo('/analytics')">
            {{ 'nav.analytics' | t }}
          </ion-button>
        </div>
        <ion-card class="mobile-card" id="mobile-dashboard-allocation">
          <ion-list lines="full">
            @for (bucket of assetBuckets(); track bucket.assetType) {
              <ion-item>
                <ion-label>
                  <h3>{{ bucket.label }}</h3>
                  <p>{{ bucket.count }} {{ 'holdings.symbolsPlural' | t }}</p>
                </ion-label>
                <div slot="end" style="text-align:right;">
                  <div class="font-mono privacy-mask" style="font-weight:700;">
                    {{ bucket.value | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                  </div>
                  <div class="font-mono" style="font-size:12px; color:var(--sgsk-text-secondary);">
                    {{ bucket.weight | number: '1.1-1' }}%
                  </div>
                </div>
              </ion-item>
            } @empty {
              <ion-item>
                <ion-label>{{ 'holdings.emptySymbolSearch' | t }}</ion-label>
              </ion-item>
            }
          </ion-list>
        </ion-card>

        <!-- Top Market Movers -->
        <div class="section-header">
          <span>{{ 'performance.topGainers' | t }}</span>
          <ion-button fill="clear" size="small" (click)="goTo('/holdings')">
            {{ 'nav.holdings' | t }}
          </ion-button>
        </div>
        <ion-card class="mobile-card" id="mobile-dashboard-movers">
          <ion-list lines="full">
            @for (pos of topMovers(); track pos.symbol) {
              <ion-item button (click)="openHistory(pos.symbol)">
                <ion-label>
                  <h3>{{ pos.displaySymbol }}</h3>
                  <p>{{ pos.name }}</p>
                </ion-label>
                <div slot="end" style="text-align:right;">
                  <div
                    class="font-mono"
                    [class.pl-positive]="pos.unrealizedPLPercent >= 0"
                    [class.pl-negative]="pos.unrealizedPLPercent < 0"
                    style="font-weight:700;"
                  >
                    {{ pos.unrealizedPLPercent >= 0 ? '+' : ''
                    }}{{ pos.unrealizedPLPercent | number: '1.2-2' }}%
                  </div>
                  <div class="font-mono privacy-mask" style="font-size:12px; color:var(--sgsk-text-secondary);">
                    {{ pos.holdingValue | currency: pos.currency : 'symbol-narrow' : '1.0-0' }}
                  </div>
                </div>
              </ion-item>
            }
          </ion-list>
        </ion-card>
      }
    </ion-content>
  `,
})
export class MobileDashboardPage {
  readonly state = inject(MobileStateService);
  private readonly router = inject(Router);

  readonly openPositions = computed(() => this.state.localizedPortfolioData()?.openPositions ?? []);

  readonly netWorth = computed(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    const raw = data.summary.totalValue || data.summary.openInvested || 0;
    return convertCurrency(raw, data.currency, this.state.displayCurrency(), this.state.exchangeRate());
  });

  readonly investedCost = computed(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    const raw = data.summary.openInvested ?? data.summary.totalInvested ?? 0;
    return convertCurrency(raw, data.currency, this.state.displayCurrency(), this.state.exchangeRate());
  });

  readonly totalReturn = computed(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    return convertCurrency(
      data.summary.totalUnrealizedPL || 0,
      data.currency,
      this.state.displayCurrency(),
      this.state.exchangeRate()
    );
  });

  readonly realizedPL = computed(() => {
    const data = this.state.portfolioData();
    if (!data) return 0;
    return convertCurrency(
      data.summary.totalRealizedPL || 0,
      data.currency,
      this.state.displayCurrency(),
      this.state.exchangeRate()
    );
  });

  readonly returnPct = computed(() => this.state.portfolioData()?.summary.totalUnrealizedPLPercent ?? 0);
  readonly netDividends = computed(() => this.state.localizedDividendData()?.totalNetDividends ?? 0);

  readonly assetBuckets = computed(() => {
    const positions = this.openPositions();
    const lang = this.state.i18n.lang();
    const target = this.state.displayCurrency();
    const rate = this.state.exchangeRate();

    const groups = new Map<string, { assetType: string; label: string; value: number; count: number }>();
    let total = 0;

    for (const pos of positions) {
      const val = convertCurrency(pos.holdingValue || pos.totalCost, pos.currency, target, rate);
      total += val;
      const existing = groups.get(pos.assetType);
      if (existing) {
        existing.value += val;
        existing.count += 1;
      } else {
        groups.set(pos.assetType, {
          assetType: pos.assetType,
          label: getAssetTypeLabel(pos.assetType, pos.symbol, lang),
          value: val,
          count: 1,
        });
      }
    }

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        weight: total > 0 ? (g.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  });

  readonly topMovers = computed(() => {
    return [...this.openPositions()]
      .sort((a, b) => Math.abs(b.unrealizedPLPercent) - Math.abs(a.unrealizedPLPercent))
      .slice(0, 5);
  });

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 400);
  }

  goTo(path: string, pvd = false): void {
    void this.state.nativePlatform.triggerHapticImpact('light');
    if (pvd) {
      this.state.selectHoldingsSubTab('pvd');
    } else if (path === '/holdings') {
      this.state.selectHoldingsSubTab('market');
    }
    void this.router.navigateByUrl(path);
  }

  openHistory(symbol: string): void {
    this.state.selectedHistorySymbol.set(symbol);
    void this.router.navigateByUrl('/transactions');
  }
}
