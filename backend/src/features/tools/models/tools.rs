use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::error::ValidatePayload;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum OrderAction {
    Buy,
    Sell,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulatedStepModel {
    pub action: OrderAction,
    pub shares: f64,
    pub price: f64,
    #[serde(default)]
    pub fee_percent: f64,
    #[serde(default)]
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PositionSnapshotModel {
    #[serde(default)]
    pub symbol: String,
    #[serde(default)]
    pub shares: f64,
    #[serde(default)]
    pub avg_cost: f64,
    #[serde(default)]
    pub market_price: f64,
    #[serde(default = "default_usd")]
    pub currency: String,
    #[serde(default)]
    pub total_cost: Option<f64>,
}

impl Default for PositionSnapshotModel {
    fn default() -> Self {
        Self {
            symbol: String::new(),
            shares: 0.0,
            avg_cost: 0.0,
            market_price: 0.0,
            currency: default_usd(),
            total_cost: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulateOrderRequest {
    #[serde(default)]
    pub initial_position: Option<PositionSnapshotModel>,
    #[serde(default)]
    pub symbol: Option<String>,
    #[serde(default)]
    pub steps: Vec<SimulatedStepModel>,
    #[serde(default = "default_usd")]
    pub currency: String,
    #[serde(default)]
    pub tax_fee_percent: f64,
}

impl ValidatePayload for SimulateOrderRequest {
    fn validate(&self) -> Result<(), String> {
        if let Some(pos) = &self.initial_position {
            if pos.shares < 0.0 || pos.avg_cost < 0.0 || pos.market_price < 0.0 {
                return Err("Position snapshot metrics must be non-negative".to_string());
            }
        }
        if self.tax_fee_percent < 0.0 {
            return Err("taxFeePercent must be >= 0".to_string());
        }
        for step in &self.steps {
            if step.shares <= 0.0 || step.price <= 0.0 || step.fee_percent < 0.0 {
                return Err("Step shares and price must be > 0 and feePercent >= 0".to_string());
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulationStateMetrics {
    pub total_shares: f64,
    pub average_cost: f64,
    pub total_cost: f64,
    pub market_price: f64,
    pub holding_value: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "unrealizedPLPercent")]
    pub unrealized_pl_percent: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulationDeltaMetrics {
    pub shares: f64,
    pub shares_percent: f64,
    pub average_cost: f64,
    pub average_cost_percent: f64,
    pub total_cost: f64,
    pub total_cost_percent: f64,
    pub holding_value: f64,
    pub holding_value_percent: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "unrealizedPLPercent")]
    pub unrealized_pl_percent: f64,
    pub breakeven_distance_initial: f64,
    pub breakeven_distance_simulated: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulateOrderResponse {
    pub initial: SimulationStateMetrics,
    pub simulated: SimulationStateMetrics,
    pub delta: SimulationDeltaMetrics,
    pub steps: Vec<SimulatedStepModel>,
    pub total_capital_outlay: f64,
    pub total_proceeds: f64,
    pub total_fees: f64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SolveTargetCostRequest {
    #[serde(default)]
    pub initial_position: Option<PositionSnapshotModel>,
    #[serde(default)]
    pub symbol: Option<String>,
    pub target_avg_cost: f64,
    pub purchase_price: f64,
    #[serde(default)]
    pub fee_percent: f64,
    #[serde(default = "default_usd")]
    pub currency: String,
}

impl ValidatePayload for SolveTargetCostRequest {
    fn validate(&self) -> Result<(), String> {
        if let Some(pos) = &self.initial_position {
            if pos.shares < 0.0 || pos.avg_cost < 0.0 || pos.market_price < 0.0 {
                return Err("Position snapshot metrics must be non-negative".to_string());
            }
        }
        if self.target_avg_cost <= 0.0 || self.purchase_price <= 0.0 || self.fee_percent < 0.0 {
            return Err(
                "targetAvgCost and purchasePrice must be > 0 and feePercent >= 0".to_string(),
            );
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SolveTargetCostResponse {
    pub is_valid: bool,
    #[serde(default)]
    pub error_message: String,
    #[serde(default)]
    pub required_shares: f64,
    #[serde(default)]
    pub required_capital: f64,
    #[serde(default)]
    pub fee_amount: f64,
    #[serde(default)]
    pub total_outlay: f64,
    #[serde(default)]
    pub achieved_avg_cost: f64,
    #[serde(default)]
    pub new_total_shares: f64,
    #[serde(default)]
    pub new_total_cost: f64,
    #[serde(default = "default_usd")]
    pub currency: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum CompoundingFrequency {
    Daily,
    Weekly,
    Biweekly,
    Semimonthly,
    Monthly,
    Quarterly,
    Semiannually,
    Annually,
}

impl CompoundingFrequency {
    pub fn periods_per_year(self) -> i32 {
        match self {
            Self::Daily => 365,
            Self::Weekly => 52,
            Self::Biweekly => 26,
            Self::Semimonthly => 24,
            Self::Monthly => 12,
            Self::Quarterly => 4,
            Self::Semiannually => 2,
            Self::Annually => 1,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum TvmSolveMode {
    Fv,
    Pmt,
    Pv,
    N,
    Rate,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PaymentTiming {
    End,
    Beginning,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TvmScheduleEntryModel {
    pub period: i32,
    pub year: i32,
    pub start_balance: f64,
    pub contributions: f64,
    pub interest_earned: f64,
    pub end_balance: f64,
    pub total_contributions_to_date: f64,
    pub total_interest_to_date: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TvmCalculateRequest {
    #[serde(default = "default_tvm_mode")]
    pub mode: TvmSolveMode,
    #[serde(default)]
    pub present_value: f64,
    #[serde(default)]
    pub payment: f64,
    #[serde(default = "default_annual_rate")]
    pub annual_rate_pct: f64,
    #[serde(default = "default_years")]
    pub years: f64,
    #[serde(default = "default_compounding")]
    pub compounding: CompoundingFrequency,
    #[serde(default = "default_timing")]
    pub timing: PaymentTiming,
    #[serde(default)]
    pub target_future_value: Option<f64>,
    #[serde(default = "default_usd")]
    pub currency: String,
}

impl ValidatePayload for TvmCalculateRequest {
    fn validate(&self) -> Result<(), String> {
        if self.present_value < 0.0
            || self.payment < 0.0
            || self.annual_rate_pct < 0.0
            || self.years < 0.0
            || self.target_future_value.is_some_and(|v| v < 0.0)
        {
            return Err("TVM numeric inputs must be non-negative".to_string());
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TvmCalculateResponse {
    pub mode: TvmSolveMode,
    pub future_value: f64,
    pub present_value: f64,
    pub payment: f64,
    pub annual_rate_pct: f64,
    pub years: f64,
    pub compounding: CompoundingFrequency,
    pub compounding_periods_per_year: i32,
    pub total_periods: i32,
    pub total_principal: f64,
    pub total_contributions: f64,
    pub total_invested: f64,
    pub total_interest_earned: f64,
    pub effective_annual_rate_pct: f64,
    pub multiplier: f64,
    #[serde(default = "default_usd")]
    pub currency: String,
    #[serde(default)]
    pub schedule: Vec<TvmScheduleEntryModel>,
    #[serde(default = "default_true")]
    pub is_valid: bool,
    #[serde(default)]
    pub error_message: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum RebalanceMode {
    Standard,
    NoSell,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum NoSellSubMode {
    MinInflow,
    CustomDeposit,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum RebalanceAction {
    Buy,
    Sell,
    Balanced,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolRebalanceInputModel {
    pub symbol: String,
    #[serde(default)]
    pub target_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RebalanceTradeOrderModel {
    pub id: String,
    pub symbol: String,
    pub display_symbol: String,
    pub name: String,
    pub asset_type: String,
    pub action: OrderAction,
    pub shares: f64,
    pub price: f64,
    pub amount: f64,
    #[serde(default = "default_usd")]
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolRebalanceItemModel {
    pub symbol: String,
    pub display_symbol: String,
    pub name: String,
    pub asset_type: String,
    pub asset_type_label: String,
    pub currency: String,
    pub current_shares: f64,
    pub current_price: f64,
    pub current_value: f64,
    pub current_class_percent: f64,
    pub current_portfolio_percent: f64,
    pub target_percent: f64,
    pub target_value: f64,
    pub action: RebalanceAction,
    pub delta_value: f64,
    pub delta_shares: f64,
    pub color: String,
    #[serde(default)]
    pub is_anchor_position: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AssetClassRebalanceGroupModel {
    pub asset_type: String,
    pub label: String,
    pub color: String,
    pub current_value: f64,
    pub current_portfolio_percent: f64,
    pub target_total_percent: f64,
    pub is_valid: bool,
    pub min_inflow_required: f64,
    pub total_buy_amount: f64,
    pub total_sell_amount: f64,
    #[serde(default)]
    pub symbols: Vec<SymbolRebalanceItemModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RebalanceCalculateRequest {
    #[serde(default = "default_rebalance_mode")]
    pub mode: RebalanceMode,
    #[serde(default = "default_no_sell_sub_mode")]
    pub no_sell_sub_mode: NoSellSubMode,
    #[serde(default)]
    pub custom_cash_deposit: f64,
    #[serde(default)]
    pub target_allocations: HashMap<String, f64>,
    #[serde(default = "default_usd")]
    pub currency: String,
}

impl ValidatePayload for RebalanceCalculateRequest {
    fn validate(&self) -> Result<(), String> {
        if self.custom_cash_deposit < 0.0 {
            return Err("customCashDeposit must be >= 0".to_string());
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RebalanceCalculateResponse {
    pub mode: RebalanceMode,
    #[serde(default = "default_no_sell_sub_mode")]
    pub no_sell_sub_mode: NoSellSubMode,
    #[serde(default = "default_usd")]
    pub currency: String,
    pub total_current_portfolio_value: f64,
    pub total_target_portfolio_value: f64,
    pub cash_contribution: f64,
    pub total_buy_amount: f64,
    pub total_sell_amount: f64,
    pub net_cash_difference: f64,
    #[serde(default)]
    pub groups: Vec<AssetClassRebalanceGroupModel>,
    #[serde(default)]
    pub orders: Vec<RebalanceTradeOrderModel>,
    #[serde(default = "default_true")]
    pub is_valid: bool,
    #[serde(default)]
    pub error_message: String,
}

fn default_usd() -> String {
    "USD".to_string()
}

fn default_tvm_mode() -> TvmSolveMode {
    TvmSolveMode::Fv
}

fn default_annual_rate() -> f64 {
    8.0
}

fn default_years() -> f64 {
    10.0
}

fn default_compounding() -> CompoundingFrequency {
    CompoundingFrequency::Monthly
}

fn default_timing() -> PaymentTiming {
    PaymentTiming::End
}

fn default_rebalance_mode() -> RebalanceMode {
    RebalanceMode::Standard
}

fn default_no_sell_sub_mode() -> NoSellSubMode {
    NoSellSubMode::MinInflow
}

fn default_true() -> bool {
    true
}
