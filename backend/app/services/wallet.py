from datetime import datetime
from typing import Tuple, List

from sqlalchemy import select, func, desc
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



