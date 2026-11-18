import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { TranslationKey } from '@shared/i18n/en';
import { PortfolioPosition } from '@shared/models/portfolio.model';
import {
  AvgCostSimulationResult,
  PositionSnapshot,
  SimulatedStep,
  SimulationAction,
  TargetAvgCostGoalResult,
} from '@shared/models/tools.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import {
  getQuickAdjustedPrice,
  simulateAvgCost,
  solveTargetAvgCostGoal,
} from '@shared/utils/calculator.utils';
import {
  convertCurrency,
  displaySymbol,
  getAssetType,
  getAssetTypeClass,
  getAssetTypeLabel,
  getPriceFormat,
  getQuantityFormat,
  getSymbolColor,
  getSymbolName,
  getUnitLabel,
  getUnitLabelSingular,
  normalizeAssetType,
  resolveSymbolName,
} from '@shared/utils/format.utils';
import { MobileStateService } from '../../../services/mobile-state.service';
import { NativePlatformService } from '../../../services/native-platform.service';

export interface MobileSymbolOption {
  symbol: string;
  displaySymbol: string;
  name: string;
  assetType: string;
  assetTypeLabel: string;
  currency: string;
  totalShares: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  color: string;
}

@Component({
  selector: 'app-mobile-avg-cost',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    TranslatePipe,
    SymbolIconComponent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
  ],
  templateUrl: './mobile-avg-cost.component.html',
  styleUrl: './mobile-avg-cost.component.css',
})
export class MobileAvgCostComponent {
  readonly state = inject(MobileStateService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly initialSymbol = input<string>('');

  readonly mode = signal<'forward' | 'reverse'>('forward');
  readonly selectedSymbol = signal<string>('');
  readonly isCustomMode = signal<boolean>(false);
  readonly isSymbolSheetOpen = signal<boolean>(false);
  readonly sheetSearchQuery = signal<string>('');
  readonly assetFilter = signal<string>('');

  // Custom Position Inputs
  readonly customSymbol = signal<string>('CUSTOM');
  readonly customAssetType = signal<string>('us-stock');
  readonly customCurrency = signal<string>('USD');
  readonly customShares = signal<number>(100);
  readonly customAvgCost = signal<number>(150);
  readonly customMarketPrice = signal<number>(140);

  // Forward Form Controls
  readonly currentAction = signal<SimulationAction>('BUY');
  readonly inputMode = signal<'shares' | 'amount'>('shares');
  readonly inputShares = signal<number>(0);
  readonly inputAmount = signal<number>(0);
  readonly inputPrice = signal<number>(0);
  readonly inputFeePercent = signal<number>(0);
  readonly queuedSteps = signal<SimulatedStep[]>([]);

  // Calculation state
  readonly isCalculating = signal<boolean>(false);
  readonly lastCalculatedTime = signal<string>('Just now');

  // Reverse Target Cost Solver
  readonly targetAvgCost = signal<number>(0);
  readonly targetBuyPrice = signal<number>(0);
  readonly targetFeePercent = signal<number>(0);

  private prevCurrency: string | null = null;

  private readonly openPositions = computed<PortfolioPosition[]>(
    () => this.state.localizedPortfolioData()?.openPositions ?? []
  );

  constructor() {
    effect(() => {
      const initSym = this.initialSymbol();
      const positions = this.openPositions();
      if (initSym && positions.some((p) => p.symbol === initSym) && this.selectedSymbol() !== initSym) {
        this.selectSymbol(initSym);
      } else if (!this.selectedSymbol() && !this.isCustomMode() && positions.length > 0) {
        this.selectSymbol(positions[0].symbol);
      }
    });

    effect(() => {
      const curr = this.state.dc();
      if (this.prevCurrency && this.prevCurrency !== curr) {
        this.prevCurrency = curr;
        const sym = this.selectedSymbol();
        if (sym && !this.isCustomMode()) {
          const pos = this.openPositions().find((p) => p.symbol === sym);
          if (pos) {
            const pd = this.state.prices().get(sym);
            const mktPrice = pd && pd.price > 0 ? pd.price : pos.currentPrice || pos.averageCost;
            const mktCurr = pd?.currency || pos.currency;
            const convMktPrice = this.state.cx(mktPrice, mktCurr);
            const convAvgCost = this.state.cx(pos.averageCost, pos.currency);

            this.inputPrice.set(parseFloat(convMktPrice.toFixed(4)));
            this.inputAmount.set(parseFloat((this.inputShares() * convMktPrice).toFixed(2)));
            this.targetBuyPrice.set(parseFloat((convMktPrice * 0.95).toFixed(4)));
            this.targetAvgCost.set(parseFloat((convAvgCost * 0.9).toFixed(4)));
          }
        }
      } else {
        this.prevCurrency = curr;
      }
    });
  }

  readonly hasSelectedSymbol = computed<boolean>(
    () => Boolean(this.selectedSymbol()) || this.isCustomMode()
  );

  readonly availableSymbols = computed<MobileSymbolOption[]>(() => {
    const positions = this.openPositions();
    const pm = this.state.prices();
    const lang = this.state.i18n.lang();

    return positions.map((p) => {
      const pd = pm.get(p.symbol);
      const mktPrice = pd && pd.price > 0 ? pd.price : p.currentPrice || 0;
      const mktCurr = pd?.currency || p.currency;
      const name =
        getSymbolName(p.symbol, p.name || '', lang, p.nameTh || '', p.assetType) ||
        resolveSymbolName(p.symbol, pm, lang, p.assetType);
      return {
        symbol: p.symbol,
        displaySymbol: p.displaySymbol || displaySymbol(p.symbol),
        name,
        assetType: p.assetType,
        assetTypeLabel: getAssetTypeLabel(p.assetType, p.symbol, lang),
        currency: this.state.dc(),
        totalShares: p.totalShares,
        averageCost: this.state.cx(p.averageCost, p.currency),
        totalCost: this.state.cx(p.totalCost, p.currency),
        currentPrice: this.state.cx(mktPrice, mktCurr),
        color: getSymbolColor(p.symbol),
      };
    });
  });

  readonly filteredSymbolOptions = computed<MobileSymbolOption[]>(() => {
    const q = this.sheetSearchQuery().trim().toUpperCase();
    const filter = this.assetFilter().trim();
    return this.availableSymbols().filter((opt) => {
      if (filter && normalizeAssetType(opt.assetType) !== filter) return false;
      if (q) {
        return (
          opt.symbol.toUpperCase().includes(q) ||
          opt.displaySymbol.toUpperCase().includes(q) ||
          opt.name.toUpperCase().includes(q)
        );
      }
      return true;
    });
  });

  readonly selectedPosition = computed<PortfolioPosition | null>(() => {
    const sym = this.selectedSymbol();
    if (!sym || this.isCustomMode()) return null;
    return this.openPositions().find((p) => p.symbol === sym) || null;
  });

  readonly positionSnapshot = computed<PositionSnapshot>(() => {
    const lang = this.state.i18n.lang();
    if (this.isCustomMode()) {
      const shares = Math.max(0, this.customShares());
      const avgCost = Math.max(0, this.customAvgCost());
      const mktPrice = Math.max(0, this.customMarketPrice());
      const totalCost = shares * avgCost;
      const holdingValue = shares * mktPrice;
      const unPL = holdingValue - totalCost;
      const unPLPct = totalCost > 0 ? (unPL / totalCost) * 100 : 0;
      const sym = this.customSymbol().trim().toUpperCase() || 'CUSTOM';
      return {
        symbol: sym,
        displaySymbol: sym,
        name: this.state.i18n.t('tools.avg.customSimName', { symbol: sym }),
        assetType: this.customAssetType(),
        assetTypeLabel: getAssetTypeLabel(this.customAssetType(), undefined, lang),
        currency: this.customCurrency(),
        totalShares: shares,
        averageCost: avgCost,
        totalCost,
        currentPrice: mktPrice,
        holdingValue,
        unrealizedPL: unPL,
        unrealizedPLPercent: unPLPct,
        hasPrice: mktPrice > 0,
      };
    }

    const pos = this.selectedPosition();
    if (!pos) {
      return {
        symbol: 'NONE',
        displaySymbol: this.state.i18n.t('tools.selectSymbol'),
        name: this.state.i18n.t('tools.avg.noPosSelected'),
        assetType: 'us-stock',
        assetTypeLabel: getAssetTypeLabel('us-stock', undefined, lang),
        currency: this.state.dc(),
        totalShares: 0,
        averageCost: 0,
        totalCost: 0,
        currentPrice: 0,
        holdingValue: 0,
        unrealizedPL: 0,
        unrealizedPLPercent: 0,
        hasPrice: false,
      };
    }

    const pm = this.state.prices();
    const pd = pm.get(pos.symbol);
    const mktPrice = pd && pd.price > 0 ? pd.price : pos.currentPrice || 0;
    const mktCurr = pd?.currency || pos.currency;
    const convMktPrice = this.state.cx(mktPrice, mktCurr);
    const convAvgCost = this.state.cx(pos.averageCost, pos.currency);
    const convTotalCost = this.state.cx(pos.totalCost, pos.currency);
    const holdingVal = pos.totalShares * convMktPrice;
    const unPL = holdingVal - convTotalCost;
    const unPLPct = convTotalCost > 0 ? (unPL / convTotalCost) * 100 : 0;
    const localizedName =
      getSymbolName(pos.symbol, pos.name || '', lang, pos.nameTh || '', pos.assetType) ||
      resolveSymbolName(pos.symbol, pm, lang, pos.assetType);

    return {
      symbol: pos.symbol,
      displaySymbol: pos.displaySymbol || displaySymbol(pos.symbol),
      name: localizedName,
      assetType: pos.assetType,
      assetTypeLabel: getAssetTypeLabel(pos.assetType, pos.symbol, lang),
      currency: this.state.dc(),
      totalShares: pos.totalShares,
      averageCost: convAvgCost,
      totalCost: convTotalCost,
      currentPrice: convMktPrice,
      holdingValue: holdingVal,
      unrealizedPL: unPL,
      unrealizedPLPercent: unPLPct,
      hasPrice: convMktPrice > 0,
    };
  });

  readonly effectiveSteps = computed<SimulatedStep[]>(() => {
    const queued = [...this.queuedSteps()];
    const curShares = this.inputShares();
    const curPrice = this.inputPrice();
    const curFee = this.inputFeePercent();
    if (curShares > 0 && curPrice > 0) {
      const gross = curShares * curPrice;
      const feeAmount = gross * (curFee / 100);
      const totalCost = this.currentAction() === 'BUY' ? gross + feeAmount : gross - feeAmount;
      queued.push({
        id: 'active-input-step',
        action: this.currentAction(),
        shares: curShares,
        price: curPrice,
        feePercent: curFee,
        feeAmount,
        totalCost,
      });
    }
    return queued;
  });

  readonly simulationResult = computed<AvgCostSimulationResult>(() =>
    simulateAvgCost(this.positionSnapshot(), this.effectiveSteps())
  );

  readonly reverseGoalResult = computed<TargetAvgCostGoalResult>(() => {
    const snap = this.positionSnapshot();
    return solveTargetAvgCostGoal({
      currentShares: snap.totalShares,
      currentAvgCost: snap.averageCost,
      targetAvgCost: this.targetAvgCost(),
      purchasePrice: this.targetBuyPrice(),
      feePercent: this.targetFeePercent(),
    });
  });

  readonly costShiftBarPercent = computed<number>(() => {
    const res = this.simulationResult();
    const initAvg = res.initial.averageCost;
    const simAvg = res.simulated.averageCost;
    if (initAvg <= 0 || simAvg <= 0) return 50;
    const maxVal = Math.max(initAvg, simAvg) * 1.15;
    return Math.min(100, Math.max(5, (simAvg / maxVal) * 100));
  });

  openSymbolSheet(): void {
    this.isSymbolSheetOpen.set(true);
    void this.nativePlatform.triggerHapticSelection();
  }

  closeSymbolSheet(): void {
    this.isSymbolSheetOpen.set(false);
  }

  setAssetFilter(type: string): void {
    if (!type || type === 'all') {
      this.assetFilter.set('');
      return;
    }
    this.assetFilter.set(this.assetFilter() === type ? '' : type);
    void this.nativePlatform.triggerHapticSelection();
  }

  selectSymbol(symbol: string): void {
    this.selectedSymbol.set(symbol);
    this.isCustomMode.set(false);
    this.isSymbolSheetOpen.set(false);

    const pos = this.openPositions().find((p) => p.symbol === symbol);
    if (pos) {
      const pd = this.state.prices().get(symbol);
      const mktPrice = pd && pd.price > 0 ? pd.price : pos.currentPrice || pos.averageCost;
      const mktCurr = pd?.currency || pos.currency;
      const convMktPrice = this.state.cx(mktPrice, mktCurr);
      const convAvgCost = this.state.cx(pos.averageCost, pos.currency);

      const defaultPrice = parseFloat(convMktPrice.toFixed(4));
      const defaultShares = Math.max(1, Math.round(pos.totalShares * 0.25));
      this.inputPrice.set(defaultPrice);
      this.inputShares.set(defaultShares);
      this.inputAmount.set(parseFloat((defaultShares * defaultPrice).toFixed(2)));

      const assetType = getAssetType(pos.assetType, symbol);
      const fee = assetType === 'thai-stock' ? 0.157 : 0;
      this.inputFeePercent.set(fee);
      this.targetAvgCost.set(parseFloat((convAvgCost * 0.9).toFixed(4)));
      this.targetBuyPrice.set(parseFloat((convMktPrice * 0.95).toFixed(4)));
      this.targetFeePercent.set(fee);
    }
    void this.nativePlatform.triggerHapticSelection();
  }

  enableCustomMode(): void {
    this.isCustomMode.set(true);
    this.selectedSymbol.set('CUSTOM');
    this.isSymbolSheetOpen.set(false);
    const defaultPrice = this.customMarketPrice();
    const defaultShares = Math.round(this.customShares() * 0.25);
    this.inputPrice.set(defaultPrice);
    this.inputShares.set(defaultShares);
    this.inputAmount.set(parseFloat((defaultShares * defaultPrice).toFixed(2)));
    this.targetAvgCost.set(parseFloat((this.customAvgCost() * 0.9).toFixed(4)));
    this.targetBuyPrice.set(parseFloat((this.customMarketPrice() * 0.95).toFixed(4)));
    void this.nativePlatform.triggerHapticSelection();
  }

  setMode(m: 'forward' | 'reverse'): void {
    this.mode.set(m);
    void this.nativePlatform.triggerHapticSelection();
  }

  setAction(action: SimulationAction): void {
    this.currentAction.set(action);
    void this.nativePlatform.triggerHapticSelection();
  }

  setInputMode(m: 'shares' | 'amount'): void {
    this.inputMode.set(m);
    const price = this.inputPrice();
    if (m === 'amount') {
      this.inputAmount.set(price > 0 ? parseFloat((this.inputShares() * price).toFixed(2)) : 0);
    } else {
      this.inputShares.set(price > 0 ? parseFloat((this.inputAmount() / price).toFixed(4)) : 0);
    }
    void this.nativePlatform.triggerHapticSelection();
  }

  onSharesInput(val: number | string): void {
    const shares = Math.max(0, Number(val) || 0);
    this.inputShares.set(shares);
    const price = this.inputPrice();
    this.inputAmount.set(price > 0 ? parseFloat((shares * price).toFixed(2)) : 0);
  }

  onAmountInput(val: number | string): void {
    const amount = Math.max(0, Number(val) || 0);
    this.inputAmount.set(amount);
    const price = this.inputPrice();
    this.inputShares.set(price > 0 ? parseFloat((amount / price).toFixed(4)) : 0);
  }

  onPriceInput(val: number | string): void {
    const price = Math.max(0, Number(val) || 0);
    this.inputPrice.set(price);
    if (this.inputMode() === 'amount') {
      this.inputShares.set(price > 0 ? parseFloat((this.inputAmount() / price).toFixed(4)) : 0);
    } else {
      this.inputAmount.set(parseFloat((this.inputShares() * price).toFixed(2)));
    }
  }

  applyShareMultiplier(multiplier: number): void {
    const snap = this.positionSnapshot();
    const baseShares = snap.totalShares > 0 ? snap.totalShares : 100;
    this.onSharesInput(Math.max(1, Math.round(baseShares * multiplier)));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyMaxSellShares(): void {
    this.onSharesInput(Math.max(0, this.positionSnapshot().totalShares));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyAmountAddition(amount: number): void {
    this.onAmountInput(amount);
    void this.nativePlatform.triggerHapticSelection();
  }

  applyAmountMultiplier(multiplier: number): void {
    const snap = this.positionSnapshot();
    const baseVal = snap.holdingValue > 0 ? snap.holdingValue : snap.totalCost > 0 ? snap.totalCost : 10000;
    this.onAmountInput(parseFloat(Math.max(0, baseVal * multiplier).toFixed(2)));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyMaxSellAmount(): void {
    const snap = this.positionSnapshot();
    const price = this.inputPrice() > 0 ? this.inputPrice() : snap.currentPrice;
    this.onAmountInput(parseFloat((snap.totalShares * price).toFixed(2)));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyPriceQuickDip(percentChange: number): void {
    const basePrice = this.positionSnapshot().currentPrice || this.inputPrice();
    this.onPriceInput(getQuickAdjustedPrice(basePrice, percentChange));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyMarketPrice(): void {
    const mkt = this.positionSnapshot().currentPrice;
    if (mkt > 0) this.onPriceInput(parseFloat(mkt.toFixed(4)));
    void this.nativePlatform.triggerHapticSelection();
  }

  addStepToQueue(): void {
    const curShares = this.inputShares();
    const curPrice = this.inputPrice();
    const curFee = this.inputFeePercent();
    if (curShares <= 0 || curPrice <= 0) return;

    const gross = curShares * curPrice;
    const feeAmount = gross * (curFee / 100);
    const totalCost = this.currentAction() === 'BUY' ? gross + feeAmount : gross - feeAmount;

    this.queuedSteps.update((steps) => [
      ...steps,
      {
        id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        action: this.currentAction(),
        shares: curShares,
        price: curPrice,
        feePercent: curFee,
        feeAmount,
        totalCost,
      },
    ]);
    this.inputShares.set(0);
    void this.nativePlatform.triggerHapticSelection();
  }

  removeQueuedStep(stepId: string): void {
    this.queuedSteps.update((steps) => steps.filter((s) => s.id !== stepId));
    void this.nativePlatform.triggerHapticSelection();
  }

  clearAllSteps(): void {
    this.queuedSteps.set([]);
    this.inputShares.set(50);
    void this.nativePlatform.triggerHapticSelection();
  }

  calculate(): void {
    this.isCalculating.set(true);
    if (this.inputMode() === 'amount') {
      this.onAmountInput(this.inputAmount());
    } else {
      this.onSharesInput(this.inputShares());
    }
    const locale = this.state.i18n.lang() === 'th' ? 'th-TH' : 'en-US';
    this.lastCalculatedTime.set(
      new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    this.isCalculating.set(false);
    void this.nativePlatform.triggerHapticImpact('medium');
  }

  applyReverseGoalToSimulation(): void {
    const goal = this.reverseGoalResult();
    if (!goal.isValid || goal.requiredShares <= 0) return;
    this.mode.set('forward');
    this.currentAction.set('BUY');
    this.inputMode.set('shares');
    this.inputShares.set(parseFloat(goal.requiredShares.toFixed(4)));
    this.inputPrice.set(this.targetBuyPrice());
    this.inputFeePercent.set(this.targetFeePercent());
    this.calculate();
  }

  getDisplaySymbol = displaySymbol;
  getAssetTypeClass = getAssetTypeClass;
  getQuantityFormat = getQuantityFormat;
  getPriceFormat = getPriceFormat;
  getAssetTypeLabel = (assetType?: string, symbol?: string): string =>
    getAssetTypeLabel(assetType, symbol, this.state.i18n.lang());
  unitLabel = (symbol?: string, assetType?: string): string =>
    getUnitLabel(symbol, assetType, this.state.i18n.lang());
  unitLabelSingular = (symbol?: string, assetType?: string): string =>
    getUnitLabelSingular(symbol, assetType, this.state.i18n.lang());
  actionVerb = (): string =>
    this.state.i18n.t(
      this.currentAction() === 'BUY' ? 'tools.avg.actionBuyVerb' : 'tools.avg.actionSellVerb'
    );
  reverseGoalErrorMessage(res: TargetAvgCostGoalResult): string {
    if (res.errorKey) {
      return this.state.i18n.t(res.errorKey as TranslationKey, res.errorParams);
    }
    return res.errorMessage || '';
  }
  convertPrice(amount: number, currency: string): number {
    return convertCurrency(amount, currency, this.state.dc(), this.state.exchangeRate());
  }
}
