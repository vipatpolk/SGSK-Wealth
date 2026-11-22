use std::collections::HashMap;

use crate::features::portfolio::models::portfolio::PortfolioPosition;
use crate::features::portfolio::services::allocation_service::DEFAULT_TARGET_ENTRIES;
use crate::features::portfolio::services::valuation_service::ValuationService;
use crate::features::tools::models::tools::{
    AssetClassRebalanceGroupModel, NoSellSubMode, OrderAction, PaymentTiming,
    PositionSnapshotModel, RebalanceAction, RebalanceCalculateRequest, RebalanceCalculateResponse,
    RebalanceMode, RebalanceTradeOrderModel, SimulateOrderRequest, SimulateOrderResponse,
    SimulationDeltaMetrics, SimulationStateMetrics, SolveTargetCostRequest,
    SolveTargetCostResponse, SymbolRebalanceItemModel, TvmCalculateRequest, TvmCalculateResponse,
    TvmScheduleEntryModel, TvmSolveMode,
};
use crate::utils::format_utils::{get_asset_type, round_digits, title_case_dash};

#[derive(Clone)]
pub struct ToolsService {
    pub valuation_service: ValuationService,
}

impl ToolsService {
    pub fn new(valuation_service: ValuationService) -> Self {
        Self { valuation_service }
    }

    pub async fn simulate_order(&self, req: &SimulateOrderRequest) -> SimulateOrderResponse {
        let initial = self
            .resolve_initial_position(
                req.initial_position.as_ref(),
                req.symbol.as_deref(),
                &req.currency,
            )
            .await;

        let init_shares = initial.shares;
        let init_total_cost = initial.total_cost.unwrap_or(init_shares * initial.avg_cost);
        let init_avg_cost = if init_shares > 0.0 {
            init_total_cost / init_shares
        } else {
            0.0
        };
        let market_price = initial.market_price;
        let init_holding_val = init_shares * market_price;
        let init_unrealized_pl = init_holding_val - init_total_cost;
        let init_unrealized_pl_pct = if init_total_cost > 0.0 {
            (init_unrealized_pl / init_total_cost) * 100.0
        } else {
            0.0
        };

        let mut sim_shares = init_shares;
        let mut sim_total_cost = init_total_cost;
        let mut sim_avg_cost = init_avg_cost;
        let mut sim_realized_pl = 0.0;
        let mut total_outlay = 0.0;
        let mut total_proceeds = 0.0;
        let mut total_fees = 0.0;

        for step in &req.steps {
            let shares = step.shares;
            let price = step.price;
            let fee_pct = if step.fee_percent != 0.0 {
                step.fee_percent
            } else {
                req.tax_fee_percent
            };

            match step.action {
                OrderAction::Buy => {
                    let fee = shares * price * (fee_pct / 100.0);
                    let step_cost = (shares * price) + fee;
                    sim_shares += shares;
                    sim_total_cost += step_cost;
                    sim_avg_cost = if sim_shares > 0.0 {
                        sim_total_cost / sim_shares
                    } else {
                        0.0
                    };
                    total_outlay += step_cost;
                    total_fees += fee;
                }
                OrderAction::Sell => {
                    if sim_shares <= 0.0 {
                        continue;
                    }
                    let actual_sell_shares = shares.min(sim_shares);
                    let gross = actual_sell_shares * price;
                    let fee = gross * (fee_pct / 100.0);
                    let net = gross - fee;
                    let cost_sold = actual_sell_shares * sim_avg_cost;
                    let step_realized_pl = net - cost_sold;

                    sim_realized_pl += step_realized_pl;
                    sim_shares -= actual_sell_shares;
                    sim_total_cost -= cost_sold;

                    if sim_shares <= 0.0 {
                        sim_shares = 0.0;
                        sim_total_cost = 0.0;
                        sim_avg_cost = 0.0;
                    } else {
                        sim_avg_cost = sim_total_cost / sim_shares;
                    }

                    total_proceeds += net;
                    total_fees += fee;
                }
            }
        }

        let sim_holding_val = sim_shares * market_price;
        let sim_unrealized_pl = sim_holding_val - sim_total_cost;
        let sim_unrealized_pl_pct = if sim_total_cost > 0.0 {
            (sim_unrealized_pl / sim_total_cost) * 100.0
        } else {
            0.0
        };

        let delta_shares = sim_shares - init_shares;
        let delta_shares_pct = if init_shares > 0.0 {
            (delta_shares / init_shares) * 100.0
        } else {
            0.0
        };
        let delta_avg_cost = sim_avg_cost - init_avg_cost;
        let delta_avg_cost_pct = if init_avg_cost > 0.0 {
            (delta_avg_cost / init_avg_cost) * 100.0
        } else {
            0.0
        };
        let delta_total_cost = sim_total_cost - init_total_cost;
        let delta_total_cost_pct = if init_total_cost > 0.0 {
            (delta_total_cost / init_total_cost) * 100.0
        } else {
            0.0
        };
        let delta_holding_val = sim_holding_val - init_holding_val;
        let delta_holding_val_pct = if init_holding_val > 0.0 {
            (delta_holding_val / init_holding_val) * 100.0
        } else {
            0.0
        };
        let delta_unrealized_pl = sim_unrealized_pl - init_unrealized_pl;
        let delta_unrealized_pl_pct = sim_unrealized_pl_pct - init_unrealized_pl_pct;

        let breakeven_dist_init = if market_price > 0.0 {
            ((init_avg_cost - market_price) / market_price) * 100.0
        } else {
            0.0
        };
        let breakeven_dist_sim = if market_price > 0.0 {
            ((sim_avg_cost - market_price) / market_price) * 100.0
        } else {
            0.0
        };

        SimulateOrderResponse {
            initial: SimulationStateMetrics {
                total_shares: round_digits(init_shares, 6),
                average_cost: round_digits(init_avg_cost, 4),
                total_cost: round_digits(init_total_cost, 2),
                market_price: round_digits(market_price, 4),
                holding_value: round_digits(init_holding_val, 2),
                unrealized_pl: round_digits(init_unrealized_pl, 2),
                unrealized_pl_percent: round_digits(init_unrealized_pl_pct, 2),
                realized_pl: 0.0,
            },
            simulated: SimulationStateMetrics {
                total_shares: round_digits(sim_shares, 6),
                average_cost: round_digits(sim_avg_cost, 4),
                total_cost: round_digits(sim_total_cost, 2),
                market_price: round_digits(market_price, 4),
                holding_value: round_digits(sim_holding_val, 2),
                unrealized_pl: round_digits(sim_unrealized_pl, 2),
                unrealized_pl_percent: round_digits(sim_unrealized_pl_pct, 2),
                realized_pl: round_digits(sim_realized_pl, 2),
            },
            delta: SimulationDeltaMetrics {
                shares: round_digits(delta_shares, 6),
                shares_percent: round_digits(delta_shares_pct, 2),
                average_cost: round_digits(delta_avg_cost, 4),
                average_cost_percent: round_digits(delta_avg_cost_pct, 2),
                total_cost: round_digits(delta_total_cost, 2),
                total_cost_percent: round_digits(delta_total_cost_pct, 2),
                holding_value: round_digits(delta_holding_val, 2),
                holding_value_percent: round_digits(delta_holding_val_pct, 2),
                unrealized_pl: round_digits(delta_unrealized_pl, 2),
                unrealized_pl_percent: round_digits(delta_unrealized_pl_pct, 2),
                breakeven_distance_initial: round_digits(breakeven_dist_init, 2),
                breakeven_distance_simulated: round_digits(breakeven_dist_sim, 2),
                realized_pl: round_digits(sim_realized_pl, 2),
            },
            steps: req.steps.clone(),
            total_capital_outlay: round_digits(total_outlay, 2),
            total_proceeds: round_digits(total_proceeds, 2),
            total_fees: round_digits(total_fees, 2),
            currency: initial.currency,
        }
    }

