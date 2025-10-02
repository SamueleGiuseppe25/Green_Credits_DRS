from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import CollectionSlot


async def get_me(session: AsyncSession, user_id: int) -> CollectionSlot | None:
    stmt = select(CollectionSlot).where(CollectionSlot.user_id == user_id).limit(1)
    return (await session.execute(stmt)).scalars().first()


async def upsert(
    session: AsyncSession,
    user_id: int,
    slot: dict,
) -> CollectionSlot:
    current = await get_me(session, user_id)
    if current is None:
        current = CollectionSlot(
            user_id=user_id,
            weekday=slot["weekday"],
            start_time=slot["startTime"],
            end_time=slot["endTime"],
            preferred_return_point_id=slot.get("preferredReturnPointId"),
        )
        session.add(current)
    else:
        current.weekday = slot["weekday"]
        current.start_time = slot["startTime"]
        current.end_time = slot["endTime"]
        current.preferred_return_point_id = slot.get("preferredReturnPointId")
    await session.commit()
    await session.refresh(current)
    return current



