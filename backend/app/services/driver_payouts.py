from typing import List

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import DriverEarning, DriverPayout

EARNING_PER_BAG_CENTS = 50


async def create_earning(
    session: AsyncSession, driver_id: int, collection_id: int, bag_count: int
) -> DriverEarning:
    """
    Create (or return existing) one earning row per collection.
    Intended to be called inside the same transaction as the collection status update.
    """
    existing = await session.scalar(
        select(DriverEarning).where(DriverEarning.collection_id == collection_id).limit(1)
    )
    if existing is not None:
        return existing

    bags = int(bag_count or 1)
    amount_cents = bags * EARNING_PER_BAG_CENTS
    earning = DriverEarning(
        driver_id=int(driver_id),
        collection_id=int(collection_id),
        amount_cents=int(amount_cents),
    )
    session.add(earning)
    # flush so the row exists before the outer commit (and we get an id)
    await session.flush()
    return earning


async def get_driver_balance(session: AsyncSession, driver_id: int) -> int:
    earnings_sum_stmt = select(func.coalesce(func.sum(DriverEarning.amount_cents), 0)).where(
        DriverEarning.driver_id == driver_id
    )
    payouts_sum_stmt = select(func.coalesce(func.sum(DriverPayout.amount_cents), 0)).where(
        DriverPayout.driver_id == driver_id
    )
    earnings = await session.scalar(earnings_sum_stmt)
    payouts = await session.scalar(payouts_sum_stmt)
    return int(earnings or 0) - int(payouts or 0)


async def get_driver_earnings(
    session: AsyncSession, driver_id: int, limit: int = 50
) -> List[DriverEarning]:
    stmt = (
        select(DriverEarning)
        .where(DriverEarning.driver_id == driver_id)
        .order_by(desc(DriverEarning.created_at))
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_driver_payouts_list(
    session: AsyncSession, driver_id: int, limit: int = 50
) -> List[DriverPayout]:
    stmt = (
        select(DriverPayout)
        .where(DriverPayout.driver_id == driver_id)
        .order_by(desc(DriverPayout.created_at))
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars().all())


async def create_payout(
    session: AsyncSession, driver_id: int, amount_cents: int, note: str | None = None
) -> DriverPayout:
    amount = int(amount_cents or 0)
    if amount <= 0:
        raise ValueError("amountCents must be > 0")

    balance = await get_driver_balance(session, driver_id)
    if amount > balance:
        raise ValueError("amountCents exceeds current balance")

    payout = DriverPayout(driver_id=int(driver_id), amount_cents=amount, note=note)
    session.add(payout)
    await session.commit()
    await session.refresh(payout)
    return payout


async def list_all_payouts(session: AsyncSession, limit: int = 50) -> List[DriverPayout]:
    stmt = select(DriverPayout).order_by(desc(DriverPayout.created_at)).limit(limit)
    return list((await session.execute(stmt)).scalars().all())