    pub async fn solve_target_cost(&self, req: &SolveTargetCostRequest) -> SolveTargetCostResponse {
        let initial = self
            .resolve_initial_position(
                req.initial_position.as_ref(),
                req.symbol.as_deref(),
                &req.currency,
            )
            .await;

        let s0 = initial.shares;
        let c0 = initial.total_cost.unwrap_or(s0 * initial.avg_cost);
        let p0 = if s0 > 0.0 { initial.avg_cost } else { 0.0 };
        let target = req.target_avg_cost;
        let p_buy = req.purchase_price;
        let fee_pct = req.fee_percent;
        let f = fee_pct / 100.0;
        let p_eff = p_buy * (1.0 + f);

        if s0 <= 0.0 {
            if p_eff <= 0.0 {
                return SolveTargetCostResponse {
                    is_valid: false,
                    error_message: "Purchase price must be greater than zero.".to_string(),
                    required_shares: 0.0,
                    required_capital: 0.0,
                    fee_amount: 0.0,
                    total_outlay: 0.0,
                    achieved_avg_cost: 0.0,
                    new_total_shares: 0.0,
                    new_total_cost: 0.0,
                    currency: initial.currency,
                };
            }
            let req_shares = 1.0;
            let req_capital = req_shares * p_buy;
            let fee_amount = req_capital * f;
            let total_outlay = req_capital + fee_amount;
            return SolveTargetCostResponse {
                is_valid: true,
                error_message: String::new(),
                required_shares: round_digits(req_shares, 6),
                required_capital: round_digits(req_capital, 2),
                fee_amount: round_digits(fee_amount, 2),
                total_outlay: round_digits(total_outlay, 2),
                achieved_avg_cost: round_digits(total_outlay / req_shares, 4),
                new_total_shares: round_digits(req_shares, 6),
                new_total_cost: round_digits(total_outlay, 2),
                currency: initial.currency,
            };
        }

        let denom = target - p_eff;
        if denom.abs() < 1e-9 {
            return SolveTargetCostResponse {
                is_valid: false,
                error_message:
                    "Target average cost equals effective buy price. Mathematical boundary."
                        .to_string(),
                required_shares: 0.0,
                required_capital: 0.0,
                fee_amount: 0.0,
                total_outlay: 0.0,
                achieved_avg_cost: 0.0,
                new_total_shares: 0.0,
                new_total_cost: 0.0,
                currency: initial.currency,
            };
        }

        let req_shares = (c0 - (s0 * target)) / denom;

        if req_shares <= 0.0 {
            let msg = if p_eff >= target && target < p0 {
                format!(
                    "Cannot average down to {target:.2} when effective buy price ({p_eff:.2}) is higher than or equal to target cost."
                )
            } else if p_eff <= target && target > p0 {
                format!(
                    "Cannot average up to {target:.2} when effective buy price ({p_eff:.2}) is lower than or equal to target cost."
                )
            } else {
                "No additional shares required or target is already achieved.".to_string()
            };
            return SolveTargetCostResponse {
                is_valid: false,
                error_message: msg,
                required_shares: 0.0,
                required_capital: 0.0,
                fee_amount: 0.0,
                total_outlay: 0.0,
                achieved_avg_cost: 0.0,
                new_total_shares: 0.0,
                new_total_cost: 0.0,
                currency: initial.currency,
            };
        }

        let req_capital = req_shares * p_buy;
        let fee_amount = req_capital * f;
        let total_outlay = req_capital + fee_amount;
        let new_shares = s0 + req_shares;
        let new_cost = c0 + total_outlay;
        let achieved_cost = if new_shares > 0.0 {
            new_cost / new_shares
        } else {
            0.0
        };

        SolveTargetCostResponse {
            is_valid: true,
            error_message: String::new(),
            required_shares: round_digits(req_shares, 6),
            required_capital: round_digits(req_capital, 2),
            fee_amount: round_digits(fee_amount, 2),
            total_outlay: round_digits(total_outlay, 2),
            achieved_avg_cost: round_digits(achieved_cost, 4),
            new_total_shares: round_digits(new_shares, 6),
            new_total_cost: round_digits(new_cost, 2),
            currency: initial.currency,
        }
    }

