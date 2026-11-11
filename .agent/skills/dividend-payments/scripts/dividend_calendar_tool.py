#!/usr/bin/env python3
"""Dividend Calendar & Entitlement Calculation Tool.

Covers:
- U.S. SEC modern T+1 settlement rules (SEC Rule 15c6-1, effective May 28, 2024)
- Special dividends (>= 25% of security value) with deferred ex-dates
- Stock Exchange of Thailand (SET) T+2 settlement rules
- Thai statutory withholding tax (10%, BOI 0%) and U.S. treaty withholding tax (15% W-8BEN, 30% standard)
- Thai stock dividend mandatory accompanying cash dividend calculation
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta
from typing import Optional, Set


def is_business_day(d: date, holidays: Optional[Set[date]] = None) -> bool:
    """Check if a date is a weekday (Monday-Friday) and not in the holiday set."""
    if d.weekday() >= 5:  # 5=Saturday, 6=Sunday
        return False
    if holidays and d in holidays:
        return False
    return True


def add_business_days(d: date, days: int, holidays: Optional[Set[date]] = None) -> date:
    """Add or subtract business days."""
    step = 1 if days >= 0 else -1
    remaining = abs(days)
    curr = d
    while remaining > 0:
        curr += timedelta(days=step)
        if is_business_day(curr, holidays):
            remaining -= 1
    return curr


def calculate_us_ex_date(
    record_date: date,
    payable_date: Optional[date] = None,
    is_special_dividend_25pct: bool = False,
    holidays: Optional[Set[date]] = None,
) -> date:
    """Determine the U.S. Ex-Dividend Date under modern T+1 settlement.

    Rules (Investor.gov / SEC Rule 15c6-1):
    1. If special dividend >= 25% (or stock spin-off), ex-date is deferred to
       Payable Date + 1 business day.
    2. If Record Date is a business day:
       Ex-Date = Record Date.
    3. If Record Date is a weekend or holiday:
       Ex-Date = 1 business day before Record Date.
    """
    if is_special_dividend_25pct:
        if not payable_date:
            raise ValueError("payable_date is required for special dividends >= 25%")
        return add_business_days(payable_date, 1, holidays)

    if is_business_day(record_date, holidays):
        return record_date
    else:
        # Non-business day record date -> 1 business day before
        return add_business_days(record_date, -1, holidays)


def calculate_thai_ex_date(
    record_date: Optional[date] = None,
    book_closing_date: Optional[date] = None,
    holidays: Optional[Set[date]] = None,
) -> date:
    """Determine the SET Ex-Dividend (XD) Date under Thailand's T+2 settlement.

    Rules (Stock Exchange of Thailand / Circular Bor.Jor.(Wor) 25/2007):
    1. With Record Date (RD):
       Settlement takes 2 business days. To be recorded on Record Date,
       the trade must be executed at latest on (Record Date - 1 business day).
       Therefore, XD Date = Record Date - 1 business day.
    2. With Book Closing Date (BC):
       XD Date = Book Closing Date - 2 business days.
    """
    if record_date is not None:
        return add_business_days(record_date, -1, holidays)
    elif book_closing_date is not None:
        return add_business_days(book_closing_date, -2, holidays)
    else:
        raise ValueError("Either record_date or book_closing_date must be provided for SET.")


def is_trade_eligible_for_dividend(trade_date: date, ex_date: date, is_buy: bool = True) -> bool:
    """Check whether a transaction receives the declared dividend.

    Rule:
    - BUY strictly before ex_date (trade_date < ex_date) -> BUYER receives dividend.
    - BUY on or after ex_date (trade_date >= ex_date) -> SELLER receives dividend (BUYER gets None).
    - SELL on or after ex_date (trade_date >= ex_date) -> SELLER retains dividend.
    - SELL strictly before ex_date (trade_date < ex_date) -> SELLER loses dividend to BUYER.
    """
    if is_buy:
        return trade_date < ex_date
    else:
        # For a sale, the seller keeps the dividend if sold ON or AFTER the ex-date
        return trade_date >= ex_date


def calculate_dividend_payout(
    shares: float,
    dividend_per_share: float,
    market: str = "US",
    has_w8ben: bool = True,
    is_boi: bool = False,
    non_boi_ratio: float = 1.0,
) -> dict[str, float]:
    """Calculate gross payout, withholding tax, and net payout.

    Markets:
    - 'US': 15% with W-8BEN treaty; 30% statutory NRA rate without treaty.
    - 'TH' or 'SET': 10% standard (Revenue Code Sec 50(2)(Jor)).
      If BOI exempt, 0% on BOI portion and 10% on non-BOI portion.
    """
    gross = shares * dividend_per_share

    if market.upper() in ("TH", "SET", "THAI"):
        if is_boi:
            wht_rate = 0.0
            tax = 0.0
        elif non_boi_ratio < 1.0:
            # Mixed BOI and non-BOI
            taxable_gross = gross * non_boi_ratio
            tax = taxable_gross * 0.10
            wht_rate = tax / gross if gross > 0 else 0.0
        else:
            wht_rate = 0.10
            tax = gross * wht_rate
    else:
        # US Market
        wht_rate = 0.15 if has_w8ben else 0.30
        tax = gross * wht_rate

    net = gross - tax
    return {
        "shares": shares,
        "dps": dividend_per_share,
        "gross": round(gross, 4),
        "withholding_tax_rate": round(wht_rate, 4),
        "withholding_tax": round(tax, 4),
        "net": round(net, 4),
    }


def calculate_thai_stock_dividend_buffer(
    stock_value_per_share: float,
    wht_rate: float = 0.10,
) -> dict[str, float]:
    """Calculate accompanying cash dividend required to cover withholding tax for Thai stock dividend.

    Under SET practice and Thai Revenue Code:
      Total Dividend Value (D) = Stock Value (S) + Cash Dividend (C)
      Tax (T) = D * wht_rate
    To satisfy tax exactly from cash dividend with 0 net cash outflow:
      C = T = (S + C) * wht_rate
      C * (1 - wht_rate) = S * wht_rate
      C = S * wht_rate / (1 - wht_rate)
    """
    cash_buffer = (stock_value_per_share * wht_rate) / (1.0 - wht_rate)
    total_val = stock_value_per_share + cash_buffer
    tax_due = total_val * wht_rate
    net_cash = cash_buffer - tax_due

    return {
        "stock_value_per_share": round(stock_value_per_share, 6),
        "cash_buffer_per_share": round(cash_buffer, 6),
        "total_dividend_value_per_share": round(total_val, 6),
        "withholding_tax_per_share": round(tax_due, 6),
        "net_cash_received_per_share": round(net_cash, 6),
    }


def parse_date(date_str: str) -> date:
    """Parse YYYY-MM-DD string to date."""
    return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()


def run_self_tests() -> None:
    """Run automated assertion tests across all scenarios."""
    print("Running self-tests for dividend calculations...")

    # 1. US T+1: Business Day Record Date (Monday, 2026-05-11)
    rec_mon = date(2026, 5, 11)
    ex_mon = calculate_us_ex_date(rec_mon)
    assert ex_mon == date(2026, 5, 11), f"Expected 2026-05-11, got {ex_mon}"

    # 2. US T+1: Sunday Record Date (Sunday, 2026-08-30) -> Friday before (2026-08-28)
    rec_sun = date(2026, 8, 30)
    ex_sun = calculate_us_ex_date(rec_sun)
    assert ex_sun == date(2026, 8, 28), f"Expected 2026-08-28, got {ex_sun}"

    # 3. US Special Dividend >= 25%: Payable date (2026-11-06) -> Deferred Ex-Date = 2026-11-09
    pay_fri = date(2026, 11, 6)
    ex_spec = calculate_us_ex_date(rec_mon, payable_date=pay_fri, is_special_dividend_25pct=True)
    assert ex_spec == date(2026, 11, 9), f"Expected 2026-11-09, got {ex_spec}"

    # 4. SET T+2: Record Date Monday (2026-04-06) -> XD Friday (2026-04-03)
    rec_set = date(2026, 4, 6)
    xd_set = calculate_thai_ex_date(record_date=rec_set)
    assert xd_set == date(2026, 4, 3), f"Expected 2026-04-03, got {xd_set}"

    # 5. Entitlement checks
    assert is_trade_eligible_for_dividend(date(2026, 4, 2), xd_set, is_buy=True) is True
    assert is_trade_eligible_for_dividend(date(2026, 4, 3), xd_set, is_buy=True) is False
    assert is_trade_eligible_for_dividend(date(2026, 4, 3), xd_set, is_buy=False) is True

    # 6. Payout calculations
    us_calc = calculate_dividend_payout(1000, 0.25, market="US", has_w8ben=True)
    assert us_calc["gross"] == 250.0 and us_calc["withholding_tax"] == 37.5 and us_calc["net"] == 212.5

    thai_calc = calculate_dividend_payout(10000, 4.50, market="TH")
    assert thai_calc["gross"] == 45000.0 and thai_calc["withholding_tax"] == 4500.0 and thai_calc["net"] == 40500.0

    # 7. Thai Stock Dividend Cash Buffer test (0.10 THB stock value)
    stock_buff = calculate_thai_stock_dividend_buffer(0.10, 0.10)
    assert abs(stock_buff["cash_buffer_per_share"] - 0.011111) < 0.0001
    assert abs(stock_buff["net_cash_received_per_share"]) < 0.00001

    print("All unit tests passed successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate Ex-Dividend Dates and Entitlements.")
    parser.add_argument("--test", action="store_true", help="Run automated self-tests")
    parser.add_argument("--market", choices=["US", "SET"], default="US", help="Market regime (US or SET)")
    parser.add_argument("--record-date", type=str, help="Record Date (YYYY-MM-DD)")
    parser.add_argument("--payable-date", type=str, help="Payable Date (YYYY-MM-DD) for special dividends")
    parser.add_argument("--special", action="store_true", help="U.S. special dividend >= 25%% of share value")
    parser.add_argument("--shares", type=float, default=1000.0, help="Number of shares")
    parser.add_argument("--dps", type=float, default=1.0, help="Dividend per share")

    args = parser.parse_args()

    if args.test:
        run_self_tests()
    elif args.record_date:
        rd = parse_date(args.record_date)
        if args.market == "US":
            pd = parse_date(args.payable_date) if args.payable_date else None
            ex_date = calculate_us_ex_date(rd, payable_date=pd, is_special_dividend_25pct=args.special)
            print(f"U.S. (T+1 Rule) Record Date: {rd} -> Ex-Dividend Date: {ex_date}")
        else:
            ex_date = calculate_thai_ex_date(record_date=rd)
            print(f"SET Thailand (T+2 Rule) Record Date: {rd} -> XD (Ex-Dividend) Date: {ex_date}")

        payout = calculate_dividend_payout(args.shares, args.dps, market=args.market)
        print(f"Payout Summary ({args.shares} shares @ {args.dps} DPS):")
        print(f"  Gross Dividend : {payout['gross']}")
        print(f"  Withholding Tax: {payout['withholding_tax']} ({payout['withholding_tax_rate']*100:.1f}%)")
        print(f"  Net Dividend   : {payout['net']}")
    else:
        run_self_tests()
