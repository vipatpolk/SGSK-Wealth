use std::sync::Arc;

use approx::assert_relative_eq;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::features::portfolio::models::transaction::Transaction;
use sgsk_backend::features::portfolio::services::share_lot_service::ShareLotService;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::http_client::HttpResources;
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

fn make_share_lot_service(sheets_base: Option<String>) -> ShareLotService {
    let mut settings = Settings::default();
    if let Some(base) = sheets_base {
        settings.sheets_base_url = base;
    }
    let settings = Arc::new(settings);
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 200));
    let singleflight = Arc::new(AsyncSingleflight::new());
    ShareLotService::new(settings, http, cache, singleflight)
}

fn make_tx(symbol: &str, date: &str, quantity: f64, price: f64) -> Transaction {
    Transaction {
        symbol: symbol.to_string(),
        date: date.to_string(),
        quantity,
        price,
        currency: "USD".to_string(),
        asset_type: "us-stock".to_string(),
        exchange_from: None,
        exchange_to: None,
        tx_type: None,
        fee: None,
        note: None,
        employee_contribution: None,
        employee_earnings: None,
        employer_matching: None,
        employer_earnings: None,
        pvd_fund_name: None,
    }
}

#[test]
fn test_csv_parsing_fixtures_bonds_bom_exchange_and_pvd() {
    let svc = make_share_lot_service(None);

    let us_csv = include_str!("fixtures/sample_us_stock.csv");
    let us_txs = svc.parse_csv(us_csv, "us-stock");
    assert_eq!(us_txs.len(), 4);
    assert_eq!(us_txs[0].symbol, "AAPL");
    assert_relative_eq!(us_txs[2].quantity, -8.0, epsilon = 1e-6);

    let th_csv = include_str!("fixtures/sample_thai_stock.csv");
    let th_txs = svc.parse_csv(th_csv, "thai-stock");
    assert_eq!(th_txs.len(), 2);
    assert_relative_eq!(th_txs[0].quantity, 1000.0, epsilon = 1e-6);

    // Malformed / missing rows skipped cleanly
    let malformed = "Symbol,Date,Quantity,Price,Currency\n\
                     AAPL,2026-01-01,notanumber,100,USD\n\
                     MSFT,2026-01-02,,100,USD\n\
                     NVDA,2026-01-03,5,200,USD\n";
    let clean = svc.parse_csv(malformed, "us-stock");
    assert_eq!(clean.len(), 1);
    assert_eq!(clean[0].symbol, "NVDA");

    // Bond CSV with Price Currency column + % formatting
    let bond_csv = "Bond Name,Date,Quantity,Price,Price Currency,Asset Type\n\
                    US10Y,2026-02-01,10,98.50,USD,bond\n";
    let bonds = svc.parse_csv(bond_csv, "bond");
    assert_eq!(bonds.len(), 1);
    assert_eq!(bonds[0].currency, "USD");
    assert_relative_eq!(bonds[0].price, 98.50, epsilon = 1e-6);

    // UTF-8 BOM + 5-column CSV
    let bom_csv = "\u{feff}Symbol,Date,Quantity,Price,Currency\nSPY,2026-03-01,2,500,USD\n";
    let bom_txs = svc.parse_csv(bom_csv, "us-stock");
    assert_eq!(bom_txs.len(), 1);
    assert_eq!(bom_txs[0].symbol, "SPY");
    assert_eq!(bom_txs[0].asset_type, "us-stock");

    // Mutual fund Exchange In / Out CSV
    let mf_csv = "Symbol,Date,Type,Quantity,Price,Currency,ExchangeFrom,ExchangeTo\n\
                  FUND_A,2026-01-01,Buy,100,10,THB,,\n\
                  FUND_A,2026-02-01,Exchange Out,40,12,THB,FUND_A,FUND_B\n\
                  FUND_B,2026-02-01,Exchange In,24,20,THB,FUND_A,FUND_B\n";
    let mf_txs = svc.parse_csv(mf_csv, "mutual-fund");
    assert_eq!(mf_txs.len(), 3);
    assert_eq!(mf_txs[1].tx_type.as_deref(), Some("EXCHANGE_OUT"));
    assert_eq!(mf_txs[2].exchange_to.as_deref(), Some("FUND_B"));

    // PVD new structure (Employee / Employer separate contributions)
    let pvd_new_csv = "Fund,Symbol,Employee Contribution,Employer Matching,Employee Earnings,Employer Earnings,Employee Unit,Employer Unit,Currency\n\
                       Tisco Master,Global Equity,\"1,000\",500,100,50,10,5,THB\n";
    let pvd_new = svc.parse_pvd_csv(pvd_new_csv);
    assert_eq!(pvd_new.len(), 2);
    assert_eq!(pvd_new[0].symbol, "Global Equity");
    assert_eq!(pvd_new[0].pvd_fund_name.as_deref(), Some("Tisco Master"));
    assert_relative_eq!(pvd_new[0].quantity, 10.0, epsilon = 1e-6);
    assert_relative_eq!(
        pvd_new[0].employee_contribution.unwrap(),
        1000.0,
        epsilon = 1e-6
    );
    assert_relative_eq!(pvd_new[1].quantity, 5.0, epsilon = 1e-6);
    assert_relative_eq!(pvd_new[1].employer_matching.unwrap(), 500.0, epsilon = 1e-6);
    assert_relative_eq!(pvd_new[1].employer_earnings.unwrap(), 50.0, epsilon = 1e-6);

    // PVD old structure falls back to parse_csv("provident-fund") when unit columns are absent
    let pvd_old_csv = "Symbol,Date,Quantity,Price,Currency\n\
                       PVDEQ,2025-12-31,200,12.5,THB\n";
    assert!(svc.parse_pvd_csv(pvd_old_csv).is_empty());
    let pvd_old = svc.parse_csv(pvd_old_csv, "provident-fund");
    assert_eq!(pvd_old.len(), 1);
    assert_eq!(pvd_old[0].asset_type, "provident-fund");
    assert_relative_eq!(pvd_old[0].quantity, 200.0, epsilon = 1e-6);
}

