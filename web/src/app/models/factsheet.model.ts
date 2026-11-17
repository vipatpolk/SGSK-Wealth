export interface FactsheetFeeItem {
  description: string;
  ceilingRate?: string | null;
  actualRate?: string | null;
  note?: string | null;
}

export interface FactsheetPerformanceItem {
  category: string;
  period: string;
  value?: number | null;
}

export interface FactsheetAllocationItem {
  seq: number;
  name: string;
  ratio: number;
}

export interface FactsheetHoldingItem {
  seq: number;
  name: string;
  ratio: number;
  creditRating?: string | null;
  isin?: string | null;
}

export interface FactsheetStatistics {
  maxDrawdown?: number | null;
  sharpeRatio?: number | null;
  trackingError?: number | null;
  fxHedging?: string | null;
  turnoverRatio?: number | null;
  beta?: number | null;
  alpha?: number | null;
  yieldToMaturity?: number | null;
  portfolioDuration?: string | null;
  recoveringPeriod?: string | null;
}

export interface FactsheetTradeConditions {
  minimumInitialSub?: number | null;
  minimumNextSub?: number | null;
  minimumRedempt?: number | null;
  currency?: string | null;
  subscriptionPeriod?: string | null;
  redemptionPeriod?: string | null;
  settlementPeriod?: string | null;
}

export interface FundFactsheetResponse {
  symbol: string;
  displaySymbol: string;
  assetType: string;
  projId?: string | null;
  fundName?: string | null;
  fundNameTh?: string | null;
  amcName?: string | null;
  amcNameTh?: string | null;
  fundClassName?: string | null;
  policyDesc?: string | null;
  investmentPolicyDesc?: string | null;
  managementStyle?: string | null;
  objective?: string | null;
  aimcType?: string | null;
  aimcDescription?: string | null;
  riskLevel?: string | null;
  riskDescription?: string | null;
  benchmark?: string | null;
  benchmarkRemark?: string | null;
  dividendPolicy?: string | null;
  inceptionDate?: string | null;
  pdfUrl?: string | null;
  amcUrl?: string | null;
  asOfDate?: string | null;
  feederMasterFund?: string | null;
  feederCountry?: string | null;
  fxHedgingPolicy?: string | null;
  taxIncentiveType?: string | null;
  isinCode?: string | null;
  fees: FactsheetFeeItem[];
  performance: FactsheetPerformanceItem[];
  statistics?: FactsheetStatistics | null;
  assetAllocation: FactsheetAllocationItem[];
  topHoldings: FactsheetHoldingItem[];
  tradeConditions?: FactsheetTradeConditions | null;
}

export interface FactsheetRequestTarget {
  symbol: string;
  assetType: string;
  fundName?: string;
  displayName?: string;
  displayNameTh?: string;
}
