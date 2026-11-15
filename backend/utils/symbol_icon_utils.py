import re
from urllib.parse import urlparse

from utils.format_utils import display_symbol, get_asset_type

_MULTILABEL_SUFFIXES = (
    ".co.th",
    ".or.th",
    ".in.th",
    ".ac.th",
    ".go.th",
    ".co.uk",
    ".org.uk",
    ".com.hk",
    ".com.sg",
    ".com.au",
    ".co.jp",
)

_CORPORATE_STOPWORDS = frozenset(
    {
        "ASSET",
        "MANAGEMENT",
        "FUND",
        "FUNDS",
        "INVESTMENT",
        "INVESTMENTS",
        "SECURITIES",
        "COMPANY",
        "LIMITED",
        "LTD",
        "PUBLIC",
        "PCL",
        "THAILAND",
        "CO",
        "PLC",
        "THE",
        "AND",
        "GROUP",
        "HOLDINGS",
        "INSURANCE",
    }
)


def _int32(val: int) -> int:
    """Simulates 32-bit signed integer arithmetic as performed by JavaScript bitwise operators."""
    val = val & 0xFFFFFFFF
    if val >= 0x80000000:
        val -= 0x100000000
    return val


def _hsl_to_hex(h: float, s: float, lightness: float) -> str:
    """Converts HSL components (h in [0, 360), s and lightness in [0, 1]) to standard 6-digit hex string (#rrggbb)."""
    a = s * min(lightness, 1.0 - lightness)

    def f(n: int) -> str:
        k = (n + h / 30.0) % 12
        color = lightness - a * max(min(k - 3, 9 - k, 1), -1)
        val = round(255 * color)
        return f"{val:02x}"

    return f"#{f(0)}{f(8)}{f(4)}"


def clean_ticker_for_url(symbol: str) -> str:
    """Normalizes symbol to a clean ticker string suitable for CDN lookup.

    Strips suffixes (.FUND, .BKFUND, .BK, .CRYPTO) and replaces '.' or '/' with '-'.
    """
    clean = display_symbol(symbol or "").strip()
    return re.sub(r"[./]", "-", clean)


def get_symbol_monogram(symbol: str) -> str:
    """Computes a 1-3 letter monogram representation for fallback avatar.

    Matches ShareLot getSymbolMonogram logic:
    - 1-3 chars: returns clean symbol (e.g., BTC, PTT, SPY, V, T)
    - >3 chars: first 2 alphanumeric characters (e.g., AAPL -> AA, ES-GTECHSSF -> ES)
    """
    clean = display_symbol(symbol or "").strip().upper()
    if not clean:
        return "?"

    if len(clean) <= 3:
        return clean

    letters_only = re.sub(r"[^A-Z0-9]", "", clean)
    return letters_only[:2] or clean[:2]


def get_symbol_color(symbol: str) -> str:
    """Dynamically computes a consistent, vibrant brand color for any symbol.

    Uses a deterministic string hash mapped to HSL color space.
    Matches ShareLot getSymbolColor output exactly.
    """
    clean = display_symbol(symbol or "").upper().strip()
    if not clean:
        return "#6366f1"

    h = 0
    for char in clean:
        h = _int32(ord(char) + _int32((h << 5) - h))

    hue = abs(h) % 360
    sat = 0.65 + (abs(h >> 3) % 20) / 100.0
    light = 0.45 + (abs(h >> 7) % 10) / 100.0

    return _hsl_to_hex(hue, sat, light)


def get_symbol_logo_config(symbol: str, asset_type: str = "") -> dict:
    """Resolves primary and secondary CDN logo URLs and metadata for a given symbol and asset type."""
    if not symbol:
        return {
            "primary_url": None,
            "secondary_url": None,
            "is_mutual_fund": False,
            "monogram": "?",
            "brand_color": "#6366f1",
        }

    resolved_type = get_asset_type(asset_type, symbol)
    clean_ticker = clean_ticker_for_url(symbol)
    brand_color = get_symbol_color(symbol)
    monogram = get_symbol_monogram(symbol)

    if resolved_type in ("mutual-fund", "provident-fund"):
        return {
            "primary_url": None,
            "secondary_url": None,
            "is_mutual_fund": True,
            "monogram": monogram,
            "brand_color": brand_color,
        }

    if resolved_type == "crypto":
        sym_lower = clean_ticker.lower()
        return {
            "primary_url": f"https://assets.coincap.io/assets/icons/{sym_lower}@2x.png",
            "secondary_url": f"https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/{sym_lower}.svg",
            "is_mutual_fund": False,
            "monogram": monogram,
            "brand_color": brand_color,
        }

    if resolved_type == "thai-stock":
        clean_upper = clean_ticker.upper()
        return {
            "primary_url": f"https://www.set.or.th/dat/vender/quote/company_logo/{clean_upper}.png",
            "secondary_url": f"https://assets.parqet.com/logos/symbol/{clean_upper}.BK?format=png",
            "is_mutual_fund": False,
            "monogram": monogram,
            "brand_color": brand_color,
        }

    # U.S. Equities & Global ETFs (default)
    clean_upper = clean_ticker.upper()
    return {
        "primary_url": f"https://assets.parqet.com/logos/symbol/{clean_upper}?format=png",
        "secondary_url": f"https://financialmodelingprep.com/image-stock/{clean_upper}.png",
        "is_mutual_fund": False,
        "monogram": monogram,
        "brand_color": brand_color,
    }


