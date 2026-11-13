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
        return {"proj_id": "M0123_2560", "proj_name_en": "K-CHANGE MUTUAL FUND", "fund_class_name": "main"}

    async def mock_fetch_fund_nav_data(symbol: str, clean_symbol: str, sym_upper: str, fund: dict):
        return {
            "originalSymbol": symbol,
            "data": PriceData(symbol=symbol, name=fund["name"], price=15.75, currency="THB"),
        }

    monkeypatch.setattr(service, "fetch_fund_profile", mock_fetch_fund_profile)
    monkeypatch.setattr(service, "fetch_fund_nav_data", mock_fetch_fund_nav_data)

    res = await service.fetch_single_fund_nav("K-CHANGE.FUND")
    assert res["originalSymbol"] == "K-CHANGE.FUND"
    assert res["data"].price == 15.75
    assert res["data"].name == "K-CHANGE MUTUAL FUND"
    assert res["data"].currency == "THB"

    res_bk = await service.fetch_single_fund_nav("K-CHANGE.BKFUND")
    assert res_bk["originalSymbol"] == "K-CHANGE.BKFUND"
    assert res_bk["data"].price == 15.75


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

