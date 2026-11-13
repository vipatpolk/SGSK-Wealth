# SEC Thailand Provident Fund (PVD) Open API (`/v1/pvd`) Reference

Complete endpoint reference for **PVD Open APIs (15 endpoints)** extracted from the SEC Open Data Portal catalog (`https://secopendata.sec.or.th/sec-open-apis`).

- **Base URL:** `https://api.sec.or.th`
- **Authentication:** Header `Ocp-Apim-Subscription-Key: <SEC_SUBSCRIPTION_KEY>` and `Accept: application/json`
- **Scope Constraint:** Data covers **multi-employer pooled provident funds only** — **Pooled Funds (`PF`)** and **Master Pooled Funds (`PM`)**. Single-employer corporate funds (`single fund`) are not published in this dataset.
- **Response Shape Difference vs. Fund v2:** PVD endpoints return a **top-level JSON array `[...]` directly** (NOT a paginated `{ "items": [...] }` object), even though the portal data dictionary uses `items[].*` notation. Handle `isinstance(data, list)` as well as dict fallbacks, and check `204 No Content` before parsing JSON.
- **Buddhist Era Date Caveat:** Date fields such as `regis_date`, `sub_policy_start_date`, and `sub_policy_inception_date` often use **Thai Buddhist Era (พ.ศ.)** years formatted `YYYY-MM-DD` (e.g., `"2544-03-14"` = 2001 CE), while open-ended fields use `"-"` instead of `null`.

---

## Endpoint Summary (15 Endpoints)

| # | Method | Path | Purpose |
|---:|:---|:---|:---|
| 1 | `GET` | `/v1/pvd/factsheet/amc` | List PVD Asset Management Companies (`unique_id`) |
| 2 | `GET` | `/v1/pvd/factsheet/{unique_id}/fund` | List PVD funds managed by an AMC (`proj_id`) |
| 3 | `POST` | `/v1/pvd/factsheet/fund` | Search PVD funds by partial Thai/English name (`FundName`) |
| 4 | `GET` | `/v1/pvd/factsheet/{proj_id}/policy` | Investment policies & sub-policies (`sub_policy_id`, risk, AIMC) |
| 5 | `GET` | `/v1/pvd/factsheet/{proj_id}/return` | Calendar/cumulative trailing returns (Y1–Y10, Inception, YTD) |
| 6 | `GET` | `/v1/pvd/factsheet/{proj_id}/trailreturn` | Trailing returns (3M, 6M, 1Y, 3Y, etc.) |
| 7 | `GET` | `/v1/pvd/factsheet/{proj_id}/fee` | Management fee & total fee breakdown |
| 8 | `GET` | `/v1/pvd/factsheet/{proj_id}/PVDFullPort/{period}` | Monthly asset allocation by asset class code (`period=YYYYMM`, 45d lag) |
| 9 | `GET` | `/v1/pvd/factsheet/{proj_id}/statistics` | Risk & performance statistics (Sharpe, MDD, YTM, Duration) |
| 10 | `GET` | `/v1/pvd/factsheet/{proj_id}/top5/assettype` | Top 5 asset type allocation per sub-policy |
| 11 | `GET` | `/v1/pvd/factsheet/{proj_id}/top5/securities` | Top 5 security holdings (+ credit rating & master ISIN) |
| 12 | `GET` | `/v1/pvd/factsheet/{proj_id}/top5/foreign` | Top 5 foreign countries (direct investments only) |
| 13 | `GET` | `/v1/pvd/factsheet/{proj_id}/top5/industry` | Top 5 industries (direct equity policies only) |
| 14 | `GET` | `/v1/pvd/factsheet/{proj_id}/top5/issuer` | Top 5 bond issuers (direct fixed-income policies only) |
| 15 | `GET` | `/v1/pvd/factsheet/{proj_id}/nav/{nav_date}` | Monthly sub-policy NAV (`nav_date=YYYYMMDD`, 3Y window from `20240630`, 60d lag) |

---

## Discovery Endpoints (1–3)

### 1. Asset Management Company (AMC)
`GET /v1/pvd/factsheet/amc` (`01-Factsheet-Amc`)

- **Parameters:** None
- **Response Fields:** `unique_id` (e.g., `"C0000000023"`), `name_th`, `name_en`, `abbr_name` (`"MFC"`), `last_upd_date` (ISO8601 UTC)

### 2. Provident Fund under AMC Management
`GET /v1/pvd/factsheet/{unique_id}/fund` (`02-Factsheet-Fund`)

