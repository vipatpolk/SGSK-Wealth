import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioPosition, PortfolioSummary } from '@shared/models/portfolio.model';
import { PriceData } from '@shared/services/price.service';
import { I18nService } from '@shared/services/i18n.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { AvgCostSimulationResult, ToolDefinition, ToolId } from '@shared/models/tools.model';
import { AvgCostCalculatorComponent } from './avg-cost-calculator/avg-cost-calculator.component';
import { TvmCalculatorComponent } from './tvm-calculator/tvm-calculator.component';
import { RebalanceCalculatorComponent } from '@app/features/tools/rebalance-calculator/rebalance-calculator.component';

@Component({
  selector: 'app-tools',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    AvgCostCalculatorComponent,
    TvmCalculatorComponent,
    RebalanceCalculatorComponent,
  ],
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.css'],
})
export class ToolsComponent {
  readonly i18n = inject(I18nService);
  portfolioPositions = input.required<PortfolioPosition[]>();
  portfolioSummary = input<PortfolioSummary | null>(null);
  pricesMap = input.required<Map<string, PriceData>>();
  displayCurrency = input.required<'USD' | 'THB'>();
  exchangeRate = input.required<number>();
  hasRate = input.required<boolean>();
  privacyMode = input<boolean>(false);
  initialToolId = input<ToolId | undefined>(undefined);

  selectedSymbolChange = output<string>();

  readonly activeToolId = signal<ToolId>('avg-cost-calculator');
  readonly selectedToolSymbol = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      const tool = this.initialToolId();
      if (tool) {
        // Run untracked so language switches do not re-trigger this effect via localizedToolsList().
        untracked(() => this.selectTool(tool));
      }
    });
  }

  private readonly localizedToolsList = computed<ToolDefinition[]>(() => {
    this.i18n.lang();
    return [
      {
        id: 'avg-cost-calculator',
        title: this.i18n.t('tools.avgCost.title'),
        shortTitle: this.i18n.t('tools.avgCost.short'),
        description: this.i18n.t('tools.avgCost.desc'),
        icon: 'calculator',
        badge: this.i18n.t('tools.activeBadge'),
        isReady: true,
      },
      {
        id: 'tvm-calculator',
        title: this.i18n.t('tools.tvm.title'),
        shortTitle: this.i18n.t('tools.tvm.short'),
        description: this.i18n.t('tools.tvm.desc'),
        icon: 'trending-up',
        badge: this.i18n.t('tools.activeBadge'),
        isReady: true,
      },
      {
        id: 'rebalance-planner',
        title: this.i18n.t('tools.rebalance.title'),
        shortTitle: this.i18n.t('tools.rebalance.short'),
        description: this.i18n.t('tools.rebalance.desc'),
        icon: 'pie-chart',
        badge: this.i18n.t('tools.activeBadge'),
        isReady: true,
      },
    ];
  });

  get toolsList(): ToolDefinition[] {
    return this.localizedToolsList();
  }

  readonly activeTool = computed(() => {
    const list = this.localizedToolsList();
    return list.find((t) => t.id === this.activeToolId()) || list[0];
  });

  selectTool(toolId: ToolId): void {
    const tool = this.toolsList.find((t) => t.id === toolId);
    if (tool && tool.isReady) {
      this.activeToolId.set(toolId);
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onSymbolChange(symbol: string): void {
    this.selectedToolSymbol.set(symbol);
    this.selectedSymbolChange.emit(symbol);
  }
}
