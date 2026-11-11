from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from config.settings import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    settings = get_settings()
    is_dev = settings.environment.lower() == "development"
    if not api_key or not (
        api_key == settings.backend_api_key or (is_dev and api_key == "dev_secret_key_change_in_prod")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key
