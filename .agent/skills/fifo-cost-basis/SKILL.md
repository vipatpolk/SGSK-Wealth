---
name: fifo-cost-basis
description: >-
  Authoritative guide and calculation workflows for the First In, First Out (FIFO) valuation and cost-basis method across accounting inventory (COGS, ending inventory, GAAP/IFRS vs. LIFO) and investment portfolios (securities lot matching, realized P&L, remaining cost basis, acquisition fees, and comparison with Average Cost). Use when implementing or verifying FIFO lot queues, calculating cost basis or COGS, comparing FIFO against LIFO or Average Cost, or working on `share_lot_service.py` and `valuation_service.py`.
---

# First In, First Out (FIFO): Accounting & Portfolio Cost-Basis Guide

This skill synthesizes core accounting standards (GAAP/IFRS inventory valuation) and investment portfolio cost-basis mechanics into operational rules, formulas, and verification tools for FIFO lot tracking.

---

## 1. Core Principle & Quick Reference

**First In, First Out (FIFO)** assumes that the assets, inventory units, or securities acquired **first** are the ones sold, consumed, or disposed of **first**. Consequently, remaining holdings always consist of the **most recently acquired** lots.

| Dimension | Inventory & Financial Accounting | Securities & Investment Portfolios |
| :--- | :--- | :--- |
| **What Exits First** | Oldest purchased or manufactured inventory units | Earliest purchased share/ETF/fund lots (chronological order) |
| **Expense / Exit Metric** | **Cost of Goods Sold (COGS)** uses oldest unit costs | **Realized P&L** matches sale proceeds against oldest lot cost basis |
| **Remaining Balance** | **Ending Inventory** reflects most recent acquisition prices | **Remaining Cost Basis** is computed solely from remaining unsold lots |
| **Acquisition Costs** | Direct inventory/production costs | Purchase price **plus** transaction fees (e.g., brokerage fees, stamp duty) |
| **Regulatory Standing** | Accepted under **U.S. GAAP** and **IFRS** (LIFO is prohibited under IFRS) | Mandated in many tax jurisdictions; optional in others (e.g., private investors in Switzerland) |
| **Inflation / Rising Prices** | Lower COGS, higher net income, higher ending inventory, higher tax liability | Selling older cheaper lots realizes larger gains; remaining basis reflects higher recent prices |

---

## 2. Core Workflows

### Workflow 1: Inventory Valuation (COGS & Ending Inventory)

Use this workflow when tracking physical goods or accounting cost flows across purchase batches:

1. **Maintain Ordered Purchase Layers:** Record each purchase/production batch with `(date, quantity, unit_cost)` in chronological order.
2. **Allocate Sales to Oldest Layers First:** When selling `Q` units, consume from the earliest layer with `remaining_qty > 0` until `Q` units are matched.
3. **Compute COGS:**
   $$\text{COGS} = \sum_{i} (\text{matched\_qty}_i \times \text{unit\_cost}_i)$$
4. **Compute Ending Inventory:** Sum the remaining quantities multiplied by their respective layer unit costs:
   $$\text{Ending Inventory} = \sum_{j} (\text{remaining\_qty}_j \times \text{unit\_cost}_j)$$

---

### Workflow 2: Securities Cost Basis & Realized P&L

Use this workflow when tracking investment purchases, partial sales, and remaining portfolio cost basis:

1. **Include Acquisition Costs in Lot Cost Basis:**
   $$\text{Lot Cost Basis per Unit} = \frac{(\text{Purchase Price} \times \text{Units}) + \text{Purchase Fees (e.g., brokerage, stamp duty)}}{\text{Units}}$$
2. **Consume Lots Chronologically on Sale:**
   Sort transactions by trade date ascending. On a sale of `Q` units at `sell_price`:
   - Match against the oldest open lot(s) first: `matched_qty = min(lot.remaining_qty, remaining_to_sell)`.
   - Compute per-lot realized P&L:
     $$\text{Realized P\&L}_{\text{lot}} = \text{matched\_qty} \times (\text{sell\_price} - \text{lot\_cost\_basis})$$
   - Decrement `lot.remaining_qty` by `matched_qty`. Remove exhausted lots.