    async fn resolve_initial_position(
        &self,
        snapshot: Option<&PositionSnapshotModel>,
        symbol: Option<&str>,
        currency: &str,
    ) -> PositionSnapshotModel {
        if let Some(snap) = snapshot {
            if snap.shares > 0.0 || snap.avg_cost > 0.0 {
                return snap.clone();
            }
        }

        let lookup_symbol = symbol
            .or_else(|| snapshot.map(|s| s.symbol.as_str()))
            .unwrap_or("")
            .to_uppercase();

        if lookup_symbol.is_empty() {
            return snapshot.cloned().unwrap_or_else(|| PositionSnapshotModel {
                currency: currency.to_string(),
                ..Default::default()
            });
        }

        let holdings = self
            .valuation_service
            .get_portfolio_holdings("all", currency)
            .await;

        if holdings.error.is_none() {
            for pos in &holdings.open_positions {
                if get_asset_type(Some(&pos.asset_type), Some(&pos.symbol)) == "provident-fund" {
                    continue;
                }
                if pos.symbol.to_uppercase() == lookup_symbol {
                    return PositionSnapshotModel {
                        symbol: pos.symbol.clone(),
                        shares: pos.total_shares,
                        avg_cost: pos.average_cost,
                        market_price: pos.current_price,
                        currency: pos.currency.clone(),
                        total_cost: Some(pos.total_cost),
                    };
                }
            }
        }

        snapshot.cloned().unwrap_or_else(|| PositionSnapshotModel {
            symbol: lookup_symbol,
            currency: currency.to_string(),
            ..Default::default()
        })
    }

