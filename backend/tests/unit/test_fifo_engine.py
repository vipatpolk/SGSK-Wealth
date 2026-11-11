import pytest

from models.transaction import Transaction
from services.share_lot_service import ShareLotService


@pytest.fixture
def service():
    return ShareLotService()


@pytest.mark.unit
def test_fifo_single_buy_and_hold(service):
    transactions = [
        Transaction(symbol="AAPL", date="2026-01-01", quantity=10, price=100.0, currency="USD", assetType="us-stock")
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    s = summaries[0]
    assert s.symbol == "AAPL"
    assert s.totalShares == 10.0
    assert s.totalCost == 1000.0
    assert s.averageCost == 100.0
    assert len(s.lots) == 1

    assert len(closed_summaries) == 0

    assert len(tx_summaries) == 1
    ts = tx_summaries[0]
    assert ts.buyCount == 1
    assert ts.sellCount == 0
    assert ts.currentStatus == "OPEN"


@pytest.mark.unit
def test_fifo_partial_lot_sale(service):
    transactions = [
        Transaction(symbol="AAPL", date="2026-01-01", quantity=10, price=100.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="AAPL", date="2026-01-05", quantity=-4, price=150.0, currency="USD", assetType="us-stock"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    s = summaries[0]
    assert s.totalShares == 6.0
    assert s.totalCost == 600.0
    assert s.averageCost == 100.0

    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.symbol == "AAPL"
    assert cs.closedShares == 4.0
    assert cs.totalCost == 400.0
    assert cs.totalProceeds == 600.0
    assert cs.realizedPL == 200.0

    ts = tx_summaries[0]
    assert ts.realizedPL == 200.0
    assert pytest.approx(ts.realizedPLPercent, 0.01) == 50.0


@pytest.mark.unit
def test_fifo_multi_lot_queue_matching(service):
    transactions = [
        Transaction(symbol="AAPL", date="2026-01-01", quantity=5, price=100.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="AAPL", date="2026-01-02", quantity=5, price=200.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="AAPL", date="2026-01-03", quantity=-7, price=250.0, currency="USD", assetType="us-stock"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    s = summaries[0]
    assert s.totalShares == 3.0
    assert s.totalCost == 600.0
    assert s.averageCost == 200.0

    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.closedShares == 7.0
    assert cs.realizedPL == pytest.approx(850.0, 0.01)

    ts = tx_summaries[0]
    assert pytest.approx(ts.realizedPL, 0.01) == 850.0


@pytest.mark.unit
def test_fifo_complete_position_exit(service):
    transactions = [
        Transaction(symbol="TSLA", date="2026-01-01", quantity=10, price=200.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="TSLA", date="2026-01-15", quantity=-10, price=250.0, currency="USD", assetType="us-stock"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 0

    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.symbol == "TSLA"
    assert cs.closedShares == 10.0
    assert cs.totalCost == 2000.0
    assert cs.totalProceeds == 2500.0
    assert cs.realizedPL == 500.0
    assert pytest.approx(cs.realizedPLPercent, 0.01) == 25.0

    ts = tx_summaries[0]
    assert ts.currentStatus == "CLOSED"
    assert ts.netShares == 0.0


@pytest.mark.unit
def test_fifo_floating_point_epsilon_precision(service):
    transactions = [
        Transaction(
            symbol="BTC.CRYPTO",
            date="2026-01-01",
            quantity=0.12345678,
            price=50000.0,
            currency="USD",
            assetType="crypto",
        ),
        Transaction(
            symbol="BTC.CRYPTO",
            date="2026-01-02",
            quantity=-0.12345678,
            price=60000.0,
            currency="USD",
            assetType="crypto",
        ),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 0
    assert len(closed_summaries) == 1
    assert closed_summaries[0].closedShares == pytest.approx(0.12345678, 1e-7)


@pytest.mark.unit
def test_fifo_finpension_worked_example(service):
    """TC-FIFO-01: finpension CSIF (CH) Equity Switzerland Large Cap Blue ZB worked example."""
    transactions = [
        Transaction(
            symbol="CSIF.CH",
            date="2020-07-23",
            quantity=10,
            price=1373.76,
            currency="CHF",
            assetType="mutual-fund",
        ),
        Transaction(
            symbol="CSIF.CH",
            date="2021-09-01",
            quantity=2,
            price=1679.18,
            currency="CHF",
            assetType="mutual-fund",
        ),
        Transaction(
            symbol="CSIF.CH",
            date="2022-05-25",
            quantity=-5,
            price=1581.06,
            currency="CHF",
            assetType="mutual-fund",
        ),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    # 7 units remaining: 5 from 2020-07-23 @ 1373.76, 2 from 2021-09-01 @ 1679.18
    assert len(summaries) == 1
    s = summaries[0]
    assert s.totalShares == 7.0
    assert s.totalCost == pytest.approx(10227.16, 0.01)
    assert s.averageCost == pytest.approx(1461.022857, 1e-4)
    assert len(s.lots) == 2

    # 5 units sold from Lot 1: 5 * (1581.06 - 1373.76) = 1036.50
    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.closedShares == 5.0
    assert cs.totalCost == pytest.approx(6868.80, 0.01)
    assert cs.totalProceeds == pytest.approx(7905.30, 0.01)
    assert cs.realizedPL == pytest.approx(1036.50, 0.01)

    assert len(tx_summaries) == 1
    ts = tx_summaries[0]
    assert ts.realizedPL == pytest.approx(1036.50, 0.01)
    assert ts.currentStatus == "OPEN"
    assert ts.netShares == 7.0


@pytest.mark.unit
def test_fifo_zero_cost_basis_lot(service):
    """TC-FIFO-02: Zero-cost-basis lots (bonus shares/airdrops) record correct realized P&L."""
    transactions = [
        Transaction(symbol="BONUS", date="2026-01-01", quantity=10, price=0.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="BONUS", date="2026-01-10", quantity=-4, price=25.0, currency="USD", assetType="us-stock"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    assert summaries[0].totalShares == 6.0
    assert summaries[0].totalCost == 0.0

    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.closedShares == 4.0
    assert cs.totalCost == 0.0
    assert cs.totalProceeds == 100.0
    assert cs.realizedPL == 100.0

    assert tx_summaries[0].realizedPL == 100.0


@pytest.mark.unit
def test_fifo_oversell_bounds_realized_pl_to_matched_lots(service):
    """TC-FIFO-03: Overselling does not invent proceeds on unmatched shares."""
    transactions = [
        Transaction(symbol="AAPL", date="2026-01-01", quantity=4, price=100.0, currency="USD", assetType="us-stock"),
        Transaction(symbol="AAPL", date="2026-01-05", quantity=-10, price=150.0, currency="USD", assetType="us-stock"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 0
    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.closedShares == 4.0
    assert cs.totalCost == 400.0
    assert cs.totalProceeds == 600.0
    assert cs.realizedPL == 200.0

    # tx_summary must match matched lots (200.0), not total_amount - matched_cost (1500 - 400 = 1100)
    assert tx_summaries[0].realizedPL == 200.0


@pytest.mark.unit
def test_fifo_explicit_sell_action_with_positive_quantity(service):
    """TC-FIFO-04: Action=SELL with positive quantity consumes lots rather than buying."""
    transactions = [
        Transaction(symbol="MSFT", date="2026-01-01", quantity=10, price=200.0, currency="USD", assetType="us-stock", txType="BUY"),
        Transaction(symbol="MSFT", date="2026-01-05", quantity=4, price=250.0, currency="USD", assetType="us-stock", txType="SELL"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    assert summaries[0].totalShares == 6.0
    assert summaries[0].totalCost == 1200.0

    assert len(closed_summaries) == 1
    assert closed_summaries[0].closedShares == 4.0
    assert closed_summaries[0].realizedPL == 200.0


@pytest.mark.unit
def test_fifo_non_iso_date_sorting(service):
    """TC-FIFO-05: Non-ISO date formats (e.g., DD.MM.YYYY) are normalized for chronological FIFO order."""
    transactions = [
        Transaction(symbol="ETF", date="01.09.2021", quantity=2, price=200.0, currency="EUR", assetType="mutual-fund"),
        Transaction(symbol="ETF", date="23.07.2020", quantity=10, price=100.0, currency="EUR", assetType="mutual-fund"),
        Transaction(symbol="ETF", date="25.05.2022", quantity=-5, price=250.0, currency="EUR", assetType="mutual-fund"),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    # 2020 lot (100.0) should be consumed first, NOT 2021 lot
    assert len(closed_summaries) == 1
    assert closed_summaries[0].closedShares == 5.0
    assert closed_summaries[0].totalCost == 500.0  # 5 * 100.0
    assert closed_summaries[0].realizedPL == 750.0  # 5 * (250 - 100)


@pytest.mark.unit
def test_fifo_with_acquisition_and_sell_fees(service):
    """TC-FIFO-06: Fees are incorporated into buy cost basis and deducted from net sell proceeds."""
    transactions = [
        Transaction(
            symbol="NVDA",
            date="2026-01-01",
            quantity=10,
            price=100.0,
            currency="USD",
            assetType="us-stock",
            fee=20.0,  # 102.0 / share effective
        ),
        Transaction(
            symbol="NVDA",
            date="2026-01-10",
            quantity=-5,
            price=150.0,
            currency="USD",
            assetType="us-stock",
            fee=10.0,  # 148.0 / share effective
        ),
    ]
    summaries, closed_summaries, tx_summaries = service.process_transactions(transactions)

    assert len(summaries) == 1
    assert summaries[0].totalShares == 5.0
    assert summaries[0].totalCost == 510.0
    assert summaries[0].averageCost == 102.0

    assert len(closed_summaries) == 1
    cs = closed_summaries[0]
    assert cs.closedShares == 5.0
    assert cs.totalCost == 510.0
    assert cs.totalProceeds == 740.0
    assert cs.realizedPL == 230.0  # 740 - 510
