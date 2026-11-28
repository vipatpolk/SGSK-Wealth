use std::future::Future;
use std::pin::Pin;

use rust_decimal::Decimal;
use sgsk_common::AppError;
use sgsk_domain::AssetTabId;

pub type PortFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

/// Port for fetching portfolio transaction CSVs (Google Sheets adapter in `crates/integrations`).
pub trait TransactionSheetPort: Send + Sync {
    fn fetch_tab_csv<'a>(&'a self, tab: AssetTabId) -> PortFuture<'a, Result<String, AppError>>;
    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(AssetTabId, String)>, AppError>>;
}

/// Port for live market quotes and spot FX rates.
pub trait MarketPricePort: Send + Sync {
    fn fetch_fx_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> PortFuture<'a, Result<Decimal, AppError>>;
}

/// Port for Thailand SEC Mutual Fund and Provident Fund NAV data.
pub trait FundNavPort: Send + Sync {
    fn fetch_nav<'a>(
        &'a self,
        symbol: &'a str,
    ) -> PortFuture<'a, Result<Option<Decimal>, AppError>>;
}

/// Port for resolving user profile authorization flags from Supabase.
pub trait IdentityProfilePort: Send + Sync {
    fn fetch_profile_flags<'a>(
        &'a self,
        user_id: &'a str,
        bearer_token: &'a str,
    ) -> PortFuture<'a, Result<Option<(String, bool)>, AppError>>;
}
