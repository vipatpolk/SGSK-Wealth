use rust_decimal::{Decimal, RoundingStrategy};
use sgsk_common::Currency;

/// Rounds a monetary decimal value to the currency's standard decimal places using
/// midpoint-away-from-zero rounding.
pub fn round_currency(amount: Decimal, currency: Currency) -> Decimal {
    round_dp(amount, currency.decimal_places())
}

/// Rounds a decimal value to `dp` decimal places using midpoint-away-from-zero rounding.
pub fn round_dp(amount: Decimal, dp: u32) -> Decimal {
    amount.round_dp_with_strategy(dp, RoundingStrategy::MidpointAwayFromZero)
}

/// Converts between `USD`/`USDT` and `THB` using `usd_to_thb`.
pub fn convert_currency(amount: Decimal, from: &str, to: &str, usd_to_thb: Decimal) -> Decimal {
    let f = from.trim().to_uppercase();
    let t = to.trim().to_uppercase();
    let f_norm = if f == "USDT" { "USD" } else { f.as_str() };
    let t_norm = if t == "USDT" { "USD" } else { t.as_str() };

    if f_norm == t_norm || usd_to_thb <= Decimal::ZERO {
        return amount;
    }
    match (f_norm, t_norm) {
        ("USD", "THB") => amount * usd_to_thb,
        ("THB", "USD") => amount / usd_to_thb,
        _ => amount,
    }
}

#[cfg(test)]
mod tests {
    use super::{convert_currency, round_currency};
    use rust_decimal::Decimal;
    use sgsk_common::Currency;
    use std::str::FromStr;

    #[test]
    fn rounds_monetary_values_without_binary_float_drift() {
        let val = Decimal::from_str("0.1").unwrap() + Decimal::from_str("0.2").unwrap();
        assert_eq!(
            round_currency(val, Currency::Usd),
            Decimal::from_str("0.30").unwrap()
        );

        let half = Decimal::from_str("10.125").unwrap();
        assert_eq!(
            round_currency(half, Currency::Thb),
            Decimal::from_str("10.13").unwrap()
        );
    }

    #[test]
    fn converts_usd_and_thb_bidirectionally() {
        let rate = Decimal::from_str("35").unwrap();
        assert_eq!(
            convert_currency(Decimal::from_str("100").unwrap(), "USD", "THB", rate),
            Decimal::from_str("3500").unwrap()
        );
        assert_eq!(
            convert_currency(Decimal::from_str("3500").unwrap(), "THB", "USD", rate),
            Decimal::from_str("100").unwrap()
        );
    }
}
