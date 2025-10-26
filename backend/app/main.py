import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, wallet, claims, return_points, simulate, healthz
from .routers import subscriptions, collection_slots, collections, admin
from .services.db import engine


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gc")


def create_app() -> FastAPI:
    app = FastAPI(title="GreenCredits API (MVP)", version="0.1.0")

    # CORS for dev frontend and future host
    app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",      # ← add this
        "http://127.0.0.1:5173",      # ← optional
        "http://127.0.0.1:5174",      # ← optional
        "http://localhost:3000",      # Next.js dev (if you use it)
    ],
    allow_credentials=True,
    allow_methods=["*"],              # includes OPTIONS
    allow_headers=["*"],              # includes Authorization
    expose_headers=["*"],             # optional, but fine
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

    return app


app = create_app()


