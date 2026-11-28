use std::str::FromStr;
use std::time::Duration;

use reqwest::{Client, StatusCode};
use rust_decimal::Decimal;
use serde_json::Value;
use sgsk_application::ports::{FundNavPort, MarketPricePort, PortFuture};
use sgsk_common::AppError;

/// Adapter for market FX rates.
#[derive(Clone)]
pub struct HttpMarketPriceAdapter {
    fx_endpoint: String,
    client: Client,
}

impl HttpMarketPriceAdapter {
    pub fn new(fx_endpoint: impl Into<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self {
            fx_endpoint: fx_endpoint.into(),
            client,
        }
    }
}

impl MarketPricePort for HttpMarketPriceAdapter {
    fn fetch_fx_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> PortFuture<'a, Result<Decimal, AppError>> {
        Box::pin(async move {
            let from = from_currency.trim().to_uppercase();
            let to = to_currency.trim().to_uppercase();
            if from == to {
                return Ok(Decimal::ONE);
            }
            if self.fx_endpoint.trim().is_empty() {
                return Err(AppError::Upstream("FX endpoint is not configured".into()));
            }
            let res = self
                .client
                .get(&self.fx_endpoint)
                .query(&[("from", from.as_str()), ("to", to.as_str())])
                .send()
                .await
                .map_err(|e| AppError::Upstream(format!("FX lookup failed: {e}")))?;
            let res = res
                .error_for_status()
                .map_err(|e| AppError::Upstream(format!("FX endpoint error: {e}")))?;
            let body = res
                .json::<Value>()
                .await
                .map_err(|e| AppError::Upstream(format!("Invalid FX JSON: {e}")))?;

            let rate_str = body
                .get("rate")
                .and_then(|v| {
                    v.as_str()
                        .map(str::to_string)
                        .or_else(|| v.as_f64().map(|n| n.to_string()))
                })
                .ok_or_else(|| AppError::Upstream("Missing 'rate' field in FX response".into()))?;
            Decimal::from_str(&rate_str)
                .map_err(|e| AppError::Upstream(format!("Invalid FX decimal: {e}")))
        })
    }
}

/// Adapter for Thailand SEC Open Data APIs (Mutual Fund & PVD NAVs).
#[derive(Clone)]
pub struct HttpFundNavAdapter {
    base_url: String,
    subscription_key: String,
    client: Client,
}

impl HttpFundNavAdapter {
    pub fn new(base_url: impl Into<String>, subscription_key: impl Into<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self {
            base_url: base_url.into(),
            subscription_key: subscription_key.into(),
            client,
        }
    }
}

impl FundNavPort for HttpFundNavAdapter {
    fn fetch_nav<'a>(
        &'a self,
        symbol: &'a str,
    ) -> PortFuture<'a, Result<Option<Decimal>, AppError>> {
        Box::pin(async move {
            let base = self.base_url.trim().trim_end_matches('/');
            if base.is_empty() {
                return Ok(None);
            }
            let url = format!("{base}/nav/{symbol}");
            let mut req = self.client.get(&url);
            if !self.subscription_key.trim().is_empty() {
                req = req.header("Ocp-Apim-Subscription-Key", self.subscription_key.trim());
            }
            let res = req
                .send()
                .await
                .map_err(|e| AppError::Upstream(format!("SEC NAV request failed: {e}")))?;

            if res.status() == StatusCode::NO_CONTENT {
                return Ok(None);
            }
            let res = res
                .error_for_status()
                .map_err(|e| AppError::Upstream(format!("SEC NAV error: {e}")))?;
            let body = res
                .json::<Value>()
                .await
                .map_err(|e| AppError::Upstream(format!("Invalid SEC NAV JSON: {e}")))?;
            let nav_val = body.get("nav").and_then(|v| {
                v.as_str()
                    .map(str::to_string)
                    .or_else(|| v.as_f64().map(|n| n.to_string()))
            });
            match nav_val {
                Some(s) => Decimal::from_str(&s)
                    .map(Some)
                    .map_err(|e| AppError::Upstream(format!("Invalid NAV decimal: {e}"))),
                None => Ok(None),
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{HttpFundNavAdapter, HttpMarketPriceAdapter};
    use rust_decimal::Decimal;
    use sgsk_application::ports::{FundNavPort, MarketPricePort};
    use std::str::FromStr;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn fetches_fx_rate_and_handles_sec_204_no_content() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/fx"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(serde_json::json!({ "rate": "34.50" })),
            )
            .mount(&server)
            .await;

        Mock::given(method("GET"))
            .and(path("/sec/nav/EMPTY-FUND"))
            .and(header("Ocp-Apim-Subscription-Key", "sec-key"))
            .respond_with(ResponseTemplate::new(204))
            .mount(&server)
            .await;

        let fx = HttpMarketPriceAdapter::new(format!("{}/fx", server.uri()));
        let rate = fx.fetch_fx_rate("USD", "THB").await.unwrap();
        assert_eq!(rate, Decimal::from_str("34.50").unwrap());
        assert_eq!(fx.fetch_fx_rate("THB", "THB").await.unwrap(), Decimal::ONE);

        let nav = HttpFundNavAdapter::new(format!("{}/sec", server.uri()), "sec-key");
        assert_eq!(nav.fetch_nav("EMPTY-FUND").await.unwrap(), None);
    }
}
