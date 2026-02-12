from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ReturnPoint, User, WalletTransaction


RETURN_POINTS_SEED = [
    # Supermarkets (Dublin + nearby)
    {
        "external_id": "rp_tesco_baggot_st",
        "name": "Tesco Baggot Street",
        "type": "supermarket",
        "retailer": "Tesco",
        "eircode": "D04 V2N9",
        "lat": 53.3329,
        "lng": -6.2396,
    },
    {
        "external_id": "rp_dunnes_stephens_green",
        "name": "Dunnes Stores St Stephen's Green",
        "type": "supermarket",
        "retailer": "Dunnes",
        "eircode": "D02 XY88",
        "lat": 53.3396,
        "lng": -6.2598,
    },
    {
        "external_id": "rp_lidl_rathmines",
        "name": "Lidl Rathmines",
        "type": "supermarket",
        "retailer": "Lidl",
        "eircode": "D06 E8N2",
        "lat": 53.3218,
        "lng": -6.2659,
    },
    {
        "external_id": "rp_aldi_phibsborough",
        "name": "Aldi Phibsborough",
        "type": "supermarket",
        "retailer": "Aldi",
        "eircode": "D07 N8K1",
        "lat": 53.3600,
        "lng": -6.2732,
    },
    {
        "external_id": "rp_tesco_drumcondra",
        "name": "Tesco Drumcondra",
        "type": "supermarket",
        "retailer": "Tesco",
        "eircode": "D09 V3F6",
        "lat": 53.3671,
        "lng": -6.2528,
    },
    {
        "external_id": "rp_lidl_tallaght",
        "name": "Lidl Tallaght",
        "type": "supermarket",
        "retailer": "Lidl",
        "eircode": "D24 Y6W3",
        "lat": 53.2869,
        "lng": -6.3746,
    },
    {
        "external_id": "rp_aldi_clontarf",
        "name": "Aldi Clontarf",
        "type": "supermarket",
        "retailer": "Aldi",
        "eircode": "D03 H2N6",
        "lat": 53.3652,
        "lng": -6.1967,
    },
    {
        "external_id": "rp_dunnes_cornelscourt",
        "name": "Dunnes Stores Cornelscourt",
        "type": "supermarket",
        "retailer": "Dunnes",
        "eircode": "D18 R9K2",
        "lat": 53.2475,
        "lng": -6.1647,
    },
    {
        "external_id": "rp_tesco_clearwater",
        "name": "Tesco Clearwater",
        "type": "supermarket",
        "retailer": "Tesco",
        "eircode": "D15 YR62",
        "lat": 53.3910,
        "lng": -6.3905,
    },
    {
        "external_id": "rp_supervalu_dalkey",
        "name": "SuperValu Dalkey",
        "type": "supermarket",
        "retailer": "SuperValu",
        "eircode": "A96 T2F8",
        "lat": 53.2773,
        "lng": -6.1004,
    },
    # Bottle banks
    {
        "external_id": "rp_bb_sandymount",
        "name": "Sandymount Bottle Bank",
        "type": "bottle_bank",
        "retailer": None,
        "eircode": "D04 P2X6",
        "lat": 53.3286,
        "lng": -6.2177,
    },
    {
        "external_id": "rp_bb_clontarf_seafront",
        "name": "Clontarf Seafront Bottle Bank",
        "type": "bottle_bank",
        "retailer": None,
        "eircode": "D03 X2P6",
        "lat": 53.3659,
        "lng": -6.1856,
    },
    {
        "external_id": "rp_bb_ranelagh",
        "name": "Ranelagh Bottle Bank",
        "type": "bottle_bank",
        "retailer": None,
        "eircode": "D06 K2V3",
        "lat": 53.3250,
        "lng": -6.2520,
    },
    {
        "external_id": "rp_bb_glasnevin",
        "name": "Glasnevin Bottle Bank",
        "type": "bottle_bank",
        "retailer": None,
        "eircode": "D11 K7Y2",
        "lat": 53.3712,
        "lng": -6.2762,
    },
    {
        "external_id": "rp_bb_tymon_park",
        "name": "Tymon Park Bottle Bank",
        "type": "bottle_bank",
        "retailer": None,
        "eircode": "D12 N2T4",
        "lat": 53.3096,
        "lng": -6.3221,
    },
    # Recycling centres
    {
        "external_id": "rp_rc_ringsend",
        "name": "Ringsend Recycling Centre",
        "type": "recycling_centre",
        "retailer": None,
        "eircode": "D04 R2C8",
        "lat": 53.3430,
        "lng": -6.2221,
    },
    {
        "external_id": "rp_rc_ballyogan",
        "name": "Ballyogan Recycling Centre",
        "type": "recycling_centre",
        "retailer": None,
        "eircode": "D18 X8N9",
        "lat": 53.2593,
        "lng": -6.2053,
    },
    {
        "external_id": "rp_rc_coolmine",
        "name": "Coolmine Recycling Centre",
        "type": "recycling_centre",
        "retailer": None,
        "eircode": "D15 C2W5",
        "lat": 53.3720,
        "lng": -6.3830,
    },
]


async def seed_return_points(session: AsyncSession) -> None:
    """
    Seed a realistic set of return points for the MVP demo.

    Idempotent: uses external_id to avoid duplicates.
    """
    existing = (
        await session.execute(select(ReturnPoint.external_id))
    ).scalars().all()
    existing_ids = set(existing or [])

    to_add: list[ReturnPoint] = []
    for rp in RETURN_POINTS_SEED:
        if rp["external_id"] in existing_ids:
            continue
        to_add.append(ReturnPoint(**rp))

    if not to_add:
        return

    session.add_all(to_add)
    await session.commit()


# Demo seeding disabled – wallet shows real transactions only
# Kept for reference; do not call on startup.
async def seed_demo_wallet_transactions(session: AsyncSession) -> None:
    """
    Create a few demo transactions for each user that has no transactions yet.
    Idempotent: if any [DEMO] transactions exist for a user, skip that user.
    DISABLED: Wallet now shows only real transactions from processed collections.
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