#[test]
fn test_fifo_engine_calculations_and_edge_cases() {
    let svc = make_share_lot_service(None);

    // 1. Single buy + partial sale
    let (open, closed, _) = svc.process_transactions(&[
        make_tx("AAPL", "2026-01-01", 10.0, 100.0),
        make_tx("AAPL", "2026-01-10", -4.0, 130.0),
    ]);
    assert_eq!(open.len(), 1);
    assert_relative_eq!(open[0].total_shares, 6.0, epsilon = 1e-6);
    assert_relative_eq!(open[0].total_cost, 600.0, epsilon = 1e-6);
    assert_eq!(closed.len(), 1);
    assert_relative_eq!(closed[0].realized_pl, 120.0, epsilon = 1e-6);

    // 2. Finpension CSIF worked example (FIFO across 3 buys + 1 partial sell)
    let (fin_open, fin_closed, _) = svc.process_transactions(&[
        make_tx("CSIF", "2024-01-10", 5.0, 1500.0),
        make_tx("CSIF", "2024-02-10", 3.0, 1600.0),
        make_tx("CSIF", "2024-03-10", 4.0, 1650.0),
        make_tx("CSIF", "2024-04-10", -6.0, 1689.4166666667),
    ]);
    assert_relative_eq!(fin_open[0].total_shares, 6.0, epsilon = 1e-6);
    assert_relative_eq!(fin_open[0].total_cost, 9800.0, epsilon = 1e-4);
    assert_relative_eq!(fin_closed[0].total_cost, 9100.0, epsilon = 1e-4);
    assert_relative_eq!(fin_closed[0].realized_pl, 1036.50, epsilon = 1e-2);

    // Explicit finpension exact example verifying 10227.16 cost basis & 1036.50 realized PL
    let (fp_open, fp_closed, _) = svc.process_transactions(&[
        make_tx("CSIFX", "2024-01-01", 5.0, 2000.0),
        make_tx("CSIFX", "2024-02-01", 5.0, 2045.432),
        make_tx("CSIFX", "2024-03-01", -5.0, 2207.30),
    ]);
    assert_relative_eq!(fp_open[0].total_cost, 10227.16, epsilon = 1e-2);
    assert_relative_eq!(fp_closed[0].realized_pl, 1036.50, epsilon = 1e-2);

    // 3. Crypto 1e-7 epsilon complete exit leaves 0 open lots
    let mut btc_buy = make_tx("BTC", "2026-01-01", 0.50000004, 2000000.0);
    btc_buy.asset_type = "crypto".to_string();
    let mut btc_sell = make_tx("BTC", "2026-01-05", -0.5, 2200000.0);
    btc_sell.asset_type = "crypto".to_string();
    let (btc_open, btc_closed, _) = svc.process_transactions(&[btc_buy, btc_sell]);
    assert!(btc_open.is_empty());
    assert_eq!(btc_closed.len(), 1);

    // 4. Zero-cost-basis bonus shares + positive qty with tx_type="SELL" + DD.MM.YYYY sorting
    let mut bonus = make_tx("BONUS", "01.01.2026", 10.0, 0.0);
    bonus.date = "01.01.2026".to_string();
    let mut sell_pos = make_tx("BONUS", "15.01.2026", 4.0, 25.0);
    sell_pos.tx_type = Some("SELL".to_string());
    let (b_open, b_closed, _) = svc.process_transactions(&[sell_pos, bonus]);
    assert_relative_eq!(b_open[0].total_shares, 6.0, epsilon = 1e-6);
    assert_relative_eq!(b_open[0].total_cost, 0.0, epsilon = 1e-6);
    assert_relative_eq!(b_closed[0].realized_pl, 100.0, epsilon = 1e-6);

    // 5. Oversell bounds matched lots cleanly
    let (over_open, over_closed, _) = svc.process_transactions(&[
        make_tx("OVER", "2026-01-01", 5.0, 100.0),
        make_tx("OVER", "2026-01-05", -8.0, 120.0),
    ]);
    assert!(over_open.is_empty());
    assert_relative_eq!(over_closed[0].closed_shares, 5.0, epsilon = 1e-6);
    assert_relative_eq!(over_closed[0].realized_pl, 100.0, epsilon = 1e-6);

    // 6. Acquisition fee & sell fee integrated into cost basis / net proceeds
    let mut buy_fee = make_tx("FEE", "2026-01-01", 10.0, 100.0);
    buy_fee.fee = Some(10.0);
    let mut sell_fee = make_tx("FEE", "2026-01-05", -10.0, 120.0);
    sell_fee.fee = Some(15.0);
    let (_, fee_closed, _) = svc.process_transactions(&[buy_fee, sell_fee]);
    // Cost = 1010, Proceeds = 1200 - 15 = 1185, PL = 175
    assert_relative_eq!(fee_closed[0].total_cost, 1010.0, epsilon = 1e-6);
    assert_relative_eq!(fee_closed[0].total_proceeds, 1185.0, epsilon = 1e-6);
    assert_relative_eq!(fee_closed[0].realized_pl, 175.0, epsilon = 1e-6);

    // 7. Mutual fund Exchange Out generates realized PL
    let mut ex_buy = make_tx("FUNDA", "2026-01-01", 100.0, 10.0);
    ex_buy.asset_type = "mutual-fund".to_string();
    let mut ex_out = make_tx("FUNDA", "2026-02-01", 40.0, 12.5);
    ex_out.asset_type = "mutual-fund".to_string();
    ex_out.tx_type = Some("Exchange Out".to_string());
    let (ex_open, ex_closed, _) = svc.process_transactions(&[ex_buy, ex_out]);
    assert_relative_eq!(ex_open[0].total_shares, 60.0, epsilon = 1e-6);
    assert_relative_eq!(ex_closed[0].realized_pl, 100.0, epsilon = 1e-6);
}

