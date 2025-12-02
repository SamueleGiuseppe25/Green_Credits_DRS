from datetime import datetime
from typing import Tuple, List

from sqlalchemy import select, func, and_, between
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection, CollectionSlot
from datetime import datetime, timedelta


async def create(
    session: AsyncSession,
    user_id: int,
    scheduled_at: datetime,
    return_point_id: int,
    bag_count: int | None,
    notes: str | None,
) -> Collection:
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
    "scheduled": {"collected", "canceled"},
    "collected": {"processed"},
    "processed": set(),
    "canceled": set(),
}


async def admin_transition_status(session: AsyncSession, id_: int, new_status: str) -> tuple[Collection | None, str | None]:
    stmt = select(Collection).where(Collection.id == id_).limit(1)
    col = (await session.execute(stmt)).scalars().first()
    if col is None:
        return None, None
    current = col.status
    if new_status not in {"scheduled", "collected", "processed", "canceled"}:
        return col, "Invalid status"
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        return col, f"Invalid transition: {current} -> {new_status}"
    col.status = new_status
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

