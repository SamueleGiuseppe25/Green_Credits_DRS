from datetime import datetime
from typing import Tuple, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection


async def create(
    session: AsyncSession,
    user_id: int,
    scheduled_at: datetime,
    return_point_id: int,
    bag_count: int | None,
    notes: str | None,
) -> Collection:
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
    base = select(Collection).where(Collection.user_id == user_id)
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


