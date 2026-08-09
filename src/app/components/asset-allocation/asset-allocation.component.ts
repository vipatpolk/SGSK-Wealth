import { Component, input, signal, computed, effect, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SymbolSummary, TargetAllocation, RebalanceRecommendation } from '../../models/transaction.model';
import { PriceData } from '../../services/price.service';
import { getAssetType, getAssetTypeLabel, getSymbolColor, displaySymbol, resolveSymbolName } from '../../utils/format.utils';

@Component({
  selector: 'app-asset-allocation',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, FormsModule],
  templateUrl: './asset-allocation.component.html',
  styleUrls: ['./asset-allocation.component.css']
})
export class AssetAllocationComponent implements OnInit {
  summaries = input.required<SymbolSummary[]>();
  pricesMap = input.required<Map<string, PriceData>>();
  displayCurrency = input.required<'USD' | 'THB'>();
  exchangeRate = input.required<number>();
  hasRate = input.required<boolean>();

  private defaultTargets: TargetAllocation = {
    'us-stock': 40,
    'thai-stock': 30,
    'crypto': 15,
    'mutual-fund': 15
  };

  targetAllocation = signal<TargetAllocation>(this.defaultTargets);
  isEditingTarget = signal<boolean>(false);
  tempTargetAllocation = signal<TargetAllocation>({});
  selectedAssetType = signal<string | null>(null);

  selectAssetType(type: string | null): void {
    if (this.selectedAssetType() === type) {
      this.selectedAssetType.set(null);
    } else {
      this.selectedAssetType.set(type);
    }
  }

  readonly selectedAssetLabel = computed<string>(() => {
    const type = this.selectedAssetType();
    return type ? this.getAssetLabel(type) : 'All Classes';
  });

  readonly classHoldings = computed(() => {
    const selectedType = this.selectedAssetType();
    if (!selectedType) return [];

    const pm = this.pricesMap();
    return this.summaries()
      .filter(s => getAssetType(s.assetType, s.symbol) === selectedType)
      .map(s => {
        const pd = pm.get(s.symbol);
        const val = pd && pd.price > 0 ? this.cx(s.totalShares * pd.price, pd.currency) : 0;
        return {
          symbol: s.symbol,
          displaySymbol: displaySymbol(s.symbol),
          name: resolveSymbolName(s.symbol, pm),
          shares: s.totalShares,
          price: pd?.price || 0,
          currency: pd?.currency || 'USD',
          value: val,
          color: getSymbolColor(s.symbol)
        };
      })
      .filter(h => h.value > 0 || h.shares > 0)
      .sort((a, b) => b.value - a.value);
  });

  readonly classTotalValue = computed(() => {
    return this.classHoldings().reduce((sum, h) => sum + h.value, 0);
  });

  readonly enrichedClassHoldings = computed(() => {
    const holdings = this.classHoldings();
    const classTot = this.classTotalValue();
    const portTot = this.totalValue();

    return holdings.map(h => ({
      ...h,
      classPercent: classTot > 0 ? (h.value / classTot) * 100 : 0,
      portfolioPercent: portTot > 0 ? (h.value / portTot) * 100 : 0
    }));
  });

  constructor() {
    effect(() => {
      localStorage.setItem('sharelot_target_allocation', JSON.stringify(this.targetAllocation()));
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('sharelot_target_allocation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.targetAllocation.set({ ...this.defaultTargets, ...parsed });
        }
      } catch (e) {
        // use defaults
      }
    }
  }

  private cx(value: number, originalCurrency: string): number {
    if (!this.hasRate()) return value;
    const target = this.displayCurrency();
    const orig = originalCurrency === 'USDT' ? 'USD' : originalCurrency;
    if (orig === target) return value;
    if (orig === 'USD' && target === 'THB') return value * this.exchangeRate();
    if (orig === 'THB' && target === 'USD') return value / this.exchangeRate();
    return value;
  }

  readonly currentValues = computed(() => {
    const vals: Record<string, number> = {
      'us-stock': 0, 'thai-stock': 0, 'crypto': 0, 'mutual-fund': 0
    };
    const pm = this.pricesMap();
    for (const s of this.summaries()) {
      const pd = pm.get(s.symbol);
      if (pd && pd.price > 0) {
        const type = getAssetType(s.assetType, s.symbol);
        const val = s.totalShares * pd.price;
        if (vals[type] !== undefined) {
          vals[type] += this.cx(val, pd.currency);
        } else {
          vals[type] = this.cx(val, pd.currency);
        }
      }
    }
    return vals;
  });

  readonly totalValue = computed(() => {
    return Object.values(this.currentValues()).reduce((a, b) => a + b, 0);
  });

  readonly recommendations = computed<RebalanceRecommendation[]>(() => {
    const vals = this.currentValues();
    const total = this.totalValue();
    const targets = this.targetAllocation();
    
    const defaultKeys = ['us-stock', 'thai-stock', 'crypto', 'mutual-fund'];
    const extraKeys = Object.keys({ ...vals, ...targets }).filter(k => !defaultKeys.includes(k));
    const keys = [...defaultKeys, ...extraKeys];
    
    const recs: RebalanceRecommendation[] = [];
    for (const k of keys) {
      const val = vals[k] || 0;
      const actualPct = total > 0 ? (val / total) * 100 : 0;
      const targetPct = targets[k] || 0;
      const targetVal = (targetPct / 100) * total;
      
      recs.push({
        assetType: k,
        currentValue: val,
        actualPercent: actualPct,
        targetPercent: targetPct,
        rebalanceAmount: targetVal - val,
        deviationPercent: actualPct - targetPct
      });
    }
    
    return recs;
  });