- **Path Parameter:** `unique_id` (required, string, e.g., `"C0000000023"`)
- **Response Fields:**
  - `proj_id` (string): Format `{Type}{ID}_{YYYY}` (e.g., `"V0001_2544"`)
  - `regis_id` (string/int): Registration ID
  - `regis_date` (date/string): `YYYY-MM-DD`, may use Buddhist Era (`"2544-03-14"`)
  - `cancel_date` (date/string): `YYYY-MM-DD` or `"-"` if still active
  - `proj_name_th` (string): Fund project name (Thai)
  - `fund_type` (string): `PF` = Single-Policy Pooled Fund (กองทุนร่วม) | `PM` = Master Pooled Fund
  - `fund_status` (string):
    - `SE` = Filing (active/offering)
    - `RG` = Registered (active)
    - `EX` = Expired offering period
    - `CA` = Canceled
    - `LI` = Liquidated
  - `unique_id` (string): Managing AMC ID
  - `last_upd_date` (datetime)

> [!TIP]
> Filter results to `fund_status in ("SE", "RG")` to keep only active provident funds.

### 3. Search Provident Fund by Name
`POST /v1/pvd/factsheet/fund` (`03-Factsheet-Fund`)

- **Request Body (`application/json`):**
  ```json
  {
    "FundName": "เอ็มเอฟซี"
  }
  ```
  - `FundName` (string, optional): Full or partial Thai or English PVD fund name.
- **Response Fields:** Identical schema to `GET /v1/pvd/factsheet/{unique_id}/fund`.

---

## Policy, Return, Fee & Statistics Endpoints (4–9)

### 4. Provident Fund Policy
`GET /v1/pvd/factsheet/{proj_id}/policy` (`04-Factsheet-Policy`)

- **Path Parameter:** `proj_id` (required, e.g., `"V0001_2544"`)
- **Response Fields:**
  - `proj_id`, `policy_id`, `unique_sub_policy_id` (SEC sub-policy ID, e.g., `"000125520001"`), `sub_policy_id` (AMC sub-policy code, e.g., `"MRT-ST"`), `sub_policy_name`
  - `sub_policy_start_date`, `sub_policy_inception_date` (`YYYY-MM-DD`, may use Buddhist Era e.g., `"2552-01-01"`), `sub_policy_end_date` (`YYYY-MM-DD` or `"-"`)
  - `sub_policy_nav_start` (number, initial unit NAV e.g., `10`)
  - `risk_level` (string): `RS1` Low | `RS2`–`RS5` Moderate-to-Low / Moderate | `RS6`–`RS7` High | `RS8` Very High
  - `foreign_risk_level` (string): `01` Foreign only | `02` Domestic and foreign | `03` Domestic only
  - `aimc_type` (string, e.g., `"FIXGEN"`), `aimc_description` (string)
  - `objective` (string): Investment objective
  - `mf_invest_flag` (string): `"Y"` invests via mutual funds | `"N"` does not
  - `new_member_offer` (string): `"Y"` open to new members | `"N"` closed
  - `last_upd_date` (datetime)

### 5. Provident Fund Return
`GET /v1/pvd/factsheet/{proj_id}/return` (`05-PVD-Factsheet-Return`)

- **Path Parameter:** `proj_id` (required)
- **Response Fields:** `proj_id`, `policy_id`, `unique_sub_policy_id`, `seq` (`1–10` = Year 1–10, `11` = Since inception, `12` = YTD), `return_year` (label e.g., `"ปีที่ 1"`, `"Since inception"`, `"YTD"`), `return_rate` (number `%` without `%` sign, nullable/negative allowed), `last_upd_date` / `last_updated`, `policy_name` (present in example)

### 6. Provident Fund Trail Return
`GET /v1/pvd/factsheet/{proj_id}/trailreturn` (`06-PVD-Factsheet-returntrail`)

- **Path Parameter:** `proj_id` (required)
- **Response Fields:** `proj_id`, `policy_id`, `unique_sub_policy_id`, `seq`, `return_year` (e.g., `"เดือนที่ 6"`, `"ปีที่ 1"`, `"ปีที่ 3"`), `return_rate` (number `%`, nullable), `last_upd_date` / `last_updated`, `policy_name`

### 7. Provident Fund Fee
`GET /v1/pvd/factsheet/{proj_id}/fee` (`07-PVD-Factsheet-Fee`)

- **Path Parameter:** `proj_id` (required)
- **Response Fields:**
  - `proj_id`, `policy_id`, `unique_sub_policy_id`, `seq`
  - `fee_type_desc`:
    - `ManagementFee` — PVD management fee (`% p.a. of NAV`)
    - `TotalFee` — Total PVD fee (`% p.a. of NAV`)
    - `TotalFeeMax` — Max actual total fee including underlying mutual funds
    - `TotalFeeMin` — Min actual total fee including underlying mutual funds
  - `fee_rate` (number, `% p.a. of NAV`), `last_upd_date`

