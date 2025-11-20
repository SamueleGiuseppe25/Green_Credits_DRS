from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import User, WalletTransaction


async def seed_demo_wallet_transactions(session: AsyncSession) -> None:
    """
    Create a few demo transactions for each user that has no transactions yet.
    Idempotent: if any [DEMO] transactions exist for a user, skip that user.
    """
    users = (await session.execute(select(User))).scalars().all()
    if not users:
        return

    now = datetime.utcnow()

    for u in users:
        existing_demo = await session.scalar(
            select(WalletTransaction.id).where(
                (WalletTransaction.user_id == u.id)
                & (WalletTransaction.note.contains("[DEMO]"))
            ).limit(1)
        )
        if existing_demo:
            continue

        # If user has any transactions already, skip seeding
        any_txn = await session.scalar(
            select(WalletTransaction.id).where(WalletTransaction.user_id == u.id).limit(1)
        )
        if any_txn:
            continue

        demo_rows = [
            WalletTransaction(
                user_id=u.id,
                ts=now - timedelta(days=5),
                kind="collection_completed",
                amount_cents=200,  # +€2.00
                note="[DEMO] Collection completed – 2 bags",
            ),
            WalletTransaction(
                user_id=u.id,
                ts=now - timedelta(days=3),
                kind="manual_adjustment",
                amount_cents=50,  # +€0.50
                note="[DEMO] Manual claim adjustment",
            ),
            WalletTransaction(
                user_id=u.id,
                ts=now - timedelta(days=1),
                kind="redeem",
                amount_cents=-100,  # -€1.00
                note="[DEMO] Voucher redemption",
            ),
        ]
        session.add_all(demo_rows)

    await session.commit()


