export interface SymbolAutocompleteItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  color: string;
  assetType: string;
  assetTypeLabel: string;
  isClosed: boolean;
  totalShares: number;
  totalCost: number;
  currency: string;
  holdingValue?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  realizedPL?: number;
  realizedPLPercent?: number;
  hasPrice?: boolean;
}
