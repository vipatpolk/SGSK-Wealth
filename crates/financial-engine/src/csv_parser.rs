use std::io::Cursor;
use std::str::FromStr;

use rust_decimal::Decimal;
use sgsk_domain::transaction::Transaction;

fn find_header_idx(header: &[String], candidates: &[&str]) -> Option<usize> {
    for candidate in candidates {
        if let Some(pos) = header.iter().position(|h| h == candidate) {
            return Some(pos);
        }
    }
    None
}

fn parse_decimal_cell(raw: Option<&str>) -> Option<Decimal> {
    let cleaned = raw?.trim().replace(',', "");
    if cleaned.is_empty() {
        return None;
    }
    Decimal::from_str(&cleaned).ok()
}

/// Parses a standard transaction CSV into normalized `Transaction` rows.
pub fn parse_transaction_csv(csv_text: &str, default_asset_type: &str) -> Vec<Transaction> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(Cursor::new(csv_text.as_bytes()));

    let rows: Vec<Vec<String>> = reader
        .records()
        .filter_map(Result::ok)
        .map(|rec| rec.iter().map(|s| s.to_string()).collect())
        .collect();

    if rows.len() < 2 {
        return Vec::new();
    }

    let header: Vec<String> = rows[0]
        .iter()
        .map(|h| h.trim().trim_start_matches('\u{feff}').to_lowercase())
        .collect();

    let sym_idx = find_header_idx(&header, &["symbol"]).unwrap_or(0);
    let date_idx = find_header_idx(&header, &["date"]).unwrap_or(1);
    let qty_idx = find_header_idx(&header, &["quantity", "qty"]).unwrap_or(2);
    let price_idx = find_header_idx(&header, &["price"]).unwrap_or(3);
    let curr_idx = find_header_idx(&header, &["currency", "curr"]).unwrap_or(4);
    let fee_idx = find_header_idx(
        &header,
        &[
            "fee",
            "commission",
            "comm",
            "brokerage",
            "stamp duty",
            "stamp_duty",
        ],
    );
    let type_idx = find_header_idx(&header, &["assettype", "asset type", "asset"]);
    let tx_type_idx = find_header_idx(
        &header,
        &[
            "transaction type",
            "tx_type",
            "txtype",
            "action",
            "trade type",
            "trade_type",
            "type",
        ],
    );
    let ex_from_idx = find_header_idx(&header, &["exchange from", "exchange_from", "from"]);
    let ex_to_idx = find_header_idx(&header, &["exchange to", "exchange_to", "to"]);

    let mut out = Vec::new();
    for row in &rows[1..] {
        if row.len() < 5 {
            continue;
        }
        let symbol = row.get(sym_idx).map(|s| s.trim()).unwrap_or("");
        let date = row.get(date_idx).map(|s| s.trim()).unwrap_or("");
        if symbol.is_empty() || date.is_empty() {
            continue;
        }

        let Some(quantity) = parse_decimal_cell(row.get(qty_idx).map(String::as_str)) else {
            continue;
        };
        if quantity == Decimal::ZERO {
            continue;
        }
        let Some(price) = parse_decimal_cell(row.get(price_idx).map(String::as_str)) else {
            continue;
        };

        let currency = row
            .get(curr_idx)
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .unwrap_or("USD")
            .to_uppercase();
        let asset_type = type_idx
            .and_then(|idx| row.get(idx))
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .unwrap_or(default_asset_type)
            .to_string();
        let fee = fee_idx
            .and_then(|idx| row.get(idx))
            .and_then(|s| parse_decimal_cell(Some(s.as_str())));
        let tx_type = tx_type_idx
            .and_then(|idx| row.get(idx))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let exchange_from = ex_from_idx
            .and_then(|idx| row.get(idx))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let exchange_to = ex_to_idx
            .and_then(|idx| row.get(idx))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        out.push(Transaction {
            symbol: symbol.to_string(),
            date: date.to_string(),
            quantity,
            price,
            fee,
            currency,
            asset_type,
            tx_type,
            exchange_from,
            exchange_to,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        });
    }

    out
}
