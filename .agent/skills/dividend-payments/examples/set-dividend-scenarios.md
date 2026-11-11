# SET Thailand Dividend Scenarios & Compliance Cases

This document illustrates practical real-world scenarios for dividend distributions on the Stock Exchange of Thailand (SET), demonstrating regulatory compliance with Public Limited Company Act B.E. 2535, SET disclosure rules, and Thai Revenue Department tax requirements.

---

## Scenario 1: SET Listed Company Annual Cash Dividend

### Company Profile:
- **Company:** Advanced Telecom PCL (ADVANC.BK)
- **Financial Status:** Positive retained earnings in both consolidated and separate financial statements.

### Key Milestones & Regulatory Timeline:

```
BOD Resolution       SET Notification       AGM Approval          XD Date            Record Date         Payment Date
(Thu, Feb 19)        (Fri, Feb 20, 8:30 AM) (Mon, Mar 23)        (Fri, Apr 3)        (Mon, Apr 6)        (Wed, Apr 22)
      |                     |                     |                    |                   |                   |
      +--- Immediate -------+                     +-- >= 5 biz days ---+-- T+2 Settlement -+                   |
           via SETLink                                                                                         |
      +----------------------------- Paid within 1 month of AGM approval -------------------------------------+
```

1. **Board Resolution (Feb 19):** Board proposes annual dividend of 4.50 THB/share and calls AGM for March 23.
2. **SETLink Disclosure (Feb 20, 8:30 AM):** Disclosed before 09:00 AM on next business day ("Immediate" standard).
3. **Advance Notice Requirement Check:**
   - Notification to SET on Feb 20; Record Date is set to April 6 (45 calendar days $\ge 14$ days required by Circular Bor.Jor.(Wor) 25/2007). **PASSED.**
4. **Post-AGM Spacing Requirement Check:**
   - AGM on Mon, Mar 23. Record Date on Mon, Apr 6.
   - Business days between AGM and Record Date: 9 business days ($\ge 5$ business days required). **PASSED.**
5. **SET T+2 XD Date Determination:**
   $$\text{XD Date} = \text{Record Date} - 1\text{ Business Day} = \text{Friday, April 3, 2026}$$
6. **Payment Date Check:**
   - Paid on Wed, Apr 22 (within 30 calendar days of AGM on Mar 23). **PASSED.**

### Trading Actions & Entitlements:
| Trading Date | Investor Order | Settlement Date | Entitled to Dividend? |
| :--- | :--- | :--- | :--- |
| **Thu, Apr 2, 2026** | BUY 10,000 ADVANC | Mon, Apr 6 (T+2) | **YES** (Listed on Record Date) |
| **Fri, Apr 3, 2026** (XD) | BUY 10,000 ADVANC | Tue, Apr 7 (T+2) | **NO** (XD sign active; settles after Record Date) |
| **Fri, Apr 3, 2026** (XD) | SELL 10,000 ADVANC (held earlier) | Tue, Apr 7 (T+2) | **YES** (Held overnight into XD; retains dividend) |

---

## Scenario 2: Interim Dividend with BOI Tax Exemption

### Company Profile & Board Resolution:
- **Company:** Thai Agro-Industry PCL
- **BOD Resolution Date:** Tuesday, August 11, 2026
- **Total Interim Dividend:** 1.00 THB/share, composed of:
  - **BOI Portion:** 0.60 THB/share (Derived from Board of Investment Section 31 tax-exempt activities).
  - **Non-BOI Portion:** 0.40 THB/share (Derived from taxable operations subject to 20% CIT).
- **Record Date:** Friday, August 28, 2026.
- **XD Date:** Thursday, August 27, 2026 (Record Date - 1 business day).
- **Payment Date:** Thursday, September 10, 2026 (Within 1 month of Board Resolution).

### Tax Breakdown for Individual Investor (Holding 20,000 Shares):
$$\text{BOI Gross Dividend} = 20,000 \times 0.60 = 12,000.00\text{ THB}$$
$$\text{BOI Withholding Tax (0\% exempt)} = 12,000.00 \times 0.00 = 0.00\text{ THB}$$

$$\text{Non-BOI Gross Dividend} = 20,000 \times 0.40 = 8,000.00\text{ THB}$$
$$\text{Non-BOI Withholding Tax (10\%)} = 8,000.00 \times 0.10 = 800.00\text{ THB}$$

