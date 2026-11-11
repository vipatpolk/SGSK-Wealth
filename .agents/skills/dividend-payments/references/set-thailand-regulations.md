# Stock Exchange of Thailand (SET) Dividend Regulations & Compliance

This reference document provides an authoritative breakdown of regulations, statutory requirements, disclosure checklists, and operational mechanics for dividend payments by companies listed on the Stock Exchange of Thailand (SET) and Market for Alternative Investment (mai).

---

## 1. Statutory & Regulatory Framework

Dividend distributions in Thailand are governed by primary corporate legislation and capital market regulations:
1. **Public Limited Companies Act B.E. 2535 (1992):**
   - **Section 115:** Source of dividend distribution and authorization procedures.
   - **Section 116:** Statutory legal reserve requirements.
   - **Section 51:** Share premium reserve utilization.
2. **SET Regulations:**
   - *Regulation of the Stock Exchange of Thailand Re: Rules, Conditions and Procedures Governing the Disclosure of Information and Other Acts of a Listed Company B.E. 2560 (2017)* & updated B.E. 2569 (2026).
   - *Bor.Jor./Or.01-00 Regulations Re: Procedure for Information Disclosure via Electronic System (SETLink)*.
3. **SET Circular Letters:**
   - *Circular Bor.Jor.(Wor) 25/2007:* Rules regarding closing the share register (Record Date / Book Closing) when increasing capital or paying dividends.
   - *Circular Kor.Tor.(Wor) 51/2001:* Rules regarding tax withholding on stock dividends.

---

## 2. Fundamental Conditions Precedent for Dividend Payouts

Under Section 115 of the Public Limited Companies Act B.E. 2535:

### Profit Source Requirement
- Dividends may **only** be paid out of corporate profits (accumulated unappropriated retained earnings or net profit of the operational period).
- Dividends cannot be paid out of capital or other sources.

### The Separate Financial Statement Deficit Rule
- **Critical Rule:** If a listed company reports net profits and positive retained earnings in its *consolidated financial statements*, but has **accumulated losses (deficit) in its *separate (company-only) financial statements***, the company is **strictly prohibited** from paying dividends.
- Dividend authorization is legally assessed on the standalone legal entity, not the consolidated group.

### Statutory Sequence for Offsetting Accumulated Losses
If a company wishes to clear accumulated losses to qualify for dividend distribution, it must obtain shareholder meeting approval and execute reserve transfers in the following strict statutory order:
1. **Other voluntary / general reserves** (unrestricted reserves).
2. **Legal reserve** (Section 116).
3. **Share premium reserve** (Section 51).

---

## 3. Annual Dividends vs. Interim Dividends

| Attribute | Annual Dividend | Interim Dividend |
| :--- | :--- | :--- |
| **Approval Body** | **Annual General Meeting (AGM)** of Shareholders | **Board of Directors (BOD)** |
| **Prerequisites** | Audited annual financial statements; Board recommendation | Board determines company has sufficient operational profit |
| **Payment Deadline** | **Within 1 month** from the date the AGM approves payment | **Within 1 month** from the date the BOD resolves payment |
| **Subsequent Action** | Executed per AGM resolution | Must be reported to shareholders at the next shareholder meeting |

---

## 4. Key Entitlement Dates & Timelines on the SET

```
BOD Resolution  ───►  [ >= 14 Days Notice ]  ───►  XD Date (T-1)  ───►  Record Date (T)  ───►  Payment Date
  (Immediate           to SET before RD             (T+2 settlement      (Shareholder       (Within 1 month
  Disclosure)                                        cutoff)              Register)          of approval)
```

### Settlement Cycle and the "XD" (Excluding Dividend) Sign
- The Stock Exchange of Thailand operates on a **T+2 settlement cycle** via Thailand Clearing House (TCH) and Thailand Securities Depository (TSD).
- To be eligible for a dividend, an investor must be listed in the shareholder register on the **Record Date (RD)**.
- Because trades take 2 business days to settle:
  $$\text{XD Date} = \text{Record Date} - 1\text{ Business Day}$$
- If the company uses the **Book Closing (BC)** method:
  $$\text{XD Date} = \text{Book Closing Date} - 2\text{ Business Days}$$
- **Market Rule:** A stock trades with the "XD" flag starting on the ex-dividend date. Purchases made on or after the XD date **do not** entitle the buyer to the declared dividend.

