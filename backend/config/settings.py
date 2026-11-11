import hashlib
from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_ENV_FILE = ROOT_DIR / ".env"

BLOCKED_KEY_HASHES: set[str] = {
    # SHA-256 hashes of retired / compromised keys
    "497ffb45f54901336b84e6d9a3ef1d6b063c94db66e790adcec6c2811518da3d",
    "83bfda08b5ebeb7128efa25b8739774ba251e1e3bba12e3344030544c5205f9e",
}

INSECURE_NAMED_KEYS: set[str] = {
    "dev_secret_key_change_in_prod",
    "your_sec_subscription_key_here",
    "changeme",
}


class Settings(BaseSettings):
    environment: str = "development"
    backend_api_key: str = "dev_secret_key_change_in_prod"
    allowed_origins: list[str] = ["http://localhost:4200"]
    sec_subscription_key: str = ""
    google_spreadsheet_id: str = "sample_spreadsheet_id"
    google_pvd_spreadsheet_id: str = "sample_pvd_spreadsheet_id"
    google_service_account_json: str = ""
    sec_pvd_proj_id: str = "V0001_2553"
    sec_pvd_base_url: str = "https://api.sec.or.th/v1/pvd"

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.environment.lower() == "production":
            key_hash = hashlib.sha256(self.backend_api_key.encode()).hexdigest()
            if (
                not self.backend_api_key
                or self.backend_api_key in INSECURE_NAMED_KEYS
                or key_hash in BLOCKED_KEY_HASHES
            ):
                raise ValueError(
                    "CRITICAL: BACKEND_API_KEY must be securely configured via environment variables in production."
                )
            if len(self.backend_api_key) < 32:
                raise ValueError("CRITICAL: BACKEND_API_KEY must be at least 32 characters in production.")
            if not self.google_spreadsheet_id or self.google_spreadsheet_id in ("sample_spreadsheet_id", ""):
                raise ValueError(
                    "CRITICAL: GOOGLE_SPREADSHEET_ID must be securely configured via environment variables in production."
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
