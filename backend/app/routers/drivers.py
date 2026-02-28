from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import require_driver
from ..services.db import get_db_session
from ..services.drivers import (
    get_driver_by_user_id,
    update_profile,
    get_driver_collections,
    mark_collected,
    mark_completed,
)
from ..services.driver_payouts import (
    get_driver_balance,
    get_driver_earnings,
    get_driver_payouts_list,
)
from ..schemas import (
    DriverProfileOut,
    DriverProfileUpdate,
    MarkCollectedRequest,
    DriverEarningsBalanceOut,
    DriverEarningOut,
    DriverPayoutOut,
)

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
        zone=driver.zone,
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
        zone=payload.zone,
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
        zone=driver.zone,
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
            "pickupAddress": c.pickup_address,
            "voucherAmountCents": c.voucher_amount_cents,
            "voucherPreference": c.voucher_preference,
            "charityId": c.charity_id,
            "collectionType": c.collection_type,
            "createdAt": c.created_at,
            "updatedAt": c.updated_at,
        }
        for c in collections
    ]


@router.patch("/me/collections/{id}/mark-collected")
async def mark_collection_collected(
    id: int,
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    col, err = await mark_collected(session, id, user.id)
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
        "pickupAddress": col.pickup_address,
        "voucherAmountCents": col.voucher_amount_cents,
        "voucherPreference": col.voucher_preference,
        "charityId": col.charity_id,
        "collectionType": col.collection_type,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }


@router.patch("/me/collections/{id}/mark-completed")
async def mark_collection_completed(
    id: int,
    payload: MarkCollectedRequest,
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    col, err = await mark_completed(
        session,
        id,
        user.id,
        payload.proofUrl,
        payload.voucherAmountCents,
    )
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
        "pickupAddress": col.pickup_address,
        "voucherAmountCents": col.voucher_amount_cents,
        "voucherPreference": col.voucher_preference,
        "charityId": col.charity_id,
        "collectionType": col.collection_type,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }


@router.get("/me/earnings")
async def get_my_earnings(
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    driver = await get_driver_by_user_id(session, user.id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    balance = await get_driver_balance(session, driver.id)
    rows = await get_driver_earnings(session, driver.id, limit=50)
    earnings = [
        DriverEarningOut(
            id=e.id,
            driverId=e.driver_id,
            collectionId=e.collection_id,
            amountCents=e.amount_cents,
            createdAt=e.created_at,
        )
        for e in rows
    ]
    return DriverEarningsBalanceOut(balanceCents=balance, earnings=earnings)


@router.get("/me/payouts")
async def get_my_payouts(
    user=Depends(require_driver),
    session: AsyncSession = Depends(get_db_session),
):
    driver = await get_driver_by_user_id(session, user.id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    rows = await get_driver_payouts_list(session, driver.id, limit=50)
    return [
        DriverPayoutOut(
            id=p.id,
            driverId=p.driver_id,
            amountCents=p.amount_cents,
            note=p.note,
            createdAt=p.created_at,
        )
        for p in rows
    ]
