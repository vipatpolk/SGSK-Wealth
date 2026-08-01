export interface Transaction {
  symbol: string;
  date: string;
  quantity: number;
  price: number;
  currency: string;
  assetType: string;
}

export interface ShareLot {
  symbol: string;
  purchaseDate: string;
  quantity: number;
  costBasis: number;
  totalCost: number;
  assetType: string;
}

export interface ClosedShareLot {
  symbol: string;
  purchaseDate: string;
  closeDate: string;
  quantity: number;
  costBasis: number;
  sellPrice: number;
  totalCost: number;
  totalProceeds: number;
  realizedPL: number;
  realizedPLPercent: number;
  currency: string;
  assetType: string;
}

export interface SymbolSummary {
  symbol: string;
  totalShares: number;
  totalCost: number;
  averageCost: number;
  currency: string;
  lots: ShareLot[];
  assetType: string;
}

export interface ClosedSymbolSummary {
  symbol: string;
  totalShares: number;
  closedShares: number;
  totalCost: number;
  totalProceeds: number;
  realizedPL: number;
  realizedPLPercent: number;
  averageBuyPrice: number;
  averageSellPrice: number;
  currency: string;
  lots: ClosedShareLot[];
  assetType: string;
}
