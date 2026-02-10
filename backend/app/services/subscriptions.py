from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Subscription

PLAN_DURATIONS = {"weekly": 7, "monthly": 30, "yearly": 365}


async def get_me(session: AsyncSession, user_id: int) -> Subscription | None:
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.id.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first()


async def is_subscription_active(session: AsyncSession, user_id: int) -> bool:
    sub = await get_me(session, user_id)
    if sub is None:
        return False

    if sub.status not in {"active", "canceled"}:
        return False

    # Grandfather clause for existing rows created before period tracking existed.
    if sub.current_period_end is None:
        return True

    return sub.current_period_end >= date.today()


async def activate(session: AsyncSession, user_id: int) -> Subscription:
    sub = await get_me(session, user_id)
    today = date.today()
    if sub is None:
        sub = Subscription(user_id=user_id, status="active", plan_code="monthly_basic", start_date=today)
        session.add(sub)
    else:
        sub.status = "active"
        sub.start_date = sub.start_date or today
        sub.end_date = None

    sub.current_period_start = today
    sub.current_period_end = today + timedelta(days=PLAN_DURATIONS.get(sub.plan_code or "", 30))
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


async def choose_plan(session: AsyncSession, user_id: int, plan_code: str) -> Subscription:
    if plan_code not in {"weekly", "monthly", "yearly"}:
        raise ValueError("Invalid plan code")
    sub = await get_me(session, user_id)
    today = date.today()
    if sub is None:
        sub = Subscription(user_id=user_id, status="active", plan_code=plan_code, start_date=today)
        session.add(sub)
    else:
        sub.plan_code = plan_code
        sub.status = "active"
        sub.start_date = sub.start_date or today
        sub.end_date = None

    sub.current_period_start = today
    sub.current_period_end = today + timedelta(days=PLAN_DURATIONS[plan_code])
    await session.commit()
    await session.refresh(sub)
    return sub


