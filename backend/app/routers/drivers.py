from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import require_driver
from ..services.db import get_db_session
from ..services.drivers import (
    get_driver_by_user_id,
    update_profile,
    get_driver_collections,
    mark_collected,
)
from ..schemas import DriverProfileOut, DriverProfileUpdate, MarkCollectedRequest

router = APIRouter()


@router.get("/me/profile")
async def get_my_profile(
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    driver = await get_driver_by_user_id(session, user.id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return DriverProfileOut(
        id=driver.id,
        userId=driver.user_id,
        vehicleType=driver.vehicle_type,
        vehiclePlate=driver.vehicle_plate,
        phone=driver.phone,
        isAvailable=driver.is_available,
    )


@router.patch("/me/profile")
async def update_my_profile(
    payload: DriverProfileUpdate,
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    driver = await update_profile(
        session,
        user_id=user.id,
        vehicle_type=payload.vehicleType,
        vehicle_plate=payload.vehiclePlate,
        phone=payload.phone,
        is_available=payload.isAvailable,
    )
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return DriverProfileOut(
        id=driver.id,
        userId=driver.user_id,
        vehicleType=driver.vehicle_type,
        vehiclePlate=driver.vehicle_plate,
        phone=driver.phone,
        isAvailable=driver.is_available,
    )


@router.get("/me/collections")
async def get_my_collections(
    status: str | None = Query(default=None),
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    collections = await get_driver_collections(session, user.id, status)
    return [
        {
            "id": c.id,
            "userId": c.user_id,
            "scheduledAt": c.scheduled_at,
            "returnPointId": c.return_point_id,
            "status": c.status,
            "bagCount": c.bag_count,
            "notes": c.notes,
            "driverId": c.driver_id,
            "proofUrl": c.proof_url,
            "createdAt": c.created_at,
            "updatedAt": c.updated_at,
        }
        for c in collections
    ]


@router.patch("/me/collections/{id}/mark-collected")
async def mark_collection_collected(
    id: int,
    payload: MarkCollectedRequest,
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    col, err = await mark_collected(session, id, user.id, payload.proofUrl)
    if col is None and err is None:
        raise HTTPException(status_code=404, detail="Collection not found")
    if col is None:
        raise HTTPException(status_code=400, detail=err)
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
        "driverId": col.driver_id,
        "proofUrl": col.proof_url,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }
