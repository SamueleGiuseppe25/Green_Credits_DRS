from datetime import time as time_cls
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select

from ..models import CollectionSlot, ReturnPoint


async def get_me(session: AsyncSession, user_id: int) -> CollectionSlot | None:
    stmt = select(CollectionSlot).where(CollectionSlot.user_id == user_id).limit(1)
    return (await session.execute(stmt)).scalars().first()



async def upsert(
    session: AsyncSession,
    user_id: int,
    slot: dict,
) -> CollectionSlot:
    # Normalize/validate incoming fields
    weekday: int = int(slot["weekday"])
    if weekday < 0 or weekday > 6:
        raise ValueError("weekday must be between 0 and 6")

    # Accept "HH:MM" or "HH:MM:SS"
    def _parse_time(value: str) -> time_cls:
        if len(value) == 5:  # HH:MM
            value = f"{value}:00"
        return time_cls.fromisoformat(value)

    start_time = _parse_time(slot["startTime"])
    end_time = _parse_time(slot["endTime"])
    preferred_return_point_id = slot.get("preferredReturnPointId")
    if preferred_return_point_id is not None:
        # Validate that the return point exists
        rp = await session.scalar(sa_select(ReturnPoint.id).where(ReturnPoint.id == int(preferred_return_point_id)))
        if rp is None:
            raise ValueError("preferredReturnPointId does not reference an existing return point")

    current = await get_me(session, user_id)
    if current is None:
        current = CollectionSlot(
            user_id=user_id,
            weekday=weekday,
            start_time=start_time,
            end_time=end_time,
            preferred_return_point_id=preferred_return_point_id,
        )
        session.add(current)
    else:
        current.weekday = weekday
        current.start_time = start_time
        current.end_time = end_time
        current.preferred_return_point_id = preferred_return_point_id
    await session.commit()
    await session.refresh(current)
    return current



