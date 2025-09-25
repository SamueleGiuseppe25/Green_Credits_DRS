from fastapi import APIRouter, HTTPException
from sqlalchemy import text  # <-- IMPORTANT: wrap raw SQL with text()
from app.services.db import engine, SessionLocal  # adjust import path if different
from app.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/healthz")
async def healthz():
    # If DB is not configured
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
