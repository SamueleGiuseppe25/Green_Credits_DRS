from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # <-- tolerate unrelated env vars (DEBUG, PORT, etc.)
    )

    app_name: str = "GreenCredits API (MVP)"
    version: str = "0.1.0"

    database_url: str | None = Field(
        default=None,
        description="SQLAlchemy URL. Use postgresql+asyncpg://user:pass@host:5432/db",
    )
    use_sqlite_dev: bool = Field(
        default=False,
        description="Opt-in dev-only SQLite fallback when DATABASE_URL is not set.",
    )

    # JWT / Auth
    secret_key: str = Field(default="dev-secret", description="JWT signing secret")
    jwt_algorithm: str = Field(default="HS256")
    access_token_minutes: int = Field(default=60)

    # Dev switches
    mock_auth: bool = Field(
        default=False,
        description=(
            "If true, /auth/login accepts any email/password and /auth/me returns a fixed user for dev"
        ),
    )

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
