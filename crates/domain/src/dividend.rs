use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sgsk_common::Currency;

/// Tax withholding regime for cash dividends.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DividendTaxJurisdiction {
    /// U.S. equity with W-8BEN treaty rate (15%).
    UsDta15,
    /// U.S. equity without treaty / NRA rate (30%).
    UsNra30,
    /// Thai SET equity standard withholding tax (10%).
    ThaiStandard10,
    /// Thai BOI-exempt dividend (0%).
    ThaiBoiExempt0,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DividendPayout {
    #[serde(with = "rust_decimal::serde::str")]
    pub gross_amount: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub withholding_tax_rate: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub withholding_tax_amount: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub net_amount: Decimal,
    pub currency: Currency,
}
