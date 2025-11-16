from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from datetime import datetime
from app.models.voucher import Voucher
from app.models.wallet_transaction import WalletTransaction


async def update_voucher_proof_or_donation(
    session: AsyncSession,
    user_id: int,
    voucher_id: int,
    proof_url: str | None,
    donated: bool | None,
) -> Voucher | None:
    res = await session.execute(
        select(Voucher).where(Voucher.id == voucher_id, Voucher.user_id == user_id).limit(1)
    )
    v = res.scalar_one_or_none()
    if v is None:
        return None

    if proof_url is not None:
        v.proof_url = proof_url
    if donated is not None:
        v.donated = donated

    v.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(v)
    return v
