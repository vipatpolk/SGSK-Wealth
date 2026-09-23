from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    backend_api_key: str = "dev_secret_key_change_in_prod"
    allowed_origins: list[str] = ["http://localhost:4200"]
    sec_subscription_key: str = "your_sec_subscription_key_here"
    google_spreadsheet_id: str = "your_google_spreadsheet_id_here"
    google_pvd_spreadsheet_id: str = "your_google_pvd_spreadsheet_id_here"
    google_service_account_json: str = ""
    sec_pvd_proj_id: str = "V0001_2553"
    sec_pvd_base_url: str = "https://api.sec.or.th/v1/pvd"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
