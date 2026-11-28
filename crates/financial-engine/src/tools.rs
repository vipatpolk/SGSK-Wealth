use rust_decimal::Decimal;
use sgsk_domain::tools::{
    OrderAction, OrderSimulationResult, OrderStep, PositionSnapshot, SimulationDeltaMetrics,
    SimulationStateMetrics, TargetCostInput, TargetCostResult,
};

use crate::currency::round_dp;

const ONE_HUNDRED: Decimal = Decimal::from_parts(100, 0, 0, false, 0);
const BOUNDARY_EPSILON: Decimal = Decimal::from_parts(1, 0, 0, false, 9); // 1e-9

/// Simulates sequential buy/sell order steps against an initial position using `Decimal` math.
pub fn simulate_orders(
    initial: &PositionSnapshot,
    steps: &[OrderStep],
    default_fee_percent: Decimal,
) -> OrderSimulationResult {
    let init_shares = initial.shares;
    let init_total_cost = initial.total_cost.unwrap_or(init_shares * initial.avg_cost);
    let init_avg_cost = if init_shares > Decimal::ZERO {
        init_total_cost / init_shares
    } else {
        Decimal::ZERO
    };
    let market_price = initial.market_price;
    let init_holding_val = init_shares * market_price;
    let init_unrealized_pl = init_holding_val - init_total_cost;
    let init_unrealized_pl_pct = if init_total_cost > Decimal::ZERO {
        (init_unrealized_pl / init_total_cost) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };

    let mut sim_shares = init_shares;
    let mut sim_total_cost = init_total_cost;
    let mut sim_avg_cost = init_avg_cost;
    let mut sim_realized_pl = Decimal::ZERO;
    let mut total_outlay = Decimal::ZERO;
    let mut total_proceeds = Decimal::ZERO;
    let mut total_fees = Decimal::ZERO;

    for step in steps {
        let fee_pct = if step.fee_percent != Decimal::ZERO {
            step.fee_percent
        } else {
            default_fee_percent
        };
        match step.action {
            OrderAction::Buy => {
                let fee = step.shares * step.price * (fee_pct / ONE_HUNDRED);
                let step_cost = (step.shares * step.price) + fee;
                sim_shares += step.shares;
                sim_total_cost += step_cost;
                sim_avg_cost = if sim_shares > Decimal::ZERO {
                    sim_total_cost / sim_shares
                } else {
                    Decimal::ZERO
                };
                total_outlay += step_cost;
                total_fees += fee;
            }
            OrderAction::Sell => {
                if sim_shares <= Decimal::ZERO {
                    continue;
                }
                let actual_sell_shares = step.shares.min(sim_shares);
                let gross = actual_sell_shares * step.price;
                let fee = gross * (fee_pct / ONE_HUNDRED);
                let net = gross - fee;
                let cost_sold = actual_sell_shares * sim_avg_cost;

                sim_realized_pl += net - cost_sold;
                sim_shares -= actual_sell_shares;
                sim_total_cost -= cost_sold;
                if sim_shares <= Decimal::ZERO {
                    sim_shares = Decimal::ZERO;
                    sim_total_cost = Decimal::ZERO;
                    sim_avg_cost = Decimal::ZERO;
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
    let sim_unrealized_pl_pct = if sim_total_cost > Decimal::ZERO {
        (sim_unrealized_pl / sim_total_cost) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };

    let delta_shares = sim_shares - init_shares;
    let delta_shares_pct = if init_shares > Decimal::ZERO {
        (delta_shares / init_shares) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };
    let delta_avg_cost = sim_avg_cost - init_avg_cost;
    let delta_avg_cost_pct = if init_avg_cost > Decimal::ZERO {
        (delta_avg_cost / init_avg_cost) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };
    let delta_total_cost = sim_total_cost - init_total_cost;
    let delta_total_cost_pct = if init_total_cost > Decimal::ZERO {
        (delta_total_cost / init_total_cost) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };
    let delta_holding_val = sim_holding_val - init_holding_val;
    let delta_holding_val_pct = if init_holding_val > Decimal::ZERO {
        (delta_holding_val / init_holding_val) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };
    let delta_unrealized_pl = sim_unrealized_pl - init_unrealized_pl;
    let delta_unrealized_pl_pct = sim_unrealized_pl_pct - init_unrealized_pl_pct;

    let breakeven_dist_init = if market_price > Decimal::ZERO {
        ((init_avg_cost - market_price) / market_price) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };
    let breakeven_dist_sim = if market_price > Decimal::ZERO {
        ((sim_avg_cost - market_price) / market_price) * ONE_HUNDRED
    } else {
        Decimal::ZERO
    };

    OrderSimulationResult {
        initial: SimulationStateMetrics {
            total_shares: round_dp(init_shares, 6),
            average_cost: round_dp(init_avg_cost, 4),
            total_cost: round_dp(init_total_cost, 2),
            market_price: round_dp(market_price, 4),
            holding_value: round_dp(init_holding_val, 2),
            unrealized_pl: round_dp(init_unrealized_pl, 2),
            unrealized_pl_percent: round_dp(init_unrealized_pl_pct, 2),
            realized_pl: Decimal::ZERO,
        },
        simulated: SimulationStateMetrics {
            total_shares: round_dp(sim_shares, 6),
            average_cost: round_dp(sim_avg_cost, 4),
            total_cost: round_dp(sim_total_cost, 2),
            market_price: round_dp(market_price, 4),
            holding_value: round_dp(sim_holding_val, 2),
            unrealized_pl: round_dp(sim_unrealized_pl, 2),
            unrealized_pl_percent: round_dp(sim_unrealized_pl_pct, 2),
            realized_pl: round_dp(sim_realized_pl, 2),
        },
        delta: SimulationDeltaMetrics {
            shares: round_dp(delta_shares, 6),
            shares_percent: round_dp(delta_shares_pct, 2),
            average_cost: round_dp(delta_avg_cost, 4),
            average_cost_percent: round_dp(delta_avg_cost_pct, 2),
            total_cost: round_dp(delta_total_cost, 2),
            total_cost_percent: round_dp(delta_total_cost_pct, 2),
            holding_value: round_dp(delta_holding_val, 2),
            holding_value_percent: round_dp(delta_holding_val_pct, 2),
            unrealized_pl: round_dp(delta_unrealized_pl, 2),
            unrealized_pl_percent: round_dp(delta_unrealized_pl_pct, 2),
            breakeven_distance_initial: round_dp(breakeven_dist_init, 2),
            breakeven_distance_simulated: round_dp(breakeven_dist_sim, 2),
            realized_pl: round_dp(sim_realized_pl, 2),
        },
        total_capital_outlay: round_dp(total_outlay, 2),
        total_proceeds: round_dp(total_proceeds, 2),
        total_fees: round_dp(total_fees, 2),
        currency: initial.currency.clone(),
    }
}

/// Solves the number of shares required at `purchase_price` to reach `target_avg_cost`.
pub fn solve_target_cost(input: &TargetCostInput) -> TargetCostResult {
    let s0 = input.initial.shares;
    let c0 = input
        .initial
        .total_cost
        .unwrap_or(s0 * input.initial.avg_cost);
    let p0 = if s0 > Decimal::ZERO {
        input.initial.avg_cost
    } else {
        Decimal::ZERO
    };
    let target = input.target_avg_cost;
    let p_buy = input.purchase_price;
    let f = input.fee_percent / ONE_HUNDRED;
    let p_eff = p_buy * (Decimal::ONE + f);

    let invalid = |msg: &str| TargetCostResult {
        is_valid: false,
        error_message: msg.to_string(),
        required_shares: Decimal::ZERO,
        required_capital: Decimal::ZERO,
        fee_amount: Decimal::ZERO,
        total_outlay: Decimal::ZERO,
        achieved_avg_cost: Decimal::ZERO,
        new_total_shares: Decimal::ZERO,
        new_total_cost: Decimal::ZERO,
        currency: input.initial.currency.clone(),
    };

    if s0 <= Decimal::ZERO {
        if p_eff <= Decimal::ZERO {
            return invalid("Purchase price must be greater than zero.");
        }
        let req_shares = Decimal::ONE;
        let req_capital = req_shares * p_buy;
        let fee_amount = req_capital * f;
        let total_outlay = req_capital + fee_amount;
        return TargetCostResult {
            is_valid: true,
            error_message: String::new(),
            required_shares: round_dp(req_shares, 6),
            required_capital: round_dp(req_capital, 2),
            fee_amount: round_dp(fee_amount, 2),
            total_outlay: round_dp(total_outlay, 2),
            achieved_avg_cost: round_dp(total_outlay / req_shares, 4),
            new_total_shares: round_dp(req_shares, 6),
            new_total_cost: round_dp(total_outlay, 2),
            currency: input.initial.currency.clone(),
        };
    }

    let denom = target - p_eff;
    if denom.abs() < BOUNDARY_EPSILON {
        return invalid("Target average cost equals effective buy price. Mathematical boundary.");
    }

    let req_shares = (c0 - (s0 * target)) / denom;
    if req_shares <= Decimal::ZERO {
        let msg = if p_eff >= target && target < p0 {
            format!(
                "Cannot average down to {:.2} when effective buy price ({:.2}) is higher than or equal to target cost.",
                round_dp(target, 2),
                round_dp(p_eff, 2)
            )
        } else if p_eff <= target && target > p0 {
            format!(
                "Cannot average up to {:.2} when effective buy price ({:.2}) is lower than or equal to target cost.",
                round_dp(target, 2),
                round_dp(p_eff, 2)
            )
        } else {
            "No additional shares required or target is already achieved.".to_string()
        };
        return invalid(&msg);
    }

    let req_capital = req_shares * p_buy;
    let fee_amount = req_capital * f;
    let total_outlay = req_capital + fee_amount;
    let new_total_shares = s0 + req_shares;
    let new_total_cost = c0 + total_outlay;
    let achieved_avg_cost = if new_total_shares > Decimal::ZERO {
        new_total_cost / new_total_shares
    } else {
        Decimal::ZERO
    };

    TargetCostResult {
        is_valid: true,
        error_message: String::new(),
        required_shares: round_dp(req_shares, 6),
        required_capital: round_dp(req_capital, 2),
        fee_amount: round_dp(fee_amount, 2),
        total_outlay: round_dp(total_outlay, 2),
        achieved_avg_cost: round_dp(achieved_avg_cost, 4),
        new_total_shares: round_dp(new_total_shares, 6),
        new_total_cost: round_dp(new_total_cost, 2),
        currency: input.initial.currency.clone(),
    }
}
