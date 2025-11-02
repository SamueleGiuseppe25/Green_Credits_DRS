from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from datetime import datetime
from app.models.voucher import Voucher
from app.models.wallet_transaction import WalletTransaction


async def create_voucher_for_collection(
    session: AsyncSession,
    user_id: int,
    collection_id: int,
    amount_cents: int,
    store_chain: str = "Generic",
    store_name: str | None = None,
):
    """Create a voucher and a matching wallet transaction credit."""
    voucher = Voucher(
        collection_id=collection_id,
        store_chain=store_chain,
        store_name=store_name,
        amount_cents=amount_cents,
        voucher_code=f"VC-{collection_id}-{int(datetime.utcnow().timestamp())}",
        donated=False,
        created_at=datetime.utcnow(),
    )
    session.add(voucher)

    # Credit wallet immediately
    wt = WalletTransaction(
        user_id=user_id,
        kind="credit",
        amount_cents=amount_cents,
        note=f"Voucher {voucher.voucher_code}",
    )
    session.add(wt)

    await session.flush()   # get ids without commit
    return voucher
