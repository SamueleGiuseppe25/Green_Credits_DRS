from fastapi import APIRouter, Depends, Body
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.collection_slots import get_me as svc_get_me, upsert as svc_upsert, delete_me as svc_delete_me
from ..schemas import CollectionSlot as CollectionSlotSchema, CollectionSlotOut as CollectionSlotOutSchema


router = APIRouter()


@router.get("/me", response_model=CollectionSlotOutSchema)
async def get_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    slot = await svc_get_me(session, current_user.id)
    if slot is None:
        # Return an empty/default preference according to schema
        return {
            "weekday": 0,
            "startTime": "18:00:00",
            "endTime": "20:00:00",
            "preferredReturnPointId": None,
            "frequency": "weekly",
            "enabled": False,
        }
    return {
        "weekday": slot.weekday,
        "startTime": str(slot.start_time),
        "endTime": str(slot.end_time),
        "preferredReturnPointId": slot.preferred_return_point_id,
        "frequency": slot.frequency,
        "enabled": True,
    }


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
        # Bad request with clear message; avoids 500 and preserves CORS
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "weekday": saved.weekday,
        "startTime": str(saved.start_time),
        "endTime": str(saved.end_time),
        "preferredReturnPointId": saved.preferred_return_point_id,
        "frequency": saved.frequency,
        "enabled": True,
    }


@router.delete("/me", status_code=204)
async def delete_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    await svc_delete_me(session, current_user.id)
    return