    pub async fn calculate_tvm(&self, req: &TvmCalculateRequest) -> TvmCalculateResponse {
        let m = req.compounding.periods_per_year();
        let mut pv = req.present_value.max(0.0);
        let mut pmt = req.payment.max(0.0);
        let mut rate_pct = req.annual_rate_pct.max(0.0);
        let mut years = req.years.max(0.0);
        let mut fv = req.target_future_value.unwrap_or(0.0).max(0.0);
        let t = match req.timing {
            PaymentTiming::Beginning => 1.0,
            PaymentTiming::End => 0.0,
        };

        let mut is_valid = true;
        let mut error_message = String::new();

        match req.mode {
            TvmSolveMode::Fv => {
                fv = Self::tvm_future_value(pv, pmt, rate_pct, years, m, t);
            }
            TvmSolveMode::Pmt => {
                if years <= 0.0 {
                    is_valid = false;
                    error_message =
                        "Investment horizon must be greater than 0 years to calculate payment."
                            .to_string();
                    pmt = 0.0;
                } else {
                    pmt = Self::tvm_payment(fv, pv, rate_pct, years, m, t);
                }
            }
            TvmSolveMode::Pv => {
                if years <= 0.0 {
                    pv = fv;
                } else {
                    pv = Self::tvm_present_value(fv, pmt, rate_pct, years, m, t);
                }
            }
            TvmSolveMode::N => {
                let (res_years, ok, err) = Self::tvm_years(fv, pv, pmt, rate_pct, m, t);
                years = res_years;
                is_valid = ok;
                error_message = err;
            }
            TvmSolveMode::Rate => {
                if years <= 0.0 {
                    is_valid = false;
                    error_message =
                        "Investment horizon must be greater than 0 years to calculate return rate."
                            .to_string();
                    rate_pct = 0.0;
                } else {
                    let (res_rate, ok, err) = Self::tvm_rate(fv, pv, pmt, years, m, t);
                    rate_pct = res_rate;
                    is_valid = ok;
                    error_message = err;
                }
            }
        }

        let total_periods = (years * m as f64).ceil() as i32;
        let total_principal = pv;
        let total_contributions = pmt * total_periods as f64;
        let total_invested = total_principal + total_contributions;
        let total_interest = (fv - total_invested).max(0.0);

        let periodic_rate = (rate_pct / 100.0) / m as f64;
        let ear_pct = if m > 0 {
            ((1.0 + periodic_rate).powi(m) - 1.0) * 100.0
        } else {
            rate_pct
        };
        let multiplier = if total_invested > 0.0 {
            fv / total_invested
        } else if fv > 0.0 {
            1.0
        } else {
            0.0
        };

        let schedule = if is_valid && years > 0.0 {
            Self::tvm_generate_schedule(pv, pmt, rate_pct, years, m, t)
        } else {
            Vec::new()
        };

        TvmCalculateResponse {
            mode: req.mode,
            future_value: round_digits(fv, 2),
            present_value: round_digits(pv, 2),
            payment: round_digits(pmt, 2),
            annual_rate_pct: round_digits(rate_pct, 4),
            years: round_digits(years, 2),
            compounding: req.compounding,
            compounding_periods_per_year: m,
            total_periods,
            total_principal: round_digits(total_principal, 2),
            total_contributions: round_digits(total_contributions, 2),
            total_invested: round_digits(total_invested, 2),
            total_interest_earned: round_digits(total_interest, 2),
            effective_annual_rate_pct: round_digits(ear_pct, 4),
            multiplier: round_digits(multiplier, 2),
            currency: req.currency.clone(),
            schedule,
            is_valid,
            error_message,
        }
    }

    fn tvm_future_value(pv: f64, pmt: f64, rate_pct: f64, years: f64, m: i32, t: f64) -> f64 {
        let n = years * m as f64;
        if n <= 0.0 {
            return pv;
        }
        let i = (rate_pct / 100.0) / m as f64;
        if i.abs() < 1e-12 {
            return pv + pmt * n;
        }
        let growth = (1.0 + i).powf(n);
        let fv_pv = pv * growth;
        let fv_pmt = pmt * ((growth - 1.0) / i) * (1.0 + i * t);
        (fv_pv + fv_pmt).max(0.0)
    }

    fn tvm_present_value(fv: f64, pmt: f64, rate_pct: f64, years: f64, m: i32, t: f64) -> f64 {
        let n = years * m as f64;
        if n <= 0.0 {
            return fv;
        }
        let i = (rate_pct / 100.0) / m as f64;
        if i.abs() < 1e-12 {
            return (fv - pmt * n).max(0.0);
        }
        let growth = (1.0 + i).powf(n);
        let fv_pmt = pmt * ((growth - 1.0) / i) * (1.0 + i * t);
        ((fv - fv_pmt) / growth).max(0.0)
    }

    fn tvm_payment(fv: f64, pv: f64, rate_pct: f64, years: f64, m: i32, t: f64) -> f64 {
        let n = years * m as f64;
        if n <= 0.0 {
            return 0.0;
        }
        let i = (rate_pct / 100.0) / m as f64;
        if i.abs() < 1e-12 {
            return ((fv - pv) / n).max(0.0);
        }
        let growth = (1.0 + i).powf(n);
        let fv_pv = pv * growth;
        let annuity_factor = ((growth - 1.0) / i) * (1.0 + i * t);
        if annuity_factor.abs() < 1e-12 {
            return 0.0;
        }
        ((fv - fv_pv) / annuity_factor).max(0.0)
    }

