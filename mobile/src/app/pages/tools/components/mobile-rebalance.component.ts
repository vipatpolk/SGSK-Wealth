import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SymbolIconComponent } from '@shared/components/symbol-icon/symbol-icon.component';
import { PortfolioPosition } from '@shared/models/portfolio.model';
import {
  AssetClassRebalanceGroup,
  NoSellSubMode,
  RebalanceMode,
  RebalancePlanResult,
  RebalanceTradeOrder,
} from '@shared/models/tools.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { displaySymbol, getAssetType } from '@shared/utils/format.utils';
import {
  calculateRebalancePlan,
  getCurrentWeightsForClass,
  getEqualWeightsForClass,
  normalizeWeightsTo100,
} from '@shared/utils/rebalance-calculator.utils';
import { MobileStateService } from '../../../services/mobile-state.service';
import { NativePlatformService } from '../../../services/native-platform.service';

@Component({
  selector: 'app-mobile-rebalance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, FormsModule, TranslatePipe, SymbolIconComponent],
  templateUrl: './mobile-rebalance.component.html',
  styleUrl: './mobile-rebalance.component.css',
})
export class MobileRebalanceComponent implements OnInit {
  readonly state = inject(MobileStateService);
  private readonly nativePlatform = inject(NativePlatformService);

  readonly mode = signal<RebalanceMode>('standard');
  readonly noSellSubMode = signal<NoSellSubMode>('min-inflow');
  readonly selectedAssetClassFilter = signal<string>('all');
  readonly customCashDeposit = signal<number>(1000);
  readonly targetAllocations = signal<Record<string, number>>({});
  readonly isCopiedOrders = signal<boolean>(false);
  readonly isOrdersExpanded = signal<boolean>(true);

  private readonly STORAGE_KEY = 'sgsk_wealth_tools_rebalance_targets';
  private readonly LEGACY_STORAGE_KEY = 'sharelot_tools_rebalance_targets';

