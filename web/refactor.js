const fs = require('fs');
const path = require('path');

const appTsPath = path.join(__dirname, 'src/app/app.ts');
const appHtmlPath = path.join(__dirname, 'src/app/app.html');

let appTs = fs.readFileSync(appTsPath, 'utf8');
let appHtml = fs.readFileSync(appHtmlPath, 'utf8');

const componentsDir = path.join(__dirname, 'src/app/components');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. Header Component
const headerDir = path.join(componentsDir, 'header');
if (!fs.existsSync(headerDir)) fs.mkdirSync(headerDir, { recursive: true });

const headerTs = `import { Component, input, output } from '@angular/core';
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
  currentView = input.required<'holdings' | 'transactions'>();
  displayCurrency = input.required<'USD' | 'THB'>();
  theme = input.required<'dark' | 'light'>();

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
`;

fs.writeFileSync(path.join(headerDir, 'header.component.ts'), headerTs);

// Header HTML Extraction
const headerHtmlStart = appHtml.indexOf('<header class="header">');
const headerHtmlEnd = appHtml.indexOf('</header>') + '</header>'.length;
let headerHtml = appHtml.substring(headerHtmlStart, headerHtmlEnd);

// In headerHtml, change view-toggle calls and signals
// For signals, input() in template can be used with () as function
// For outputs, emit
headerHtml = headerHtml.replace(/setView\(/g, 'viewChange.emit(');
headerHtml = headerHtml.replace(/displayCurrency\.set\(/g, 'currencyChange.emit(');
headerHtml = headerHtml.replace(/toggleTheme\(\)/g, 'themeChange.emit()');

fs.writeFileSync(path.join(headerDir, 'header.component.html'), headerHtml);

// 2. Tab Bar Component
const tabBarDir = path.join(componentsDir, 'tab-bar');
if (!fs.existsSync(tabBarDir)) fs.mkdirSync(tabBarDir, { recursive: true });

const tabBarTs = `import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AssetTab } from '../../config/sheet.config';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './tab-bar.component.html'
})
export class TabBarComponent {
  currentView = input.required<'holdings' | 'transactions'>();
  tabs = input.required<AssetTab[]>();
  activeTab = input.required<AssetTab>();
  isTabDropdownOpen = input.required<boolean>();

  tabSelect = output<AssetTab>();
  toggleDropdown = output<void>();
}
`;
fs.writeFileSync(path.join(tabBarDir, 'tab-bar.component.ts'), tabBarTs);

const tabBarHtmlStart = appHtml.indexOf("<!-- Tab Bar -->");
const tabBarHtmlEnd = appHtml.indexOf("<!-- Screen Loading Overlay (Hides contents while data is loading) -->");
let tabBarHtml = appHtml.substring(tabBarHtmlStart, tabBarHtmlEnd).trim();

tabBarHtml = tabBarHtml.replace(/selectTab\(/g, 'tabSelect.emit(');
tabBarHtml = tabBarHtml.replace(/toggleTabDropdown\(\)/g, 'toggleDropdown.emit()');
fs.writeFileSync(path.join(tabBarDir, 'tab-bar.component.html'), tabBarHtml);

// 3. Search Bar Component
const searchBarDir = path.join(componentsDir, 'search-bar');
if (!fs.existsSync(searchBarDir)) fs.mkdirSync(searchBarDir, { recursive: true });

const searchBarTs = `import { Component, input, output } from '@angular/core';
import { SymbolAutocompleteItem } from '../../app';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  templateUrl: './search-bar.component.html'
})
export class SearchBarComponent {
  searchQuery = input.required<string>();
  isSearchFocused = input.required<boolean>();
  isSearchDropdownOpen = input.required<boolean>();
  searchActiveIndex = input.required<number>();
  autocompleteSuggestions = input.required<SymbolAutocompleteItem[]>();
  filteredSummariesCount = input.required<number>();
  filteredClosedSummariesCount = input.required<number>();
  isClosedTab = input.required<boolean>();
  isAllTab = input.required<boolean>();

  searchInput = output<string>();
  searchFocus = output<void>();
  searchKeydown = output<KeyboardEvent>();
  clearSearch = output<HTMLInputElement>();
  selectItem = output<SymbolAutocompleteItem>();
  closeDropdown = output<void>();
  refresh = output<void>();
  expandAll = output<void>();
  collapseAll = output<void>();
  setSearchActiveIndex = output<number>();
  
  getAssetTypeClass(assetType: string | undefined, symbol: string | undefined): string {
    // A bit hacky, but better than copying formatting utils
    return 'asset-type-badge';
  }
}
`;
fs.writeFileSync(path.join(searchBarDir, 'search-bar.component.ts'), searchBarTs);

const searchBarHtmlStart = appHtml.indexOf("<!-- Toolbar -->");
const searchBarHtmlEnd = appHtml.indexOf("<!-- Mobile Controls Bar (Filter & Sort) -->");
let searchBarHtml = appHtml.substring(searchBarHtmlStart, searchBarHtmlEnd).trim();

searchBarHtml = searchBarHtml.replace(/onSearchInput\(\$any\(\$event\.target\)\.value\)/g, 'searchInput.emit($any($event.target).value)');
searchBarHtml = searchBarHtml.replace(/onSearchFocus\(\)/g, 'searchFocus.emit()');
searchBarHtml = searchBarHtml.replace(/onSearchKeydown\(\$event\)/g, 'searchKeydown.emit($event)');
searchBarHtml = searchBarHtml.replace(/clearSearchQuery\(searchInput\)/g, 'clearSearch.emit(searchInput)');
searchBarHtml = searchBarHtml.replace(/selectAutocompleteItem\(item\)/g, 'selectItem.emit(item)');
searchBarHtml = searchBarHtml.replace(/closeSearchDropdown\(\)/g, 'closeDropdown.emit()');
searchBarHtml = searchBarHtml.replace(/refresh\(\)/g, 'refresh.emit()');
searchBarHtml = searchBarHtml.replace(/expandAll\(\)/g, 'expandAll.emit()');
searchBarHtml = searchBarHtml.replace(/collapseAll\(\)/g, 'collapseAll.emit()');
searchBarHtml = searchBarHtml.replace(/searchActiveIndex\.set\(i\)/g, 'setSearchActiveIndex.emit(i)');
fs.writeFileSync(path.join(searchBarDir, 'search-bar.component.html'), searchBarHtml);

// 4. Filters Component
const filtersDir = path.join(componentsDir, 'filters');
if (!fs.existsSync(filtersDir)) fs.mkdirSync(filtersDir, { recursive: true });

const filtersTs = `import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filters',
  standalone: true,
  templateUrl: './filters.component.html'
})
export class FiltersComponent {
  isClosedTab = input.required<boolean>();
  closedAssetTypeOptions = input.required<any[]>();
  selectedClosedAssetType = input.required<string>();
  isMobileFilterDropdownOpen = input.required<boolean>();
  
  sortOptions = input.required<any[]>();
  sortField = input.required<string>();
  sortDirection = input.required<'asc' | 'desc'>();
  isMobileSortDropdownOpen = input.required<boolean>();
  
  toggleMobileFilter = output<void>();
  setClosedAssetType = output<string>();
  toggleMobileSort = output<void>();
  setSort = output<string>();
  toggleSortDir = output<void>();
}
`;
fs.writeFileSync(path.join(filtersDir, 'filters.component.ts'), filtersTs);

const filtersHtmlStart = appHtml.indexOf("<!-- Mobile Controls Bar (Filter & Sort) -->");
const filtersHtmlEnd = appHtml.indexOf("<!-- Price Loading Indicator -->");
let filtersHtml = appHtml.substring(filtersHtmlStart, filtersHtmlEnd).trim();

filtersHtml = filtersHtml.replace(/toggleMobileFilterDropdown\(\)/g, 'toggleMobileFilter.emit()');
filtersHtml = filtersHtml.replace(/setClosedAssetTypeFilter\(opt\.id\)/g, 'setClosedAssetType.emit(opt.id)');
filtersHtml = filtersHtml.replace(/toggleMobileSortDropdown\(\)/g, 'toggleMobileSort.emit()');
filtersHtml = filtersHtml.replace(/setSort\(opt\.field\)/g, 'setSort.emit(opt.field)');
filtersHtml = filtersHtml.replace(/toggleSortDirection\(\)/g, 'toggleSortDir.emit()');
fs.writeFileSync(path.join(filtersDir, 'filters.component.html'), filtersHtml);

// 5. Summary Card Component
const cardDir = path.join(componentsDir, 'summary-card');
if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, { recursive: true });

const cardTs = `import { Component, input, output } from '@angular/core';
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
`;
fs.writeFileSync(path.join(cardDir, 'summary-card.component.ts'), cardTs);

const cardHtmlStart = appHtml.indexOf("<!-- ================= TEMPLATE: OPEN POSITION CARD ================= -->");
const cardHtmlEnd = appHtml.indexOf("</main>");
let cardHtmlRaw = appHtml.substring(cardHtmlStart, cardHtmlEnd).trim();

// The card template uses ng-template. I will wrap them in @if (type() === 'open') ... @else ...
// But to make it easier, let's just grab the contents.
let openContent = cardHtmlRaw.substring(
  cardHtmlRaw.indexOf('<div class="symbol-card"'),
  cardHtmlRaw.indexOf('</ng-template>')
);
let closedHtmlRaw = cardHtmlRaw.substring(cardHtmlRaw.indexOf("<!-- ================= TEMPLATE: CLOSED POSITION CARD ================= -->"));
let closedContent = closedHtmlRaw.substring(
  closedHtmlRaw.indexOf('<div class="symbol-card"'),
  closedHtmlRaw.indexOf('</ng-template>')
);

openContent = openContent.replace(/toggleExpand\(summary\.symbol\)/g, 'toggleExpand.emit(summary.symbol)');
openContent = openContent.replace(/openTransactionHistory\(summary\.symbol\)/g, 'openHistory.emit(summary.symbol)');
openContent = openContent.replace(/isExpanded\(summary\.symbol\)/g, 'isExpanded()');

closedContent = closedContent.replace(/toggleExpand\(summary\.symbol\)/g, 'toggleExpand.emit(summary.symbol)');
closedContent = closedContent.replace(/openTransactionHistory\(summary\.symbol\)/g, 'openHistory.emit(summary.symbol)');
closedContent = closedContent.replace(/isExpanded\(summary\.symbol\)/g, 'isExpanded()');

// Replace function calls with () for signal-based inputs
openContent = openContent.replace(/getSymbolColor\(/g, 'getSymbolColor()(');
openContent = openContent.replace(/getDisplaySymbol\(/g, 'getDisplaySymbol()(');
openContent = openContent.replace(/getSymbolName\(/g, 'getSymbolName()(');
openContent = openContent.replace(/getAssetTypeClass\(/g, 'getAssetTypeClass()(');
openContent = openContent.replace(/getAssetTypeLabel\(/g, 'getAssetTypeLabel()(');
openContent = openContent.replace(/getQuantityFormat\(/g, 'getQuantityFormat()(');
openContent = openContent.replace(/getPriceFormat\(/g, 'getPriceFormat()(');
openContent = openContent.replace(/cx\(/g, 'cx()(');
openContent = openContent.replace(/dc\(/g, 'dc()(');
openContent = openContent.replace(/getCurrentPriceConverted\(/g, 'getCurrentPriceConverted()(');
openContent = openContent.replace(/getHoldingValue\(/g, 'getHoldingValue()(');
openContent = openContent.replace(/getUnrealizedPL\(/g, 'getUnrealizedPL()(');
openContent = openContent.replace(/getUnrealizedPLPercent\(/g, 'getUnrealizedPLPercent()(');
openContent = openContent.replace(/getLotHoldingValue\(/g, 'getLotHoldingValue()(');
openContent = openContent.replace(/getLotUnrealizedPL\(/g, 'getLotUnrealizedPL()(');

closedContent = closedContent.replace(/getSymbolColor\(/g, 'getSymbolColor()(');
closedContent = closedContent.replace(/getDisplaySymbol\(/g, 'getDisplaySymbol()(');
closedContent = closedContent.replace(/getSymbolName\(/g, 'getSymbolName()(');
closedContent = closedContent.replace(/getAssetTypeClass\(/g, 'getAssetTypeClass()(');
closedContent = closedContent.replace(/getAssetTypeLabel\(/g, 'getAssetTypeLabel()(');
closedContent = closedContent.replace(/getQuantityFormat\(/g, 'getQuantityFormat()(');
closedContent = closedContent.replace(/getPriceFormat\(/g, 'getPriceFormat()(');
closedContent = closedContent.replace(/cx\(/g, 'cx()(');
closedContent = closedContent.replace(/dc\(/g, 'dc()(');

const cardHtml = \`@if (type() === 'open') {
\${openContent}
} @else {
\${closedContent}
}
\`;

fs.writeFileSync(path.join(cardDir, 'summary-card.component.html'), cardHtml);

console.log('Components extracted.');
