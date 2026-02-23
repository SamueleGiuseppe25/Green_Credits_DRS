from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..models import (
    Subscription,
    Collection,
    CollectionSlot,
    WalletTransaction,
    Driver,
    DriverEarning,
    DriverPayout,
    Claim,
    Notification,
    User,
)

router = APIRouter()


class UpdateMeRequest(BaseModel):
    full_name: str | None = None
    address: str | None = None


@router.patch("/me")
async def update_me(
    payload: UpdateMeRequest,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    user = await session.get(User, current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_name = payload.full_name
    user.address = payload.address
    await session.commit()
    return {"ok": True}


@router.delete("/me", status_code=204)
async def delete_me(
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    # Block if upcoming non-canceled collections exist (drivers may be assigned)
    now = datetime.utcnow()
    up = await session.scalar(
        select(
            select(Collection.id).where(
                and_(
                    Collection.user_id == current_user.id,
                    Collection.status != "canceled",
                    Collection.scheduled_at >= now,
                )
            ).exists()
        )
    )
    if up:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancel upcoming collections before deleting your account.",
        )

    # Delete driver_earnings that reference this user's collections
    collection_ids = select(Collection.id).where(Collection.user_id == current_user.id)
    await session.execute(
        sa_delete(DriverEarning).where(DriverEarning.collection_id.in_(collection_ids))
    )

    # If user is also a driver, wipe their earnings and payouts first
    driver = (
        await session.execute(select(Driver).where(Driver.user_id == current_user.id).limit(1))
    ).scalars().first()
    if driver:
        await session.execute(sa_delete(DriverEarning).where(DriverEarning.driver_id == driver.id))
        await session.execute(sa_delete(DriverPayout).where(DriverPayout.driver_id == driver.id))

    # Delete all user-owned rows (order respects FK dependencies)
    await session.execute(sa_delete(WalletTransaction).where(WalletTransaction.user_id == current_user.id))
    await session.execute(sa_delete(Notification).where(Notification.user_id == current_user.id))
    await session.execute(sa_delete(Claim).where(Claim.user_id == current_user.id))
    await session.execute(sa_delete(CollectionSlot).where(CollectionSlot.user_id == current_user.id))
    await session.execute(sa_delete(Collection).where(Collection.user_id == current_user.id))
    await session.execute(sa_delete(Subscription).where(Subscription.user_id == current_user.id))
    if driver:
        await session.execute(sa_delete(Driver).where(Driver.user_id == current_user.id))

    user = await session.get(User, current_user.id)
    if user is None:
        return
    await session.delete(user)
    await session.commit()