    fn tvm_years(fv: f64, pv: f64, pmt: f64, rate_pct: f64, m: i32, t: f64) -> (f64, bool, String) {
        if fv <= pv {
            return (0.0, true, String::new());
        }
        let i = (rate_pct / 100.0) / m as f64;
        if i.abs() < 1e-12 {
            if pmt <= 0.0 {
                return (
                    0.0,
                    false,
                    "With 0% return rate and 0 payment, target future value cannot be reached."
                        .to_string(),
                );
            }
            let n = (fv - pv) / pmt;
            return (n / m as f64, true, String::new());
        }

        let adj_pmt = pmt * (1.0 + i * t);
        if pmt <= 0.0 {
            if pv <= 0.0 {
                return (
                    0.0,
                    false,
                    "Both starting principal and periodic payment are zero.".to_string(),
                );
            }
            let n = (fv / pv).ln() / (1.0 + i).ln();
            return (n / m as f64, true, String::new());
        }

        let num = fv * i + adj_pmt;
        let den = pv * i + adj_pmt;
        if den <= 0.0 || (num / den) <= 0.0 {
            return (
                0.0,
                false,
                "Cannot solve for time horizon with given inputs.".to_string(),
            );
        }

        let n = (num / den).ln() / (1.0 + i).ln();
        (n / m as f64, true, String::new())
    }

    fn tvm_rate(fv: f64, pv: f64, pmt: f64, years: f64, m: i32, t: f64) -> (f64, bool, String) {
        let n = (years * m as f64).max(1.0);
        let total_invested = pv + pmt * n;
        if fv <= total_invested {
            if (fv - total_invested).abs() < f64::EPSILON {
                return (0.0, true, String::new());
            }
            if fv <= 0.0 {
                return (
                    0.0,
                    false,
                    "Target Future Value must be greater than 0.".to_string(),
                );
            }
        }

        let f = |rate_i: f64| -> f64 {
            if rate_i.abs() < 1e-12 {
                return pv + pmt * n - fv;
            }
            let growth = (1.0 + rate_i).powf(n);
            pv * growth + pmt * ((growth - 1.0) / rate_i) * (1.0 + rate_i * t) - fv
        };

        let mut low = -0.95 / m as f64;
        let mut high = 5.0 / m as f64;
        let mut f_low = f(low);
        let f_high = f(high);

        if f_low * f_high > 0.0 {
            return (
                0.0,
                false,
                "Could not find a feasible return rate within standard boundaries.".to_string(),
            );
        }

        for _ in 0..100 {
            let mid = (low + high) / 2.0;
            let f_mid = f(mid);
            if f_mid.abs() < 1e-7 || (high - low) < 1e-9 {
                return (mid * m as f64 * 100.0, true, String::new());
            }
            if f_low * f_mid < 0.0 {
                high = mid;
            } else {
                low = mid;
                f_low = f_mid;
            }
        }

        (((low + high) / 2.0) * m as f64 * 100.0, true, String::new())
    }

    fn tvm_generate_schedule(
        pv: f64,
        pmt: f64,
        rate_pct: f64,
        years: f64,
        m: i32,
        t: f64,
    ) -> Vec<TvmScheduleEntryModel> {
        let total_years = (years.ceil() as i32).clamp(1, 100);
        let periodic_rate = (rate_pct / 100.0) / m as f64;

        let mut schedule = Vec::with_capacity(total_years as usize);
        let mut current_balance = pv.max(0.0);
        let mut cum_contrib = pv;
        let mut cum_interest = 0.0;

        for y in 1..=total_years {
            let start_balance = current_balance;
            let mut year_contrib = 0.0;
            let mut year_interest = 0.0;

            for _ in 0..m {
                if (t - 1.0).abs() < f64::EPSILON {
                    current_balance += pmt;
                    year_contrib += pmt;
                    let interest = current_balance * periodic_rate;
                    current_balance += interest;
                    year_interest += interest;
                } else {
                    let interest = current_balance * periodic_rate;
                    current_balance += interest + pmt;
                    year_contrib += pmt;
                    year_interest += interest;
                }
            }

            cum_contrib += year_contrib;
            cum_interest += year_interest;

            schedule.push(TvmScheduleEntryModel {
                period: y * m,
                year: y,
                start_balance: round_digits(start_balance, 2),
                contributions: round_digits(year_contrib, 2),
                interest_earned: round_digits(year_interest, 2),
                end_balance: round_digits(current_balance, 2),
                total_contributions_to_date: round_digits(cum_contrib, 2),
                total_interest_to_date: round_digits(cum_interest, 2),
            });
        }

        schedule
    }

