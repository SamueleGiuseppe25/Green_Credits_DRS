from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Subscription
from ..core.events import publish_event


def publish_subscription_confirmed(
    user_email: str,
    plan_code: str,
    amount_cents: int = 0,
    stripe_invoice_id: str | None = None,
) -> None:
    """
    Publish subscription.confirmed event (e.g. after Stripe webhook or manual activation).
    Call from Stripe webhook handler when payment succeeds, or from activate/choose_plan.
    """
    publish_event(
        "subscription.confirmed",
        {
            "email": user_email,
            "plan_code": plan_code,
            "amount_eur": amount_cents / 100.0,
            "stripe_invoice_id": stripe_invoice_id,
            "ts": datetime.utcnow().isoformat(),
        },
    )


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


async def choose_plan(session: AsyncSession, user_id: int, plan_code: str) -> Subscription:
    if plan_code not in {"weekly", "monthly", "yearly"}:
        raise ValueError("Invalid plan code")
    sub = await get_me(session, user_id)
    if sub is None:
        sub = Subscription(user_id=user_id, status="active", plan_code=plan_code, start_date=date.today())
        session.add(sub)
    else:
        sub.plan_code = plan_code
        sub.status = "active"
        sub.start_date = sub.start_date or date.today()
        sub.end_date = None
    await session.commit()
    await session.refresh(sub)
    return sub


