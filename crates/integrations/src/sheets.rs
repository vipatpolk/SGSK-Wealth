use std::time::Duration;

use reqwest::Client;
use sgsk_application::ports::{PortFuture, TransactionSheetPort};
use sgsk_common::AppError;
use sgsk_domain::AssetTabId;

#[derive(Debug, Clone)]
pub struct GoogleSheetsConfig {
    pub base_url: String,
    pub spreadsheet_id: String,
    pub pvd_spreadsheet_id: String,
}

/// Maps an `AssetTabId` to its Google Sheets `gid` (matches `backend/src/config/sheet_config.rs`).
pub const fn tab_sheet_gid(tab: AssetTabId) -> Option<&'static str> {
    match tab {
        AssetTabId::All => None,
        AssetTabId::UsStock => Some("1032243687"),
        AssetTabId::ThaiStock => Some("102823823"),
        AssetTabId::Crypto => Some("1822302220"),
        AssetTabId::MutualFund => Some("359978839"),
        AssetTabId::Bond => Some("1657887056"),
        AssetTabId::ProvidentFund => Some("0"),
        AssetTabId::ClosedPosition => Some("273600915"),
    }
}

pub const NON_EMPTY_TABS: &[AssetTabId] = &[
    AssetTabId::UsStock,
    AssetTabId::ThaiStock,
    AssetTabId::Crypto,
    AssetTabId::MutualFund,
    AssetTabId::Bond,
    AssetTabId::ProvidentFund,
    AssetTabId::ClosedPosition,
];

#[derive(Clone)]
pub struct GoogleSheetsTransactionAdapter {
    config: GoogleSheetsConfig,
    client: Client,
}

impl GoogleSheetsTransactionAdapter {
    pub fn new(config: GoogleSheetsConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self { config, client }
    }

    fn export_url(&self, tab: AssetTabId) -> Result<String, AppError> {
        let gid = tab_sheet_gid(tab).ok_or_else(|| {
            AppError::Validation(format!("Tab {tab:?} does not map to a single sheet GID"))
        })?;
        let sheet_id = if tab == AssetTabId::ProvidentFund {
            self.config.pvd_spreadsheet_id.trim()
        } else {
            self.config.spreadsheet_id.trim()
        };
        if sheet_id.is_empty() {
            return Err(AppError::Upstream(
                "Google Spreadsheet ID is not configured".into(),
            ));
        }
        let base = self.config.base_url.trim().trim_end_matches('/');
        Ok(format!("{base}/{sheet_id}/export?format=csv&gid={gid}"))
    }

    async fn fetch_single(&self, tab: AssetTabId) -> Result<String, AppError> {
        let url = self.export_url(tab)?;
        let res = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Upstream(format!("Google Sheets request failed: {e}")))?;
        let res = res
            .error_for_status()
            .map_err(|e| AppError::Upstream(format!("Google Sheets returned error: {e}")))?;
        res.text()
            .await
            .map_err(|e| AppError::Upstream(format!("Failed reading Google Sheets CSV: {e}")))
    }
}

impl TransactionSheetPort for GoogleSheetsTransactionAdapter {
    fn fetch_tab_csv<'a>(&'a self, tab: AssetTabId) -> PortFuture<'a, Result<String, AppError>> {
        Box::pin(async move { self.fetch_single(tab).await })
    }

    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(AssetTabId, String)>, AppError>> {
        Box::pin(async move {
            let mut results = Vec::new();
            let mut first_error = None;
            for &tab in NON_EMPTY_TABS {
                match self.fetch_single(tab).await {
                    Ok(csv) => results.push((tab, csv)),
                    Err(err) => {
                        if first_error.is_none() {
                            first_error = Some(err);
                        }
                    }
                }
            }
            if results.is_empty() {
                if let Some(err) = first_error {
                    return Err(err);
                }
            }
            Ok(results)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{GoogleSheetsConfig, GoogleSheetsTransactionAdapter};
    use sgsk_application::ports::TransactionSheetPort;
    use sgsk_domain::AssetTabId;
    use wiremock::matchers::{method, path, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn routes_us_stock_and_pvd_to_configured_spreadsheets() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/main-sheet/export"))
            .and(query_param("gid", "1032243687"))
            .respond_with(
                ResponseTemplate::new(200).set_body_string("Symbol,Date\nAAPL,2025-01-10\n"),
            )
            .mount(&server)
            .await;

        Mock::given(method("GET"))
            .and(path("/pvd-sheet/export"))
            .and(query_param("gid", "0"))
            .respond_with(
                ResponseTemplate::new(200).set_body_string("Symbol,Date\nPVD1,2025-01-10\n"),
            )
            .mount(&server)
            .await;

        let adapter = GoogleSheetsTransactionAdapter::new(GoogleSheetsConfig {
            base_url: server.uri(),
            spreadsheet_id: "main-sheet".into(),
            pvd_spreadsheet_id: "pvd-sheet".into(),
        });

        let us_csv = adapter.fetch_tab_csv(AssetTabId::UsStock).await.unwrap();
        assert!(us_csv.contains("AAPL"));
        let pvd_csv = adapter
            .fetch_tab_csv(AssetTabId::ProvidentFund)
            .await
            .unwrap();
        assert!(pvd_csv.contains("PVD1"));
    }
}
