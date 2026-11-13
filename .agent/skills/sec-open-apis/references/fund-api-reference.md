# SEC Thailand Fund Open API (`/v2/fund`) Reference

Complete endpoint reference for **Fund Open APIs (21 endpoints)** extracted from the SEC Open Data Portal catalog (`https://secopendata.sec.or.th/sec-open-apis`).

- **Base URL:** `https://api.sec.or.th`
- **Authentication:** Header `Ocp-Apim-Subscription-Key: <SEC_SUBSCRIPTION_KEY>` and `Accept: application/json`
- **Content-Type:** `application/json` (all 21 endpoints are `GET`)
- **HTTP `204 No Content`:** When a filtered query matches zero records, the SEC gateway may return `204 No Content` with an empty body instead of `{ "items": [] }`. Always check `response.status_code == 204` before calling `response.json()`.

---

## Standard `/v2/fund` Response Envelope & Pagination

Every `200 OK` `/v2/fund/*` response returns:

```json
{
  "message": "success",
  "page_size": 100,
  "next_cursor": "xxxx-xxx-xxx",
  "items": [ ... ]
}
```

| Field / Query Param | Type | Description |
| :--- | :--- | :--- |
| `page_size` (query & body) | integer (`1..100`) | Items returned per page (default `100`). |
| `next_cursor` (query & body) | string | Pass the `next_cursor` value from the previous response to fetch the next page. When `next_cursor == ""`, all data has been returned. |
| `message` (body) | string | Status message (e.g., `"success"`). |
| `items` (body) | array&lt;object&gt; | Returned dataset rows. |

> [!NOTE]
> All 12 endpoints under `/v2/fund/factsheet/*` (except `/factsheet/urls`) are **time-series factsheet snapshots** keyed by effective period (`start_date`, `end_date`, where `end_date` is `null` on the currently active factsheet). Pass `latest=true` to retrieve only the currently effective factsheet; when `latest=true`, the API ignores `start_date` and `end_date`.

---

## Group 1: General Info (`/v2/fund/general-info/*`, 5 Endpoints)

### 1. Asset Management Company (AMC)
`GET /v2/fund/general-info/amcs` (`getAmcList`)

Lists Asset Management Companies under SEC Thailand supervision. Use `unique_id` to filter other Fund APIs.

- **Query Parameters:** `page_size`, `next_cursor`
- **Response `items[]` Fields:**
  - `unique_id` (string): AMC identifier (e.g., `"C0000000021"`)
  - `comp_name_th` (string): AMC Thai name
  - `comp_name_en` (string): AMC English name
  - `last_upd_date` (datetime, ISO8601 UTC): Last updated timestamp

---

### 2. Fund Profile under AMC Management & General Information
`GET /v2/fund/general-info/profiles` (`getFundProfile`)

Returns mutual fund profiles, policy text, management style, feeder fund master info, share class (`fund_class_name`), tax incentives, and ISIN codes.

- **Query Parameters:**
  - `page_size`, `next_cursor`
  - `fund_class_name` (string): Fund share class abbreviation (note: `"main"` indicates a single-class fund)
  - `fund_status` (string): Filter by registration/lifecycle status (see enum below)
  - `project_info` (string): Exact match on `proj_id`, OR partial match on `proj_name_th`, `proj_name_en`, `proj_abbr_name`
  - `company_info` (string): Exact match on `unique_id`, OR partial match on `comp_name_th`, `comp_name_en`

- **Response `items[]` Fields:**
  - `unique_id`, `comp_name_th`, `comp_name_en` (string): Managing AMC identifiers
  - `proj_id` (string): SEC project ID formatted `{Type}{ID}_{BuddhistYear}` (e.g., `"M0000_2552"`)
  - `regis_id` (string): Fund registration ID (e.g., `"008_2552"`)
  - `proj_name_th`, `proj_name_en`, `proj_abbr_name` (string): Thai name, English name, project abbreviation
  - `fund_status` (string):
    - `Registered` — Officially registered (active)
    - `IPO` — Initial Public Offering (active/offering)
    - `Expired` — Offering period ended
    - `Canceled` — Project canceled
    - `Liquidated` — Fund liquidated
  - `init_date`, `regis_date`, `cancel_date` (date / string): Establishment, registration, and cancellation dates (`YYYY-MM-DD`, or `""` when not canceled)
  - `invest_country_flag` (string): `"1"` Focuses on foreign investment | `"2"` Partial foreign investment | `"3"` No foreign investment risk | `"4"` Both domestic and foreign investment risk
  - `proj_retail_type` (string):
    - `A` Non-retail | `B` High net worth | `F` Corporate bond liquidity support | `G` Special govt policy | `H` Non-retail & high net worth | `N` Institutional | `R` General retail investors | `V` Provident fund investors | `X` Institutional & ultra-HNW
  - `proj_term_flag` (string): `"Y"` fixed term | `"N"` no fixed term
  - `proj_term_year`, `proj_term_month`, `proj_term_day` (string): Term duration components
  - `policy_desc` (string): Policy category label (e.g., `"ตราสารทุน"`)
  - `investment_policy_desc` (string): Detailed policy (may be HTML or Base64-encoded string)
  - `management_style` (string):
    - `AM` Active Management | `AN` Feeder -> Active Master | `PM` Passive / Index Tracking | `PN` Feeder -> Passive Master | `IM` Inverse | `IN` Feeder -> Inverse Master | `LM` Leveraged | `LN` Feeder -> Leveraged Master | `BH` Buy-and-Hold | `SM` Index Tracking w/ occasional alpha | `OT` Others
  - `feederfund_master_fund`, `feederfund_country`, `exchange_rate_protection_policy` (string): Master fund & FX hedging details
  - `fund_class_name` (string): Class abbreviation (`"main"` if single-class)
  - `fund_class_detail`, `fund_class_description` (string): Class full title and description
  - `fund_class_tax_incentive_type` (string): e.g., `"SSF"`, `"Thai ESG"`, or `""`
  - `fund_class_isin_code` (string): Class ISIN (e.g., `"TH1085B10009"`)
  - `last_upd_date` (datetime)

