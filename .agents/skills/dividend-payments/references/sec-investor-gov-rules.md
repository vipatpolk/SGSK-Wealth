# U.S. SEC & Investor.gov Dividend Payment Regulations

This reference document outlines the regulatory framework, timing mechanics, and market conventions governing dividend distributions for U.S.-listed equities and funds, based on the U.S. Securities and Exchange Commission (SEC) and Investor.gov guidance.

---

## 1. Key Dates in the Dividend Lifecycle

When a U.S. public corporation distributes cash or stock dividends, four sequential dates govern the process:

```
Declaration Date  ───────►  Ex-Dividend Date  ───────►  Record Date  ───────►  Payable Date
 (Board announces)           (Trading without             (Shareholder           (Cash/Shares
                              entitlement)                 book cutoff)           distributed)
```

| Date | Definition | Governing Entity | Market Role |
| :--- | :--- | :--- | :--- |
| **Declaration Date** | Date the board of directors votes to approve and declare a dividend payment. | Corporate Board | Public announcement of dividend amount, record date, and payable date. |
| **Record Date** | Date established by the company to determine which shareholders appear on the company's books. | Corporate Board / By-laws | Cutoff date for identifying registered holders entitled to dividends, proxy statements, and voting rights. |
| **Ex-Dividend Date (Ex-Date)** | The first trading day where shares trade *without* the right to the declared dividend. | Stock Exchange Rules (NYSE, NASDAQ, FINRA) | Dictates who receives the payout: buyer vs. seller. |
| **Payable Date (Payment Date)** | The date the dividend is actually paid and credited to brokerage accounts or mailed. | Corporate Board | Cash disbursed or additional shares credited. |

---

## 2. Settlement Cycles and Ex-Dividend Date Determination

### Modern T+1 Settlement Cycle (Effective May 28, 2024)

Under SEC Rule 15c6-1 amendment (adopted March 2023, effective May 28, 2024), the standard settlement cycle for most broker-dealer transactions in U.S. equities, corporate bonds, and municipal securities was shortened from **T+2** (two business days) to **T+1** (one business day).

#### Determining the Ex-Date under T+1:
Because regular-way settlement occurs on the next business day after the trade date:
1. **If the Record Date is a Business Day:**
   - **`Ex-Dividend Date = Record Date`**
   - *Logic:* A purchase executed on the business day prior to the Record Date (`Record Date - 1`) settles on the Record Date (`T+1`), placing the buyer on the company's books in time. A purchase executed on the Record Date settles on `Record Date + 1`, which is too late. Therefore, the stock begins trading ex-dividend on the Record Date itself.
2. **If the Record Date is a Non-Business Day (Weekend or Federal Holiday):**
   - **`Ex-Dividend Date = 1 Business Day Prior to Record Date`**
   - *Logic:* If the Record Date is Sunday, a trade on Friday settles on Monday (`Record Date + 1`). To settle on or before Sunday, a trade must settle by Friday, meaning the purchase had to take place on Thursday. Thus, Friday is the first day trading without dividend entitlement.

#### Historical Context (Pre-May 28, 2024 / T+2):
- Under T+2 settlement, the Ex-Date was set **1 business day before the Record Date** when the Record Date was a business day, and **2 business days before** when the Record Date fell on a weekend.

---

## 3. Investor Entitlement Rules

The ex-dividend date determines whether the buyer or the seller receives the dividend:

| Action | Execution Date | Dividend Entitlement | Rationale |
| :--- | :--- | :--- | :--- |
| **BUY** | **Before** Ex-Dividend Date | **Buyer** receives dividend | Trade settles on or before Record Date; buyer is shareholder of record. |
| **BUY** | **On or After** Ex-Dividend Date | **Seller** receives dividend | Trade settles after Record Date; buyer is not on company books by Record Date. |
| **SELL** | **Before** Ex-Dividend Date | **Buyer** receives dividend | Seller divests prior to the entitlement cutoff; trade settles out before Record Date. |
| **SELL** | **On or After** Ex-Dividend Date | **Seller** keeps dividend | Seller was holder of record at cutoff; holding on ex-date confers dividend right. |

> [!IMPORTANT]
> To receive a dividend, an investor must purchase the stock **strictly before the Ex-Dividend Date**. Holding the stock overnight into the opening of the Ex-Dividend Date secures the entitlement. Selling on or after the Ex-Dividend Date does **not** forfeit the dividend.

---

## 4. Price Impact on the Ex-Dividend Date

On the morning of the Ex-Dividend Date, the stock exchange automatically adjusts the opening price downward by approximately the amount of the dividend per share (DPS):

$$\text{Theoretical Open Price} \approx \text{Previous Close Price} - \text{Dividend Per Share}$$

Market forces immediately take over at market open, meaning the actual open price may deviate due to prevailing supply, demand, and overnight news.

---

## 5. Special Dividends (25% or More of Security Value)

When a company declares a dividend that equals or exceeds **25% of the security's market value**, special exchange rules supersede standard timing:

### Deferred Ex-Dividend Date Rule
- The Ex-Dividend Date is deferred until **one business day after the Payable Date**:
  $$\text{Special Ex-Date} = \text{Payable Date} + 1\text{ Business Day}$$
- The stock continues to trade with dividend entitlement ("with-dividend" or cum-dividend) throughout the entire period between the Record Date and the Payable Date.

### Due-Bill (I.O.U.) Mechanism
- To enforce this deferral, trades between the Record Date and the deferred Ex-Date trade with an attached **Due-Bill** (an official brokerage I.O.U.).
- Because the seller was the registered shareholder on the Record Date, the paying company initially distributes the cash or shares directly to the seller on the Payable Date.
- However, because the seller sold the shares before the deferred Ex-Date, the broker automatically executes the due-bill and debits the dividend amount from the seller's account, transferring it to the buyer's account.
- **Rule of thumb for investors:** If selling shares of a company paying a 25%+ special dividend, an investor cannot keep the dividend unless they hold the shares until **after the deferred Ex-Dividend Date** (the business day following the Payable Date).

---

## 6. Stock Dividends and Spin-Offs

When a company distributes dividends in the form of additional shares (stock dividends) or shares of a subsidiary being spun off:
- **Ex-Date Timing:** Set on the **first business day after the stock dividend / spin-off shares are distributed (paid)**.
- **Due-Bill Requirement:** If an investor sells shares before the Ex-Dividend Date, they are contractually selling away their right to the stock dividend. The seller's broker issues a due-bill requiring the delivery of the new dividend shares to the buyer once received.
- **Selling Safely:** An investor can only sell without the obligation to deliver the additional shares on or after the first business day following the stock distribution date.

---

## 7. Tax and Withholding Rules for U.S. Dividends

| Investor Category | Withholding Tax Rate | Requirements |
| :--- | :--- | :--- |
| **U.S. Resident / Citizen** | 0% at source (Reported on Form 1099-DIV) | Subject to ordinary income tax (non-qualified) or capital gains rates 0%/15%/20% (qualified dividends). |
| **Thai Resident / Non-US Alien (DTA Treaty)** | **15%** withholding at source | Requires valid **Form W-8BEN** filed with broker under the U.S.–Thailand Double Tax Agreement (DTA). |
| **Non-US Alien (No Treaty / Non-Certified)** | **30%** statutory withholding | Standard non-resident alien (NRA) rate without treaty relief. |

---

## 8. Summary of Calculation Rules for Systems & Portfolio Engines

1. **Snapshot Date:** For portfolio dividend engines, calculate eligible holdings by evaluating transaction share balance strictly prior to `ex_dividend_date` (`trade_date < ex_date`).
2. **Standard Dividend Entitlement:**
   - Trade Date $< \text{Ex-Date}$ $\implies$ Entitled to dividend.
   - Trade Date $\ge \text{Ex-Date}$ $\implies$ Not entitled.
3. **Special Dividend (DPS $\ge 25\%$ Price):**
   - Entitlement cut-off moves to `Payable Date + 1 Business Day`.
4. **Net Cashflow Calculation:**
   $$\text{Gross Cash} = \text{Eligible Shares} \times \text{DPS}$$
   $$\text{Withholding Tax} = \text{Gross Cash} \times 0.15 \quad (\text{for W-8BEN holders})$$
   $$\text{Net Cash} = \text{Gross Cash} - \text{Withholding Tax}$$
