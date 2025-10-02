from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Subscription


async def get_me(session: AsyncSession, user_id: int) -> Subscription | None:
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.id.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first()


async def activate(session: AsyncSession, user_id: int) -> Subscription:
    sub = await get_me(session, user_id)
    if sub is None:
        sub = Subscription(user_id=user_id, status="active", plan_code="monthly_basic", start_date=date.today())
        session.add(sub)
    else:
        sub.status = "active"
        sub.start_date = sub.start_date or date.today()
        sub.end_date = None
    await session.commit()
    await session.refresh(sub)
    return sub


async def cancel(session: AsyncSession, user_id: int) -> Subscription:
    sub = await get_me(session, user_id)
    if sub is None:
        sub = Subscription(user_id=user_id, status="inactive")
        session.add(sub)
    else:
        sub.status = "canceled"
        sub.end_date = date.today()
    await session.commit()
    await session.refresh(sub)
    return sub



