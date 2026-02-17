from pathlib import Path
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.events import publish_event
from ..models.user import User
from ..models.driver import Driver
from ..models.collection import Collection
from ..models import WalletTransaction
from ..core.security import get_password_hash
from .driver_payouts import create_earning
from .wallet import credit_wallet_for_collection


async def create_driver(
    session: AsyncSession,
    email: str,
    password: str,
    full_name: str | None,
    vehicle_type: str | None,
    vehicle_plate: str | None,
    phone: str | None,
) -> Driver:
    email = (email or "").strip().lower()
    if "@" not in email or len(password or "") < 6:
        raise ValueError("Invalid email or password too short")

    existing = await session.scalar(select(User).where(User.email == email))
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        full_name=full_name,
        password_hash=get_password_hash(password),
        is_driver=True,
    )
    session.add(user)
    await session.flush()

    driver = Driver(
        user_id=user.id,
        vehicle_type=vehicle_type,
        vehicle_plate=vehicle_plate,
        phone=phone,
    )
    session.add(driver)
    await session.commit()
    await session.refresh(driver)
    return driver


async def get_driver_collections(
    session: AsyncSession, driver_user_id: int, status: str | None = None
) -> List[Collection]:
    driver = await get_driver_by_user_id(session, driver_user_id)
    if driver is None:
        return []
    stmt = select(Collection).where(
        Collection.driver_id == driver.id,
        Collection.is_archived == False,  # noqa: E712
    )
    if status:
        stmt = stmt.where(Collection.status == status)
    stmt = stmt.order_by(Collection.scheduled_at.desc())
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


async def mark_collected(
    session: AsyncSession,
    collection_id: int,
    driver_user_id: int,
) -> tuple[Collection | None, str | None]:
    driver = await get_driver_by_user_id(session, driver_user_id)
    if driver is None:
        return None, "Driver profile not found"

    col = (await session.execute(
        select(Collection).where(Collection.id == collection_id).limit(1)
    )).scalars().first()
    if col is None:
        return None, None

    if col.driver_id != driver.id:
        return col, "Collection not assigned to you"

    if col.status != "assigned":
        return col, f"Cannot mark as collected: current status is '{col.status}'"

    col.status = "collected"
    await create_earning(session, driver.id, col.id, col.bag_count or 1)
    await session.commit()
    await session.refresh(col)
    # Publish event for email notification
    user = (await session.execute(select(User).where(User.id == col.user_id).limit(1))).scalars().first()
    if user:
        driver_user = (await session.execute(select(User).where(User.id == driver.user_id).limit(1))).scalars().first()
        driver_name = driver_user.full_name if driver_user and driver_user.full_name else f"Driver #{driver.id}"
        await publish_event("collection.collected", {
            "email": user.email,
            "collection_id": col.id,
            "driver_name": driver_name,
        })
    return col, None


async def mark_completed(
    session: AsyncSession,
    collection_id: int,
    driver_user_id: int,
    proof_url: str | None = None,
    voucher_amount_cents: int | None = None,
) -> tuple[Collection | None, str | None]:
    driver = await get_driver_by_user_id(session, driver_user_id)
    if driver is None:
        return None, "Driver profile not found"

    col = (await session.execute(
        select(Collection).where(Collection.id == collection_id).limit(1)
    )).scalars().first()
    if col is None:
        return None, None

    if col.driver_id != driver.id:
        return col, "Collection not assigned to you"

    if col.status != "collected":
        return col, f"Cannot mark as completed: current status is '{col.status}'"

    amt = int(voucher_amount_cents or 0)
    if amt <= 0 or amt > 50_000:
        return col, "Voucher amount must be > 0 and <= 50000 cents"

    col.status = "completed"
    if proof_url:
        col.proof_url = proof_url
    col.voucher_amount_cents = amt

    # Auto-credit wallet (idempotency: check if credit already exists)
    existing_credit = await session.scalar(
        select(func.count())
        .select_from(WalletTransaction)
        .where(
            WalletTransaction.user_id == col.user_id,
            WalletTransaction.kind == "collection_credit",
            WalletTransaction.note.like(f"%collection #{col.id}%"),
        )
    )
    if int(existing_credit or 0) == 0 and amt > 0:
        proof_ref = "-"
        if proof_url:
            proof_ref = Path(proof_url).name or "-"
            if len(proof_ref) > 64:
                proof_ref = proof_ref[:61] + "..."
        note = (
            f"Credit for collection #{col.id} "
            f"(voucher €{amt / 100:.2f}) "
            f"driver_id={col.driver_id or '-'} "
            f"proof={proof_ref}"
        )
        await credit_wallet_for_collection(
            session,
            col.user_id,
            col.id,
            amt,
            note=note,
        )

    await session.commit()
    await session.refresh(col)
    # Publish event for email notification
    user = (await session.execute(select(User).where(User.id == col.user_id).limit(1))).scalars().first()
    if user:
        await publish_event("collection.completed", {
            "email": user.email,
            "collection_id": col.id,
            "proof_url": col.proof_url or "",
            "voucher_amount_eur": (col.voucher_amount_cents or 0) / 100,
        })
        if amt > 0:
            balance = await session.scalar(
                select(func.coalesce(func.sum(WalletTransaction.amount_cents), 0)).where(
                    WalletTransaction.user_id == col.user_id
                )
            )
            await publish_event("wallet.credit.created", {
                "email": user.email,
                "amount_eur": amt / 100,
                "new_balance_eur": int(balance or 0) / 100,
            })
    return col, None

async def list_drivers(session: AsyncSession) -> List[Driver]:
    stmt = select(Driver).order_by(Driver.id.asc())
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


async def get_driver_by_user_id(session: AsyncSession, user_id: int) -> Driver | None:
    stmt = select(Driver).where(Driver.user_id == user_id).limit(1)
    return (await session.execute(stmt)).scalars().first()


async def update_profile(
    session: AsyncSession,
    user_id: int,
    vehicle_type: str | None = None,
    vehicle_plate: str | None = None,
    phone: str | None = None,
    is_available: bool | None = None,
) -> Driver | None:
    driver = await get_driver_by_user_id(session, user_id)
    if driver is None:
        return None
    if vehicle_type is not None:
        driver.vehicle_type = vehicle_type
    if vehicle_plate is not None:
        driver.vehicle_plate = vehicle_plate
    if phone is not None:
        driver.phone = phone
    if is_available is not None:
        driver.is_available = is_available
    await session.commit()
    await session.refresh(driver)
    return driver
