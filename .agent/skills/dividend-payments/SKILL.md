---
name: dividend-payments
description: >-
  Authoritative guidance and operational reference for cash and stock dividend payments across U.S. (SEC T+1) and Thai (SET T+2) equity markets. Use when calculating ex-dividend dates, record dates, entitlement cutoffs, withholding taxes (U.S. 15% DTA / 30%, Thai 10% / BOI 0%), stock dividends with accompanying tax buffers, corporate disclosure compliance under SET/Public Company Act, or reconstructing share balances for portfolio dividend accounting.
---

# Dividend Payments: U.S. (SEC) & Thai (SET) Expert Guide

This skill provides comprehensive operational instructions, regulatory rules, and calculation methods for dividend payments, ex-dividend dates, shareholder entitlements, tax withholdings, and corporate disclosure compliance across U.S. and Thai capital markets.

---

## 1. Comparative Quick Reference: U.S. vs. Thai Markets

| Dimension | U.S. Equities (SEC / FINRA / NYSE) | Thai Equities (SET / SEC Thailand) |
| :--- | :--- | :--- |
| **Settlement Cycle** | **T+1** (SEC Rule 15c6-1, effective May 28, 2024) | **T+2** (Thailand Clearing House - TCH) |
| **Standard Ex-Date Rule** | **Record Date** (if business day); or **1 business day before** (if weekend/holiday) | **1 business day before Record Date** (or 2 business days before Book Closing) |
| **Ex-Dividend Sign** | Traded "Ex-Dividend" on ticker | Marked with **"XD"** (Excluding Dividend) flag on SET |
| **Buyer Entitlement** | Buy **strictly before** Ex-Dividend Date | Buy **strictly before** XD Date (at latest T-1 before XD) |
| **Seller Entitlement** | Sell **on or after** Ex-Dividend Date retains dividend | Sell **on or after** XD Date retains dividend |
| **Special Dividends ($\ge 25\%$)** | Deferred to **Payable Date + 1 business day**; trades with **Due-Bill** | Standard XD timing; corporate action requires formal advance disclosure |
| **Standard Withholding Tax** | **15%** for Thai/treaty residents with **Form W-8BEN** (30% statutory NRA rate) | **10%** under Revenue Code Section 50(2)(Jor) |
| **Tax Exemption Category** | Qualified Dividends (taxed at 0%/15%/20% for U.S. tax filers) | **BOI Privileges** (0% withholding tax on BOI-promoted earnings) |
| **Stock Dividend Tax Handling** | Additional shares distributed; adjusted cost basis | Mandatory accompanying **cash dividend buffer** (~10% total dividend) to cover tax |
| **Payment Deadline** | Determined by corporate board resolution | **Within 1 month** from AGM approval (Annual) or Board resolution (Interim) |
| **Disclosure System** | SEC EDGAR Form 8-K / Press Release | **SETLink** electronic system ("Immediately" or before 09:00 AM next business day) |

---

## 2. Core Operational Workflows

### Workflow 1: Calculating Ex-Dividend Dates & Settlement Cutoffs

When asked to determine when a stock trades ex-dividend or if an order qualifies for a dividend:

```
[Record Date]
      │
      ├─► Market == US (T+1)?
      │     ├─► Is Special Dividend (>= 25%)? ──► Ex-Date = Payable Date + 1 Business Day
      │     ├─► Is Record Date a Business Day? ──► Ex-Date = Record Date
      │     └─► Is Record Date Weekend/Holiday? ─► Ex-Date = Record Date - 1 Business Day
      │
      └─► Market == Thai / SET (T+2)?
            ├─► Using Record Date (RD)? ─────────► XD Date = Record Date - 1 Business Day
            └─► Using Book Closing (BC)? ────────► XD Date = Book Closing Date - 2 Business Days
```

*Executable Tool:* Run the included Python calendar utility:
```bash
py .agent/skills/dividend-payments/scripts/dividend_calendar_tool.py --market US --record-date 2026-05-11
py .agent/skills/dividend-payments/scripts/dividend_calendar_tool.py --market SET --record-date 2026-04-06
```

---

### Workflow 2: Reconstructing Share Holdings for Dividend Snapshot

In portfolio accounting and dividend engines (e.g., `dividend_service.py`), historical payouts must be attributed based on eligible shares held at the entitlement cutoff:

1. **Cutoff Rule:** Only count share lots purchased **strictly before** the Ex-Dividend Date (or XD date).
   $$\text{Eligible Shares} = \sum_{\text{trade\_date} < \text{ex\_date}} (\text{Inflows} - \text{Outflows})$$
2. **Same-Day Ex-Date Trades:**
   - Any BUY order executed on or after the Ex-Dividend Date does **NOT** count towards the dividend.
   - Any SELL order executed on or after the Ex-Dividend Date does **NOT** diminish the dividend entitlement for that payout.
