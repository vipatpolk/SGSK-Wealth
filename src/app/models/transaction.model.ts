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

export interface SymbolTransaction {
  id: string;
  symbol: string;
  date: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  rawQuantity: number;
  price: number;
  totalAmount: number;
  currency: string;
  assetType: string;
  runningShares: number;
  runningTotalCost: number;
  runningAverageCost: number;
  realizedPL?: number;
  realizedPLPercent?: number;
}

export interface SymbolTransactionSummary {
  symbol: string;
  assetType: string;
  currency: string;
  totalTransactions: number;
  buyCount: number;
  sellCount: number;
  totalBuyShares: number;
  totalSellShares: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  averageBuyPrice: number;
  averageSellPrice: number;
  netShares: number;
  netInvested: number;
  currentStatus: 'OPEN' | 'CLOSED';
  realizedPL: number;
  realizedPLPercent: number;
  firstTradeDate: string;
  lastTradeDate: string;
  transactions: SymbolTransaction[];
}

export interface TargetAllocation {
  [assetType: string]: number;
}

export interface RebalanceRecommendation {
  assetType: string;
  currentValue: number;
  actualPercent: number;
  targetPercent: number;
  rebalanceAmount: number;
  deviationPercent: number;
}

