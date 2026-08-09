import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { SheetResult } from '../../services/share-lot.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  loading = input.required<boolean>();
  error = input.required<string | null>();
  result = input.required<SheetResult | null>();
  totalCostConverted = input.required<number>();
  totalProceedsConverted = input.required<number>();
  totalPL = input.required<number>();
  totalPLPercent = input.required<number>();
  isClosedTab = input.required<boolean>();
  isAllTab = input.required<boolean>();
  totalHoldingConverted = input.required<number>();
  totalRealizedPLConverted = input.required<number>();
  totalRealizedPLPercent = input.required<number>();
  hasRate = input.required<boolean>();
  exchangeRate = input.required<number>();
  currentView = input.required<string>();
  displayCurrency = input.required<string>();
  theme = input.required<string>();

  viewChange = output<'holdings' | 'transactions'>();
  currencyChange = output<'USD' | 'THB'>();
  themeChange = output<void>();

  dc(originalCurrency?: string): string {
    if (!this.hasRate() && originalCurrency) {
      return originalCurrency === 'USDT' ? 'USD' : originalCurrency;
    }
    return this.displayCurrency();
  }
}
