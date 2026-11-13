#!/usr/bin/env python3
"""Zero-dependency CLI helper for querying SEC Thailand Fund (v2) and PVD (v1) Open APIs.

Reads SEC_SUBSCRIPTION_KEY from environment variables or a workspace `.env` file.
Never prints or logs the subscription key.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

BASE_URL = "https://api.sec.or.th"


def load_subscription_key(explicit_key: str | None = None) -> str:
    if explicit_key:
        return explicit_key.strip()
    env_key = os.environ.get("SEC_SUBSCRIPTION_KEY", "").strip()
    if env_key:
        return env_key

    # Walk upward from CWD to locate `.env`
    for parent in [Path.cwd(), *Path.cwd().parents]:
        env_file = parent / ".env"
        if env_file.is_file():
            for raw_line in env_file.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k.strip() == "SEC_SUBSCRIPTION_KEY":
                    return v.strip().strip('"').strip("'")
            break
    return ""


def request_json(
    method: str,
    path: str,
    subscription_key: str,
    *,
    query: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
    timeout: float = 15.0,
    max_retries: int = 2,
) -> Any:
    clean_query = {k: str(v) for k, v in (query or {}).items() if v is not None and v != ""}
    url = f"{BASE_URL}{path}"
    if clean_query:
        url = f"{url}?{urllib.parse.urlencode(clean_query)}"

    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Accept": "application/json",
        "User-Agent": "SGSK-Wealth-SEC-OpenAPI-Skill/1.0",
    }
    data_bytes: bytes | None = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(body, ensure_ascii=False).encode("utf-8")

    for attempt in range(max_retries + 1):
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method.upper())
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 204:
                    return None
                raw = resp.read().decode("utf-8").strip()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            if exc.code == 204:
                return None
            if exc.code == 429 and attempt < max_retries:
                retry_after = float(exc.headers.get("Retry-After", 2**attempt))
                time.sleep(retry_after)
                continue
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"HTTP {exc.code} on {method} {path}: {detail}") from exc
    return None


def fetch_paginated_fund(
    path: str,
    subscription_key: str,
    query: dict[str, Any],
    *,
    page_size: int = 100,
    max_pages: int = 1,
) -> dict[str, Any]:
    """Fetch 1..max_pages from a /v2/fund/* endpoint using next_cursor."""
    all_items: list[dict[str, Any]] = []
    cursor: str | None = None
    pages_fetched = 0
    last_message = "success"

    while pages_fetched < max_pages:
        page_query = {**query, "page_size": max(1, min(page_size, 100))}
        if cursor:
            page_query["next_cursor"] = cursor
        payload = request_json("GET", path, subscription_key, query=page_query)
        if not isinstance(payload, dict):
            break
        last_message = str(payload.get("message", "success"))
        items = payload.get("items") or []
        all_items.extend(items)
        pages_fetched += 1
        cursor = payload.get("next_cursor") or ""
        if not cursor or not items:
            break

    return {
        "message": last_message,
        "pages_fetched": pages_fetched,
        "next_cursor": cursor or "",
        "count": len(all_items),
        "items": all_items,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Query SEC Thailand Fund (/v2/fund) and PVD (/v1/pvd) Open APIs.",
    )
    parser.add_argument(
        "--key",
        default=None,
        help="SEC Ocp-Apim-Subscription-Key (defaults to SEC_SUBSCRIPTION_KEY env var or .env)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # Fund commands
    p_amcs = sub.add_parser("fund-amcs", help="GET /v2/fund/general-info/amcs")
    p_amcs.add_argument("--page-size", type=int, default=100)
    p_amcs.add_argument("--max-pages", type=int, default=1)

    p_prof = sub.add_parser("fund-profiles", help="GET /v2/fund/general-info/profiles")
    p_prof.add_argument("--class-name", dest="fund_class_name", default=None)
    p_prof.add_argument("--project", dest="project_info", default=None, help="proj_id or partial name/abbr")
    p_prof.add_argument("--company", dest="company_info", default=None, help="unique_id or partial AMC name")
    p_prof.add_argument("--status", dest="fund_status", default=None, help="Registered, IPO, Expired, Canceled, Liquidated")
    p_prof.add_argument("--page-size", type=int, default=100)
    p_prof.add_argument("--max-pages", type=int, default=1)

    p_nav = sub.add_parser("fund-nav", help="GET /v2/fund/daily-info/nav")
    p_nav.add_argument("--proj-id", required=True)
    p_nav.add_argument("--start", dest="start_nav_date", required=True, help="YYYY-MM-DD")
    p_nav.add_argument("--end", dest="end_nav_date", required=True, help="YYYY-MM-DD")
    p_nav.add_argument("--class-name", dest="fund_class_name", default=None)
    p_nav.add_argument("--page-size", type=int, default=100)
    p_nav.add_argument("--max-pages", type=int, default=1)

    p_div = sub.add_parser("fund-dividends", help="GET /v2/fund/daily-info/dividend-history")
    p_div.add_argument("--proj-id", required=True)
    p_div.add_argument("--page-size", type=int, default=100)
    p_div.add_argument("--max-pages", type=int, default=1)

    p_fs = sub.add_parser("fund-factsheet", help="GET /v2/fund/factsheet/<section>")
    p_fs.add_argument(
        "section",
        choices=[
            "urls",
            "ipos",
            "benchmarks",
            "subscription-redemption-minimums",
            "subscription-redemption-periods",
            "risk-spectrum",
            "statistics",
            "dividend-policy",
            "fees",
            "performance",
            "asset-allocation",
            "top5-holdings",
        ],
    )
    p_fs.add_argument("--proj-id", required=True)
    p_fs.add_argument("--class-name", dest="fund_class_name", default=None)
    p_fs.add_argument("--latest", action="store_true", help="Pass latest=true (ignored by urls)")
    p_fs.add_argument("--page-size", type=int, default=100)
    p_fs.add_argument("--max-pages", type=int, default=1)

    # PVD commands
    sub.add_parser("pvd-amcs", help="GET /v1/pvd/factsheet/amc")

    p_pvd_funds = sub.add_parser("pvd-funds", help="GET /v1/pvd/factsheet/{unique_id}/fund or POST search")
    group = p_pvd_funds.add_mutually_exclusive_group(required=True)
    group.add_argument("--unique-id", help="AMC unique_id (uses GET)")
    group.add_argument("--name", help="Partial Thai/English PVD fund name (uses POST)")

    p_pvd_pol = sub.add_parser("pvd-policies", help="GET /v1/pvd/factsheet/{proj_id}/policy")
    p_pvd_pol.add_argument("--proj-id", required=True)

    p_pvd_nav = sub.add_parser("pvd-nav", help="GET /v1/pvd/factsheet/{proj_id}/nav/{nav_date}")
    p_pvd_nav.add_argument("--proj-id", required=True)
    p_pvd_nav.add_argument("--nav-date", required=True, help="Month-end YYYYMMDD (earliest 20240630, ~60d lag)")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    key = load_subscription_key(args.key)
    if not key:
        print("Error: SEC_SUBSCRIPTION_KEY is not set in environment or .env.", file=sys.stderr)
        return 2

    try:
        if args.command == "fund-amcs":
            result = fetch_paginated_fund(
                "/v2/fund/general-info/amcs", key, {},
                page_size=args.page_size, max_pages=args.max_pages,
            )
        elif args.command == "fund-profiles":
            result = fetch_paginated_fund(
                "/v2/fund/general-info/profiles", key,
                {
                    "fund_class_name": args.fund_class_name,
                    "project_info": args.project_info,
                    "company_info": args.company_info,
                    "fund_status": args.fund_status,
                },
                page_size=args.page_size, max_pages=args.max_pages,
            )
        elif args.command == "fund-nav":
            result = fetch_paginated_fund(
                "/v2/fund/daily-info/nav", key,
                {
                    "proj_id": args.proj_id,
                    "start_nav_date": args.start_nav_date,
                    "end_nav_date": args.end_nav_date,
                    "fund_class_name": args.fund_class_name,
                },
                page_size=args.page_size, max_pages=args.max_pages,
            )
        elif args.command == "fund-dividends":
            result = fetch_paginated_fund(
                "/v2/fund/daily-info/dividend-history", key,
                {"proj_id": args.proj_id},
                page_size=args.page_size, max_pages=args.max_pages,
            )
        elif args.command == "fund-factsheet":
            q: dict[str, Any] = {"proj_id": args.proj_id}
            if args.fund_class_name:
                q["fund_class_name"] = args.fund_class_name
            if args.latest and args.section != "urls":
                q["latest"] = "true"
            result = fetch_paginated_fund(
                f"/v2/fund/factsheet/{args.section}", key, q,
                page_size=args.page_size, max_pages=args.max_pages,
            )
        elif args.command == "pvd-amcs":
            result = request_json("GET", "/v1/pvd/factsheet/amc", key)
        elif args.command == "pvd-funds":
            if args.unique_id:
                result = request_json("GET", f"/v1/pvd/factsheet/{args.unique_id}/fund", key)
            else:
                result = request_json("POST", "/v1/pvd/factsheet/fund", key, body={"FundName": args.name})
        elif args.command == "pvd-policies":
            result = request_json("GET", f"/v1/pvd/factsheet/{args.proj_id}/policy", key)
        elif args.command == "pvd-nav":
            result = request_json("GET", f"/v1/pvd/factsheet/{args.proj_id}/nav/{args.nav_date}", key)
        else:
            parser.error(f"Unknown command: {args.command}")
            return 2

        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
