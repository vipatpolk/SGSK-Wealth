export interface Transaction {
  symbol: string;
  date: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface ShareLot {
  symbol: string;
  purchaseDate: string;
  quantity: number;
  costBasis: number;
  totalCost: number;
}

export interface SymbolSummary {
  symbol: string;
  totalShares: number;
  totalCost: number;
  averageCost: number;
  currency: string;
  lots: ShareLot[];
}


