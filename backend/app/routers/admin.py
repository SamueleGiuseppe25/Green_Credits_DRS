# app/routers/admin.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..dependencies.auth import CurrentUserDep, require_admin  # note: import CurrentUser, not CurrentUserDep
from ..services.db import get_db_session
from ..services.collections import admin_transition_status

router = APIRouter()

# Create an "admin-only" dependency alias
AdminDep = Annotated[CurrentUserDep, Depends(require_admin)]

@router.get("/ping")
async def ping(_: AdminDep):
    return {"status": "ok"}

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