def generate_symbol_svg(symbol: str, asset_type: str = "") -> bytes:
    """Generates a self-contained SVG graphic for a ticker symbol.

    - Mutual and provident funds receive the stylized bank building vector icon.
    - Other assets receive a centered monogram avatar badge.
    """
    brand_color = get_symbol_color(symbol)
    resolved_type = get_asset_type(asset_type, symbol)
    monogram = get_symbol_monogram(symbol)

    if resolved_type in ("mutual-fund", "provident-fund"):
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
            f'  <rect width="64" height="64" rx="14" fill="{brand_color}" fill-opacity="0.12" stroke="{brand_color}" stroke-opacity="0.25" stroke-width="2"/>\n'
            f'  <g transform="translate(14, 14) scale(1.5)" fill="none" stroke="{brand_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n'
            f'    <path d="M3 21h18" />\n'
            f'    <path d="M3 10h18" />\n'
            f'    <path d="M5 6l7-3 7 3" />\n'
            f'    <path d="M4 10v11" />\n'
            f'    <path d="M20 10v11" />\n'
            f'    <path d="M8 14v4" />\n'
            f'    <path d="M12 14v4" />\n'
            f'    <path d="M16 14v4" />\n'
            f'  </g>\n'
            f"</svg>"
        )
    else:
        font_size = 28 if len(monogram) <= 2 else 20
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
            f'  <rect width="64" height="64" rx="14" fill="{brand_color}" fill-opacity="0.12" stroke="{brand_color}" stroke-opacity="0.25" stroke-width="2"/>\n'
            f'  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="{brand_color}" '
            f'font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" '
            f'font-size="{font_size}" font-weight="700">{monogram}</text>\n'
            f"</svg>"
        )

    return svg.encode("utf-8")


def generate_amc_svg(amc_code: str, brand_color: str) -> bytes:
    """Generates a branded monogram badge SVG for an identified AMC fallback."""
    label = (amc_code or "?").strip().upper()[:6] or "?"
    if len(label) <= 2:
        font_size = 24
    elif len(label) <= 3:
        font_size = 20
    elif len(label) <= 5:
        font_size = 14
    else:
        font_size = 12

    color = brand_color or "#6366f1"
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
        f'  <rect width="64" height="64" rx="14" fill="{color}" fill-opacity="0.14" stroke="{color}" stroke-opacity="0.32" stroke-width="2"/>\n'
        f'  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="{color}" '
        f'font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" '
        f'font-size="{font_size}" font-weight="700" letter-spacing="-0.4">{label}</text>\n'
        f"</svg>"
    )
    return svg.encode("utf-8")


def extract_domain_candidates(raw_url: str | None) -> list[str]:
    """Extracts normalized website hostname and apex domain candidates from a URL or host string."""
    value = (raw_url or "").strip()
    if not value:
        return []

    normalized = value if value.startswith(("http://", "https://")) else f"https://{value}"
    host = (urlparse(normalized).hostname or "").strip().lower().rstrip(".")
    if not host or "." not in host:
        return []

    candidates: list[str] = [host]
    labels = host.split(".")
    min_labels = 3 if any(host.endswith(suffix) for suffix in _MULTILABEL_SUFFIXES) else 2
    if len(labels) > min_labels:
        apex = ".".join(labels[-min_labels:])
        if apex not in candidates:
            candidates.append(apex)

    return candidates


def extract_brand_tokens(company_name: str | None) -> list[str]:
    """Extracts significant uppercase alphanumeric corporate brand tokens for sister-entity matching."""
    raw = re.sub(r"\([^)]*\)", " ", (company_name or "").upper())
    words = re.findall(r"[A-Z0-9]+", raw)
    brand = [w for w in words if w not in _CORPORATE_STOPWORDS and len(w) >= 2]
    return brand if brand else [w for w in words if w]


def derive_amc_code(amc_name: str | None, abbr_name: str | None = None) -> str:
    """Derives a short 2-6 character badge label dynamically from SEC AMC abbreviation or name."""
    abbr_clean = re.sub(r"[^A-Z0-9]", "", (abbr_name or "").upper())
    if abbr_clean:
        return abbr_clean[:6]

    tokens = extract_brand_tokens(amc_name)
    if not tokens:
        return "AMC"

    if len(tokens) == 1:
        return tokens[0][:6]

    if len(tokens[0]) <= 5 and len("".join(tokens)) > 6:
        return tokens[0]

    initials = "".join(t[0] for t in tokens[:6])
    return initials if len(initials) >= 2 else tokens[0][:5]
