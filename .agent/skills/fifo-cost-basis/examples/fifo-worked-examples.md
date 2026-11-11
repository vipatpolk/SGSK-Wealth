# FIFO Worked Examples & Comparisons

This document provides step-by-step calculations covering inventory accounting, investment portfolio cost basis (contrasting FIFO vs. cash-flow Average Cost), and `SGSK-Wealth` transaction lot matching.

---

## Example 1: Inventory Accounting (Investopedia Scenario)

A company makes two inventory purchases and two subsequent sales:

1. **Batch 1 Purchase:** `100` units @ `$10` each (`$1,000` total)
2. **Batch 2 Purchase:** `100` units @ `$15` each (`$1,500` total)

### Sale 1: Sell `60` units
- Under FIFO, all `60` units come from **Batch 1** (`$10/unit`):
  - **COGS (Sale 1):** `60 x $10 = $600`
  - **Remaining Ending Inventory (140 units):**
    - `40` units from Batch 1 @ `$10` = `$400`
    - `100` units from Batch 2 @ `$15` = `$1,500`
    - **Total Ending Inventory Value:** `$1,900`

### Sale 2: Sell an additional `50` units
- Under FIFO, the remaining `40` units of Batch 1 are exhausted first, and `10` units are drawn from Batch 2:
  - `40` units @ `$10` = `$400` (Batch 1 fully depleted)
  - `10` units @ `$15` = `$150`
  - **COGS (Sale 2):** `$400 + $150 = $550`
  - **Remaining Ending Inventory (90 units):**
    - `90` units from Batch 2 @ `$15` = `$1,350`

---

## Example 2: Securities Cost Basis — FIFO vs. Average Cost (finpension Scenario)

Consider a portfolio holding `CSIF (CH) Equity Switzerland Large Cap Blue ZB` with two purchases and one partial sale:

| Date | Transaction | Quantity | Unit Price / Cost Basis | Cash Flow |
| :--- | :--- | ---: | ---: | ---: |
| `23.07.2020` | Buy Lot 1 | `+10` | `1,373.76` | `-13,737.60` |
| `01.09.2021` | Buy Lot 2 | `+2` | `1,679.18` | `-3,358.36` |
| `25.05.2022` | Sell | `-5` | `1,581.06` | `+7,905.30` |

### A. Calculation Using FIFO
On `25.05.2022`, `5` units are sold. Under FIFO, all `5` units come from **Lot 1** (`23.07.2020` @ `1,373.76`):

- **Realized Profit on Sale:** `5 x (1,581.06 - 1,373.76) = 5 x 207.30 = 1,036.50`
- **Remaining Open Lots (`7` units total):**

| Date | Lot | Remaining Qty | Cost Basis / Unit | Remaining Total Cost |
| :--- | :--- | ---: | ---: | ---: |
| `23.07.2020` | Lot 1 (partial) | `5` | `1,373.76` | `6,868.80` |
| `01.09.2021` | Lot 2 (untouched) | `2` | `1,679.18` | `3,358.36` |
| **Total / FIFO Average** | | **`7`** | **`1,461.02`** | **`10,227.16`** |

$$\text{FIFO Cost Basis per Share} = \frac{(5 \times 1{,}373.76) + (2 \times 1{,}679.18)}{7} = \frac{10{,}227.16}{7} = 1{,}461.02$$

### B. Contrast: Cash-Flow Average Cost Method
If remaining cost basis is instead computed from net cash flows (`-13,737.60 - 3,358.36 + 7,905.30 = -9,190.66`):

- **Pre-sale average cost (12 units):** `(13,737.60 + 3,358.36) / 12 = 1,424.66`
- **Profit on 5 sold units (vs. pre-sale avg):** `5 x (1,581.06 - 1,424.66) = 781.98`
- **Net remaining cash outlay:** `9,190.66 / 7 = 1,312.95` per unit

Notice that `1,312.95` is **lower than `1,373.76`**, the lowest purchase price ever realized! This distortion happens because the `781.98` profit (`111.71` per remaining share) was subtracted from the remaining cost basis (`1,424.66 - 111.71 = 1,312.95`). FIFO preserves realistic acquisition costs.

---

## Example 3: Multi-Lot Queue Matching in `SGSK-Wealth`

Mirrors `backend/tests/unit/test_fifo_engine.py::test_fifo_multi_lot_queue_matching`:

| Date | Action | Qty | Price | Open FIFO Queue After Tx | Realized P&L | Remaining Avg Cost |
| :--- | :--- | ---: | ---: | :--- | ---: | ---: |
| `2026-01-01` | BUY | `5` | `100.00` | `[5 @ 100]` | — | `100.00` |
| `2026-01-02` | BUY | `5` | `200.00` | `[5 @ 100, 5 @ 200]` | — | `150.00` |
| `2026-01-03` | SELL | `-7` | `250.00` | `[3 @ 200]` | `850.00` | `200.00` |

**Step-by-step matching on `2026-01-03`:**
1. Match `5` units against Lot 1 (`100.00`): `5 x (250 - 100) = 750.00`
2. Match remaining `2` units against Lot 2 (`200.00`): `2 x (250 - 200) = 100.00`
3. Total Realized P&L = `750.00 + 100.00 = 850.00`
4. Remaining position = `3` units @ `200.00` = `600.00` total cost (`averageCost = 200.00`).
