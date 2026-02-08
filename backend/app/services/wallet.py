from datetime import datetime
from typing import Tuple, List

from sqlalchemy import select, func, desc, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import WalletTransaction


async def get_balance(session: AsyncSession, user_id: int) -> Tuple[int, datetime]:
    sum_stmt = select(func.coalesce(func.sum(WalletTransaction.amount_cents), 0)).where(
        WalletTransaction.user_id == user_id
    )
    balance_cents = await session.scalar(sum_stmt)
    ts_stmt = (
        select(WalletTransaction.ts)
        .where(WalletTransaction.user_id == user_id)
        .order_by(desc(WalletTransaction.ts))
        .limit(1)
    )
    last_updated = await session.scalar(ts_stmt)
    return int(balance_cents or 0), (last_updated or datetime.fromtimestamp(0))


async def get_history(
    session: AsyncSession, user_id: int, page: int, page_size: int
) -> Tuple[List[WalletTransaction], int]:
    base = select(WalletTransaction).where(WalletTransaction.user_id == user_id)
    total = await session.scalar(select(func.count()).select_from(base.subquery()))
    rows_stmt = base.order_by(desc(WalletTransaction.ts)).offset((page - 1) * page_size).limit(page_size)
    rows = (await session.execute(rows_stmt)).scalars().all()
    return rows, int(total or 0)


async def _next_proof_sequence(session: AsyncSession, kind: str, year: int) -> int:
    """Return count of transactions with this kind in this year (0-based); caller adds 1 for next sequence."""
    count_stmt = select(func.count()).select_from(WalletTransaction).where(
        and_(
            WalletTransaction.kind == kind,
            extract("year", WalletTransaction.ts) == year,
        )
    )
    n = await session.scalar(count_stmt) or 0
    return int(n)


def _proof_ref(prefix: str, year: int, sequence: int) -> str:
    return f"{prefix}-{year}-{sequence:06d}"


async def donate(
    session: AsyncSession, user_id: int, amount_cents: int
) -> Tuple[str, int]:
    """
    Debit wallet for donation. Returns (proof_ref, new_balance_cents).
    Caller must validate amount_cents > 0 and <= current balance.
    """
    balance_cents, _ = await get_balance(session, user_id)
    if amount_cents <= 0:
        raise ValueError("amount must be positive")
    if amount_cents > balance_cents:
        raise ValueError("amount exceeds balance")
    year = datetime.utcnow().year
    seq = await _next_proof_sequence(session, "debit_donation", year) + 1
    proof_ref = _proof_ref("DON", year, seq)
    txn = WalletTransaction(
        user_id=user_id,
        kind="debit_donation",
        amount_cents=-amount_cents,
        note=f"proof:{proof_ref}",
    )
    session.add(txn)
    await session.commit()
    await session.refresh(txn)
    new_balance, _ = await get_balance(session, user_id)
    return proof_ref, new_balance


async def redeem(
    session: AsyncSession, user_id: int, amount_cents: int
) -> Tuple[str, int]:
    """
    Debit wallet for redemption. Returns (proof_ref, new_balance_cents).
    Caller must validate amount_cents > 0 and <= current balance.
    """
    balance_cents, _ = await get_balance(session, user_id)
    if amount_cents <= 0:
        raise ValueError("amount must be positive")
    if amount_cents > balance_cents:
        raise ValueError("amount exceeds balance")
    year = datetime.utcnow().year
    seq = await _next_proof_sequence(session, "debit_redeem", year) + 1
    proof_ref = _proof_ref("RED", year, seq)
    txn = WalletTransaction(
        user_id=user_id,
        kind="debit_redeem",
        amount_cents=-amount_cents,
        note=f"proof:{proof_ref}",
    )
    session.add(txn)
    await session.commit()
    await session.refresh(txn)
    new_balance, _ = await get_balance(session, user_id)
    return proof_ref, new_balance


async def credit_wallet_for_collection(
    session: AsyncSession,
    user_id: int,
    collection_id: int,
    amount_cents: int,
    note: str | None = None,
) -> WalletTransaction:
    """
    Link a completed collection to a wallet credit.

    Intended flow (not fully implemented end-to-end yet):
    1) A Collection is marked as completed/approved.
    2) A Claim may be created and approved for that Collection (if needed).
    3) This helper is called to add a positive Transaction to the user's wallet.
    """
    txn = WalletTransaction(
        user_id=user_id,
        kind="collection_credit",
        amount_cents=int(amount_cents),
        note=note or f"Credit for collection #{collection_id}",
    )
    session.add(txn)
    await session.commit()
    await session.refresh(txn)
    return txn