> [!TIP]
> To keep only active mutual funds, filter results to `fund_status in ("IPO", "Registered")`.

---

### 3. Fund Specification
`GET /v2/fund/general-info/specifications` (`getFundSpecification`)

Special fund classifications per SEC Notification SorNor 87/2558 (and 87/2568) Appendix 2 at Class Fund level (e.g., `CIV` Cross Investing Fund).

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `spec_code`, `spec_desc`, `last_upd_date`

---

### 4. Mutual Fund Fee and Total Fee (Project-Level)
`GET /v2/fund/general-info/mutual-fund-fees` (`getMutualfundFee`)

Maximum / project-documented fund fees at the share-class level (distinct from `/v2/fund/factsheet/fees`, which provides time-series factsheet `rate` vs `actual_value`).

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `fee_type_desc` (`Distributor Fee`, `Investment Advisor Fee`, `Management Fee`, `Other Fee`, `Registrar Fee`, `Total Fee`, `Trustee Fee`), `rate` (number/string in example `2.14`), `rate_unit`, `fee_other_desc`, `last_upd_date`

---

### 5. Fund Involve Party
`GET /v2/fund/general-info/involve-parties` (`getFundRelative`)

Entities related to a mutual fund by project role (Trustee, Registrar, Distributor, Market Maker, Participating Dealer, Investment Advisor, etc.).

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `entity_type`
- **Response `items[]` Fields:** `proj_id`, `entity_type`, `entity_name_th`, `entity_name_en`, `address`, `last_upd_date`
- **`entity_type` Codes:** Note that the SEC spec defines both legacy 1-letter codes in prose (`A` Auditor, `U` Underwriter, `S` Selling Agent, `R` Registrar, `V` Supervisor/Trustee, `M` Advisor, `O` Outsource, `P` Private Equity/Prof. Investor, `K` Market Maker, `N` Financial Advisor, `F` Fund Manager — example uses `"R"`) and formal `enum` codes (`T` Trustee, `R` Registrar, `D` Distributor, `MM` Market Maker, `PD` Participating Dealer, `IA` Investment Advisor, `FA` Fund Advisor, `G` Guarantor, `O` Outsource, `PB` Prime Broker). Handle both sets cleanly.

---

## Group 2: Factsheet (`/v2/fund/factsheet/*`, 12 Endpoints)

### Common Factsheet Query Parameters & Envelope Fields
Unless noted otherwise, `/v2/fund/factsheet/*` endpoints accept:
- `page_size`, `next_cursor`, `proj_id`
- `start_date` (`YYYY-MM-DD`): returns records with effective `start_date >= value`
- `end_date` (`YYYY-MM-DD`): returns records with effective `end_date <= value`
- `latest` (`boolean`): `true` returns only the currently effective factsheet record and **ignores** `start_date` and `end_date`
- *(On class-level endpoints)* `fund_class_name` (string)

Common response fields: `proj_id`, `start_date`, `end_date` (`null` if latest effective factsheet), `prospectus_type` (`IPO` | `Monthly` | `SignificantFactsheet`), `last_upd_date`.

---

### 6. Fund Factsheet URL and PDF File
`GET /v2/fund/factsheet/urls` (`getFactsheetUrl`)

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `fund_class_name` *(no `start_date`/`end_date`/`latest`)*
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `prospectus_type`, `amc_url_factsheet` (AMC-hosted URL), `pdf_factsheet` (SEC Azure Blob PDF URL; multi-class funds share one consolidated PDF), `as_of_date` (`YYYY-MM-DD`), `last_upd_date`

