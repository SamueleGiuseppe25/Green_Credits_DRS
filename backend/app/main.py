from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, wallet, claims, return_points, simulate, healthz


def create_app() -> FastAPI:
    app = FastAPI(title="GreenCredits API (MVP)", version="0.1.0")

    # CORS for dev frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
    app.include_router(claims.router, prefix="/claims", tags=["Claims"])
    app.include_router(return_points.router, prefix="/return-points", tags=["ReturnPoints"])
    app.include_router(simulate.router, prefix="/simulate", tags=["Simulator"])
    app.include_router(healthz.router, tags=["Health"])  # /healthz

    @app.get("/")
    async def root():
        return {"name": "GreenCredits API", "version": "0.1.0"}

    return app


app = create_app()


