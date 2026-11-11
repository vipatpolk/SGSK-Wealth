from fastapi import APIRouter, Response

from services.icon_service import IconService

router = APIRouter(prefix="/icon", tags=["icon"])
service = IconService()


@router.get("/meta/{symbol:path}")
async def get_icon_metadata(symbol: str, asset_type: str = ""):
    """Returns metadata for the given ticker symbol icon."""
    return service.get_symbol_metadata(symbol, asset_type)


@router.get("")
async def get_icon_by_query(symbol: str = "", asset_type: str = ""):
    """Returns icon image or SVG when symbol is passed as a query parameter."""
    content, media_type = await service.get_symbol_icon(symbol, asset_type)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )


@router.get("/{symbol:path}")
async def get_icon_by_path(symbol: str, asset_type: str = ""):
    """Returns icon image or SVG when symbol is passed as a path parameter."""
    content, media_type = await service.get_symbol_icon(symbol, asset_type)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )
