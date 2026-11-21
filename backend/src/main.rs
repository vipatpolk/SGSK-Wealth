use std::env;
use std::net::SocketAddr;

use sgsk_backend::config::settings::Settings;
use sgsk_backend::create_app;
use sgsk_backend::state::AppState;
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let settings = Settings::from_env().unwrap_or_else(|err| {
        eprintln!("{err}");
        std::process::exit(1);
    });

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8000);

    let addr: SocketAddr = format!("{host}:{port}")
        .parse()
        .expect("valid HOST:PORT socket address");

    let state = AppState::from_settings(settings);
    let app = create_app(state);

    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(err) => {
            eprintln!("Failed to bind SGSK-Wealth Rust backend to http://{addr}: {err}");
            std::process::exit(1);
        }
    };
    tracing::info!("SGSK-Wealth Rust backend listening on http://{addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server exited with error");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut sig) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            sig.recv().await;
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
