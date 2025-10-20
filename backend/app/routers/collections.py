from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.collections import create as svc_create, list_me as svc_list_me, cancel as svc_cancel



class CreateCollectionRequest(BaseModel):
    scheduledAt: str
    returnPointId: int
    bagCount: Optional[int] = 1
    notes: Optional[str] = None


router = APIRouter()


@router.post("", status_code=201)
async def create_collection(
    current_user: CurrentUserDep,
    payload: CreateCollectionRequest,
    session: AsyncSession = Depends(get_db_session),
):
    scheduled_at = datetime.fromisoformat(payload.scheduledAt)  # assume ISO from client
    created = await svc_create(
        session,
        current_user.id,
        scheduled_at,
        payload.returnPointId,
        payload.bagCount,
        payload.notes,
    )
    return {
        "id": created.id,
        "userId": created.user_id,
        "scheduledAt": created.scheduled_at,
        "returnPointId": created.return_point_id,
        "status": created.status,
        "bagCount": created.bag_count,
        "notes": created.notes,
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
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }



