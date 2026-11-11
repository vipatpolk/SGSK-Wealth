#!/usr/bin/env python3
"""FIFO Cost-Basis, COGS, and Realized P&L Calculator.

Supports:
- Chronological FIFO lot matching across buys/inflows and sells/outflows
- Optional per-transaction fees added to buy cost basis or deducted from sell proceeds
- Remaining open-lot weighted average cost basis (finpension FIFO cost price)
- Comparison with cash-flow Average Cost basis
- Built-in worked examples (`--example finpension`, `--example inventory`)
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Iterable, List, Tuple

EPSILON = 1e-7


@dataclass
class TxInput:
    date: str
    quantity: float  # positive = buy/inflow, negative = sell/outflow
    price: float
    fee: float = 0.0


@dataclass
class OpenLot:
    date: str
    quantity: float
    unit_cost: float


@dataclass
class ClosedMatch:
    buy_date: str
    sell_date: str
    quantity: float
    buy_unit_cost: float
    sell_unit_price: float
    realized_pl: float


@dataclass
class FifoSummary:
    open_lots: List[OpenLot]
    closed_matches: List[ClosedMatch]
    remaining_shares: float
    remaining_total_cost: float
    fifo_cost_basis_per_share: float
    total_realized_cost_cogs: float
    total_realized_proceeds: float
    total_realized_pl: float
    cashflow_avg_cost_per_share: float


def compute_fifo(transactions: Iterable[TxInput]) -> FifoSummary:
    """Run chronological FIFO lot matching on a sequence of transactions."""
    ordered = sorted(transactions, key=lambda t: t.date)
    open_lots: List[OpenLot] = []
    closed_matches: List[ClosedMatch] = []

    total_cogs = 0.0
    total_proceeds = 0.0
    total_realized_pl = 0.0
    net_cash_outflow = 0.0

    for tx in ordered:
        if tx.quantity > EPSILON:
            qty = tx.quantity
            total_buy_cost = (qty * tx.price) + tx.fee
            unit_cost = total_buy_cost / qty
            open_lots.append(OpenLot(date=tx.date, quantity=qty, unit_cost=unit_cost))
            net_cash_outflow += total_buy_cost
        elif tx.quantity < -EPSILON:
            sell_qty = abs(tx.quantity)
            net_proceeds = (sell_qty * tx.price) - tx.fee
            effective_sell_price = net_proceeds / sell_qty
            net_cash_outflow -= net_proceeds

            remaining_to_sell = sell_qty
            for lot in open_lots:
                if remaining_to_sell <= EPSILON:
                    break
                if lot.quantity <= EPSILON:
                    continue

                matched = min(lot.quantity, remaining_to_sell)
                cost = matched * lot.unit_cost
                proceeds = matched * effective_sell_price
                pl = proceeds - cost

                closed_matches.append(
                    ClosedMatch(
                        buy_date=lot.date,
                        sell_date=tx.date,
                        quantity=matched,
                        buy_unit_cost=lot.unit_cost,
                        sell_unit_price=effective_sell_price,
                        realized_pl=pl,
                    )
                )

                lot.quantity -= matched
                remaining_to_sell -= matched
                total_cogs += cost
                total_proceeds += proceeds
                total_realized_pl += pl

            open_lots = [lot for lot in open_lots if lot.quantity > EPSILON]

    remaining_shares = sum(lot.quantity for lot in open_lots)
    remaining_total_cost = sum(lot.quantity * lot.unit_cost for lot in open_lots)
    fifo_cost_basis = (
        remaining_total_cost / remaining_shares if remaining_shares > EPSILON else 0.0
    )
    cashflow_avg = (
        net_cash_outflow / remaining_shares if remaining_shares > EPSILON else 0.0
    )

    return FifoSummary(
        open_lots=open_lots,
        closed_matches=closed_matches,
        remaining_shares=remaining_shares,
        remaining_total_cost=remaining_total_cost,
        fifo_cost_basis_per_share=fifo_cost_basis,
        total_realized_cost_cogs=total_cogs,
        total_realized_proceeds=total_proceeds,
        total_realized_pl=total_realized_pl,
        cashflow_avg_cost_per_share=cashflow_avg,
    )


def parse_tx_arg(raw: str) -> TxInput:
    """Parse DATE:QTY:PRICE[:FEE] into a TxInput."""
    parts = raw.split(":")
    if len(parts) not in (3, 4):
        raise ValueError(
            f"Invalid --tx '{raw}'. Expected DATE:QTY:PRICE or DATE:QTY:PRICE:FEE"
        )
    date_str = parts[0]
    qty = float(parts[1])
    price = float(parts[2])
    fee = float(parts[3]) if len(parts) == 4 else 0.0
    return TxInput(date=date_str, quantity=qty, price=price, fee=fee)


def get_preset_examples() -> dict[str, Tuple[str, List[TxInput]]]:
    return {
        "finpension": (
            "finpension CSIF (CH) Equity Switzerland Large Cap Blue ZB",
            [
                TxInput("2020-07-23", 10, 1373.76),
                TxInput("2021-09-01", 2, 1679.18),
                TxInput("2022-05-25", -5, 1581.06),
            ],
        ),
        "inventory": (
            "Investopedia Inventory Example (2 buys, 2 sales)",
            [
                TxInput("2026-01-01", 100, 10.0),
                TxInput("2026-01-02", 100, 15.0),
                TxInput("2026-01-03", -60, 20.0),
                TxInput("2026-01-04", -50, 20.0),
            ],
        ),
    }


def print_summary(title: str, summary: FifoSummary) -> None:
    print(f"=== {title} ===")
    print("Closed FIFO Matches (COGS / Realized P&L):")
    if not summary.closed_matches:
        print("  (none)")
    for m in summary.closed_matches:
        print(
            f"  Sell {m.sell_date} <- Buy {m.buy_date}: "
            f"qty={m.quantity:g}, cost={m.buy_unit_cost:,.2f}, "
            f"sell={m.sell_unit_price:,.2f}, P&L={m.realized_pl:,.2f}"
        )

    print("Remaining Open Lots (Ending Inventory / Open Cost Basis):")
    if not summary.open_lots:
        print("  (none)")
    for lot in summary.open_lots:
        lot_total = lot.quantity * lot.unit_cost
        print(
            f"  Buy {lot.date}: qty={lot.quantity:g}, "
            f"unit_cost={lot.unit_cost:,.2f}, total={lot_total:,.2f}"
        )

    print("Summary Metrics:")
    print(f"  Remaining Shares/Units : {summary.remaining_shares:g}")
    print(f"  Remaining Total Cost   : {summary.remaining_total_cost:,.2f}")
    print(f"  FIFO Cost Basis / Unit : {summary.fifo_cost_basis_per_share:,.2f}")
    print(f"  Cash-Flow Avg / Unit   : {summary.cashflow_avg_cost_per_share:,.2f}")
    print(f"  Total COGS / Sold Cost : {summary.total_realized_cost_cogs:,.2f}")
    print(f"  Total Proceeds         : {summary.total_realized_proceeds:,.2f}")
    print(f"  Total Realized P&L     : {summary.total_realized_pl:,.2f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="FIFO Cost-Basis & COGS Calculator")
    parser.add_argument(
        "--example",
        choices=["finpension", "inventory"],
        help="Run a built-in worked example",
    )
    parser.add_argument(
        "--tx",
        action="append",
        default=[],
        help="Transaction in DATE:QTY:PRICE[:FEE] format (repeatable)",
    )
    args = parser.parse_args()

    if args.example:
        title, txs = get_preset_examples()[args.example]
        print_summary(title, compute_fifo(txs))
    elif args.tx:
        txs = [parse_tx_arg(raw) for raw in args.tx]
        print_summary("Custom FIFO Calculation", compute_fifo(txs))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