3. **Outflow Handling:** Outflows (SELL, SWITCH_OUT, EXCHANGE_OUT) executed prior to the ex-date reduce the balance.

---

### Workflow 3: Calculating Gross, Withholding Tax, and Net Dividend Income

To compute dividend cashflows and withholding taxes:

1. **Gross Dividend Calculation:**
   $$\text{Gross Dividend} = \text{Eligible Shares} \times \text{Dividend Per Share (DPS)}$$
2. **Withholding Tax Determination:**
   - **U.S. Stocks / ETFs:**
     - Non-US resident with W-8BEN: $\text{Tax} = \text{Gross} \times 15\%$
     - Non-US resident without W-8BEN: $\text{Tax} = \text{Gross} \times 30\%$
   - **Thai Equities & Mutual Funds:**
     - Pure Non-BOI (standard): $\text{Tax} = \text{Gross} \times 10\%$
     - Pure BOI (promoted): $\text{Tax} = 0.00$
     - Mixed BOI / Non-BOI:
       $$\text{Tax} = (\text{Eligible Shares} \times \text{Non-BOI DPS}) \times 10\%$$
3. **Net Cashflow:**
   $$\text{Net Cashflow} = \text{Gross Dividend} - \text{Withholding Tax}$$

---

### Workflow 4: Validating Thai Listed Company Dividend Compliance

When evaluating Thai listed corporate dividend proposals or disclosures under Public Company Act B.E. 2535 and SET regulations:

1. **Check 1: Profitability on Separate Financial Statements (Section 115)**
   - Check if the *separate (company-only)* financial statements report unappropriated retained earnings.
   - *Failure condition:* If the company has accumulated losses (deficit) on its standalone statements, dividends are **legally prohibited**, regardless of consolidated profits!
2. **Check 2: Clearing Accumulated Losses Priority**
   - If accumulated losses are wiped out, verify the statutory priority:
     1. Other voluntary reserves $\rightarrow$ 2. Legal reserve (Section 116) $\rightarrow$ 3. Share premium reserve (Section 51).
3. **Check 3: Payment Timeline (Section 115)**
   - Annual dividend must be paid within **1 month** from AGM approval.
   - Interim dividend must be paid within **1 month** from Board resolution.
4. **Check 4: Advance Notice & Spacing (Circular Bor.Jor.(Wor) 25/2007)**
   - SET notified at least **14 calendar days** prior to Record Date / Book Closing.
   - Record Date scheduled at least **5 business days after** the AGM date.
   - If Record Date is scheduled on the AGM date, mandatory disclaimer text must be included.
5. **Check 5: SETLink Disclosure & Halt ("H") Risk**
   - Must disclose immediately (day of resolution or before 09:00 AM next business day).
   - Rate per share in SETLink template must match the PDF announcement exactly to avoid an immediate **Halt ("H") sign**.

---

### Workflow 5: Handling Thai Stock Dividends & Mandatory Cash Buffers

When a Thai company issues a stock dividend (e.g. ratio $N:1$):

1. **Tax Buffer Formula:**
   Because stock dividends are subject to 10% withholding tax, the company must distribute an accompanying cash dividend so shareholders have zero out-of-pocket tax liability:
   $$\text{Cash Buffer Per Share} = \frac{\text{Stock Value Per Share} \times 0.10}{1.0 - 0.10} = \frac{\text{Stock Value Per Share}}{9}$$
2. **Fractional Share Settlement:**
   Verify whether fractions are compensated in cash (THB/share) or rounded up/down per corporate resolution.
3. **Capital Filing Requirements:**
   - Submit Form F 53-4 simultaneously with Board resolution.
   - Confirm unallocated unpaid registered capital was decreased first before increasing capital.
   - Register capital increase with MOC and file listing application with SET within 14 days of distribution.

---

## 3. Deep-Dive References & Examples

- **U.S. SEC / Investor.gov Details:** See [sec-investor-gov-rules.md](./references/sec-investor-gov-rules.md) for full T+1 mechanics, 25%+ special dividends, and due-bill procedures.
- **SET Regulations & Legal Framework:** See [set-thailand-regulations.md](./references/set-thailand-regulations.md) for Section 115-116 legal reserves, BOI details, and SETLink reporting checklists.
- **U.S. Calculation Scenarios:** See [us-dividend-scenarios.md](./examples/us-dividend-scenarios.md) for worked examples of business day, weekend, and special dividend timelines.
- **SET Case Studies & Checklists:** See [set-dividend-scenarios.md](./examples/set-dividend-scenarios.md) for annual, interim BOI, stock dividend tax buffers, and deficit disqualification cases.
- **Python Calculation Script:** Inspect and run [dividend_calendar_tool.py](./scripts/dividend_calendar_tool.py) for programmatic date and tax calculations.
