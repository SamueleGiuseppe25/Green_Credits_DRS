from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..dependencies.auth import require_admin
from ..models import Collection, Subscription, User, WalletTransaction
from ..services.collections import admin_transition_status, assign_driver as svc_assign_driver
from ..services.drivers import create_driver as svc_create_driver, list_drivers as svc_list_drivers
from ..services.db import get_db_session
from ..schemas import AssignDriverRequest, DriverProfileCreate, DriverProfileOut

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/ping")
async def ping():
    return {"status": "ok"}


@router.get("/metrics")
async def metrics(session: AsyncSession = Depends(get_db_session)):
    users_total = await session.scalar(select(func.count()).select_from(User))
    active_subscriptions = await session.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.status == "active")
    )
    collections_total = await session.scalar(
        select(func.count()).select_from(Collection).where(Collection.is_archived == False)  # noqa: E712
    )
    collections_scheduled = await session.scalar(
        select(func.count())
        .select_from(Collection)
        .where(
            Collection.is_archived == False,  # noqa: E712
            Collection.status == "scheduled",
        )
    )
    voucher_total_cents = await session.scalar(
        select(func.coalesce(func.sum(WalletTransaction.amount_cents), 0)).select_from(WalletTransaction)
    )
    return {
        "users_total": int(users_total or 0),
        "active_subscriptions": int(active_subscriptions or 0),
        "collections_total": int(collections_total or 0),
        "collections_scheduled": int(collections_scheduled or 0),
        "voucher_total_cents": int(voucher_total_cents or 0),
    }


@router.get("/collections")
async def list_collections(
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Collection).where(Collection.is_archived == False)  # noqa: E712
    if status:
        stmt = stmt.where(Collection.status == status)
    stmt = stmt.order_by(Collection.scheduled_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "return_point_id": c.return_point_id,
            "scheduled_at": c.scheduled_at.isoformat(),
            "status": c.status,
            "bag_count": c.bag_count,
            "notes": c.notes,
            "driver_id": c.driver_id,
            "proof_url": c.proof_url,
        }
        for c in rows
    ]

class UpdateStatusRequest(BaseModel):
    status: str

@router.patch("/collections/{id}/status")
async def update_collection_status(
    id: int,
    payload: UpdateStatusRequest,
    session: AsyncSession = Depends(get_db_session),
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
        "driverId": col.driver_id,
        "proofUrl": col.proof_url,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }


@router.post("/drivers", status_code=201)
async def create_driver(
    payload: DriverProfileCreate,
    session: AsyncSession = Depends(get_db_session),
):
    try:
        driver = await svc_create_driver(
            session,
            email=payload.email,
            password=payload.password,
            full_name=payload.fullName,
            vehicle_type=payload.vehicleType,
            vehicle_plate=payload.vehiclePlate,
            phone=payload.phone,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return DriverProfileOut(
        id=driver.id,
        userId=driver.user_id,
        vehicleType=driver.vehicle_type,
        vehiclePlate=driver.vehicle_plate,
        phone=driver.phone,
        isAvailable=driver.is_available,
    )


@router.get("/drivers")
async def list_drivers(session: AsyncSession = Depends(get_db_session)):
    drivers = await svc_list_drivers(session)
    return [
        {
            "id": d.id,
            "userId": d.user_id,
            "vehicleType": d.vehicle_type,
            "vehiclePlate": d.vehicle_plate,
            "phone": d.phone,
            "isAvailable": d.is_available,
        }
        for d in drivers
    ]


@router.patch("/collections/{id}/assign-driver")
async def assign_driver_to_collection(
    id: int,
    payload: AssignDriverRequest,
    session: AsyncSession = Depends(get_db_session),
):
    col, err = await svc_assign_driver(session, id, payload.driverId)
    if col is None:
        raise HTTPException(status_code=404, detail="Collection not found")
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
