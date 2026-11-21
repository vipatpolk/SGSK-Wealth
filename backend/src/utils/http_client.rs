use std::sync::Arc;
use std::time::Duration;

use reqwest::Client;
use tokio::sync::Semaphore;

use crate::config::settings::Settings;

pub struct HttpResources {
    pub client: Client,
    pub outbound_sem: Arc<Semaphore>,
    pub yahoo_sem: Arc<Semaphore>,
    pub sec_sem: Arc<Semaphore>,
    pub sheets_sem: Arc<Semaphore>,
    pub binance_sem: Arc<Semaphore>,
}

impl HttpResources {
    pub fn new(settings: &Settings) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .connect_timeout(Duration::from_secs(5))
            .pool_max_idle_per_host(40)
            .user_agent("Mozilla/5.0")
            .build()
            .expect("failed to build reqwest client");

        Self {
            client,
            outbound_sem: Arc::new(Semaphore::new(25)),
            yahoo_sem: Arc::new(Semaphore::new(settings.yfinance_max_concurrency.max(1))),
            sec_sem: Arc::new(Semaphore::new(10)),
            sheets_sem: Arc::new(Semaphore::new(5)),
            binance_sem: Arc::new(Semaphore::new(5)),
        }
    }
}
