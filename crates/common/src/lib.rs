use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Supported ISO 4217 display and settlement currencies.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Currency {
    Thb,
    Usd,
}

impl Currency {
    /// Returns the number of standard decimal places for display/settlement rounding.
    pub const fn decimal_places(self) -> u32 {
        match self {
            Self::Thb | Self::Usd => 2,
        }
    }
}

/// Shared application error type mapped at the API boundary.
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication required: {0}")]
    Unauthorized(String),
    #[error("Access forbidden: {0}")]
    Forbidden(String),
    #[error("Validation failed: {0}")]
    Validation(String),
    #[error("Upstream error: {0}")]
    Upstream(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

#[cfg(test)]
mod tests {
    use super::Currency;

    #[test]
    fn currency_decimal_places_match_iso_4217() {
        assert_eq!(Currency::Thb.decimal_places(), 2);
        assert_eq!(Currency::Usd.decimal_places(), 2);
    }
}