  readonly displayTotalValue = computed(() => {
    return this.selectedAssetType() ? this.classTotalValue() : this.totalValue();
  });

  readonly currencyExposure = computed(() => {
    let usdVal = 0;
    let thbVal = 0;
    const pm = this.pricesMap();
    const selectedType = this.selectedAssetType();
    const summaries = selectedType
      ? this.summaries().filter(s => getAssetType(s.assetType, s.symbol) === selectedType)
      : this.summaries();

    for (const s of summaries) {
      const pd = pm.get(s.symbol);
      if (pd && pd.price > 0) {
        const val = this.cx(s.totalShares * pd.price, pd.currency);
        const orig = pd.currency === 'USDT' ? 'USD' : pd.currency;
        if (orig === 'USD') usdVal += val;
        else if (orig === 'THB') thbVal += val;
      }
    }
    const tot = usdVal + thbVal;
    return {
      usd: usdVal,
      thb: thbVal,
      usdPercent: tot > 0 ? (usdVal / tot) * 100 : 0,
      thbPercent: tot > 0 ? (thbVal / tot) * 100 : 0
    };
  });

  readonly allHoldings = computed(() => {
    const pm = this.pricesMap();
    const selectedType = this.selectedAssetType();
    const summaries = selectedType
      ? this.summaries().filter(s => getAssetType(s.assetType, s.symbol) === selectedType)
      : this.summaries();

    const holdings = summaries.map(s => {
      const pd = pm.get(s.symbol);
      const val = pd && pd.price > 0 ? this.cx(s.totalShares * pd.price, pd.currency) : 0;
      return {
        symbol: s.symbol,
        displaySymbol: displaySymbol(s.symbol),
        value: val,
        percent: 0,
        color: getSymbolColor(s.symbol)
      };
    }).filter(h => h.value > 0);
    
    const total = selectedType ? this.classTotalValue() : this.totalValue();
    holdings.forEach(h => h.percent = total > 0 ? (h.value / total) * 100 : 0);
    
    return holdings.sort((a, b) => b.value - a.value);
  });

  showAllHoldings = signal<boolean>(false);

  readonly displayedHoldings = computed(() => {
    const all = this.allHoldings();
    return this.showAllHoldings() ? all : all.slice(0, 5);
  });

  toggleShowAllHoldings() {
    this.showAllHoldings.update(v => !v);
  }

  readonly actualTotal = computed(() => {
    return this.recommendations().reduce((sum, r) => sum + r.actualPercent, 0);
  });

  readonly editTargetTotal = computed(() => {
    const temp = this.tempTargetAllocation();
    return Object.values(temp).reduce((sum, val) => sum + (val || 0), 0);
  });

  readonly targetTotal = computed(() => {
    return Object.values(this.targetAllocation()).reduce((sum, val) => sum + (val || 0), 0);
  });

  readonly isTargetValid = computed(() => {
    return Math.abs(this.editTargetTotal() - 100) <= 0.1;
  });

  startEditing() {
    this.tempTargetAllocation.set({ ...this.targetAllocation() });
    this.isEditingTarget.set(true);
  }

  updateTempTarget(assetType: string, value: number) {
    this.tempTargetAllocation.update(temp => ({
      ...temp,
      [assetType]: value
    }));
  }

  saveTargets() {
    if (!this.isTargetValid()) {
      alert(`Target allocation must sum to 100%. Current sum: ${this.editTargetTotal()}%`);
      return;
    }
    this.targetAllocation.set({ ...this.tempTargetAllocation() });
    this.isEditingTarget.set(false);
  }

  cancelEditing() {
    this.isEditingTarget.set(false);
  }

  getAssetColor(type: string): string {
    switch(type) {
      case 'us-stock': return '#3b82f6';
      case 'thai-stock': return '#10b981';
      case 'crypto': return '#f59e0b';
      case 'mutual-fund': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getAssetLabel(type: string): string {
    return getAssetTypeLabel(type);
  }

  readonly donutSegments = computed(() => {
    const selectedType = this.selectedAssetType();
    let cumulativePercent = 0;
    
    if (!selectedType) {
      const recs = this.recommendations();
      return recs.map(r => {
        const percent = r.actualPercent;
        const offset = 100 - cumulativePercent;
        cumulativePercent += percent;
        
        return {
          key: r.assetType,
          label: this.getAssetLabel(r.assetType),
          actualPercent: percent,
          dashArray: `${Math.max(percent, 0.001)} ${100 - Math.max(percent, 0.001)}`,
          dashOffset: offset,
          color: this.getAssetColor(r.assetType)
        };
      });
    } else {
      const holdings = this.enrichedClassHoldings();
      return holdings.map(h => {
        const percent = h.classPercent;
        const offset = 100 - cumulativePercent;
        cumulativePercent += percent;
        
        return {
          key: h.symbol,
          label: h.displaySymbol,
          actualPercent: percent,
          dashArray: `${Math.max(percent, 0.001)} ${100 - Math.max(percent, 0.001)}`,
          dashOffset: offset,
          color: h.color
        };
      });
    }
  });

}
