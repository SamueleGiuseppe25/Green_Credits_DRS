from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from ..core.events import publish_event
from ..dependencies.auth import CurrentUserDep, require_active_subscription
from ..models.user import User
from ..models.return_point import ReturnPoint
from ..services.db import get_db_session
from ..services.collections import create as svc_create, list_me as svc_list_me, cancel as svc_cancel, delete_canceled as svc_delete_canceled



class CreateCollectionRequest(BaseModel):
    scheduledAt: str
    returnPointId: int
    bagCount: Optional[int] = 1
    notes: Optional[str] = None


router = APIRouter()


@router.post("", status_code=201)
async def create_collection(
    payload: CreateCollectionRequest,
    current_user: User = Depends(require_active_subscription),
    session: AsyncSession = Depends(get_db_session),
):
    scheduled_at = datetime.fromisoformat(payload.scheduledAt)  # assume ISO from client
    try:
        created = await svc_create(
            session,
            current_user.id,
            scheduled_at,
            payload.returnPointId,
            payload.bagCount,
            payload.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    rp_name = ""
    rp_row = (await session.execute(select(ReturnPoint).where(ReturnPoint.id == created.return_point_id).limit(1))).scalars().first()
    if rp_row:
        rp_name = rp_row.name
    await publish_event("collection.scheduled", {
        "email": current_user.email,
        "collection_id": created.id,
        "scheduled_at": str(created.scheduled_at),
        "return_point_name": rp_name,
    })
    return {
        "id": created.id,
        "userId": created.user_id,
        "scheduledAt": created.scheduled_at,
        "returnPointId": created.return_point_id,
        "status": created.status,
        "bagCount": created.bag_count,
        "notes": created.notes,
        "voucherAmountCents": created.voucher_amount_cents,
        "createdAt": created.created_at,
        "updatedAt": created.updated_at,
    }


@router.get("/me")
async def list_my_collections(
    current_user: CurrentUserDep,
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
):
    rows, total = await svc_list_me(session, current_user.id, status, page, pageSize)
    items = [
        {
            "id": r.id,
            "userId": r.user_id,
            "scheduledAt": r.scheduled_at,
            "returnPointId": r.return_point_id,
            "status": r.status,
            "bagCount": r.bag_count,
            "notes": r.notes,
            "voucherAmountCents": r.voucher_amount_cents,
            "createdAt": r.created_at,
            "updatedAt": r.updated_at,
        }
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "pageSize": pageSize}


@router.patch("/{id}/cancel")
async def cancel_collection(
    id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    col = await svc_cancel(session, current_user.id, id)
    if col is None:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": col.id,
        "userId": col.user_id,
        "scheduledAt": col.scheduled_at,
        "returnPointId": col.return_point_id,
        "status": col.status,
        "bagCount": col.bag_count,
        "notes": col.notes,
        "voucherAmountCents": col.voucher_amount_cents,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }


@router.delete("/{id}", status_code=204)
async def delete_collection(
    id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    ok, reason = await svc_delete_canceled(session, current_user.id, id)
    if ok:
        return
    if reason == "not_found":
        raise HTTPException(status_code=404, detail="Not found")
    if reason == "not_canceled":
        raise HTTPException(status_code=400, detail="Only canceled collections can be deleted")
    # Fallback generic error
    raise HTTPException(status_code=400, detail="Cannot delete collection")