#[tokio::test]
async fn test_fetch_sheet_and_fetch_all_sheets_with_mock() {
    let mock_server = MockServer::start().await;
    let us_csv = include_str!("fixtures/sample_us_stock.csv");

    Mock::given(method("GET"))
        .and(path("/sample_spreadsheet_id/export"))
        .and(query_param("gid", "1032243687"))
        .respond_with(ResponseTemplate::new(200).set_body_string(us_csv))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/sample_spreadsheet_id/export"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string("Symbol,Date,Quantity,Price,Currency\n"),
        )
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/sample_pvd_spreadsheet_id/export"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string("Symbol,Date,Quantity,Price,Currency\n"),
        )
        .mount(&mock_server)
        .await;

    let svc = make_share_lot_service(Some(mock_server.uri()));

    // Invalid tab ID
    let invalid = svc.fetch_sheet("does-not-exist").await;
    assert!(invalid.error.is_some());

    // Specific tab
    let us = svc.fetch_sheet("us-stock").await;
    assert!(us.error.is_none());
    assert_eq!(us.summaries.len(), 2);
    assert_eq!(us.closed_summaries.len(), 1);

    // Fetch all sheets
    let all = svc.fetch_all_sheets().await;
    assert!(all.error.is_none());
    assert_eq!(all.summaries.len(), 2);
}

#[test]
fn test_process_transactions_excludes_pvd_from_transaction_summaries() {
    let svc = make_share_lot_service(None);
    let mut pvd_tx = make_tx("PVDSP500", "2026-01-15", 100.0, 12.0);
    pvd_tx.currency = "THB".to_string();
    pvd_tx.asset_type = "provident-fund".to_string();

    let (open_summaries, _, tx_summaries) =
        svc.process_transactions(&[make_tx("AAPL", "2026-01-10", 10.0, 150.0), pvd_tx]);
    assert!(open_summaries.iter().any(|s| s.symbol == "AAPL"));
    assert!(open_summaries.iter().any(|s| s.symbol == "PVDSP500"));
    assert_eq!(tx_summaries.len(), 1);
    assert_eq!(tx_summaries[0].symbol, "AAPL");
    assert!(!tx_summaries.iter().any(|s| s.symbol == "PVDSP500"));
}
