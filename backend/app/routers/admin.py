# app/routers/admin.py
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..dependencies.auth import CurrentUserDep, require_admin
from ..services.db import get_db_session
from ..services.collections import admin_transition_status
from ..models import User, Subscription, Collection, WalletTransaction

router = APIRouter()

# Create an "admin-only" dependency alias
AdminDep = Annotated[CurrentUserDep, Depends(require_admin)]


@router.get("/ping")
async def ping(_: AdminDep):
    return {"status": "ok"}


@router.get("/metrics")
async def get_metrics(
    _: AdminDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Return admin metrics: users_total, active_subscriptions, collections_total, collections_scheduled, voucher_total_cents."""
    users_total = await session.scalar(select(func.count()).select_from(User)) or 0
    active_subs = await session.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.status == "active")
    ) or 0
    collections_total = await session.scalar(select(func.count()).select_from(Collection)) or 0
    collections_scheduled = await session.scalar(
        select(func.count()).select_from(Collection).where(Collection.status == "scheduled")
    ) or 0
    voucher_total_cents = await session.scalar(
        select(func.coalesce(func.sum(WalletTransaction.amount_cents), 0)).select_from(WalletTransaction)
    ) or 0
    return {
        "users_total": int(users_total),
        "active_subscriptions": int(active_subs),
        "collections_total": int(collections_total),
        "collections_scheduled": int(collections_scheduled),
        "voucher_total_cents": int(voucher_total_cents),
    }


@router.get("/collections")
async def get_collections(
    _: AdminDep,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    """Return recent collections with id, user_id, return_point_id, scheduled_at, status, bag_count, notes."""
    stmt = select(Collection).order_by(desc(Collection.scheduled_at)).limit(limit)
    if status:
        stmt = stmt.where(Collection.status == status)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "return_point_id": c.return_point_id,
            "scheduled_at": c.scheduled_at,
            "status": c.status,
            "bag_count": c.bag_count,
            "notes": c.notes,
        }
        for c in rows
    ]

class UpdateStatusRequest(BaseModel):
    status: str

@router.patch("/collections/{id}/status")
async def update_collection_status(
    id: int,
    payload: UpdateStatusRequest,
    _: AdminDep,  # no default here
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    col, err = await admin_transition_status(session, id, payload.status)
    if col is None:
        raise HTTPException(status_code=404, detail="Not found")
    if err:
        raise HTTPException(status_code=400, detail=err)

    return {
        "id": col.id,
        "userId": col.user_id,
        "scheduledAt": col.scheduled_at,
        "returnPointId": col.return_point_id,
        "status": col.status,
        "bagCount": col.bag_count,
        "notes": col.notes,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }
