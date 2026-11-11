# FIFO Accounting & Securities Cost-Basis Reference

This reference consolidates principles from financial accounting standards (Investopedia: *FIFO Explained: First In, First Out Inventory Method*) and portfolio cost-basis methodology (finpension: *Understanding FIFO: How to calculate the cost basis of an asset*).

---

## 1. Accounting Foundations (GAAP & IFRS)

### Cost Flow Assumption vs. Physical Flow
- **Definition:** Under FIFO, the oldest inventory costs are assigned to Cost of Goods Sold (COGS) first when items are sold, leaving the most recent purchase or production costs in Ending Inventory on the balance sheet.
- **Cost Flow vs. Physical Stock:** FIFO is an accounting *cost flow assumption*—the accounting sequence does not strictly have to match physical warehouse movement, though it closely mirrors businesses handling **perishable goods** (food, beverages, pharmaceuticals) or **trend-sensitive goods** that risk obsolescence.
- **Global Standards:**
  - **U.S. GAAP:** Permits FIFO, LIFO, Weighted-Average Cost, and Specific Identification.
  - **IFRS:** Permits FIFO and Weighted-Average Cost; **LIFO is prohibited under IFRS**.

### Financial Statement Impact Under Inflation (Rising Prices)
When replacement costs rise over time:
1. **Lower COGS:** Older, cheaper inventory costs are expensed first.
2. **Higher Gross Profit & Net Income:** Lower COGS widens the spread against current-price revenues.
3. **Higher Ending Inventory:** Unsold inventory on the balance sheet is valued at higher, more recent prices.
4. **Higher Tax Liability:** Higher reported net income typically increases corporate income tax obligations compared to LIFO (where allowed).

*(Under deflation / falling prices, these directional effects reverse: older higher-cost units raise COGS and compress net income.)*

### Pros and Cons of FIFO
- **Advantages:**
  - Simple to understand, implement, and audit.
  - Transparent financial statements; harder to manipulate earnings by timing end-of-period purchases.
  - Ending inventory reflects current replacement values on the balance sheet.
  - Aligns with the natural physical flow of most businesses and satisfies IFRS requirements.
- **Disadvantages:**
  - Can overstate economic profits during high inflation (because historical low costs are matched against current inflated revenues, sometimes called "phantom/inventory profits").
  - Results in higher income tax payments during inflationary periods compared to LIFO.
  - May not mirror actual cost economics in rapidly innovating industries where older inventory loses value quickly.

---

## 2. Securities & Portfolio Cost-Basis Mechanics

### What Is Cost Basis?
For financial investments (stocks, ETFs, index funds, crypto):
- **Cost Basis** is the total actual acquisition outlay paid for an asset, including **incidental purchase costs** such as brokerage commissions and **stamp duty**.
- Tracking cost basis becomes non-trivial as soon as an investor makes multiple purchases at different prices and executes partial sales.

### Jurisdiction & Tax Context
- In many jurisdictions (such as the U.S. default lot-relief rule or Germany's *Abgeltungsteuer* lot tracking), FIFO is the default or legally mandated tax-lot matching order unless specific identification is elected.
- **Swiss Private Investors:** As explained by finpension, FIFO is **not prescribed by law** for private investors in Switzerland because private individuals generally do not pay capital gains tax on movable private securities. Nonetheless, platforms like finpension apply FIFO internally to compute accurate, economically meaningful acquisition cost bases.

### FIFO Cost Basis Formula for Open Positions
After matching any sales chronologically against the earliest purchased shares, the remaining position's per-unit cost basis is:

1. Multiply the **remaining quantity** of each open purchase lot by its **cost basis per unit**.
2. Sum the cost sub-totals across all remaining open lots.
3. Divide by the **total number of remaining units**.

$$\text{FIFO Cost Basis} = \frac{\sum_{i} (\text{Remaining Units}_i \times \text{Cost Basis}_i)}{\sum_{i} \text{Remaining Units}_i}$$

### Why Cash-Flow Average Cost Can Produce Unintuitive Results
A naive "cash-flow average cost" divides net cumulative cash outflow (`Total Buys - Total Sales Proceeds`) by remaining shares. When a partial sale is executed at a **profit**:
- The realized profit reduces the net cumulative cash outflow.
- Distributing that realized profit across the remaining shares artificially depresses their cost basis.
- In extreme cases, the resulting cost basis drops **below the lowest purchase price ever paid** for the security.

**FIFO solves this** by retiring the exact cost of the earliest sold units and computing the remaining cost basis strictly from the actual purchase prices of the unsold lots.
