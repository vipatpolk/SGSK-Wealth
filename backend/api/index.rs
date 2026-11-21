use sgsk_backend::config::settings::Settings;
use sgsk_backend::create_app;
use sgsk_backend::state::AppState;
use tower::ServiceBuilder;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::{run, Error};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let settings = Settings::from_env().map_err(Error::from)?;
    let state = AppState::from_settings(settings);
    let router = create_app(state);

    let app = ServiceBuilder::new()
        .layer(VercelLayer::new())
        .service(router);

    run(app).await
}
