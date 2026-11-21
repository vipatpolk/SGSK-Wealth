use std::sync::Arc;

use crate::config::settings::Settings;
use crate::features::dividends::services::dividend_service::DividendService;
use crate::features::market_data::services::icon_service::IconService;
use crate::features::market_data::services::nav_service::NavService;
use crate::features::market_data::services::price_service::PriceService;
use crate::features::portfolio::services::allocation_service::AllocationService;
use crate::features::portfolio::services::performance_service::PerformanceService;
use crate::features::portfolio::services::share_lot_service::ShareLotService;
use crate::features::portfolio::services::valuation_service::ValuationService;
use crate::features::tools::services::tools_service::ToolsService;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::http_client::HttpResources;
use crate::utils::supabase_auth::SupabaseTokenVerifier;
use crate::utils::yfinance_client::{HttpYahooFinanceClient, YahooFinanceProvider};

pub struct AppState {
    pub settings: Arc<Settings>,
    pub http: Arc<HttpResources>,
    pub cache: Arc<TTLCache>,
    pub singleflight: Arc<AsyncSingleflight>,
    pub token_verifier: SupabaseTokenVerifier,
    pub share_lot_service: ShareLotService,
    pub nav_service: NavService,
    pub price_service: PriceService,
    pub icon_service: IconService,
    pub valuation_service: ValuationService,
    pub performance_service: PerformanceService,
    pub allocation_service: AllocationService,
    pub dividend_service: DividendService,
    pub tools_service: ToolsService,
}

impl AppState {
    pub fn from_settings(settings: Settings) -> Arc<Self> {
        let settings = Arc::new(settings);
        let http = Arc::new(HttpResources::new(&settings));
        let yf_client: Arc<dyn YahooFinanceProvider> =
            Arc::new(HttpYahooFinanceClient::new(Arc::clone(&http), &settings));
        Self::with_yahoo_provider(settings, http, yf_client)
    }

    pub fn with_yahoo_provider(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        yf_client: Arc<dyn YahooFinanceProvider>,
    ) -> Arc<Self> {
        let cache = Arc::new(TTLCache::new(60.0, 2000));
        let singleflight = Arc::new(AsyncSingleflight::new());
        let icon_cache = Arc::new(TTLCache::new(86400.0, 2000));
        let icon_singleflight = Arc::new(AsyncSingleflight::new());

        let token_verifier = SupabaseTokenVerifier::new(
            Arc::clone(&http),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );

        let share_lot_service = ShareLotService::new(
            Arc::clone(&settings),
            Arc::clone(&http),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let nav_service = NavService::new(
            Arc::clone(&settings),
            Arc::clone(&http),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let price_service = PriceService::new(
            Arc::clone(&settings),
            Arc::clone(&http),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
            nav_service.clone(),
            yf_client,
        );
        let icon_service = IconService::new(
            Arc::clone(&http),
            icon_cache,
            icon_singleflight,
            nav_service.clone(),
        );
        let valuation_service = ValuationService::new(
            share_lot_service.clone(),
            price_service.clone(),
            nav_service.clone(),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let performance_service = PerformanceService::new(
            valuation_service.clone(),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let allocation_service = AllocationService::new(valuation_service.clone());
        let dividend_service = DividendService::new(
            valuation_service.clone(),
            price_service.clone(),
            nav_service.clone(),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let tools_service = ToolsService::new(valuation_service.clone());

        Arc::new(Self {
            settings,
            http,
            cache,
            singleflight,
            token_verifier,
            share_lot_service,
            nav_service,
            price_service,
            icon_service,
            valuation_service,
            performance_service,
            allocation_service,
            dividend_service,
            tools_service,
        })
    }
}
