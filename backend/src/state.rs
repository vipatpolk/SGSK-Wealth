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
use crate::ports::{
    FundNavPort, GoogleSheetsAdapter, IdentityProfilePort, MarketPricePort, NavServicePortAdapter,
    PriceServicePortAdapter, SupabaseProfileAdapter, TransactionSheetPort,
};
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::http_client::HttpResources;
use crate::utils::supabase_auth::SupabaseTokenVerifier;
use crate::utils::yfinance_client::{HttpYahooFinanceClient, YahooFinanceProvider};

pub struct InfrastructureDeps {
    pub settings: Arc<Settings>,
    pub http: Arc<HttpResources>,
    pub cache: Arc<TTLCache>,
    pub singleflight: Arc<AsyncSingleflight>,
}

pub struct IdentityDeps {
    pub token_verifier: SupabaseTokenVerifier,
}

pub struct MarketDataDeps {
    pub nav_service: NavService,
    pub price_service: PriceService,
    pub icon_service: IconService,
}

pub struct PortfolioDeps {
    pub share_lot_service: ShareLotService,
    pub valuation_service: ValuationService,
    pub performance_service: PerformanceService,
    pub allocation_service: AllocationService,
    pub dividend_service: DividendService,
    pub tools_service: ToolsService,
}

pub struct AppState {
    pub infra: InfrastructureDeps,
    pub identity: IdentityDeps,
    pub market_data: MarketDataDeps,
    pub portfolio: PortfolioDeps,
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

        let sheet_port: Arc<dyn TransactionSheetPort> = Arc::new(GoogleSheetsAdapter::new(
            Arc::clone(&settings),
            Arc::clone(&http),
            Arc::clone(&cache),
        ));
        let profile_port: Arc<dyn IdentityProfilePort> =
            Arc::new(SupabaseProfileAdapter::new(Arc::clone(&http)));

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
            Arc::clone(&settings),
            Arc::clone(&http),
            icon_cache,
            icon_singleflight,
            nav_service.clone(),
        );

        let price_port: Arc<dyn MarketPricePort> =
            Arc::new(PriceServicePortAdapter::new(price_service.clone()));
        let nav_port: Arc<dyn FundNavPort> =
            Arc::new(NavServicePortAdapter::new(nav_service.clone()));

        Self::assemble(
            settings,
            http,
            cache,
            singleflight,
            nav_service,
            price_service,
            icon_service,
            sheet_port,
            price_port,
            nav_port,
            profile_port,
        )
    }

    pub fn with_ports(
        settings: Settings,
        sheet_port: Arc<dyn TransactionSheetPort>,
        price_port: Arc<dyn MarketPricePort>,
        nav_port: Arc<dyn FundNavPort>,
        profile_port: Arc<dyn IdentityProfilePort>,
    ) -> Arc<Self> {
        let settings = Arc::new(settings);
        let http = Arc::new(HttpResources::new(&settings));
        let cache = Arc::new(TTLCache::new(60.0, 2000));
        let singleflight = Arc::new(AsyncSingleflight::new());
        let icon_cache = Arc::new(TTLCache::new(86400.0, 2000));
        let icon_singleflight = Arc::new(AsyncSingleflight::new());
        let yf_client: Arc<dyn YahooFinanceProvider> =
            Arc::new(HttpYahooFinanceClient::new(Arc::clone(&http), &settings));

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
            Arc::clone(&settings),
            Arc::clone(&http),
            icon_cache,
            icon_singleflight,
            nav_service.clone(),
        );

        Self::assemble(
            settings,
            http,
            cache,
            singleflight,
            nav_service,
            price_service,
            icon_service,
            sheet_port,
            price_port,
            nav_port,
            profile_port,
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn assemble(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
        nav_service: NavService,
        price_service: PriceService,
        icon_service: IconService,
        sheet_port: Arc<dyn TransactionSheetPort>,
        price_port: Arc<dyn MarketPricePort>,
        nav_port: Arc<dyn FundNavPort>,
        profile_port: Arc<dyn IdentityProfilePort>,
    ) -> Arc<Self> {
        let token_verifier = SupabaseTokenVerifier::with_profile_port(
            Arc::clone(&http),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
            profile_port,
        );

        let share_lot_service =
            ShareLotService::with_port(sheet_port, Arc::clone(&cache), Arc::clone(&singleflight));
        let valuation_service = ValuationService::with_ports(
            share_lot_service.clone(),
            Arc::clone(&price_port),
            Arc::clone(&nav_port),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let performance_service = PerformanceService::new(
            valuation_service.clone(),
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let allocation_service = AllocationService::new(valuation_service.clone());
        let dividend_service = DividendService::with_ports(
            valuation_service.clone(),
            price_port,
            nav_port,
            Arc::clone(&cache),
            Arc::clone(&singleflight),
        );
        let tools_service = ToolsService::new(valuation_service.clone());

        Arc::new(Self {
            infra: InfrastructureDeps {
                settings,
                http,
                cache,
                singleflight,
            },
            identity: IdentityDeps { token_verifier },
            market_data: MarketDataDeps {
                nav_service,
                price_service,
                icon_service,
            },
            portfolio: PortfolioDeps {
                share_lot_service,
                valuation_service,
                performance_service,
                allocation_service,
                dividend_service,
                tools_service,
            },
        })
    }
}
