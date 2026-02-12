import re
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection
from ..services.db import get_db_session
from ..dependencies.auth import CurrentUserDep
from ..services.wallet import get_balance, get_history
from ..schemas import WalletBalanceResponse, WalletHistoryResponse, Transaction

COLLECTION_ID_PATTERN = re.compile(r"collection #(\d+)", re.IGNORECASE)


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

    # Collect collection IDs from collection-related transactions
    collection_ids: set[int] = set()
    for r in rows:
        if r.kind in ("collection_credit", "collection_completed") and r.note:
            match = COLLECTION_ID_PATTERN.search(r.note)
            if match:
                collection_ids.add(int(match.group(1)))

    # Fetch collection details for user's collections only
    collection_map: dict[int, dict] = {}
    if collection_ids:
        stmt = select(Collection.id, Collection.status, Collection.proof_url).where(
            Collection.id.in_(collection_ids),
            Collection.user_id == current_user.id,
        )
        result = (await session.execute(stmt)).all()
        for row in result:
            collection_map[row[0]] = {"status": row[1], "proof_url": row[2]}

    items = []
    for r in rows:
        extra: dict = {}
        if r.kind in ("collection_credit", "collection_completed") and r.note:
            match = COLLECTION_ID_PATTERN.search(r.note)
            if match:
                cid = int(match.group(1))
                if cid in collection_map:
                    extra = {
                        "collectionId": cid,
                        "collectionStatus": collection_map[cid]["status"],
                        "proofUrl": collection_map[cid]["proof_url"],
                    }
        items.append(
            Transaction(
                id=r.id,
                ts=r.ts,
                kind=r.kind,
                amountCents=r.amount_cents,
                note=r.note,
                **extra,
            )
        )

    return {"items": items, "total": total, "page": page, "pageSize": pageSize}


