from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings


# --- Base class for models ---
class Base(DeclarativeBase):
    pass


# --- Load settings ---
_settings = get_settings()

# --- Resolve database URL ---
if _settings.database_url:
    resolved_database_url = _settings.database_url
elif _settings.use_sqlite_dev:
    resolved_database_url = "sqlite:///./dev.db"
else:
    raise RuntimeError("Database not configured. Set DATABASE_URL or USE_SQLITE_DEV=true.")


# --- Create SYNC engine (psycopg2-compatible) ---
engine = create_engine(resolved_database_url, echo=False, pool_pre_ping=True)

# --- Session factory ---
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# --- Dependency for FastAPI routes ---
def get_db() -> Generator:
    """Yield a database session and ensure it closes properly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
