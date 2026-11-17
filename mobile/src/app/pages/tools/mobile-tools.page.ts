import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular';
import {
  AvgCostSimulationResult,
  RebalanceMode,
  RebalancePlanResult,
  ToolId,
  TvmCalculationResult,
} from '@shared/models/tools.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToolsService } from '@shared/services/tools.service';
import { calculateRebalancePlan } from '@shared/utils/rebalance-calculator.utils';
import { calculateTVM } from '@shared/utils/tvm-calculator.utils';
import { MobileStateService } from '../../services/mobile-state.service';

@Component({
  selector: 'app-mobile-tools',
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
  ],
  template: `
    <ion-content>
      <div style="padding:10px 14px 4px;">
        <ion-segment
          id="mobile-tools-segment"
          [value]="activeTool()"
          (ionChange)="onToolChange($event)"
        >
          <ion-segment-button value="avg-cost-calculator" id="mobile-tool-avg-cost">
            <ion-label>Avg Cost</ion-label>
          </ion-segment-button>
          <ion-segment-button value="rebalance-planner" id="mobile-tool-rebalance">
            <ion-label>Rebalance</ion-label>
          </ion-segment-button>
          <ion-segment-button value="tvm-calculator" id="mobile-tool-tvm">
            <ion-label>TVM</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      @if (activeTool() === 'avg-cost-calculator') {
        <ion-card class="mobile-card" id="mobile-avg-cost-card">
          <ion-card-header>
            <ion-card-title>{{ 'tools.avgCost.title' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="full">
              <ion-item>
                <ion-select
                  id="mobile-sim-symbol"
                  [label]="'common.symbol' | t"
                  [value]="selectedSymbol()"
                  (ionChange)="selectedSymbol.set($event.detail.value)"
                >
                  @for (pos of positions(); track pos.symbol) {
                    <ion-select-option [value]="pos.symbol">
                      {{ pos.displaySymbol }} ({{ pos.totalShares | number: '1.0-2' }})
                    </ion-select-option>
                  }
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-input
                  id="mobile-sim-shares"
                  type="number"
                  label="Buy Shares"
                  labelPlacement="stacked"
                  [value]="buyShares()"
                  (ionInput)="buyShares.set(+$event.detail.value! || 0)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  id="mobile-sim-price"
                  type="number"
                  label="Buy Price"
                  labelPlacement="stacked"
                  [value]="buyPrice()"
                  (ionInput)="buyPrice.set(+$event.detail.value! || 0)"
                ></ion-input>
              </ion-item>
            </ion-list>
            <ion-button
              id="mobile-sim-run-btn"
              expand="block"
              style="margin-top:12px;"
              (click)="runSimulation()"
            >
              Simulate Order
            </ion-button>

            @if (simulationResult(); as sim) {
              <div class="metric-grid" id="mobile-sim-result">
                <div class="metric-box">
                  <span class="metric-label">New Avg Cost</span>
                  <span class="metric-value font-mono">
                    {{ sim.simulated.averageCost | number: '1.2-2' }}
                  </span>
                </div>
                <div class="metric-box">
                  <span class="metric-label">New Shares</span>
                  <span class="metric-value font-mono">
                    {{ sim.simulated.totalShares | number: '1.2-2' }}
                  </span>
                </div>
              </div>
            }
          </ion-card-content>
        </ion-card>
      } @else if (activeTool() === 'rebalance-planner') {
        <ion-card class="mobile-card" id="mobile-rebalance-card">
          <ion-card-header>
            <ion-card-title>{{ 'tools.rebalance.title' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-segment
              [value]="rebalanceMode()"
              (ionChange)="onRebalanceModeChange($event)"
            >
              <ion-segment-button value="standard">
                <ion-label>Standard</ion-label>
              </ion-segment-button>
              <ion-segment-button value="no-sell">
                <ion-label>No-Sell Inflow</ion-label>
              </ion-segment-button>
            </ion-segment>

            <div class="metric-grid" id="mobile-rebalance-result">
              <div class="metric-box">
                <span class="metric-label">Current Value</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ rebalancePlan().totalCurrentPortfolioValue | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Cash Inflow</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ rebalancePlan().cashContribution | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-card class="mobile-card" id="mobile-tvm-card">
          <ion-card-header>
            <ion-card-title>{{ 'tools.tvm.title' | t }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="full">
              <ion-item>
                <ion-input
                  id="mobile-tvm-pv"
                  type="number"
                  label="Present Value"
                  labelPlacement="stacked"
                  [value]="tvmPv()"
                  (ionInput)="tvmPv.set(+$event.detail.value! || 0)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  id="mobile-tvm-pmt"
                  type="number"
                  label="Monthly Contribution"
                  labelPlacement="stacked"
                  [value]="tvmPmt()"
                  (ionInput)="tvmPmt.set(+$event.detail.value! || 0)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  id="mobile-tvm-rate"
                  type="number"
                  label="Annual Return (%)"
                  labelPlacement="stacked"
                  [value]="tvmRate()"
                  (ionInput)="tvmRate.set(+$event.detail.value! || 0)"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  id="mobile-tvm-years"
                  type="number"
                  label="Years"
                  labelPlacement="stacked"
                  [value]="tvmYears()"
                  (ionInput)="tvmYears.set(+$event.detail.value! || 1)"
                ></ion-input>
              </ion-item>
            </ion-list>

            <div class="metric-grid" id="mobile-tvm-result">
              <div class="metric-box">
                <span class="metric-label">Future Value</span>
                <span class="metric-value font-mono pl-positive privacy-mask">
                  {{ tvmResult().futureValue | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Total Interest</span>
                <span class="metric-value font-mono privacy-mask">
                  {{ tvmResult().totalInterestEarned | currency: state.dc() : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
})
export class MobileToolsPage {
  readonly state = inject(MobileStateService);
  private readonly toolsService = inject(ToolsService);

  readonly activeTool = signal<ToolId>('avg-cost-calculator');
  readonly selectedSymbol = signal<string>('');
  readonly buyShares = signal<number>(10);
  readonly buyPrice = signal<number>(100);
  readonly simulationResult = signal<AvgCostSimulationResult | null>(null);

  readonly rebalanceMode = signal<RebalanceMode>('standard');

  readonly tvmPv = signal<number>(100000);
  readonly tvmPmt = signal<number>(10000);
  readonly tvmRate = signal<number>(8);
  readonly tvmYears = signal<number>(10);

  readonly positions = computed(() => this.state.localizedPortfolioData()?.openPositions ?? []);

  readonly rebalancePlan = computed<RebalancePlanResult>(() => {
    const pos = this.positions();
    const targets: Record<string, number> = {};
    if (pos.length > 0) {
      const equal = 100 / pos.length;
      for (const p of pos) targets[p.symbol] = equal;
    }
    return calculateRebalancePlan(
      pos,
      this.state.prices(),
      {
        mode: this.rebalanceMode(),
        noSellSubMode: 'min-inflow',
        customCashDeposit: 0,
        targetAllocations: targets,
      },
      this.state.displayCurrency(),
      this.state.exchangeRate() || 1
    );
  });

  readonly tvmResult = computed<TvmCalculationResult>(() =>
    calculateTVM({
      mode: 'FV',
      presentValue: this.tvmPv(),
      payment: this.tvmPmt(),
      annualRatePct: this.tvmRate(),
      years: this.tvmYears(),
      compounding: 'monthly',
      timing: 'end',
    })
  );

  onRebalanceModeChange(event: CustomEvent): void {
    const mode = event.detail.value === 'no-sell' ? 'no-sell' : 'standard';
    this.rebalanceMode.set(mode);
  }

  onToolChange(event: CustomEvent): void {
    const next = (event.detail.value as ToolId) || 'avg-cost-calculator';
    void this.state.nativePlatform.triggerHapticImpact('light');
    this.activeTool.set(next);
  }

  runSimulation(): void {
    const pos = this.positions().find((p) => p.symbol === this.selectedSymbol()) ?? this.positions()[0];
    const snapshot = pos
      ? {
          symbol: pos.symbol,
          displaySymbol: pos.displaySymbol,
          name: pos.name,
          assetType: pos.assetType,
          assetTypeLabel: pos.assetTypeLabel,
          currency: pos.currency,
          totalShares: pos.totalShares,
          averageCost: pos.averageCost,
          totalCost: pos.totalCost,
          currentPrice: pos.currentPrice,
          holdingValue: pos.holdingValue,
          unrealizedPL: pos.unrealizedPL,
          unrealizedPLPercent: pos.unrealizedPLPercent,
          hasPrice: pos.hasPrice,
        }
      : {
          symbol: 'CUSTOM',
          displaySymbol: 'CUSTOM',
          name: 'Custom Simulation',
          assetType: 'us-stock',
          assetTypeLabel: 'US Stock',
          currency: this.state.displayCurrency(),
          totalShares: 0,
          averageCost: 0,
          totalCost: 0,
          currentPrice: this.buyPrice(),
          holdingValue: 0,
          unrealizedPL: 0,
          unrealizedPLPercent: 0,
          hasPrice: true,
        };

    this.toolsService
      .simulateOrder(
        snapshot,
        [
          {
            id: 'mobile-step-1',
            action: 'BUY',
            shares: this.buyShares(),
            price: this.buyPrice(),
            feePercent: 0,
            feeAmount: 0,
            totalCost: this.buyShares() * this.buyPrice(),
          },
        ],
        snapshot.currency
      )
      .subscribe((res) => this.simulationResult.set(res));
  }
}
