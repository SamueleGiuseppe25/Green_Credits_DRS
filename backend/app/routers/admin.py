from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ..dependencies.auth import require_admin
from ..models import (
    Collection,
    CollectionSlot,
    Driver,
    DriverEarning,
    DriverPayout,
    Subscription,
    User,
)
from ..services.collections import admin_transition_status, assign_driver as svc_assign_driver
from ..services.drivers import create_driver as svc_create_driver, list_drivers as svc_list_drivers
from ..services.driver_payouts import (
    create_payout,
    get_driver_balance,
    get_driver_earnings,
    list_all_payouts,
)
from ..services.db import get_db_session
from ..schemas import (
    AssignDriverRequest,
    DriverProfileCreate,
    DriverProfileOut,
    CreatePayoutRequest,
    DriverEarningsBalanceOut,
    DriverEarningOut,
    DriverPayoutOut,
    GenerateCollectionsResponse,
)
from ..services.recurring_generation import generate_collections as svc_generate_collections

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/ping")
async def ping():
    return {"status": "ok"}


PLAN_PRICES = {"weekly": 499, "monthly": 1499, "yearly": 14999}


def _plan_price_cents(plan_code: str | None) -> int:
    """Map plan_code to price in cents. Handles monthly_basic as monthly."""
    if not plan_code:
        return 0
    if plan_code in PLAN_PRICES:
        return PLAN_PRICES[plan_code]
    if plan_code.startswith("monthly"):
        return PLAN_PRICES["monthly"]
    if plan_code.startswith("weekly"):
        return PLAN_PRICES["weekly"]
    if plan_code.startswith("yearly"):
        return PLAN_PRICES["yearly"]
    return 0


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
    # Voucher total from real collection data (completed collections only)
    voucher_total_cents = await session.scalar(
        select(func.coalesce(func.sum(Collection.voucher_amount_cents), 0))
        .select_from(Collection)
        .where(Collection.status == "completed")
    )
    # Recurring schedules
    total_recurring_schedules = await session.scalar(
        select(func.count()).select_from(CollectionSlot).where(CollectionSlot.status == "active")
    )
    # Recurring schedules breakdown by frequency
    recurring_by_freq = (
        await session.execute(
            select(CollectionSlot.frequency, func.count(CollectionSlot.id))
            .where(CollectionSlot.status == "active")
            .group_by(CollectionSlot.frequency)
        )
    )
    recurring_schedules_by_frequency = {
        row[0]: row[1] for row in recurring_by_freq.all()
    }
    # Driver totals
    total_driver_earnings_cents = await session.scalar(
        select(func.coalesce(func.sum(DriverEarning.amount_cents), 0)).select_from(DriverEarning)
    )
    total_driver_payouts_cents = await session.scalar(
        select(func.coalesce(func.sum(DriverPayout.amount_cents), 0)).select_from(DriverPayout)
    )
    # Subscription revenue (count each active subscription × plan price)
    active_subs = (
        await session.execute(
            select(Subscription.plan_code).where(Subscription.status == "active")
        )
    ).scalars().all()
    total_subscription_revenue_cents = sum(
        _plan_price_cents(plan) for plan in active_subs
    )
    available_payout_balance_cents = total_subscription_revenue_cents - int(
        total_driver_payouts_cents or 0
    )
    return {
        "users_total": int(users_total or 0),
        "active_subscriptions": int(active_subscriptions or 0),
        "collections_total": int(collections_total or 0),
        "collections_scheduled": int(collections_scheduled or 0),
        "voucher_total_cents": int(voucher_total_cents or 0),
        "total_recurring_schedules": int(total_recurring_schedules or 0),
        "recurring_schedules_by_frequency": recurring_schedules_by_frequency,
        "total_subscription_revenue_cents": total_subscription_revenue_cents,
        "total_driver_earnings_cents": int(total_driver_earnings_cents or 0),
        "total_driver_payouts_cents": int(total_driver_payouts_cents or 0),
        "available_payout_balance_cents": available_payout_balance_cents,
    }


@router.post("/generate-collections", response_model=GenerateCollectionsResponse)
async def generate_collections(
    session: AsyncSession = Depends(get_db_session),
):
    result = await svc_generate_collections(session, weeks_ahead=4)
    return GenerateCollectionsResponse(generated=result["generated"], skipped=result["skipped"])


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
            "voucher_amount_cents": c.voucher_amount_cents,
            "collection_slot_id": c.collection_slot_id,
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
        "voucherAmountCents": col.voucher_amount_cents,
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
        "voucherAmountCents": col.voucher_amount_cents,
        "createdAt": col.created_at,
        "updatedAt": col.updated_at,
    }


@router.get("/drivers/{driver_id}/earnings")
async def get_driver_earnings_admin(
    driver_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    driver = await session.scalar(select(Driver).where(Driver.id == driver_id).limit(1))
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    balance = await get_driver_balance(session, driver_id)
    rows = await get_driver_earnings(session, driver_id, limit=200)
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


@router.post("/drivers/{driver_id}/payouts", status_code=201)
async def create_driver_payout(
    driver_id: int,
    payload: CreatePayoutRequest,
    session: AsyncSession = Depends(get_db_session),
):
    driver = await session.scalar(select(Driver).where(Driver.id == driver_id).limit(1))
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    try:
        payout = await create_payout(session, driver_id, payload.amountCents, payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return DriverPayoutOut(
        id=payout.id,
        driverId=payout.driver_id,
        amountCents=payout.amount_cents,
        note=payout.note,
        createdAt=payout.created_at,
    )


@router.get("/payouts")
async def list_payouts(session: AsyncSession = Depends(get_db_session)):
    rows = await list_all_payouts(session, limit=200)
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
