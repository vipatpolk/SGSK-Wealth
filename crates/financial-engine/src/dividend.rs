use rust_decimal::Decimal;
use sgsk_common::Currency;
use sgsk_domain::dividend::{DividendPayout, DividendTaxJurisdiction};

use crate::currency::round_currency;

/// Calculates gross dividend, statutory withholding tax, and net payout for U.S. & Thai equities.
pub fn calculate_dividend_payout(
    shares: Decimal,
    dividend_per_share: Decimal,
    jurisdiction: DividendTaxJurisdiction,
    currency: Currency,
) -> DividendPayout {
    let rate = match jurisdiction {
        DividendTaxJurisdiction::UsDta15 => Decimal::from_parts(15, 0, 0, false, 2),
        DividendTaxJurisdiction::UsNra30 => Decimal::from_parts(30, 0, 0, false, 2),
        DividendTaxJurisdiction::ThaiStandard10 => Decimal::from_parts(10, 0, 0, false, 2),
        DividendTaxJurisdiction::ThaiBoiExempt0 => Decimal::ZERO,
    };

    let gross_amount = round_currency(shares * dividend_per_share, currency);
    let withholding_tax_amount = round_currency(gross_amount * rate, currency);
    let net_amount = round_currency(gross_amount - withholding_tax_amount, currency);

    DividendPayout {
        gross_amount,
        withholding_tax_rate: rate,
        withholding_tax_amount,
        net_amount,
        currency,
    }
}
