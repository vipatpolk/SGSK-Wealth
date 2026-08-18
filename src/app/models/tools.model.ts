import { PortfolioPosition } from './portfolio.model';
import { PriceData } from '../services/price.service';

export type ToolId = 'avg-cost-calculator' | 'dca-simulator' | 'rebalance-planner';

export interface ToolDefinition {
  id: ToolId;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  badge?: string;
  isReady: boolean;
}

export type SimulationAction = 'BUY' | 'SELL';

export interface SimulatedStep {
  id: string;
  action: SimulationAction;
  shares: number;
  price: number;
  feePercent: number;
  feeAmount: number;
  totalCost: number; // Gross + fee for BUY, Gross - fee for SELL
}

export interface PositionSnapshot {
  symbol: string;
  displaySymbol: string;
  name: string;
  assetType: string;
  assetTypeLabel: string;
  currency: string;
  totalShares: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  holdingValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  hasPrice: boolean;
}

export interface SimulationStateMetrics {
  totalShares: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  holdingValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedPL: number;
  totalOutlay: number;
  totalProceeds: number;
  totalFees: number;
}

export interface SimulationDeltaMetrics {
  shares: number;
  sharesPercent: number;
  averageCost: number;
  averageCostPercent: number;
  totalCost: number;
  holdingValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  breakevenDistanceInitial: number; // % needed to reach avgCost from currentPrice
  breakevenDistanceSimulated: number;
}

export interface AvgCostSimulationResult {
  initial: PositionSnapshot;
  simulated: SimulationStateMetrics;
  delta: SimulationDeltaMetrics;
  steps: SimulatedStep[];
}

export interface TargetAvgCostGoalInput {
  currentShares: number;
  currentAvgCost: number;
  targetAvgCost: number;
  purchasePrice: number;
  feePercent?: number;
}

export interface TargetAvgCostGoalResult {
  isValid: boolean;
  errorMessage?: string;
  requiredShares: number;
  requiredCapital: number;
  feeAmount: number;
  totalOutlay: number;
  newTotalShares: number;
  newTotalCost: number;
  achievedAvgCost: number;
}
