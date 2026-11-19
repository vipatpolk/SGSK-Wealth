import asyncio
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from utils.yfinance_client import YFinanceClient  # noqa: E402


async def main() -> None:
    client = YFinanceClient()

    t0 = time.perf_counter()
    aapl_quote, ptt_quote, usd_thb, aapl_divs, ptt_divs = await asyncio.gather(
        client.get_quote("AAPL"),
        client.get_quote("PTT.BK"),
        client.get_exchange_rate("USD", "THB"),
        client.get_dividends("AAPL"),
        client.get_dividends("PTT.BK"),
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    print(f"Elapsed: {elapsed_ms:.1f} ms")
    print(f"AAPL: price={aapl_quote.price} {aapl_quote.currency} name={aapl_quote.name!r}")
    print(f"PTT.BK: price={ptt_quote.price} {ptt_quote.currency} name={ptt_quote.name!r}")
    print(f"USD/THB: {usd_thb}")
    if aapl_divs:
        latest_aapl = datetime.fromtimestamp(aapl_divs[0]["date"], tz=timezone.utc).strftime("%Y-%m-%d")
        print(f"AAPL dividends: count={len(aapl_divs)}, latest={latest_aapl} ({aapl_divs[0]['amount']})")
    if ptt_divs:
        latest_ptt = datetime.fromtimestamp(ptt_divs[0]["date"], tz=timezone.utc).strftime("%Y-%m-%d")
        print(f"PTT.BK dividends: count={len(ptt_divs)}, latest={latest_ptt} ({ptt_divs[0]['amount']})")


if __name__ == "__main__":
    asyncio.run(main())
