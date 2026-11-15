from fastapi import APIRouter, Depends

from models.factsheet import FundFactsheetResponse
from models.requests import NavRequest
from services.nav_service import NavService
from utils.auth import verify_api_key

router = APIRouter(prefix="/nav", tags=["nav"], dependencies=[Depends(verify_api_key)])
service = NavService()


@router.post("/fetch")
async def fetch_navs(req: NavRequest):
    return await service.fetch_fund_navs(req.symbols)


@router.get("/factsheet", response_model=FundFactsheetResponse)
async def get_fund_factsheet(
    symbol: str,
    asset_type: str = "mutual-fund",
    fund_name: str | None = None,
):
    return await service.fetch_fund_factsheet(symbol, asset_type, fund_name)