### 8. Provident Fund Asset Allocation (Monthly Full Portfolio)
`GET /v1/pvd/factsheet/{proj_id}/PVDFullPort/{period}` (`08-PVD-Factsheet-FullPortPvd`)

Monthly historical asset allocation with a **45-day publication lag** after month-end.

- **Path Parameters:**
  - `proj_id` (required, e.g., `"V0103_2540"`)
  - `period` (required, **`YYYYMM`**, e.g., `"202303"`)
- **Response Fields:**
  - `proj_id`, `period` (`YYYYMM`), `market_value` (number), `nav` (number, shown in example), `percent_nav` (number)
  - `assetliab_code` (string):
    - `101` Equity (หุ้น)
    - `103` Corporate bonds (หุ้นกู้)
    - `108` Mutual fund units (หน่วยลงทุน)
    - `110` Warrants (ใบสำคัญแสดงสิทธิ)
    - `201` Deposits / PN / BE
    - `206` Government bonds
    - `401` Derivatives
    - `450` Gold bullion
    - `700` Other assets/liabilities
    - `903` Total

### 9. Provident Fund Statistics
`GET /v1/pvd/factsheet/{proj_id}/statistics` (`09-PVD-Factsheet-statistics`)

- **Path Parameter:** `proj_id` (required)
- **Response Fields:** `proj_id`, `policy_id`, `unique_sub_policy_id`, `period` (dictionary says `YYYYMM`, example returns `"2025-06-30"`), `max_drawdown` (`%`), `tracking_error` (`%`, nullable), `recovering_period` (days), `port_turnover`, `sharpe_ratio`, `alpha` (`%`), `fx_hedging` (`%`), `beta`, `port_duration` (days), `yield_to_maturity` / `yeild_to_maturity` (`%` — **spec example contains `yeild_to_maturity` typo!**), `last_upd_date`, `policy_name`

---

## Top 5 Breakdown & Monthly NAV Endpoints (10–15)

All `top5/*` endpoints take path parameter `proj_id` (required). Note that in examples, `period` is formatted `"2025-06-30"` (`YYYY-MM-DD`) despite dictionaries describing `YYYYMM`, and rows include `policy_name`.

| Endpoint | Ranking & Payload Fields | Applicability |
| :--- | :--- | :--- |
| `GET /v1/pvd/factsheet/{proj_id}/top5/assettype` | `asset_allocation_seq` (1–5), `asset_allocation` / `assetliab_name_th` *(quirk: example uses `assetliab_name_th`)*, `asset_ratio` (`%NAV`) | All PVD sub-policies |
| `GET /v1/pvd/factsheet/{proj_id}/top5/securities` | `secur_seq` (1–5), `secur_name`, `secur_invest_size` (`%NAV`), `secur_credit_rating` (bonds, nullable), `secur_isin_code` (master fund ISIN, nullable) | All PVD sub-policies |
| `GET /v1/pvd/factsheet/{proj_id}/top5/foreign` | `secur_seq_country` (1–5), `country`, `country_size` (`%NAV`, nullable) | Direct foreign investments only |
| `GET /v1/pvd/factsheet/{proj_id}/top5/industry` | `secur_seq_industry` (1–5), `industry`, `industry_size` (`%NAV`, nullable) | Direct equity policies only |
| `GET /v1/pvd/factsheet/{proj_id}/top5/issuer` | `secur_seq_issuer` (1–5), `issuer`, `issuer_size` (`%NAV`) | Direct bond policies only |

### 15. Monthly PVD Fund NAV by Sub-Policy
`GET /v1/pvd/factsheet/{proj_id}/nav/{nav_date}` (`15-PVD-Factsheet-nav`)

Month-end NAV and unit price per sub-policy for up to **3 years of monthly history** starting from **`20240630`**, subject to a **60-day publication lag** after the last business day of the month.

- **Path Parameters:**
  - `proj_id` (required, e.g., `"V0001_2552"`)
  - `nav_date` (required, **`YYYYMMDD`** CE Gregorian last day of month, e.g., `"20240630"`; earliest period `"20240630"`, available ~60 days after month-end)
- **Response Fields:**
  - `proj_id`, `policy_id`, `unique_sub_policy_id`, `policy_name` (in example)
  - `nav_date` (returned as `"2024-06-30"` in example)
  - `net_asset` (number THB total net asset value)
  - `net_asset_per_unit` (number THB/unit)
  - `last_upd_date` (datetime)
