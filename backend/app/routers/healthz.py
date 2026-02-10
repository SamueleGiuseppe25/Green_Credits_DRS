from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from ..services.db import engine, SessionLocal
from ..config import get_settings

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/healthz")
async def healthz():
    settings = get_settings()
    # If DB is not configured (based on current settings/env)
    if not settings.database_url and not settings.use_sqlite_dev:
        return {"status": "ok", "db": "not_configured", "version": settings.version}
    if engine is None or SessionLocal is None:
        return {"status": "ok", "db": "not_configured", "version": settings.version}

    # DB configured: run a quick ping
    try:
        async with SessionLocal() as s:
            await s.execute(text("SELECT 1"))   # <-- wrap in text(...)
        return {"status": "ok", "db": "ok", "version": settings.version}
    except Exception as exc:
        # Return structured JSON so you can see the real cause when it fails
        raise HTTPException(
            status_code=500,
            detail={
                "code": "HEALTH_CHECK_FAILED",
                "message": str(exc),
                "version": settings.version,
            },
        )
