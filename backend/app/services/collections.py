from datetime import datetime, timedelta, time as time_cls
from typing import Tuple, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection, CollectionSlot, Driver, WalletTransaction
from .wallet import credit_wallet_for_collection

SERVICE_START = time_cls(8, 0)
SERVICE_END = time_cls(20, 0)


def _validate_scheduled_at(scheduled_at: datetime) -> None:
    now = datetime.utcnow()
    if scheduled_at < now:
        raise ValueError("Date must be today or later.")
    scheduled_time = scheduled_at.time()
    if scheduled_time < SERVICE_START or scheduled_time > SERVICE_END:
        raise ValueError("You can only book collections between 08:00 and 20:00.")


async def create(
    session: AsyncSession,
    user_id: int,
    scheduled_at: datetime,
    return_point_id: int,
    bag_count: int | None,
    notes: str | None,
) -> Collection:
    _validate_scheduled_at(scheduled_at)
    # Block if user has an active recurring slot
    has_slot = await session.scalar(select(select(CollectionSlot.id).where(CollectionSlot.user_id == user_id).exists()))
    if has_slot:
        raise ValueError("You already have a recurring pickup scheduled. Disable it before creating a one-off collection.")
    # Enforce 1 pickup per ISO week per user (exclude archived/canceled)
    year, week, _ = scheduled_at.isocalendar()
    # Compute week start (Monday) and end (Sunday)
    # Find Monday of that week
    monday = scheduled_at - timedelta(days=scheduled_at.weekday())
    week_start = datetime(monday.year, monday.month, monday.day, 0, 0, 0)
    week_end = week_start + timedelta(days=7)

    conflict_stmt = (
        select(func.count())
        .select_from(Collection)
        .where(
            and_(
                Collection.user_id == user_id,
                Collection.is_archived == False,  # noqa: E712
                Collection.status != "canceled",
                Collection.scheduled_at >= week_start,
                Collection.scheduled_at < week_end,
            )
        )
    )
    conflicts = await session.scalar(conflict_stmt)
    if int(conflicts or 0) > 0:
        raise ValueError("Weekly pickup limit reached. You can only have one pickup per week.")

    col = Collection(
        user_id=user_id,
        scheduled_at=scheduled_at,
        return_point_id=return_point_id,
        bag_count=bag_count or 1,
        notes=notes,
        status="scheduled",
    )
    session.add(col)
    await session.commit()
    await session.refresh(col)
    return col


async def list_me(
    session: AsyncSession, user_id: int, status: str | None, page: int, page_size: int
) -> Tuple[List[Collection], int]:
    base = select(Collection).where(Collection.user_id == user_id, Collection.is_archived == False)  # noqa: E712
    if status:
        base = base.where(Collection.status == status)
    total = await session.scalar(select(func.count()).select_from(base.subquery()))
    rows = (
        await session.execute(base.order_by(Collection.scheduled_at.desc()).offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return rows, int(total or 0)


async def cancel(session: AsyncSession, user_id: int, id_: int) -> Collection | None:
    stmt = select(Collection).where(Collection.id == id_, Collection.user_id == user_id).limit(1)
    col = (await session.execute(stmt)).scalars().first()
    if col is None:
        return None
    col.status = "canceled"
    await session.commit()
    await session.refresh(col)
    return col



ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "scheduled": {"assigned", "canceled"},
    "assigned": {"collected", "canceled"},
    "collected": {"processed"},
    "processed": set(),
    "canceled": set(),
}

VALID_STATUSES = {"scheduled", "assigned", "collected", "processed", "canceled"}


async def admin_transition_status(session: AsyncSession, id_: int, new_status: str) -> tuple[Collection | None, str | None]:
    stmt = select(Collection).where(Collection.id == id_).limit(1)
    col = (await session.execute(stmt)).scalars().first()
    if col is None:
        return None, None
    current = col.status
    if new_status not in VALID_STATUSES:
        return col, "Invalid status"
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        return col, f"Invalid transition: {current} -> {new_status}"
    col.status = new_status

    # Auto-credit wallet when collection is processed
    if new_status == "processed":
        # Idempotency: check if credit already exists for this collection
        existing_credit = await session.scalar(
            select(func.count())
            .select_from(WalletTransaction)
            .where(
                WalletTransaction.user_id == col.user_id,
                WalletTransaction.kind == "collection_credit",
                WalletTransaction.note.like(f"%collection #{col.id}%"),
            )
        )
        if int(existing_credit or 0) == 0:
            amount_cents = col.bag_count * 500  # 5 EUR per bag
            await credit_wallet_for_collection(
                session, col.user_id, col.id, amount_cents
            )

    await session.commit()
    await session.refresh(col)
    return col, None


async def assign_driver(session: AsyncSession, collection_id: int, driver_id: int) -> tuple[Collection | None, str | None]:
    col = (await session.execute(select(Collection).where(Collection.id == collection_id).limit(1))).scalars().first()
    if col is None:
        return None, None

    driver = (await session.execute(select(Driver).where(Driver.id == driver_id).limit(1))).scalars().first()
    if driver is None:
        return col, "Driver not found"

    col.driver_id = driver.id
    if col.status == "scheduled":
        col.status = "assigned"
    await session.commit()
    await session.refresh(col)
    return col, None


async def delete_canceled(session: AsyncSession, user_id: int, id_: int) -> tuple[bool, str | None]:
    """
    Soft delete (archive) a collection if it belongs to the user and is already canceled.
    Returns (True, None) on success; (False, reason) otherwise.
    """
    stmt = select(Collection).where(Collection.id == id_, Collection.user_id == user_id).limit(1)
    col = (await session.execute(stmt)).scalars().first()
    if col is None:
        return False, "not_found"
    if col.status != "canceled":
        return False, "not_canceled"
    col.is_archived = True
    await session.commit()
    await session.commit()
    return True, None

