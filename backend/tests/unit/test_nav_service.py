import pytest

from models.transaction import PriceData
from services.nav_service import NavService


@pytest.fixture
def service():
    return NavService()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_navs_empty(service):
    res = await service.fetch_fund_navs([])
    assert res == {}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_single_fund_nav_not_found(service, monkeypatch):
    async def mock_fetch_fund_profile(clean_symbol: str, sym_upper: str):
        return None

    monkeypatch.setattr(service, "fetch_fund_profile", mock_fetch_fund_profile)

    res = await service.fetch_single_fund_nav("UNKNOWN_FUND.FUND")
    assert res["originalSymbol"] == "UNKNOWN_FUND.FUND"
    assert res["data"].price == 0.0
    assert res["data"].currency == "THB"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_single_fund_nav_success(service, monkeypatch):
    async def mock_fetch_fund_profile(clean_symbol: str, sym_upper: str):
        return {
            "proj_id": "M0123_2560",
            "proj_name_en": "K-CHANGE MUTUAL FUND",
            "proj_name_th": "กองทุนเปิดเค พอสซิทีฟ เชนจ์ หุ้นทุน",
            "fund_class_name": "main",
        }

    async def mock_fetch_fund_nav_data(symbol: str, clean_symbol: str, sym_upper: str, fund: dict):
        return {
            "originalSymbol": symbol,
            "data": PriceData(
                symbol=symbol,
                name=fund["name"],
                nameTh=fund.get("nameTh", ""),
                price=15.75,
                currency="THB",
            ),
        }

    monkeypatch.setattr(service, "fetch_fund_profile", mock_fetch_fund_profile)
    monkeypatch.setattr(service, "fetch_fund_nav_data", mock_fetch_fund_nav_data)

    res = await service.fetch_single_fund_nav("K-CHANGE.FUND")
    assert res["originalSymbol"] == "K-CHANGE.FUND"
    assert res["data"].price == 15.75
    assert res["data"].name == "K-CHANGE MUTUAL FUND"
    assert res["data"].nameTh == "กองทุนเปิดเค พอสซิทีฟ เชนจ์ หุ้นทุน"
    assert res["data"].currency == "THB"

    res_bk = await service.fetch_single_fund_nav("K-CHANGE.BKFUND")
    assert res_bk["originalSymbol"] == "K-CHANGE.BKFUND"
    assert res_bk["data"].price == 15.75
    assert res_bk["data"].nameTh == "กองทุนเปิดเค พอสซิทีฟ เชนจ์ หุ้นทุน"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_pvd_policies_success(service, monkeypatch):
    class MockResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {
                    "sub_policy_id": "PVDSP500",
                    "sub_policy_name": "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส",
                    "policy_name": "ตราสารทุน",
                    "aimc_type": "EQUS",
                    "risk_level": "RS6",
                    "objective": "ลงทุนในกองทุนเปิดไทยพาณิชย์หุ้นยูเอส",
                }
            ]

    async def mock_get(url, *args, **kwargs):
        return MockResponse()

    monkeypatch.setattr(service.client, "get", mock_get)

    res = await service.fetch_pvd_policies("V0001_2553")
    assert "PVDSP500" in res
    assert res["PVDSP500"]["name"] == "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส"
    assert res["PVDSP500"]["policyName"] == "ตราสารทุน"
    assert res["PVDSP500"]["aimcType"] == "EQUS"
    assert res["PVDSP500"]["riskLevel"] == "RS6"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_pvd_proj_id_and_policies_by_fund_name(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()
    captured_posts: list[dict] = []

    class MockPostResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {"proj_id": "V9999_2540", "proj_name_th": "อื่น", "fund_status": "CA"},
                {"proj_id": "V0001_2553", "proj_name_th": "ไทยพาณิชย์ มาสเตอร์ฟันด์", "fund_status": "RG"},
            ]

    class MockGetResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {
                    "sub_policy_id": "PVDSP500",
                    "sub_policy_name": "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส",
                    "policy_name": "ตราสารทุน",
                    "aimc_type": "EQUS",
                    "risk_level": "RS6",
                    "objective": "ลงทุนในกองทุนเปิดไทยพาณิชย์หุ้นยูเอส",
                }
            ]

    async def mock_post(url, *args, **kwargs):
        captured_posts.append({"url": url, "json": kwargs.get("json")})
        return MockPostResponse()

    async def mock_get(url, *args, **kwargs):
        assert "/factsheet/V0001_2553/policy" in url
        return MockGetResponse()

    monkeypatch.setattr(service.client, "post", mock_post)
    monkeypatch.setattr(service.client, "get", mock_get)

    resolved = await service.fetch_pvd_proj_id("ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert resolved == "V0001_2553"
    assert len(captured_posts) == 1
    assert captured_posts[0]["url"].endswith("/factsheet/fund")
    assert captured_posts[0]["json"] == {"FundName": "ไทยพาณิชย์ มาสเตอร์ฟันด์"}

    policies = await service.fetch_pvd_policies(fund_name="ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert "PVDSP500" in policies
    assert policies["PVDSP500"]["name"] == "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส"
    assert policies["PVDSP500"]["fundName"] == "ไทยพาณิชย์ มาสเตอร์ฟันด์"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_pvd_policies_without_proj_or_fund_returns_empty(service):
    assert await service.fetch_pvd_policies() == {}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_pvd_proj_id_204_returns_none(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    class Mock204Response:
        status_code = 204

    async def mock_post(url, *args, **kwargs):
        return Mock204Response()

    monkeypatch.setattr(service.client, "post", mock_post)
    assert await service.fetch_pvd_proj_id("ไม่พบกองทุน") is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_nav_data_preserves_name_th(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    class MockNavResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [{"nav_date": "2026-11-10", "fund_class_name": "main", "last_val": 12.3456}]

    async def mock_get(url, *args, **kwargs):
        return MockNavResponse()

    monkeypatch.setattr(service.client, "get", mock_get)

    res = await service.fetch_fund_nav_data(
        "SCBSFF.FUND",
        "SCBSFF",
        "SCBSFF",
        {
            "projId": "M0001_2550",
            "name": "SCB Short Term Fixed Income Fund",
            "nameTh": "กองทุนเปิดไทยพาณิชย์ตราสารหนี้ระยะสั้น",
            "targetClass": "main",
        },
    )
    assert res["data"].name == "SCB Short Term Fixed Income Fund"
    assert res["data"].nameTh == "กองทุนเปิดไทยพาณิชย์ตราสารหนี้ระยะสั้น"
    assert res["data"].price == 12.3456


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_factsheet_mutual_fund_success(service, monkeypatch):
    import base64

    from utils.cache import ttl_cache

    ttl_cache.clear()
    policy_b64 = base64.b64encode("ลงทุนในหุ้นสหรัฐเติบโตสูง".encode()).decode("ascii")

    async def mock_fetch_fund_profile(clean_symbol: str, sym_upper: str):
        return {
            "proj_id": "M0888_2560",
            "proj_name_en": "K USA Equity Fund-A(A)",
            "proj_name_th": "กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A ชนิดสะสมมูลค่า",
            "comp_name_en": "KASIKORN ASSET MANAGEMENT CO., LTD.",
            "comp_name_th": "บริษัทหลักทรัพย์จัดการกองทุน กสิกรไทย จำกัด",
            "fund_class_name": "K-USA-A(A)",
            "policy_desc": "ตราสารทุน",
            "investment_policy_desc": policy_b64,
            "management_style": "AN",
            "feederfund_master_fund": "Morgan Stanley US Advantage",
            "feederfund_country": "Luxembourg",
            "exchange_rate_protection_policy": "Hedged >= 75%",
            "fund_class_tax_incentive_type": "",
            "fund_class_isin_code": "TH8888010001",
            "regis_date": "2017-05-10",
        }

    class MockSecResp:
        def __init__(self, status_code: int, payload=None):
            self.status_code = status_code
            self._payload = payload
            self.text = "" if status_code == 204 else "{}"

        def raise_for_status(self):
            pass

        def json(self):
            return self._payload

    async def mock_get(url, *args, **kwargs):
        if "/factsheet/urls" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "pdf_factsheet": "https://sec.example/k-usa.pdf",
                            "amc_url_factsheet": "https://kasikornasset.example/k-usa",
                            "as_of_date": "2026-09-30",
                        }
                    ]
                },
            )
        if "/factsheet/risk-spectrum" in url:
            return MockSecResp(200, {"items": [{"risk_spectrum": "RS6", "risk_spectrum_desc": "High Risk"}]})
        if "/factsheet/benchmarks" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "group_seq": 1,
                            "benchmark": "S&P 500 Total Return Net",
                            "benchmark_remark": "Converted to THB",
                        }
                    ]
                },
            )
        if "/factsheet/dividend-policy" in url:
            return MockSecResp(204)
        if "/factsheet/fees" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "fee_type_desc": "Management Fee",
                            "rate": 2.14,
                            "actual_value": 1.605,
                        }
                    ]
                },
            )
        if "/factsheet/performance" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "performance_type_desc": "Fund Return",
                            "reference_period": "1Y",
                            "performance_value": 18.45,
                        }
                    ]
                },
            )
        if "/factsheet/statistics" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "maximum_drawdown": "-21.3",
                            "sharpe_ratio": "1.12",
                            "tracking_error": "3.40",
                            "fx_hedging": "78.5%",
                            "portfolio_turnover_ratio": "14.2",
                        }
                    ]
                },
            )
        if "/factsheet/asset-allocation" in url:
            return MockSecResp(200, {"items": [{"asset_seq": 1, "asset_name": "Foreign Equity", "asset_ratio": 96.5}]})
        if "/factsheet/top5-holdings" in url:
            return MockSecResp(200, {"items": [{"asset_seq": 1, "asset_name": "MS US Advantage", "asset_ratio": 96.5}]})
        if "/factsheet/subscription-redemption-minimums" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "minimum_sub_ipo": 500,
                            "minimum_sub": 500,
                            "minimum_sub_cur": "THB     ",
                            "minimum_redempt": 500,
                        }
                    ]
                },
            )
        if "/factsheet/subscription-redemption-periods" in url:
            return MockSecResp(
                200,
                {
                    "items": [
                        {"fund_class_name": "K-USA-A(A)", "type": "subscription", "period": "08:30 - 15:30"},
                        {
                            "fund_class_name": "K-USA-A(A)",
                            "type": "redemption",
                            "period": "08:30 - 14:00",
                            "settlement_period": "T+4",
                        },
                    ]
                },
            )
        return MockSecResp(204)

    monkeypatch.setattr(service, "fetch_fund_profile", mock_fetch_fund_profile)
    monkeypatch.setattr(service.client, "get", mock_get)

    res = await service.fetch_fund_factsheet("K-USA-A(A).FUND", "mutual-fund")
    assert res.symbol == "K-USA-A(A).FUND"
    assert res.displaySymbol == "K-USA-A(A)"
    assert res.projId == "M0888_2560"
    assert res.fundName == "K USA Equity Fund-A(A)"
    assert res.fundNameTh == "กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A ชนิดสะสมมูลค่า"
    assert res.investmentPolicyDesc == "ลงทุนในหุ้นสหรัฐเติบโตสูง"
    assert res.managementStyle == "AN - Feeder Fund (Active Master)"
    assert res.pdfUrl == "https://sec.example/k-usa.pdf"
    assert res.amcUrl == "https://kasikornasset.example/k-usa"
    assert res.riskLevel == "RS6"
    assert res.benchmark == "S&P 500 Total Return Net"
    assert res.benchmarkRemark == "Converted to THB"
    assert res.dividendPolicy is None
    assert len(res.fees) == 1
    assert res.fees[0].ceilingRate == "2.14%"
    assert res.fees[0].actualRate == "1.605%"
    assert len(res.performance) == 1
    assert res.performance[0].value == 18.45
    assert res.statistics is not None
    assert res.statistics.maxDrawdown == -21.3
    assert res.statistics.sharpeRatio == 1.12
    assert res.assetAllocation[0].name == "Foreign Equity"
    assert res.topHoldings[0].name == "MS US Advantage"
    assert res.tradeConditions is not None
    assert res.tradeConditions.currency == "THB"
    assert res.tradeConditions.settlementPeriod == "T+4"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_factsheet_pvd_success(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    async def mock_fetch_pvd_proj_id(fund_name: str):
        return "V0001_2553"

    async def mock_fetch_pvd_policies(proj_id: str | None = None, fund_name: str | None = None):
        return {
            "PVDSP500": {
                "subPolicyId": "PVDSP500",
                "policyId": "P01",
                "uniqueSubPolicyId": "000125530001",
                "name": "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส",
                "fundName": "ไทยพาณิชย์ มาสเตอร์ฟันด์",
                "policyName": "ตราสารทุน",
                "aimcType": "EQUS",
                "aimcDescription": "US Equity",
                "riskLevel": "RS6",
                "objective": "ลงทุนในกองทุนเปิดไทยพาณิชย์หุ้นยูเอส",
                "inceptionDate": "2555-01-15",
                "foreignRiskLevel": "01",
            }
        }

    class MockSecResp:
        def __init__(self, status_code: int, payload=None):
            self.status_code = status_code
            self._payload = payload
            self.text = "" if status_code == 204 else "[]"

        def raise_for_status(self):
            pass

        def json(self):
            return self._payload

    async def mock_get(url, *args, **kwargs):
        if url.endswith("/return"):
            return MockSecResp(
                200,
                [{"unique_sub_policy_id": "000125530001", "seq": 12, "return_year": "YTD", "return_rate": 14.2}],
            )
        if url.endswith("/trailreturn"):
            return MockSecResp(
                200,
                [{"unique_sub_policy_id": "000125530001", "seq": 1, "return_year": "1Y", "return_rate": 22.8}],
            )
        if url.endswith("/fee"):
            return MockSecResp(
                200,
                [
                    {"unique_sub_policy_id": "000125530001", "seq": 1, "fee_type_desc": "ManagementFee", "fee_rate": 0.45},
                    {"unique_sub_policy_id": "000125530001", "seq": 2, "fee_type_desc": "TotalFeeMax", "fee_rate": 0.85},
                ],
            )
        if url.endswith("/statistics"):
            return MockSecResp(
                200,
                [
                    {
                        "unique_sub_policy_id": "000125530001",
                        "period": "2026-09-30",
                        "max_drawdown": -15.4,
                        "sharpe_ratio": 1.35,
                        "yeild_to_maturity": 3.2,
                    }
                ],
            )
        if url.endswith("/top5/assettype"):
            return MockSecResp(
                200,
                [
                    {
                        "unique_sub_policy_id": "000125530001",
                        "asset_allocation_seq": 1,
                        "assetliab_name_th": "หน่วยลงทุน",
                        "asset_ratio": 98.5,
                    }
                ],
            )
        if url.endswith("/top5/securities"):
            return MockSecResp(
                200,
                [
                    {
                        "unique_sub_policy_id": "000125530001",
                        "secur_seq": 1,
                        "secur_name": "SCBS&P500",
                        "secur_invest_size": 98.5,
                        "secur_isin_code": "TH000100001",
                    }
                ],
            )
        return MockSecResp(204)

    monkeypatch.setattr(service, "fetch_pvd_proj_id", mock_fetch_pvd_proj_id)
    monkeypatch.setattr(service, "fetch_pvd_policies", mock_fetch_pvd_policies)
    monkeypatch.setattr(service.client, "get", mock_get)

    res = await service.fetch_fund_factsheet("PVDSP500", "provident-fund", "ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert res.symbol == "PVDSP500"
    assert res.assetType == "provident-fund"
    assert res.projId == "V0001_2553"
    assert res.fundNameTh == "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส"
    assert res.amcName == "ไทยพาณิชย์ มาสเตอร์ฟันด์"
    assert res.riskLevel == "RS6"
    assert res.fxHedgingPolicy == "Foreign Investment Only"
    assert len(res.fees) == 2
    assert res.fees[0].actualRate == "0.45%"
    assert res.fees[1].ceilingRate == "0.85%"
    assert len(res.performance) == 2
    assert res.statistics is not None
    assert res.statistics.yieldToMaturity == 3.2
    assert res.assetAllocation[0].name == "หน่วยลงทุน"
    assert res.topHoldings[0].name == "SCBS&P500"
    assert res.topHoldings[0].isin == "TH000100001"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_factsheet_pvd_fallback_when_offline(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    async def mock_fetch_pvd_proj_id(fund_name: str):
        return None

    monkeypatch.setattr(service, "fetch_pvd_proj_id", mock_fetch_pvd_proj_id)

    res = await service.fetch_fund_factsheet("PVDSP500", "provident-fund")
    assert res.symbol == "PVDSP500"
    assert res.riskLevel == "RS6"
    assert res.aimcType == "US Equity"
    assert res.fundNameTh == "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_fund_factsheet_pvd_selects_latest_period_and_prevents_sibling_leakage(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    class MockSecResp:
        def __init__(self, status_code: int, payload=None):
            self.status_code = status_code
            self._payload = payload
            self.text = "" if status_code == 204 else "[]"

        def raise_for_status(self):
            pass

        def json(self):
            return self._payload

    async def mock_fetch_pvd_proj_id(fund_name: str):
        return "V0001_2553"

    async def mock_get(url, *args, **kwargs):
        if url.endswith("/policy"):
            return MockSecResp(
                200,
                [
                    {
                        "proj_id": "V0001_2553",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "unique_sub_policy_id": "000125530022",
                        "sub_policy_id": "PVDNDQ",
                        "sub_policy_name": "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส เอ็นดีคิว",
                        "sub_policy_start_date": "2023-07-01",
                        "sub_policy_inception_date": "2023-07-21",
                        "sub_policy_end_date": "-",
                        "risk_level": "RS6",
                        "last_upd_date": "2026-06-30T00:00:00",
                    },
                    {
                        "proj_id": "V0001_2553",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "unique_sub_policy_id": "000125530023",
                        "sub_policy_id": "PVDNDQ",
                        "sub_policy_name": "ตราสารทุน ",
                        "sub_policy_start_date": "-",
                        "sub_policy_inception_date": "-",
                        "sub_policy_end_date": "-",
                        "risk_level": "RS6",
                        "last_upd_date": "2023-07-01T00:00:00",
                    },
                    {
                        "proj_id": "V0001_2553",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "unique_sub_policy_id": "000125530034",
                        "sub_policy_id": "PVDAXJ",
                        "sub_policy_name": "นโยบายดัชนีหุ้น Asia ex Japan",
                        "sub_policy_start_date": "2024-01-01",
                        "sub_policy_inception_date": "2024-01-15",
                        "sub_policy_end_date": "-",
                        "risk_level": "RS6",
                        "last_upd_date": "2026-06-30T00:00:00",
                    },
                ],
            )
        if url.endswith("/top5/assettype"):
            return MockSecResp(
                200,
                [
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2024-12-31",
                        "asset_allocation_seq": 1,
                        "assetliab_name_th": "หน่วยลงทุนของกองทุนตราสารทุน",
                        "asset_ratio": 95.10,
                    },
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2026-06-30",
                        "asset_allocation_seq": 1,
                        "assetliab_name_th": "หน่วยลงทุนของกองทุนตราสารทุน",
                        "asset_ratio": 96.04,
                    },
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2026-06-30",
                        "asset_allocation_seq": 2,
                        "assetliab_name_th": "เงินฝากธนาคารประเภทออมทรัพย์",
                        "asset_ratio": 0.91,
                    },
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2026-06-30",
                        "asset_allocation_seq": 3,
                        "assetliab_name_th": "เงินฝากธนาคารประเภทออมทรัพย์",
                        "asset_ratio": 0.91,
                    },
                ],
            )
        if url.endswith("/top5/securities"):
            return MockSecResp(
                200,
                [
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2024-12-31",
                        "secur_seq": 1,
                        "secur_name": "SCBNDQ(A)",
                        "secur_invest_size": 95.10,
                    },
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2026-06-30",
                        "secur_seq": 1,
                        "secur_name": "SCBNDQ(A)",
                        "secur_invest_size": 96.04,
                    },
                    {
                        "unique_sub_policy_id": "000125530022",
                        "policy_id": "01",
                        "policy_name": "ตราสารทุน",
                        "period": "2026-06-30",
                        "secur_seq": 2,
                        "secur_name": None,
                        "secur_invest_size": None,
                    },
                ],
            )
        return MockSecResp(204)

    monkeypatch.setattr(service, "fetch_pvd_proj_id", mock_fetch_pvd_proj_id)
    monkeypatch.setattr(service.client, "get", mock_get)

    ndq_fs = await service.fetch_fund_factsheet("PVDNDQ", "provident-fund", "ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert ndq_fs.fundName == "นโยบายกองทุนรวมต่างประเทศ หุ้นยูเอส เอ็นดีคิว"
    assert ndq_fs.asOfDate == "2026-06-30"
    assert [(a.name, a.ratio) for a in ndq_fs.assetAllocation] == [
        ("หน่วยลงทุนของกองทุนตราสารทุน", 96.04),
        ("เงินฝากธนาคารประเภทออมทรัพย์", 0.91),
    ]
    assert [(h.name, h.ratio) for h in ndq_fs.topHoldings] == [("SCBNDQ(A)", 96.04)]

    # Sibling policy under the same policy_id="01" with no assettype/securities rows must stay empty.
    axj_fs = await service.fetch_fund_factsheet("PVDAXJ", "provident-fund", "ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert axj_fs.assetAllocation == []
    assert axj_fs.topHoldings == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_resolve_fund_amc_caches_pvd_and_mutual_fund_unique_id(monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()
    svc = NavService()
    monkeypatch.setitem(svc.headers, "Ocp-Apim-Subscription-Key", "test-key")

    class MockPostResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {
                    "proj_id": "V0001_2553",
                    "proj_name_th": "ไทยพาณิชย์ มาสเตอร์ฟันด์",
                    "fund_status": "RG",
                    "unique_id": "C0000000239",
                }
            ]

    class MockPolicyResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return [
                {
                    "sub_policy_id": "PVDSP500",
                    "sub_policy_name": "นโยบายหุ้นยูเอส",
                }
            ]

    async def mock_post(url, *args, **kwargs):
        return MockPostResponse()

    async def mock_get(url, *args, **kwargs):
        return MockPolicyResponse()

    monkeypatch.setattr(svc.client, "post", mock_post)
    monkeypatch.setattr(svc.client, "get", mock_get)

    # Resolving PVD fund populates amcId on policies and symbol->AMC cache
    policies = await svc.fetch_pvd_policies(fund_name="ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert policies["PVDSP500"]["amcId"] == "C0000000239"
    assert ttl_cache.get("sec_pvd_symbol_amc_PVDSP500") == "C0000000239"

    # resolve_fund_amc returns cached AMC ID with fund_name or by symbol
    amc_id, hint = await svc.resolve_fund_amc("PVDSP500", "provident-fund", "ไทยพาณิชย์ มาสเตอร์ฟันด์")
    assert amc_id == "C0000000239"
    assert hint == "ไทยพาณิชย์ มาสเตอร์ฟันด์"

    amc_id_by_sym, _ = await svc.resolve_fund_amc("PVDSP500", "provident-fund")
    assert amc_id_by_sym == "C0000000239"

    # Mutual fund resolution via fetch_fund_profile
    async def mock_fetch_profile(clean_symbol: str, sym_upper: str):
        return {
            "proj_id": "M0159_2555",
            "unique_id": "C0000000021",
            "comp_name_en": "KASIKORN ASSET MANAGEMENT COMPANY LIMITED",
        }

    monkeypatch.setattr(svc, "fetch_fund_profile", mock_fetch_profile)
    mf_amc_id, mf_name = await svc.resolve_fund_amc("K-USA-A(A).FUND", "mutual-fund")
    assert mf_amc_id == "C0000000021"
    assert mf_name == "KASIKORN ASSET MANAGEMENT COMPANY LIMITED"

