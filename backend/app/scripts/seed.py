import asyncio
import os

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.db import engine, SessionLocal
from app.models import User, ReturnPoint


async def seed() -> None:
    if engine is None or SessionLocal is None:
        print("[seed] Database not configured. Skipping seeding (ok in dev).")
        return

    async with engine.begin() as conn:
        # ensure tables exist (for dev convenience). In prod use alembic migrations.
        await conn.run_sync(User.metadata.create_all)
        await conn.run_sync(ReturnPoint.metadata.create_all)

    async with SessionLocal() as session:  # type: AsyncSession
        # Seed demo user if not exists
        stmt_user = (
            insert(User)
            .prefix_with("OR IGNORE" if "sqlite" in engine.url.drivername else "")
            .values(email="demo@example.com", full_name="Demo User", password_hash="x")
        )
        await session.execute(stmt_user)

        # Seed a couple of return points (ignore duplicates on sqlite)
        stmt_rp = insert(ReturnPoint).values(
            [
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
            ]
        )
        if "sqlite" in engine.url.drivername:
            stmt_rp = stmt_rp.prefix_with("OR IGNORE")
        await session.execute(stmt_rp)

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())


