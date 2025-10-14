from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db import get_db
from app.models.subscriptions import UserSubscription
from app.schemas.subscriptions import (
    ActivateSubscriptionRequest,
    SubscriptionStatusResponse
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.post("/activate", response_model=SubscriptionStatusResponse)
async def activate_subscription(
    data: ActivateSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if sub and sub.is_active:
        raise HTTPException(status_code=400, detail="Already subscribed")

    if sub:
        sub.is_active = True
        sub.start_date = data.start_date or sub.start_date
        sub.cancel_date = None
    else:
        sub = UserSubscription(
            user_id=user.id,
            is_active=True,
            start_date=data.start_date
        )
        db.add(sub)

    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/cancel", response_model=SubscriptionStatusResponse)
async def cancel_subscription(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub or not sub.is_active:
        raise HTTPException(status_code=400, detail="No active subscription")

    sub.is_active = False
    sub.cancel_date = func.now()

    await db.commit()
    await db.refresh(sub)
    return sub


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        return SubscriptionStatusResponse(is_active=False)

    return sub
