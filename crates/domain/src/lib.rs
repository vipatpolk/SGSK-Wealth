pub mod allocation;
pub mod dividend;
pub mod tools;
pub mod transaction;

use serde::{Deserialize, Serialize};

/// Canonical asset tabs matching the Google Sheets portfolio structure.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AssetTabId {
    All,
    UsStock,
    ThaiStock,
    Crypto,
    MutualFund,
    Bond,
    ProvidentFund,
    ClosedPosition,
}

/// Active portfolio data source for the current session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PortfolioSource {
    GoogleSheets,
    Local,
}

#[cfg(test)]
mod tests {
    use super::{AssetTabId, PortfolioSource};

    #[test]
    fn asset_tab_serializes_in_kebab_case() {
        let json = serde_json::to_string(&AssetTabId::UsStock).unwrap();
        assert_eq!(json, "\"us-stock\"");
        let src = serde_json::to_string(&PortfolioSource::GoogleSheets).unwrap();
        assert_eq!(src, "\"google_sheets\"");
    }
}
