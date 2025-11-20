from fastapi import APIRouter, Depends, Body
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.collection_slots import get_me as svc_get_me, upsert as svc_upsert
from ..schemas import CollectionSlot as CollectionSlotSchema


router = APIRouter()


@router.get("/me", response_model=CollectionSlotSchema)
async def get_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    slot = await svc_get_me(session, current_user.id)
    if slot is None:
        # Return an empty/default preference according to schema
        return {"weekday": 0, "startTime": "18:00:00", "endTime": "20:00:00", "preferredReturnPointId": None}
    return {
        "weekday": slot.weekday,
        "startTime": str(slot.start_time),
        "endTime": str(slot.end_time),
        "preferredReturnPointId": slot.preferred_return_point_id,
    }


@router.put("/me", response_model=CollectionSlotSchema)
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
    }



