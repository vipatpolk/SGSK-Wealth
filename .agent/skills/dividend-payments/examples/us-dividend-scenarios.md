# U.S. Dividend Scenarios & Case Studies (SEC T+1)

This guide provides concrete, worked examples of U.S. dividend lifecycle calculations under modern **T+1 settlement** rules, including standard dividends, weekend record dates, large special dividends (25%+), and stock distributions.

---

## Scenario 1: Standard Cash Dividend (Business Day Record Date)

### Parameters:
- **Company:** Apple Inc. (AAPL)
- **Declaration Date:** Thursday, April 30, 2026
- **Record Date:** Monday, May 11, 2026 (Business Day)
- **Payable Date:** Thursday, May 14, 2026
- **Dividend per Share:** $0.25 USD
- **Investor:** Holding 1,000 shares; files Form W-8BEN (15% treaty withholding tax).

### Timeline & Date Determination (T+1 Rule):
1. **Record Date** falls on a Monday (business day).
2. Under SEC Rule 15c6-1 (T+1 settlement):
   $$\text{Ex-Dividend Date} = \text{Record Date} = \text{Monday, May 11, 2026}$$

| Trading Day | Action by Investor | Settlement Date | Entitled to $0.25 Dividend? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Fri, May 8, 2026** | **BUY 1,000 shares** | Mon, May 11, 2026 | **YES** | Settles on Record Date (T+1). Buyer appears on company books. |
| **Mon, May 11, 2026** (Ex-Date) | **BUY 1,000 shares** | Tue, May 12, 2026 | **NO** | Settles after Record Date. Seller retains the dividend. |
| **Mon, May 11, 2026** (Ex-Date) | **SELL 1,000 shares** (held previously) | Tue, May 12, 2026 | **YES** | Shareholder was on the books through the Record Date cutoff; selling on or after Ex-Date retains entitlement. |

### Cashflow Calculation:
- **Gross Dividend:** $1,000 \times \$0.25 = \$250.00\text{ USD}$
- **Withholding Tax (15%):** $\$250.00 \times 0.15 = \$37.50\text{ USD}$
- **Net Dividend Received:** $\$250.00 - \$37.50 = \$212.50\text{ USD}$ (credited May 14, 2026).

---

## Scenario 2: Cash Dividend with Weekend Record Date

### Parameters:
- **Company:** Microsoft Corp. (MSFT)
- **Declaration Date:** Tuesday, August 18, 2026
- **Record Date:** Sunday, August 30, 2026 (Non-Business Day)
- **Payable Date:** Thursday, September 10, 2026
- **Dividend per Share:** $0.75 USD

### Timeline & Date Determination (T+1 Rule):
1. **Record Date** falls on Sunday (non-business day).
2. Under T+1 exchange rules:
   $$\text{Ex-Dividend Date} = 1\text{ Business Day Before Record Date} = \text{Friday, August 28, 2026}$$

| Trading Day | Action by Investor | Settlement Date | Entitled? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Thu, Aug 27, 2026** | **BUY 500 shares** | Fri, Aug 28, 2026 | **YES** | Settles Friday, recorded before Sunday. |
| **Fri, Aug 28, 2026** (Ex-Date) | **BUY 500 shares** | Mon, Aug 31, 2026 | **NO** | Settles Monday (after Sunday Record Date). Buyer not entitled. |
| **Fri, Aug 28, 2026** (Ex-Date) | **SELL 500 shares** (held earlier) | Mon, Aug 31, 2026 | **YES** | Seller was already recorded; settles off books Monday. Seller gets dividend. |

---

## Scenario 3: Large / Special Dividend ($\ge 25\%$ of Share Price)

### Parameters:
- **Company:** Special Tech Corp (STC)
- **Pre-Announcement Share Price:** $40.00 USD
- **Declaration Date:** Monday, October 5, 2026
- **Dividend per Share:** $12.00 USD ($\frac{\$12}{\$40} = 30\% \ge 25\%$)
- **Record Date:** Monday, October 19, 2026
- **Payable Date:** Friday, November 6, 2026

### Determining the Deferred Ex-Dividend Date:
Because the dividend exceeds 25% of security value, FINRA/NYSE/NASDAQ defer the ex-date:
$$\text{Deferred Ex-Dividend Date} = \text{Payable Date} + 1\text{ Business Day} = \text{Monday, November 9, 2026}$$

```
Record Date              Payable Date             Deferred Ex-Date
(Mon, Oct 19)            (Fri, Nov 6)             (Mon, Nov 9)
     |                        |                        |
     +--- Trades with DUE BILL ------------------------+---> Trades Ex-Dividend
          (Buyer entitled to $12 dividend)                   (No dividend)
```

### Due-Bill Mechanics & Execution:
1. **Trade between Oct 19 and Nov 6:**
   - Investor A held shares on Oct 19 (Record Date) and sells to Investor B on Wednesday, Oct 28.
   - The stock trades **with Due-Bill**.
   - On Friday, Nov 6 (Payable Date), Company STC disburses $12.00/share directly to Investor A (the registered record holder).
   - However, because the trade occurred prior to the deferred Ex-Date, the brokerage settlement clearinghouse automatically enforces the Due-Bill: **$12.00/share is debited from Investor A and credited to Investor B**.
2. **Trade on or after Monday, Nov 9 (Deferred Ex-Date):**
   - Stock price adjusts downward on the morning of Nov 9 by approximately $12.00.
   - Purchases on or after Nov 9 trade clean (no due-bill, no dividend right).

---

## Scenario 4: Stock Dividend & Spin-Off Distribution

### Parameters:
- **Company:** Growth Holdings (GH)
- **Distribution:** 1 share of spin-off subsidiary "NewCo" for every 4 shares of GH held.
- **Record Date:** Wednesday, September 2, 2026
- **Distribution / Payment Date:** Monday, September 21, 2026
- **Ex-Distribution Date:** Tuesday, September 22, 2026 (first business day after distribution).

### Due-Bill Enforcement:
- If a shareholder sells GH shares on Friday, September 11 (after Record Date but before Ex-Date), they sell GH **with due-bill** attached.
- When NewCo shares are delivered to the seller on September 21, the broker automatically transfers those NewCo shares to the buyer.
- An investor can only divest GH without surrendering the NewCo spin-off shares by waiting to sell on **Tuesday, September 22, 2026** or later.
