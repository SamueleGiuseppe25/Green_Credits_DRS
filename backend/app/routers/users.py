from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..models import Subscription, Collection, User

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
    # Block if active subscription
    sub = (await session.execute(select(Subscription).where(and_(Subscription.user_id == current_user.id, Subscription.status == "active")).limit(1))).scalars().first()
    if sub is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End your subscription before deleting your account.")
    # Block if upcoming collections
    from datetime import datetime
    now = datetime.utcnow()
    up = await session.scalar(select(select(Collection.id).where(and_(Collection.user_id == current_user.id, Collection.status != "canceled", Collection.scheduled_at >= now)).exists()))
    if up:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancel upcoming collections before deleting your account.")
    user = await session.get(User, current_user.id)
    if user is None:
        return
    await session.delete(user)
    await session.commit()
    return