    pub async fn calculate_rebalance(
        &self,
        req: &RebalanceCalculateRequest,
    ) -> RebalanceCalculateResponse {
        let currency = if req.currency.is_empty() {
            "USD".to_string()
        } else {
            req.currency.clone()
        };
        let holdings = self
            .valuation_service
            .get_portfolio_holdings("all", &currency)
            .await;
        let open_positions = holdings.open_positions;

        let mut class_map: HashMap<String, Vec<PortfolioPosition>> = HashMap::new();
        for pos in &open_positions {
            let atype = if pos.asset_type.is_empty() {
                "us-stock".to_string()
            } else {
                pos.asset_type.clone()
            };
            class_map.entry(atype).or_default().push(pos.clone());
        }

        let ordered_types: Vec<&str> = DEFAULT_TARGET_ENTRIES.iter().map(|(k, _)| *k).collect();
        let mut all_types: Vec<String> = ordered_types
            .iter()
            .filter(|t| class_map.contains_key(**t))
            .map(|t| (*t).to_string())
            .collect();
        for k in class_map.keys() {
            if !ordered_types.contains(&k.as_str()) {
                all_types.push(k.clone());
            }
        }

        let total_portfolio_value: f64 = open_positions.iter().map(|p| p.holding_value).sum();

        let mut groups = Vec::new();
        let mut orders = Vec::new();
        let mut total_buy_amount = 0.0;
        let mut total_sell_amount = 0.0;
        let mut total_inflow_contribution = 0.0;

        for atype in &all_types {
            let pos_list = class_map.get(atype).expect("type in class_map");
            let class_total_value: f64 = pos_list.iter().map(|p| p.holding_value).sum();
            let class_portfolio_pct = if total_portfolio_value > 0.0 {
                (class_total_value / total_portfolio_value) * 100.0
            } else {
                0.0
            };

            let target_sum: f64 = pos_list
                .iter()
                .map(|p| {
                    req.target_allocations
                        .get(&p.symbol)
                        .copied()
                        .unwrap_or(0.0)
                        .max(0.0)
                })
                .sum();
            let is_valid =
                (target_sum - 100.0).abs() <= 0.1 || (target_sum == 0.0 && pos_list.is_empty());

            let mut symbols: Vec<SymbolRebalanceItemModel> = Vec::new();
            let mut group_buy = 0.0;
            let mut group_sell = 0.0;
            let mut min_inflow_req = 0.0;

            match req.mode {
                RebalanceMode::Standard => {
                    for pos in pos_list {
                        let tpct = req
                            .target_allocations
                            .get(&pos.symbol)
                            .copied()
                            .unwrap_or(0.0)
                            .max(0.0);
                        let tval = if class_total_value > 0.0 {
                            (tpct / 100.0) * class_total_value
                        } else {
                            0.0
                        };
                        let delta_val = tval - pos.holding_value;
                        let cur_class_pct = if class_total_value > 0.0 {
                            (pos.holding_value / class_total_value) * 100.0
                        } else {
                            0.0
                        };
                        let cur_port_pct = if total_portfolio_value > 0.0 {
                            (pos.holding_value / total_portfolio_value) * 100.0
                        } else {
                            0.0
                        };

                        let (act, dshares) = if delta_val > 0.01 {
                            group_buy += delta_val;
                            let ds = if pos.current_price > 0.0 {
                                delta_val / pos.current_price
                            } else {
                                0.0
                            };
                            (RebalanceAction::Buy, ds)
                        } else if delta_val < -0.01 {
                            group_sell += delta_val.abs();
                            let ds = if pos.current_price > 0.0 {
                                -delta_val.abs() / pos.current_price
                            } else {
                                0.0
                            };
                            (RebalanceAction::Sell, ds)
                        } else {
                            (RebalanceAction::Balanced, 0.0)
                        };

                        symbols.push(SymbolRebalanceItemModel {
                            symbol: pos.symbol.clone(),
                            display_symbol: if pos.display_symbol.is_empty() {
                                pos.symbol.clone()
                            } else {
                                pos.display_symbol.clone()
                            },
                            name: if pos.name.is_empty() {
                                pos.symbol.clone()
                            } else {
                                pos.name.clone()
                            },
                            asset_type: atype.clone(),
                            asset_type_label: if pos.asset_type_label.is_empty() {
                                atype.clone()
                            } else {
                                pos.asset_type_label.clone()
                            },
                            currency: currency.clone(),
                            current_shares: pos.total_shares,
                            current_price: pos.current_price,
                            current_value: pos.holding_value,
                            current_class_percent: round_digits(cur_class_pct, 2),
                            current_portfolio_percent: round_digits(cur_port_pct, 2),
                            target_percent: round_digits(tpct, 2),
                            target_value: round_digits(tval, 2),
                            action: act,
                            delta_value: round_digits(delta_val, 2),
                            delta_shares: round_digits(dshares, 4),
                            color: "#3b82f6".to_string(),
                            is_anchor_position: false,
                        });
                    }
                }
                RebalanceMode::NoSell => match req.no_sell_sub_mode {
                    NoSellSubMode::MinInflow => {
                        let mut max_req_class_val = class_total_value;
                        let mut anchor_sym: Option<String> = None;
                        for pos in pos_list {
                            let tpct = req
                                .target_allocations
                                .get(&pos.symbol)
                                .copied()
                                .unwrap_or(0.0)
                                .max(0.0);
                            if tpct > 0.0 {
                                let req_val = pos.holding_value / (tpct / 100.0);
                                if req_val > max_req_class_val {
                                    max_req_class_val = req_val;
                                    anchor_sym = Some(pos.symbol.clone());
                                }
                            }
                        }

                        min_inflow_req = (max_req_class_val - class_total_value).max(0.0);
                        let new_class_val = max_req_class_val;
                        group_buy = min_inflow_req;
                        total_inflow_contribution += min_inflow_req;

                        for pos in pos_list {
                            let tpct = req
                                .target_allocations
                                .get(&pos.symbol)
                                .copied()
                                .unwrap_or(0.0)
                                .max(0.0);
                            let tval = (tpct / 100.0) * new_class_val;
                            let delta_val = (tval - pos.holding_value).max(0.0);
                            let cur_class_pct = if class_total_value > 0.0 {
                                (pos.holding_value / class_total_value) * 100.0
                            } else {
                                0.0
                            };
                            let cur_port_pct = if total_portfolio_value > 0.0 {
                                (pos.holding_value / total_portfolio_value) * 100.0
                            } else {
                                0.0
                            };
                            let is_anchor = anchor_sym.as_deref() == Some(pos.symbol.as_str())
                                || delta_val < 0.01;
                            let no_sell_act = if delta_val >= 0.01 {
                                RebalanceAction::Buy
                            } else {
                                RebalanceAction::Balanced
                            };
                            let dshares = if delta_val >= 0.01 && pos.current_price > 0.0 {
                                delta_val / pos.current_price
                            } else {
                                0.0
                            };

                            symbols.push(SymbolRebalanceItemModel {
                                symbol: pos.symbol.clone(),
                                display_symbol: if pos.display_symbol.is_empty() {
                                    pos.symbol.clone()
                                } else {
                                    pos.display_symbol.clone()
                                },
                                name: if pos.name.is_empty() {
                                    pos.symbol.clone()
                                } else {
                                    pos.name.clone()
                                },
                                asset_type: atype.clone(),
                                asset_type_label: if pos.asset_type_label.is_empty() {
                                    atype.clone()
                                } else {
                                    pos.asset_type_label.clone()
                                },
                                currency: currency.clone(),
                                current_shares: pos.total_shares,
                                current_price: pos.current_price,
                                current_value: pos.holding_value,
                                current_class_percent: round_digits(cur_class_pct, 2),
                                current_portfolio_percent: round_digits(cur_port_pct, 2),
                                target_percent: round_digits(tpct, 2),
                                target_value: round_digits(tval, 2),
                                action: no_sell_act,
                                delta_value: round_digits(delta_val, 2),
                                delta_shares: round_digits(dshares, 4),
                                color: "#3b82f6".to_string(),
                                is_anchor_position: is_anchor && tpct > 0.0,
                            });
                        }
                    }
                    NoSellSubMode::CustomDeposit => {
                        let deposit = req.custom_cash_deposit.max(0.0);
                        let share_of_deposit = if total_portfolio_value > 0.0 {
                            (class_total_value / total_portfolio_value) * deposit
                        } else {
                            deposit / (all_types.len().max(1) as f64)
                        };
                        let target_class_val = class_total_value + share_of_deposit;

                        let mut deficits = Vec::with_capacity(pos_list.len());
                        for pos in pos_list {
                            let tpct = req
                                .target_allocations
                                .get(&pos.symbol)
                                .copied()
                                .unwrap_or(0.0)
                                .max(0.0);
                            let ideal_val = (tpct / 100.0) * target_class_val;
                            let deficit = (ideal_val - pos.holding_value).max(0.0);
                            deficits.push((pos.symbol.clone(), tpct, deficit));
                        }

                        let tot_deficit: f64 = deficits.iter().map(|d| d.2).sum();
                        let mut allocated_cash = 0.0;

                        for pos in pos_list {
                            let (_, tpct, dval) = deficits
                                .iter()
                                .find(|d| d.0 == pos.symbol)
                                .cloned()
                                .unwrap_or_else(|| (pos.symbol.clone(), 0.0, 0.0));
                            let b_amt = if tot_deficit > 0.0 && share_of_deposit > 0.0 {
                                if tot_deficit <= share_of_deposit {
                                    let surplus = share_of_deposit - tot_deficit;
                                    dval + (tpct / 100.0) * surplus
                                } else {
                                    share_of_deposit * (dval / tot_deficit)
                                }
                            } else {
                                0.0
                            };

                            allocated_cash += b_amt;
                            let tval = pos.holding_value + b_amt;
                            let cur_class_pct = if class_total_value > 0.0 {
                                (pos.holding_value / class_total_value) * 100.0
                            } else {
                                0.0
                            };
                            let cur_port_pct = if total_portfolio_value > 0.0 {
                                (pos.holding_value / total_portfolio_value) * 100.0
                            } else {
                                0.0
                            };
                            let custom_act = if b_amt >= 0.01 {
                                RebalanceAction::Buy
                            } else {
                                RebalanceAction::Balanced
                            };
                            let dshares = if b_amt >= 0.01 && pos.current_price > 0.0 {
                                b_amt / pos.current_price
                            } else {
                                0.0
                            };

                            symbols.push(SymbolRebalanceItemModel {
                                symbol: pos.symbol.clone(),
                                display_symbol: if pos.display_symbol.is_empty() {
                                    pos.symbol.clone()
                                } else {
                                    pos.display_symbol.clone()
                                },
                                name: if pos.name.is_empty() {
                                    pos.symbol.clone()
                                } else {
                                    pos.name.clone()
                                },
                                asset_type: atype.clone(),
                                asset_type_label: if pos.asset_type_label.is_empty() {
                                    atype.clone()
                                } else {
                                    pos.asset_type_label.clone()
                                },
                                currency: currency.clone(),
                                current_shares: pos.total_shares,
                                current_price: pos.current_price,
                                current_value: pos.holding_value,
                                current_class_percent: round_digits(cur_class_pct, 2),
                                current_portfolio_percent: round_digits(cur_port_pct, 2),
                                target_percent: round_digits(tpct, 2),
                                target_value: round_digits(tval, 2),
                                action: custom_act,
                                delta_value: round_digits(b_amt, 2),
                                delta_shares: round_digits(dshares, 4),
                                color: "#3b82f6".to_string(),
                                is_anchor_position: b_amt < 0.01 && tpct > 0.0,
                            });
                        }

                        group_buy = allocated_cash;
                        total_inflow_contribution += allocated_cash;
                    }
                },
            }

            total_buy_amount += group_buy;
            total_sell_amount += group_sell;

            for s in &symbols {
                if s.action == RebalanceAction::Buy && s.delta_value >= 0.01 {
                    orders.push(RebalanceTradeOrderModel {
                        id: format!("order-buy-{}", s.symbol),
                        symbol: s.symbol.clone(),
                        display_symbol: s.display_symbol.clone(),
                        name: s.name.clone(),
                        asset_type: s.asset_type.clone(),
                        action: OrderAction::Buy,
                        shares: round_digits(s.delta_shares, 4),
                        price: round_digits(s.current_price, 4),
                        amount: round_digits(s.delta_value, 2),
                        currency: currency.clone(),
                    });
                } else if s.action == RebalanceAction::Sell && s.delta_value <= -0.01 {
                    orders.push(RebalanceTradeOrderModel {
                        id: format!("order-sell-{}", s.symbol),
                        symbol: s.symbol.clone(),
                        display_symbol: s.display_symbol.clone(),
                        name: s.name.clone(),
                        asset_type: s.asset_type.clone(),
                        action: OrderAction::Sell,
                        shares: round_digits(s.delta_shares.abs(), 4),
                        price: round_digits(s.current_price, 4),
                        amount: round_digits(s.delta_value.abs(), 2),
                        currency: currency.clone(),
                    });
                }
            }

            groups.push(AssetClassRebalanceGroupModel {
                asset_type: atype.clone(),
                label: title_case_dash(atype),
                color: "#3b82f6".to_string(),
                current_value: round_digits(class_total_value, 2),
                current_portfolio_percent: round_digits(class_portfolio_pct, 2),
                target_total_percent: round_digits(target_sum, 2),
                is_valid,
                min_inflow_required: round_digits(min_inflow_req, 2),
                total_buy_amount: round_digits(group_buy, 2),
                total_sell_amount: round_digits(group_sell, 2),
                symbols,
            });
        }

        let target_port_val = match req.mode {
            RebalanceMode::Standard => total_portfolio_value,
            RebalanceMode::NoSell => total_portfolio_value + total_inflow_contribution,
        };

        let is_overall_valid = groups.iter().all(|g| g.is_valid);
        orders.sort_by(|a, b| {
            let act_rank = |act: OrderAction| if act == OrderAction::Buy { -1 } else { 1 };
            act_rank(a.action)
                .cmp(&act_rank(b.action))
                .then_with(|| b.amount.total_cmp(&a.amount))
        });

        RebalanceCalculateResponse {
            mode: req.mode,
            no_sell_sub_mode: req.no_sell_sub_mode,
            currency,
            total_current_portfolio_value: round_digits(total_portfolio_value, 2),
            total_target_portfolio_value: round_digits(target_port_val, 2),
            cash_contribution: round_digits(
                if req.mode == RebalanceMode::NoSell {
                    total_inflow_contribution
                } else {
                    0.0
                },
                2,
            ),
            total_buy_amount: round_digits(total_buy_amount, 2),
            total_sell_amount: round_digits(total_sell_amount, 2),
            net_cash_difference: round_digits(total_buy_amount - total_sell_amount, 2),
            groups,
            orders,
            is_valid: is_overall_valid,
            error_message: if is_overall_valid {
                String::new()
            } else {
                "Target percentages in one or more asset classes do not sum to 100%.".to_string()
            },
        }
    }
}