### Advance Notice Requirements (Circular Bor.Jor.(Wor) 25/2007)
1. **14-Day Advance Notice:** The listed company must notify the SET of the Board's resolution establishing the entitlement date at least **14 calendar days** prior to the Record Date or Book Closing Date.
2. **5 Business Days Post-AGM Spacing:** In cases where an AGM approves the annual dividend, the Record Date should be scheduled at least **5 business days after** the AGM date to allow market participants clarity following the vote.
3. **Same-Day Entitlement Disclaimer:** If the company deems it necessary to set the Record Date on the same day as the AGM entitlement or before the meeting, the disclosure memorandum and AGM notice must include the mandatory regulatory warning:
   > *"The right to receive dividend or new shares, as the case may be, is uncertain as it has not yet been approved by shareholders."*

---

## 5. Dividend Types & Tax Mechanics

### A. Cash Dividends
- Stated as a gross rate in Thai Baht per share (THB/share).
- Must disclose whether drawn from current operational period profits or unappropriated retained earnings.
- **Withholding Tax (WHT):**
  - Standard statutory withholding tax of **10%** under Revenue Code Section 50(2)(Jor) applies to individual domestic and foreign tax residents.
  - **BOI Privileges:** Dividends paid from net profits of businesses granted corporate income tax exemption under the **Board of Investment (BOI)** are **0% exempt** from withholding tax.
  - The disclosure must explicitly state the BOI dividend portion (exempt) and Non-BOI dividend portion (taxable at 10%) per share.

$$\text{Net Cash Dividend} = (\text{Gross non-BOI} \times 0.90) + (\text{Gross BOI} \times 1.00)$$

---

### B. Stock Dividends

Companies may distribute dividends as newly issued common shares instead of or in combination with cash.

#### 1. Mandatory Accompanying Cash Dividend for Tax
Under Thai tax law (Revenue Code and SET Circular Kor.Tor.(Wor) 51/2001), receiving stock dividends represents taxable income to shareholders. Because physical shares cannot be remitted to the Revenue Department, the company **must allocate a cash dividend component** to cover the 10% withholding tax:
$$\text{Total Dividend Value per Share} = \text{Stock Dividend Value} + \text{Cash Dividend for WHT}$$
$$\text{Stock Dividend Value per Share} = \frac{\text{Retained Earnings Transferred to Stated Equity}}{\text{Number of Stock Dividend Shares Issued}}$$
$$\text{Accompanying Cash Dividend} \ge 10\% \times \text{Total Dividend Value per Share}$$
*Example:* If a company declares a 10:1 stock dividend at par 1.00 THB (yielding 0.10 THB stock value/share), it pays an accompanying cash dividend of 0.0111111 THB/share so that the 10% withholding tax is fully settled without requiring shareholders to pay out of pocket.

#### 2. Fractional Share Treatment
Disclosures must specify exact treatment of fractional shares:
- Cash compensation rate (in THB per fractional share), OR
- Disregard / round down, OR
- Rounding rule (e.g. fractions $\ge 0.5$ round up to 1 full share with specified monetary adjustment).

#### 3. Capital Increase Procedures
- Stock dividends require shareholder approval for increasing registered capital.
- The company must submit the **Capital Increase Report Form (F 53-4)** simultaneously with the board resolution.
- **Unpaid Capital Precondition:** If the company has registered capital that remains unpaid and unallocated to convertible instruments, the company **must decrease its registered capital** prior to enacting the capital increase for the stock dividend.
- **SET Listing:**
  - Submit report on allocation of capital increase shares via SETLink within **14 days** of the share distribution date.
  - File for listing of the new shares with SET and register the increased paid-up capital with the Ministry of Commerce (MOC).

---

## 6. Information Disclosure Checklist via SETLink

Listed companies must follow strict disclosure procedures:

### 1. Timing of Disclosure: "Immediately"
- Disclose on the day the Board resolution is reached, OR
- Prior to **09:00 AM** on the next business day (before market pre-opening).

### 2. Standard SETLink Template Selection
- **Cash Dividend Only:** Select template `"Dividend payment / Omission of dividend payment"`.
- **Stock Dividend:** Select template `"Dividend payment / Omission of dividend payment - Capital Increase - Determination of Shareholders' Meeting"`.
- **Dividend Omission:** The company is legally obligated to report when the board resolves to **omit** a dividend payout.

### 3. Risk of Trading Halt ("H" Sign)
The SET will immediately place a **Halt ("H") sign** suspending trading on the company's shares if:
- The dividend amount per share stated in the SETLink template differs from the attached PDF notification.
- The calculation basis, profit source, or entitlement dates are ambiguous or inconsistent.
- The halt remains until the company releases a formal clarifying statement through SETLink.
