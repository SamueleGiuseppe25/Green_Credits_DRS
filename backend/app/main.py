import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, wallet, claims, return_points, simulate, healthz
from .routers import subscriptions, collection_slots, collections, admin
from .services.db import engine, SessionLocal
from .config import get_settings
from .routers import dev_utils
from .services.seed import seed_demo_wallet_transactions


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gc")


def create_app() -> FastAPI:
    app = FastAPI(title="GreenCredits API (MVP)", version="0.1.0")

    # CORS for dev frontend and future host
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev
            "http://localhost:3000",  # Next.js dev
            # "https://YOUR-PROD-FRONTEND-DOMAIN",  # add your production domain here
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
    app.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
    app.include_router(collection_slots.router, prefix="/collection-slots", tags=["CollectionSlots"])
    app.include_router(collections.router, prefix="/collections", tags=["Collections"])
    app.include_router(claims.router, prefix="/claims", tags=["Claims"])
    app.include_router(return_points.router, prefix="/return-points", tags=["ReturnPoints"])
    app.include_router(simulate.router, prefix="/simulate", tags=["Simulator"])
    app.include_router(healthz.router, tags=["Health"])  # /health and /healthz
    app.include_router(admin.router, prefix="/admin", tags=["Admin"])  # admin-only

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

        # Seed demo data (best-effort; non-fatal on failure)
        if SessionLocal is not None:
            try:
                async with SessionLocal() as session:
                    await seed_demo_wallet_transactions(session)
                logger.info("Demo wallet seed done")
            except Exception as exc:  # pragma: no cover
                logger.warning("Seed failed: %s", exc)

    # Optional dev utilities
    settings = get_settings()
    if settings.mock_auth:
        app.include_router(dev_utils.router)

    return app


app = create_app()