3. **Calculate Remaining Cost Basis (FIFO Average Cost Price):**
   Multiply remaining units in each open lot by that lot's cost basis, sum them, and divide by total remaining units:
   $$\text{FIFO Cost Basis per Share} = \frac{\sum_{k \in \text{open\_lots}} (\text{remaining\_qty}_k \times \text{cost\_basis}_k)}{\sum_{k \in \text{open\_lots}} \text{remaining\_qty}_k}$$

> [!IMPORTANT]
> **Why FIFO beats Cash-Flow Average Cost for remaining cost basis:**
> Blending raw cash flows (purchases minus sales proceeds) across remaining units distributes realized profits into the remaining basis. A profitable partial sale can depress the calculated average cost basis **below the lowest purchase price ever paid**. FIFO avoids this distortion because realized gains are separated from remaining open lots.

---

### Workflow 3: Choosing Between Valuation Methods

| Method | Rule | Net Income / Gains (Rising Prices) | Ending Inventory / Remaining Basis | Standards & Key Trade-Offs |
| :--- | :--- | :--- | :--- | :--- |
| **FIFO** | Oldest lots sold first | **Higher** (lowest cost matched first) | **Higher** (reflects current market costs) | Allowed under **GAAP & IFRS**; transparent, hard to manipulate, matches natural goods flow; higher taxable income in inflation. |
| **LIFO** | Newest lots sold first | **Lower** (highest recent cost matched first) | **Lower** (stale historical costs remain) | Allowed under **U.S. GAAP**, **prohibited under IFRS**; lowers taxable income in inflation, distorts balance sheet. |
| **Average Cost** | Weighted average cost across available units | **Between FIFO & LIFO** | **Between FIFO & LIFO** | Simple to compute; cash-flow variants can distort remaining cost basis after profitable sales. |
| **Specific Tracing** | Exact physical or tax-lot ID matched | Exact per-item cost | Exact remaining item costs | Only feasible when every unit/component is uniquely identifiable. |

---

### Workflow 4: Applying FIFO in `SGSK-Wealth`

In `backend/services/share_lot_service.py` (`ShareLotService.process_transactions`):

1. **Chronological Ordering:** Transactions per symbol are sorted by `tx.date` ascending before lot matching.
2. **Lot Creation (`BUY`, `EXCHANGE_IN`):** Appends a `ShareLot` with `quantity`, `costBasis=price`, and `totalCost=qty * price`.
3. **FIFO Queue Matching (`SELL`, `EXCHANGE_OUT`):** Iterates `open_lots` from index `0` forward, matching `min(lot.quantity, remaining_to_sell)` using `EPSILON = 1e-7` to prevent floating-point dust on full exits (e.g., fractional crypto quantities).
4. **Closed Lot Accounting:** Emits a `ClosedShareLot` for each matched slice with `purchaseDate`, `closeDate`, `costBasis`, `sellPrice`, `realizedPL`, and `realizedPLPercent`.
5. **Dividends:** `DIVIDEND` transactions do **not** open or consume FIFO share lots (`runningShares` and `runningTotalCost` remain unchanged).

*Executable Tool:* Verify FIFO lot schedules, remaining cost basis, and Average Cost comparisons using the included script:

```bash
py .agent/skills/fifo-cost-basis/scripts/fifo_calculator.py --example finpension
py .agent/skills/fifo-cost-basis/scripts/fifo_calculator.py --example inventory
py .agent/skills/fifo-cost-basis/scripts/fifo_calculator.py --tx 2020-07-23:10:1373.76 --tx 2021-09-01:2:1679.18 --tx 2022-05-25:-5:1581.06
```

---

## 3. Deep-Dive References & Examples

- **Accounting & Investment Theory:** See [fifo-accounting-and-securities.md](./references/fifo-accounting-and-securities.md) for GAAP/IFRS rules, inflationary effects, Swiss investment context, and method trade-offs.
- **Worked Calculations:** See [fifo-worked-examples.md](./examples/fifo-worked-examples.md) for step-by-step inventory COGS, finpension ETF cost-basis vs. cash-flow average cost, and `ShareLotService` scenarios.
- **Python Calculator Script:** Inspect and run [fifo_calculator.py](./scripts/fifo_calculator.py) for programmatic lot-by-lot FIFO verification.
