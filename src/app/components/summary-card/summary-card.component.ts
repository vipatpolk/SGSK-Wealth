import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './summary-card.component.html'
})
export class SummaryCardComponent {
  type = input.required<'open' | 'closed'>();
  summary = input.required<any>();
  isAllTab = input.required<boolean>();
  isClosedTab = input.required<boolean>();
  hasPriceData = input.required<boolean>();
  pricesLoading = input.required<boolean>();
  isExpanded = input.required<boolean>();
  
  toggleExpand = output<string>();
  openHistory = output<string>();
  
  // Formatters as inputs
  getSymbolColor = input.required<(symbol: string) => string>();
  getDisplaySymbol = input.required<(symbol: string) => string>();
  getSymbolName = input.required<(symbol: string) => string>();
  getAssetTypeClass = input.required<(type?: string, symbol?: string) => string>();
  getAssetTypeLabel = input.required<(type?: string, symbol?: string) => string>();
  getQuantityFormat = input.required<(symbol: string) => string>();
  getPriceFormat = input.required<(symbol: string) => string>();
  
  // Currency handling
  cx = input.required<(amount: number, currency: string) => number>();
  dc = input.required<(currency?: string) => string>();
  
  // Metrics for open positions
  getCurrentPriceConverted = input.required<(summary: any) => number>();
  getHoldingValue = input.required<(summary: any) => number>();
  getUnrealizedPL = input.required<(summary: any) => number>();
  getUnrealizedPLPercent = input.required<(summary: any) => number>();
  getLotHoldingValue = input.required<(lot: any, summary: any) => number>();
  getLotUnrealizedPL = input.required<(lot: any, summary: any) => number>();
}