$$\text{Total Gross Dividend} = 20,000.00\text{ THB}$$
$$\text{Total Withholding Tax} = 800.00\text{ THB}$$
$$\text{Net Cash Credited to Account} = 19,200.00\text{ THB}$$

*Effective Withholding Tax Rate:* $\frac{800}{20,000} = 4.0\%$ (instead of standard 10%).

---

## Scenario 3: Stock Dividend with Accompanying Cash Dividend & WHT

### Company Profile:
- **Company:** Siam Retail Expansion PCL
- **Existing Paid-up Shares:** 100,000,000 shares (Par value = 1.00 THB).
- **Stock Dividend Ratio:** 10 existing shares for 1 new dividend share (equivalent to 0.10 THB/share at par).
- **Total New Shares to Issue:** 10,000,000 shares.

### Solving the Mandatory Accompanying Cash Dividend:
Under Thai Revenue Department rules (Article 50(2)(Jor)) and SET Circular Kor.Tor.(Wor) 51/2001, receiving 0.10 THB of stock value is subject to 10% withholding tax (0.01 THB/share tax liability).

To prevent shareholders from paying cash to the company, the board declares:
1. **Stock Dividend:** 10 : 1 at par 1.00 THB = 0.10 THB/share.
2. **Accompanying Cash Dividend:** **0.0111111111 THB/share**.
3. **Total Dividend Value:**
   $$\text{Total Dividend} = 0.10 + 0.0111111111 = 0.1111111111\text{ THB/share}$$
4. **10% Withholding Tax Withheld at Source:**
   $$\text{WHT} = 0.1111111111 \times 10\% = 0.0111111111\text{ THB/share}$$
5. **Net Cash Distributed:**
   $$\text{Net Cash} = \text{Cash Dividend} - \text{WHT} = 0.0111111111 - 0.0111111111 = 0.00\text{ THB}$$
   *Result:* Shareholder receives exactly 1 new stock per 10 old stocks, and all withholding tax obligations to the Revenue Department are 100% satisfied!

### Fractional Share Handling:
- **Rule in Disclosure:** Any fractional shares resulting from the 10:1 ratio will be rounded down, and compensated in cash at **0.10 THB per fractional share**.
- *Example:* An investor holding 45 shares receives:
  - 4 new dividend shares ($40 \div 10$).
  - Cash compensation for 5 fractional shares: $5 \times 0.10\text{ THB} = 0.50\text{ THB}$.

### Compliance Filings:
1. **Form F 53-4:** Capital Increase Report submitted with Board resolution via SETLink.
2. **Unpaid Capital Pre-check:** If the company had 5,000,000 unallocated unpaid registered shares, it must file to decrease capital by 5,000,000 shares before increasing by 10,000,000 shares.
3. **Post-Distribution:** Within 14 days of share crediting, report allocation results via SETLink and file for listing of new shares with SET and MOC.

---

## Scenario 4: Separate Deficit vs. Consolidated Profit (Disqualification)

### Corporate Situation:
- **Holding Company:** Bangkok Investment Group PCL (BIG)
- **Year-End Financials:**
  - **Consolidated Net Profit:** +500,000,000 THB (due to profitable subsidiaries).
  - **Consolidated Retained Earnings:** +1,200,000,000 THB.
  - **Separate (Company-Only) Net Profit:** -50,000,000 THB (operating loss).
  - **Separate Retained Earnings:** **-120,000,000 THB (Accumulated Deficit)**.

### Legal Assessment under Section 115:
- The Board proposes paying a 0.20 THB dividend based on consolidated profit.
- **Regulatory Ruling by SET & SEC:** **REJECTED / PROHIBITED.**
- Under Section 115 of the Public Limited Company Act B.E. 2535, dividends may *only* be paid if the legal entity itself has unappropriated retained earnings. A deficit on the separate financial statement legally prohibits dividend payout.

### Remediation Process to Resume Dividends:
To clear the 120,000,000 THB separate deficit, BIG must call an AGM/EGM to approve wiping out the loss in strict sequence:
1. **Step 1:** Offset 20,000,000 THB from general reserves (remaining deficit = 100M THB).
2. **Step 2:** Offset 60,000,000 THB from legal reserve under Section 116 (remaining deficit = 40M THB).
3. **Step 3:** Offset 40,000,000 THB from share premium reserve under Section 51 (remaining deficit = 0 THB).
Once the deficit on the separate financial statement is cleared to $\ge 0$, future net profits may be declared as dividends.
