import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular';
import { AssetTab, HoldingsSubTab } from '@shared/config/asset.constants';
import { ClosedPortfolioPosition, PortfolioPosition } from '@shared/models/portfolio.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { getPriceFormat, getQuantityFormat } from '@shared/utils/format.utils';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-holdings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonBadge,
    IonButton,
  ],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Market vs Provident Fund (PVD) Sub-View Segment -->
      <div style="padding:10px 14px 4px;">
        <ion-segment
          id="mobile-holdings-segment"
          [value]="state.isPvdTab() ? 'pvd' : 'market'"
          (ionChange)="onSubTabChange($event)"
        >
          <ion-segment-button value="market" id="mobile-segment-market">
            <ion-label>{{ 'holdings.subtabMarket' | t }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pvd" id="mobile-segment-pvd">
            <ion-label>{{ 'holdings.subtabPvd' | t }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      @if (!state.isPvdTab()) {
        <!-- Asset Filter Chips -->
        <div class="chip-scroll" id="mobile-asset-chips">
          @for (tab of marketTabs(); track tab.id) {
            <ion-chip
              [id]="'mobile-chip-' + tab.id"
              [color]="state.activeTab().id === tab.id ? 'primary' : 'medium'"
              [outline]="state.activeTab().id !== tab.id"
              (click)="selectAssetTab(tab)"
            >
              {{ tab.label }} ({{ state.tabCounts()[tab.id] ?? 0 }})
            </ion-chip>
          }
        </div>

        <!-- Search + Sort -->
        <div style="padding:0 10px;">
          <ion-searchbar
            id="mobile-holdings-search"
            [value]="searchQuery()"
            (ionInput)="searchQuery.set($event.detail.value ?? '')"
            [placeholder]="'common.searchPlaceholder' | t"
            debounce="150"
          ></ion-searchbar>

          <ion-item lines="none" style="border-radius:12px; margin:0 4px 8px;">
            <ion-select
              id="mobile-holdings-sort"
              [label]="'holdings.sortBy' | t"
              [value]="sortField()"
              (ionChange)="sortField.set($event.detail.value)"
            >
              <ion-select-option value="totalCost">{{ 'common.totalCost' | t }}</ion-select-option>
              <ion-select-option value="holdingValue">{{ 'summary.holdingValue' | t }}</ion-select-option>
              <ion-select-option value="pl">{{ 'holdings.sort.plPctShort' | t }}</ion-select-option>
              <ion-select-option value="symbol">{{ 'common.symbol' | t }}</ion-select-option>
            </ion-select>
          </ion-item>
        </div>
      }

      @if (state.isPvdTab()) {
        <!-- Provident Fund (PVD) Holdings -->
        <div id="mobile-pvd-list">
          @for (pos of state.pvdPositions(); track pos.symbol) {
            <ion-card class="mobile-card">
              <ion-card-header>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <ion-card-title>{{ pos.displaySymbol }}</ion-card-title>
                  <ion-badge color="primary">{{ pos.riskLevel || 'PVD' }}</ion-badge>
                </div>
                <p style="margin:4px 0 0; color:var(--sgsk-text-secondary); font-size:13px;">
                  {{ pos.pvdFundName || pos.name }}
                </p>
              </ion-card-header>
              <ion-card-content>
                <div class="metric-grid">
                  <div class="metric-box">
                    <span class="metric-label">{{ 'summary.holdingValue' | t }}</span>
                    <span class="metric-value font-mono privacy-mask">
                      {{ pos.holdingValue | currency: pos.currency : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">{{ 'common.totalCost' | t }}</span>
                    <span class="metric-value font-mono privacy-mask">
                      {{ pos.totalCost | currency: pos.currency : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                </div>
                <ion-button
                  expand="block"
                  fill="outline"
                  size="small"
                  style="margin-top:12px;"
                  (click)="openFactsheet(pos)"
                >
                  {{ 'factsheet.viewButton' | t }}
                </ion-button>
              </ion-card-content>
            </ion-card>
          } @empty {
            <ion-card class="mobile-card">
              <ion-card-content>{{ 'pvd.emptyTitle' | t }}</ion-card-content>
            </ion-card>
          }
        </div>
      } @else if (state.isClosedTab()) {
        <!-- Closed Positions -->
        <div id="mobile-closed-list">
          @for (pos of filteredClosed(); track pos.symbol) {
            <ion-card class="mobile-card">
              <ion-card-header>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <ion-card-title>{{ pos.displaySymbol }}</ion-card-title>
                  <ion-badge [color]="pos.realizedPL >= 0 ? 'success' : 'danger'" class="font-mono">
                    {{ pos.realizedPL >= 0 ? '+' : '' }}{{ pos.realizedPLPercent | number: '1.2-2' }}%
                  </ion-badge>
                </div>
                <p style="margin:4px 0 0; font-size:13px; color:var(--sgsk-text-secondary);">
                  {{ pos.name }} Â· {{ pos.assetTypeLabel }}
                </p>
              </ion-card-header>
              <ion-card-content>
                <div class="metric-grid">
                  <div class="metric-box">
                    <span class="metric-label">{{ 'summary.totalProceeds' | t }}</span>
                    <span class="metric-value font-mono privacy-mask">
                      {{ pos.totalProceeds | currency: pos.currency : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">{{ 'holdings.realizedReturn' | t }}</span>
                    <span
                      class="metric-value font-mono privacy-mask"
                      [class.pl-positive]="pos.realizedPL >= 0"
                      [class.pl-negative]="pos.realizedPL < 0"
                    >
                      {{ pos.realizedPL >= 0 ? '+' : ''
                      }}{{ pos.realizedPL | currency: pos.currency : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          } @empty {
            <ion-card class="mobile-card">
              <ion-card-content>{{ 'holdings.emptyClosedSearch' | t }}</ion-card-content>
            </ion-card>
          }
        </div>
      } @else {
        <!-- Open Market Positions with Expandable FIFO Lots -->
        <div id="mobile-position-cards">
          @for (pos of filteredOpen(); track pos.symbol) {
            <ion-card class="mobile-card">
              <ion-card-header (click)="toggleExpand(pos.symbol)" style="cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <ion-card-title>{{ pos.displaySymbol }}</ion-card-title>
                    <p style="margin:2px 0 0; font-size:12px; color:var(--sgsk-text-secondary);">
                      {{ pos.name }} Â· {{ pos.assetTypeLabel }}
                    </p>
                  </div>
                  <ion-badge [color]="pos.unrealizedPL >= 0 ? 'success' : 'danger'" class="font-mono">
                    {{ pos.unrealizedPL >= 0 ? '+' : '' }}{{ pos.unrealizedPLPercent | number: '1.2-2' }}%
                  </ion-badge>
                </div>
              </ion-card-header>

              <ion-card-content>
                <div class="metric-grid">
                  <div class="metric-box">
                    <span class="metric-label">{{ 'summary.holdingValue' | t }}</span>
                    <span class="metric-value font-mono privacy-mask">
                      {{ pos.holdingValue | currency: pos.currency : 'symbol-narrow' : '1.2-2' }}
                    </span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">{{ 'common.totalShares' | t }}</span>
                    <span class="metric-value font-mono privacy-mask">
                      {{ pos.totalShares | number: qtyFmt(pos.symbol, pos.assetType) }}
                    </span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">{{ 'common.avgCost' | t }}</span>
                    <span class="metric-value font-mono">
                      {{ pos.averageCost | number: priceFmt(pos.symbol, pos.assetType) }}
                    </span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">{{ 'summary.currentPrice' | t }}</span>
                    <span class="metric-value font-mono">
                      {{ pos.currentPrice | number: priceFmt(pos.symbol, pos.assetType) }}
                    </span>
                  </div>
                </div>

                <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                  <ion-button
                    size="small"
                    fill="outline"
                    (click)="toggleExpand(pos.symbol)"
                    [attr.data-symbol-lots]="pos.symbol"
                  >
                    {{ isExpanded(pos.symbol) ? ('common.collapseAll' | t) : ('summary.fifoLots' | t) }}
                    ({{ pos.lots.length }})
                  </ion-button>
                  <ion-button size="small" fill="clear" (click)="openHistory(pos.symbol)">
                    {{ 'nav.transactions' | t }}
                  </ion-button>
                  @if (pos.assetType === 'mutual-fund' || pos.assetType === 'provident-fund') {
                    <ion-button size="small" fill="clear" (click)="openFactsheet(pos)">
                      {{ 'factsheet.viewButton' | t }}
                    </ion-button>
                  }
                </div>

                @if (isExpanded(pos.symbol)) {
                  <ion-list lines="inset" style="margin-top:10px; border-radius:10px;">
                    @for (lot of pos.lots; track $index) {
                      <ion-item>
                        <ion-label>
                          <h3 class="font-mono">{{ lot.purchaseDate }}</h3>
                          <p class="font-mono">
                            {{ lot.quantity | number: qtyFmt(pos.symbol, pos.assetType) }} @
                            {{ lot.costBasis | number: priceFmt(pos.symbol, pos.assetType) }}
                          </p>
                        </ion-label>
                        <div slot="end" style="text-align:right;">
                          <div class="font-mono privacy-mask">
                            {{ lot.totalCost | currency: lot.currency : 'symbol-narrow' : '1.2-2' }}
                          </div>
                          <div
                            class="font-mono"
                            style="font-size:12px;"
                            [class.pl-positive]="lot.unrealizedPL >= 0"
                            [class.pl-negative]="lot.unrealizedPL < 0"
                          >
                            {{ lot.unrealizedPL >= 0 ? '+' : ''
                            }}{{ lot.unrealizedPLPercent | number: '1.2-2' }}%
                          </div>
                        </div>
                      </ion-item>
                    }
                  </ion-list>
                }
              </ion-card-content>
            </ion-card>
          } @empty {
            <ion-card class="mobile-card">
              <ion-card-content>{{ 'holdings.emptySymbolSearch' | t }}</ion-card-content>
            </ion-card>
          }
        </div>
      }
    </ion-content>
  `,
})
export class MobileHoldingsPage {
  readonly state = inject(MobileStateService);
  private readonly router = inject(Router);

  readonly searchQuery = signal<string>('');
  readonly sortField = signal<string>('totalCost');
  readonly expandedSymbols = signal<Set<string>>(new Set());

  readonly marketTabs = computed(() =>
    this.state.tabs.filter((t) => t.id !== 'provident-fund')
  );

  readonly filteredOpen = computed<PortfolioPosition[]>(() => {
    const list = this.state.localizedPortfolioData()?.openPositions ?? [];
    const q = this.searchQuery().trim().toUpperCase();
    const filtered = q
      ? list.filter(
          (p) =>
            p.symbol.toUpperCase().includes(q) ||
            p.displaySymbol.toUpperCase().includes(q) ||
            p.name.toUpperCase().includes(q) ||
            (p.nameTh || '').toUpperCase().includes(q)
        )
      : [...list];

    const field = this.sortField();
    return filtered.sort((a, b) => {
      if (field === 'symbol') return a.symbol.localeCompare(b.symbol);
      if (field === 'holdingValue') return b.holdingValue - a.holdingValue;
      if (field === 'pl') return b.unrealizedPLPercent - a.unrealizedPLPercent;
      return b.totalCost - a.totalCost;
    });
  });

  readonly filteredClosed = computed<ClosedPortfolioPosition[]>(() => {
    const list = this.state.getClosedPositions();
    const q = this.searchQuery().trim().toUpperCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.symbol.toUpperCase().includes(q) ||
        p.displaySymbol.toUpperCase().includes(q) ||
        p.name.toUpperCase().includes(q)
    );
  });

  onRefresh(event: CustomEvent): void {
    this.state.refresh();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 400);
  }

  onSubTabChange(event: CustomEvent): void {
    const next = (event.detail.value as HoldingsSubTab) || 'market';
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.state.selectHoldingsSubTab(next);
  }

  selectAssetTab(tab: AssetTab): void {
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.state.selectTab(tab);
  }

  toggleExpand(symbol: string): void {
    const next = new Set(this.expandedSymbols());
    if (next.has(symbol)) {
      next.delete(symbol);
    } else {
      next.add(symbol);
    }
    this.expandedSymbols.set(next);
  }

  isExpanded(symbol: string): boolean {
    return this.expandedSymbols().has(symbol);
  }

  qtyFmt(symbol: string, assetType: string): string {
    return getQuantityFormat(symbol, assetType);
  }

  priceFmt(symbol: string, assetType: string): string {
    return getPriceFormat(symbol, assetType);
  }

  openHistory(symbol: string): void {
    this.state.selectedHistorySymbol.set(symbol);
    void this.router.navigateByUrl('/transactions');
  }

  openFactsheet(pos: PortfolioPosition): void {
    this.state.openFactsheetModal({
      symbol: pos.symbol,
      assetType: pos.assetType,
      fundName: pos.pvdFundName || pos.name,
      displayName: pos.name,
      displayNameTh: pos.nameTh,
    });
  }
}