### 7. IPO Offering Period
`GET /v2/fund/factsheet/ipos` (`getFactsheetIPO`)

- **Query Parameters:** Standard factsheet params (`proj_id`, `start_date`, `end_date`, `latest`, pagination)
- **Response `items[]` Fields:** `proj_id`, `start_date`, `end_date`, `prospectus_type`, `first_sell_start_date`, `first_sell_end_date` (string — example shows Thai Buddhist `DD/MM/YYYY` like `"14/01/2552"`), `last_upd_date`

### 8. Fund Benchmark
`GET /v2/fund/factsheet/benchmarks` (`getFactsheetBenchmark`)

- **Query Parameters:** Standard factsheet params (`proj_id`, `start_date`, `end_date`, `latest`, pagination)
- **Response `items[]` Fields:** `proj_id`, `start_date`, `end_date`, `prospectus_type`, `group_seq`, `benchmark`, `remark` / `benchmark_remark`, `last_upd_date`
  - *Spec quirk:* `dataExample` returns `"benchmark_remark"`, whereas `dataDictionary` names it `"remark"`. Check both keys.

### 9. Minimum Subscription, Redemption, and Balance Amounts and Units
`GET /v2/fund/factsheet/subscription-redemption-minimums` (`getFactsheetRedemptionInvestment`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `minimum_sub_ipo`, `minimum_sub_ipo_cur`, `minimum_sub`, `minimum_sub_cur`, `minimum_sub_unit`, `minimum_redempt`, `minimum_redempt_cur`, `minimum_redempt_unit`, `lowbal_val`, `lowbal_val_cur`, `lowbal_unit`, `last_upd_date`
  - *Spec quirk:* Currency strings (`*_cur`) in examples may be right-padded with spaces (e.g., `"THB                                               "`). Always `.strip()`.

### 10. Subscription and Redemption Dealing Periods and Settlement Times
`GET /v2/fund/factsheet/subscription-redemption-periods` (`getFactsheetRedemption`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `type` (`"subscription"` or `"redemption"`), `period`, `redemp_period_oth`, `settlement_period`, `last_upd_date`

### 11. Fund Risk Spectrum
`GET /v2/fund/factsheet/risk-spectrum` (`getFactsheetRiskSpectrum`)

- **Query Parameters:** Standard factsheet params (fund-level; no `fund_class_name`)
- **Response `items[]` Fields:** `proj_id`, `start_date`, `end_date`, `prospectus_type`, `risk_spectrum` (`RS1`–`RS8`, `RS81`), `risk_spectrum_desc`, `last_upd_date`

### 12. Fund Statistics
`GET /v2/fund/factsheet/statistics` (`getFactsheetStatisticsinfo`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `portfolio_turnover_ratio`, `recovering_period`, `portfolio_duration_period`, `maximum_drawdown` (5Y or since inception), `sharpe_ratio` (equity only), `beta` (equity only), `alpha` (equity only), `fx_hedging`, `tracking_error`, `yield_to_maturity`, `last_upd_date`
  - *Type note:* Numeric-looking metrics (`"24.63"`, `"-0.02"`, `"0"`) are typed as `string` in this endpoint.

### 13. Fund Dividend Policy
`GET /v2/fund/factsheet/dividend-policy` (`getFactsheetDividend`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `dividend_policy` (e.g., `"Y"` / `"N"` or text), `last_upd_date`

### 14. Fund Fee (Factsheet Ceiling vs. Actual Charged)
`GET /v2/fund/factsheet/fees` (`getFactsheetFee`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `fee_type_desc` (`Front-end Fee`, `Back-end Fee`, `Switching In`, `Switching Out`, `Transfer Fee`, `Total Fee and Expense`, `Management Fee` — localized Thai+English text in examples), `rate` (float ceiling), `actual_value` (float actually charged), `fee_other_desc`, `last_upd_date`

### 15. Historical Fund Performance
`GET /v2/fund/factsheet/performance` (`getFactsheetPerformance`)

- **Query Parameters:** Standard factsheet params + `fund_class_name`
- **Response `items[]` Fields:** `proj_id`, `fund_class_name`, `start_date`, `end_date`, `prospectus_type`, `performance_type_desc` (e.g., `"ความผันผวนของกองทุนรวม"`, fund return, benchmark return), `reference_period` (e.g., `"1 year"`), `performance_value` (string/float), `last_upd_date`

### 16. Fund Asset Allocation
`GET /v2/fund/factsheet/asset-allocation` (`getFactsheetAssetAllocation`)

- **Query Parameters:** Standard factsheet params (fund-level)
- **Response `items[]` Fields:** `proj_id`, `start_date`, `end_date`, `prospectus_type`, `asset_seq` (rank integer), `asset_name` (e.g., `"หุ้นสามัญ"`), `asset_ratio` (float `%NAV`), `last_upd_date`

### 17. Top 5 Holdings
`GET /v2/fund/factsheet/top5-holdings` (`getFactsheetTop5Holding`)

- **Query Parameters:** Standard factsheet params (fund-level)
- **Response `items[]` Fields:** `proj_id`, `start_date`, `end_date`, `prospectus_type`, `asset_seq` (1–5), `asset_name` (security/issuer name), `asset_ratio` (`%NAV`), `last_upd_date`

---

## Group 3: Outstanding Portfolio (`/v2/fund/outstanding/*`, 2 Endpoints)

Both endpoints serve **3 years of historical data** with a **45-day publication lag** after the last business day of the reporting quarter/month.

> [!IMPORTANT]
> **Parameter Name Discrepancy:** The prose notes mention `period_start`/`period_end`, but the actual declared `queryParameters` in the OpenAPI schema are **`start_period`** and **`end_period`** (`YYYYMM`). Set `start_period == end_period` to query a single period.

### 18. Quarterly Fund Portfolio
`GET /v2/fund/outstanding/portfolio` (`get-outstanding-port`)

Full holding-level asset/liability breakdown as of the last business day of each quarter.

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `start_period` (`YYYYMM`), `end_period` (`YYYYMM`)
- **Response `items[]` Fields:**
  - `proj_id`, `period` (`YYYYMM`), `as_of_date` (`YYYY-MM-DD`)
  - `assetliab_code` / `assetliab_id` (string, e.g., `"101"`), `assetliab_desc` (string)
  - `issue_code` (security symbol, e.g., `"ADVANC"`), `isin_code`, `issuer`
  - `market_value` / `assetliab_value` (number THB, 5 decimals)
  - `percent_nav` (number `%NAV`, 5 decimals; total across holdings may sum up to `100.20%` due to rounding)
  - `last_upd_date`
  - *Spec quirk:* `dataExample` uses `assetliab_id` and `assetliab_value`, whereas `dataDictionary` uses `assetliab_code` and `market_value`. Support both keys when parsing.

### 19. Monthly Fund Portfolio by Asset Type
`GET /v2/fund/outstanding/portfolio-asset-type` (`get-outstanding-portassettype`)

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id`, `start_period` (`YYYYMM`), `end_period` (`YYYYMM`)
- **Response `items[]` Fields:** `proj_id`, `period` (`YYYYMM`), `assetliab_code`, `assetliab_desc`, `market_value`, `percent_nav`

---

## Group 4: Daily Info (`/v2/fund/daily-info/*`, 2 Endpoints)

### 20. Daily Fund NAV Information
`GET /v2/fund/daily-info/nav` (`getFundDailyInfoNAV`)

Daily Net Asset Value, NAV per unit, buy/sell prices, and switch-in/switch-out prices.

- **Query Parameters:**
  - `page_size`, `next_cursor`, `proj_id`, `fund_class_name`
  - `start_nav_date` (`YYYY-MM-DD`), `end_nav_date` (`YYYY-MM-DD`) *(Note: prose note mentions `nav_date_start`/`nav_date_end`, but the actual query parameters are `start_nav_date` and `end_nav_date`)*
- **Response `items[]` Fields:**
  - `proj_id`, `unique_id`, `nav_date` (`YYYY-MM-DD`)
  - `fund_class_name` (`"main"`, a specific class abbr, or `"-"` in legacy/single-class rows — see `dataExample`)
  - `net_asset` (number THB total AUM)
  - `last_val` (number THB/unit — **NAV per unit**)
  - `sell_price` (offer / purchase price THB/unit)
  - `buy_price` (redemption / bid price THB/unit)
  - `sell_swap_price` (switch-in price THB/unit)
  - `buy_swap_price` (switch-out price THB/unit)
  - `last_upd_date` (datetime)

### 21. Fund Dividend History
`GET /v2/fund/daily-info/dividend-history` (`getFundDailyInfoDividendHistory`)

Dividend payment history containing records with both book-closing date and payment date.

- **Query Parameters:** `page_size`, `next_cursor`, `proj_id` *(Note: `class_abbr_name` may appear in older client code, though `proj_id` is the documented v2 parameter; filter client-side on `class_abbr_name` after fetching by `proj_id`)*
- **Response `items[]` Fields:**
  - `unique_id`, `proj_id`
  - `class_abbr_name` (string; can be `"-"` for single-class funds)
  - `book_close_date` (date / ISO datetime in example, e.g., `"2005-01-14T12:00:00Z"`)
  - `dividend_date` (payment date, e.g., `"2005-01-26T12:00:00Z"`)
  - `dividend_value` (number THB/unit)
  - `last_upd_date` (datetime)
