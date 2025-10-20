from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.db import get_db_session
from ..dependencies.auth import CurrentUserDep
from ..services.wallet import get_balance, get_history
from ..schemas import WalletBalanceResponse, WalletHistoryResponse, Transaction


router = APIRouter()


@router.get("/balance", response_model=WalletBalanceResponse)
async def balance(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    balance_cents, last_updated = await get_balance(session, current_user.id)
    return {"balanceCents": balance_cents, "lastUpdated": last_updated}


@router.get("/history", response_model=WalletHistoryResponse)
async def history(
    current_user: CurrentUserDep,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
):
    rows, total = await get_history(session, current_user.id, page, pageSize)
    items = [
        Transaction(id=r.id, ts=r.ts, kind=r.kind, amountCents=r.amount_cents, note=r.note)
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "pageSize": pageSize}


