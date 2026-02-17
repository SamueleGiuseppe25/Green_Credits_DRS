from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.collection_slots import (
    get_me as svc_get_me,
    upsert as svc_upsert,
    delete_me as svc_delete_me,
    pause_slot as svc_pause_slot,
    resume_slot as svc_resume_slot,
    cancel_slot as svc_cancel_slot,
)
from ..schemas import CollectionSlot as CollectionSlotSchema, CollectionSlotOut as CollectionSlotOutSchema


router = APIRouter()


def _slot_to_response(slot) -> dict:
    return {
        "id": slot.id,
        "weekday": slot.weekday,
        "startTime": str(slot.start_time),
        "endTime": str(slot.end_time),
        "preferredReturnPointId": slot.preferred_return_point_id,
        "frequency": slot.frequency,
        "status": slot.status,
        "enabled": slot.status == "active",
    }


@router.get("/me", response_model=CollectionSlotOutSchema)
async def get_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    slot = await svc_get_me(session, current_user.id)
    if slot is None:
        return {
            "weekday": 0,
            "startTime": "18:00:00",
            "endTime": "20:00:00",
            "preferredReturnPointId": None,
            "frequency": "weekly",
            "status": "active",
            "enabled": False,
        }
    return _slot_to_response(slot)


@router.put("/me", response_model=CollectionSlotOutSchema)
async def put_me(
    current_user: CurrentUserDep,
    payload: CollectionSlotSchema,
    session: AsyncSession = Depends(get_db_session),
):
    try:
        saved = await svc_upsert(
            session,
            current_user.id,
            {
                "weekday": payload.weekday,
                "startTime": payload.startTime,
                "endTime": payload.endTime,
                "preferredReturnPointId": payload.preferredReturnPointId,
                "frequency": payload.frequency,
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _slot_to_response(saved)


@router.patch("/{slot_id}/pause", response_model=CollectionSlotOutSchema)
async def pause_slot(
    slot_id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    slot = await svc_pause_slot(session, current_user.id, slot_id)
    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")
    return _slot_to_response(slot)


@router.patch("/{slot_id}/resume", response_model=CollectionSlotOutSchema)
async def resume_slot(
    slot_id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    try:
        slot = await svc_resume_slot(session, current_user.id, slot_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")
    return _slot_to_response(slot)


@router.delete("/{slot_id}", status_code=204)
async def cancel_slot(
    slot_id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    slot = await svc_cancel_slot(session, current_user.id, slot_id)
    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")
    return


@router.delete("/me", status_code=204)
async def delete_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    await svc_delete_me(session, current_user.id)
    return

