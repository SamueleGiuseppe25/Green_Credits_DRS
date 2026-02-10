from datetime import time as time_cls
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select, and_

from ..models import CollectionSlot, ReturnPoint, Collection
from datetime import datetime

SERVICE_START = time_cls(8, 0)
SERVICE_END = time_cls(20, 0)


def _validate_service_time(value: time_cls) -> None:
    if value < SERVICE_START or value > SERVICE_END:
        raise ValueError("You can only book collections between 08:00 and 20:00.")


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
    _validate_service_time(start_time)
    _validate_service_time(end_time)
    preferred_return_point_id = slot.get("preferredReturnPointId")
    frequency = (slot.get("frequency") or "weekly").lower()
    if frequency not in {"weekly", "fortnightly", "every_2_weeks", "monthly"}:
        raise ValueError("Invalid frequency")
    if preferred_return_point_id is not None:
        # Validate that the return point exists
        rp = await session.scalar(sa_select(ReturnPoint.id).where(ReturnPoint.id == int(preferred_return_point_id)))
        if rp is None:
            raise ValueError("preferredReturnPointId does not reference an existing return point")

    # Block enabling schedule if user has any upcoming one-off collection
    now = datetime.utcnow()
    upcoming = await session.scalar(
        sa_select(sa_select(Collection.id).where(
            and_(Collection.user_id == user_id, Collection.status != "canceled", Collection.scheduled_at >= now)
        ).exists())
    )
    if upcoming:
        raise ValueError("You already have a collection scheduled. Cancel it before enabling a recurring pickup.")

    current = await get_me(session, user_id)
    if current is None:
        current = CollectionSlot(
            user_id=user_id,
            weekday=weekday,
            start_time=start_time,
            end_time=end_time,
            preferred_return_point_id=preferred_return_point_id,
            frequency=frequency if frequency != "every_2_weeks" else "fortnightly",
        )
        session.add(current)
    else:
        current.weekday = weekday
        current.start_time = start_time
        current.end_time = end_time
        current.preferred_return_point_id = preferred_return_point_id
        current.frequency = frequency if frequency != "every_2_weeks" else "fortnightly"
    await session.commit()
    await session.refresh(current)
    return current


async def delete_me(session: AsyncSession, user_id: int) -> None:
    current = await get_me(session, user_id)
    if current is None:
        return
    await session.delete(current)
    await session.commit()


