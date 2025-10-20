#!/usr/bin/env python
import asyncio
import logging
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.services.db import engine, SessionLocal, Base
from app.models import User, ReturnPoint

DEMO_USER = {
    "email": "demo@example.com",
    "full_name": "Demo User",
    "password_hash": "x",
}

RETURN_POINTS = [
    {
        "external_id": "rp_001",
        "name": "SuperMart Dundrum RVM",
        "type": "RVM",
        "eircode": "D14 XXXX",
        "retailer": "SuperMart",
        "lat": 53.2891,
        "lng": -6.2387,
    },
    {
        "external_id": "rp_002",
        "name": "Corner Shop Manual Return",
        "type": "Manual",
        "eircode": "D02 YYYY",
        "retailer": "Corner Shop",
        "lat": 53.3438,
        "lng": -6.2546,
    },
    {
        "external_id": "rp_003",
        "name": "Grocer Tallaght RVM",
        "type": "RVM",
        "eircode": "D24 ZZZZ",
        "retailer": "Grocer",
        "lat": 53.2875,
        "lng": -6.3569,
    },
]


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gc")


async def seed() -> None:
    if engine is None or SessionLocal is None:
        logger.warning("[seed] Database not configured. Skipping seeding (ok in dev).")
        return

    # For dev convenience only — in prod rely on Alembic migrations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:  # type: AsyncSession
        is_sqlite = "sqlite" in engine.url.drivername
        is_postgres = "postgresql" in engine.url.drivername

        # --- demo user: idempotent on SQLite & Postgres ---
        logger.info("[seed] Seeding demo user")
        if is_postgres:
            stmt_user = pg_insert(User.__table__).values(**DEMO_USER).on_conflict_do_nothing(
                index_elements=["email"]
            )
        else:
            stmt_user = insert(User.__table__).values(**DEMO_USER)
            if is_sqlite:
                stmt_user = stmt_user.prefix_with("OR IGNORE")
        await session.execute(stmt_user)

        # --- return points: idempotent on both, keyed by external_id ---
        logger.info("[seed] Seeding return points")
        if is_postgres:
            stmt_rp = pg_insert(ReturnPoint.__table__).values(RETURN_POINTS).on_conflict_do_nothing(
                index_elements=["external_id"]
            )
        else:
            stmt_rp = insert(ReturnPoint.__table__).values(RETURN_POINTS)
            if is_sqlite:
                stmt_rp = stmt_rp.prefix_with("OR IGNORE")
        await session.execute(stmt_rp)

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
