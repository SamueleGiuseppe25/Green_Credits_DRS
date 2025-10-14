from functools import lru_cache
from typing import List
from pydantic import Field, AnyHttpUrl
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
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

    secret_key: str = Field(default="dev-secret", description="JWT signing secret")
    cors_origins: List[AnyHttpUrl] = Field(default=[])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
