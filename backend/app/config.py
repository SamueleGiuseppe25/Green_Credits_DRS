from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        case_sensitive=False,
        extra="ignore",  # tolerate unrelated env vars (DEBUG, PORT, etc.)
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

    # Runtime
    debug: bool = Field(default=False)
    port: int = Field(default=8000)

    # JWT / Auth
    jwt_secret_key: str = Field(default="dev-secret", description="JWT signing secret")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)

    # Dev switches
    mock_auth: bool = Field(
        default=False,
        description=(
            "If true, /auth/login accepts any email/password and /auth/me returns a fixed user for dev"
        ),
    )

    # Stripe (TEST mode)
    stripe_secret_key: str | None = Field(default=None, description="Stripe secret key (STRIPE_SECRET_KEY)")
    stripe_webhook_secret: str | None = Field(default=None, description="Stripe webhook signing secret (STRIPE_WEBHOOK_SECRET)")
    frontend_url: str = Field(default="http://localhost:5173", description="Frontend URL (FRONTEND_URL)")
    stripe_price_id_weekly: str | None = Field(default=None, description="Stripe Price ID for weekly plan (STRIPE_PRICE_ID_WEEKLY)")
    stripe_price_id_monthly: str | None = Field(default=None, description="Stripe Price ID for monthly plan (STRIPE_PRICE_ID_MONTHLY)")
    stripe_price_id_yearly: str | None = Field(default=None, description="Stripe Price ID for yearly plan (STRIPE_PRICE_ID_YEARLY)")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
