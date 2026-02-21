import logging
import os  # Add this import
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from .routers import auth, wallet, claims, notifications, return_points, simulate, healthz
from .routers import subscriptions, collection_slots, collections, admin, users
from .routers import payments, stripe_webhooks, drivers, uploads
from .services.db import engine, SessionLocal
from .config import get_settings
from .routers import dev_utils
from .services.seed import seed_return_points
from .events.notification_handlers import register_notification_handlers


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gc")


def create_app() -> FastAPI:
    app = FastAPI(title="GreenCredits API (MVP)", version="0.1.0")

    # CORS - read from environment variable or use defaults
    cors_origins_str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://green-credits-drs.vercel.app"
    )
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]
    
    logger.info(f"CORS origins configured: {cors_origins}")  # Log for debugging
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Local file uploads (MVP): serve uploaded files from /uploads/*
    uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
    app.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
    app.include_router(collection_slots.router, prefix="/collection-slots", tags=["CollectionSlots"])
    app.include_router(collections.router, prefix="/collections", tags=["Collections"])
    app.include_router(claims.router, prefix="/claims", tags=["Claims"])
    app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
    app.include_router(return_points.router, prefix="/return-points", tags=["ReturnPoints"])
    app.include_router(simulate.router, prefix="/simulate", tags=["Simulator"])
    app.include_router(healthz.router, tags=["Health"])  # /health and /healthz
    app.include_router(admin.router)  # admin-only
    app.include_router(payments.router)
    app.include_router(stripe_webhooks.router)
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
    app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])

    register_notification_handlers()

    @app.get("/")
    async def root():
        return {"name": "GreenCredits API", "version": "0.1.0"}

    @app.on_event("startup")
    async def on_startup():
        logger.info("App started")
        if engine is not None:
            try:
                async with engine.begin():
                    pass
                logger.info("Connected to DB")
            except Exception as exc:  # pragma: no cover - best-effort log
                logger.warning("DB not reachable at startup: %s", exc)

        # Seed return points (best-effort; non-fatal on failure)
        if SessionLocal is not None:
            try:
                async with SessionLocal() as session:
                    await seed_return_points(session)
                logger.info("Seed done")
            except Exception as exc:  # pragma: no cover
                logger.warning("Seed failed: %s", exc)

    # Optional dev utilities
    settings = get_settings()
    if settings.mock_auth:
        app.include_router(dev_utils.router)

    return app


app = create_app()

settings = get_settings()
logger.info("Stripe secret present? %s", bool(getattr(settings, "stripe_secret_key", None)))
logger.info("Raw env STRIPE_SECRET_KEY present? %s", bool(__import__("os").environ.get("STRIPE_SECRET_KEY")))