  readonly displaySymbolFn = displaySymbol;

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved =
          localStorage.getItem(this.STORAGE_KEY) ||
          localStorage.getItem(this.LEGACY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            this.targetAllocations.set(parsed as Record<string, number>);
          }
        }
      } catch {
        // Use defaults
      }
    }
  }

  private readonly openPositions = computed<PortfolioPosition[]>(
    () => this.state.localizedPortfolioData()?.openPositions ?? []
  );

  constructor() {
    effect(() => {
      const positions = this.openPositions();
      if (!positions || positions.length === 0) return;

      const currentAlloc = { ...this.targetAllocations() };
      let hasChanges = false;

      const classMap = new Map<string, string[]>();
      for (const p of positions) {
        const atype = getAssetType(p.assetType, p.symbol);
        const list = classMap.get(atype) || [];
        list.push(p.symbol);
        classMap.set(atype, list);
      }

      for (const [, symList] of classMap.entries()) {
        const unassigned = symList.filter((s) => currentAlloc[s] === undefined);
        if (unassigned.length > 0) {
          const equal = getEqualWeightsForClass(symList);
          for (const s of symList) {
            currentAlloc[s] = equal[s] || 0;
          }
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this.targetAllocations.set(currentAlloc);
      }
    });

    effect(() => {
      const targets = this.targetAllocations();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(targets));
          localStorage.setItem(this.LEGACY_STORAGE_KEY, JSON.stringify(targets));
        } catch {
          // Ignore storage quota errors
        }
      }
    });
  }

  readonly masterPlan = computed<RebalancePlanResult>(() =>
    calculateRebalancePlan(
      this.openPositions(),
      this.state.prices(),
      {
        mode: this.mode(),
        noSellSubMode: this.noSellSubMode(),
        customCashDeposit: Math.max(0, this.customCashDeposit()),
        targetAllocations: this.targetAllocations(),
        selectedAssetClassFilter: this.selectedAssetClassFilter(),
      },
      this.state.displayCurrency(),
      this.state.exchangeRate(),
      this.state.i18n.lang()
    )
  );

  readonly availableAssetClasses = computed<{ id: string; label: string; count: number }[]>(() => {
    const plan = this.masterPlan();
    this.state.i18n.lang();
    const list = plan.groups.map((g) => ({
      id: g.assetType,
      label: g.label,
      count: g.symbols.length,
    }));
    return [
      {
        id: 'all',
        label: this.state.i18n.t('asset.allClasses'),
        count: plan.groups.reduce((acc, g) => acc + g.symbols.length, 0),
      },
      ...list,
    ];
  });

  readonly displayedGroups = computed<AssetClassRebalanceGroup[]>(() => {
    const filter = this.selectedAssetClassFilter();
    const plan = this.masterPlan();
    if (filter === 'all') return plan.groups;
    return plan.groups.filter((g) => g.assetType === filter);
  });

  readonly filteredCurrentValue = computed<number>(() =>
    this.displayedGroups().reduce((sum, g) => sum + g.currentValue, 0)
  );

  readonly filteredCashContribution = computed<number>(() => {
    if (this.mode() === 'standard') return 0;
    return this.displayedGroups().reduce(
      (sum, g) => sum + (this.noSellSubMode() === 'min-inflow' ? g.minInflowRequired : g.totalBuyAmount),
      0
    );
  });

  readonly filteredBuyAmount = computed<number>(() =>
    this.displayedGroups().reduce((sum, g) => sum + g.totalBuyAmount, 0)
  );

  readonly filteredSellAmount = computed<number>(() =>
    this.displayedGroups().reduce((sum, g) => sum + g.totalSellAmount, 0)
  );

  readonly filteredTargetValue = computed<number>(() =>
    this.mode() === 'standard'
      ? this.filteredCurrentValue()
      : this.filteredCurrentValue() + this.filteredCashContribution()
  );

  readonly currentValueLabel = computed<string>(() => {
    this.state.i18n.lang();
    return this.selectedAssetClassFilter() === 'all'
      ? this.state.i18n.t('tools.reb.currentPortfolioVal')
      : this.state.i18n.t('tools.reb.currentClassVal');
  });

  readonly targetValueLabel = computed<string>(() => {
    this.state.i18n.lang();
    return this.selectedAssetClassFilter() === 'all'
      ? this.state.i18n.t('tools.reb.resultingPortfolioVal')
      : this.state.i18n.t('tools.reb.resultingClassVal');
  });

  readonly filteredOrders = computed<RebalanceTradeOrder[]>(() => {
    const filter = this.selectedAssetClassFilter();
    const all = this.masterPlan().orders;
    if (filter === 'all') return all;
    return all.filter((o) => o.assetType === filter);
  });

  setMode(mode: RebalanceMode): void {
    this.mode.set(mode);
    void this.nativePlatform.triggerHapticSelection();
  }

  setNoSellSubMode(subMode: NoSellSubMode): void {
    this.noSellSubMode.set(subMode);
    void this.nativePlatform.triggerHapticSelection();
  }

  setAssetClassFilter(filter: string): void {
    this.selectedAssetClassFilter.set(filter);
    void this.nativePlatform.triggerHapticSelection();
  }

  setCustomCashDeposit(val: number | string): void {
    this.customCashDeposit.set(Math.max(0, Number(val) || 0));
  }

  adjustCashDeposit(delta: number): void {
    this.customCashDeposit.update((v) => Math.max(0, v + delta));
    void this.nativePlatform.triggerHapticSelection();
  }

  updateTarget(symbol: string, targetPct: number | string): void {
    const num = Number(targetPct) || 0;
    const sanitized = Math.min(100, Math.max(0, parseFloat(num.toFixed(2)) || 0));
    this.targetAllocations.update((curr) => ({
      ...curr,
      [symbol]: sanitized,
    }));
  }

  adjustTarget(symbol: string, delta: number): void {
    const curVal = this.targetAllocations()[symbol] ?? 0;
    this.updateTarget(symbol, curVal + delta);
    void this.nativePlatform.triggerHapticSelection();
  }

  applyEqualWeight(group: AssetClassRebalanceGroup): void {
    const syms = group.symbols.map((s) => s.symbol);
    const equal = getEqualWeightsForClass(syms);
    this.targetAllocations.update((curr) => ({ ...curr, ...equal }));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyCurrentWeight(group: AssetClassRebalanceGroup): void {
    const current = getCurrentWeightsForClass(group.symbols);
    this.targetAllocations.update((curr) => ({ ...curr, ...current }));
    void this.nativePlatform.triggerHapticSelection();
  }

  applyNormalize(group: AssetClassRebalanceGroup): void {
    const syms = group.symbols.map((s) => s.symbol);
    const normalized = normalizeWeightsTo100(this.targetAllocations(), syms);
    this.targetAllocations.update((curr) => ({ ...curr, ...normalized }));
    void this.nativePlatform.triggerHapticSelection();
  }

  toggleOrdersExpanded(): void {
    this.isOrdersExpanded.update((v) => !v);
    void this.nativePlatform.triggerHapticSelection();
  }

  async copyTradePlan(): Promise<void> {
    const orders = this.filteredOrders();
    if (orders.length === 0) return;

    const locale = this.state.i18n.lang() === 'th' ? 'th-TH' : 'en-US';
    const dc = this.state.dc();
    const lines = [
      this.state.i18n.t('tools.reb.clipHeader', { date: new Date().toLocaleDateString(locale) }),
      this.state.i18n.t('tools.reb.clipMode', {
        mode:
          this.mode() === 'standard'
            ? this.state.i18n.t('tools.reb.clipModeStandard')
            : this.state.i18n.t('tools.reb.clipModeNoSell'),
      }),
      this.state.i18n.t('tools.reb.clipCurrency', { currency: dc }),
      '------------------------------------',
      ...orders.map(
        (o) =>
          `${o.action} ${o.displaySymbol} — ${o.shares.toLocaleString()} @ ${o.price.toFixed(2)} (${o.amount.toLocaleString(locale, { maximumFractionDigits: 2 })} ${dc})`
      ),
    ];

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(lines.join('\n'));
      }
      this.isCopiedOrders.set(true);
      void this.nativePlatform.triggerHapticImpact('light');
      setTimeout(() => this.isCopiedOrders.set(false), 2000);
    } catch {
      // Ignore clipboard failure in headless test environments
    }
  }
}
