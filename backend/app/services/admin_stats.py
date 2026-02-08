from typing import Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection, ReturnPoint


ZONES = ["North", "South", "East", "West"]


def zone_for_return_point_id(rp_id: int) -> str:
    """
    Very simple demo logic:
    - Distribute return points into 4 zones based on their ID.
    - In a real system this would be a real 'zone' field in the DB.
    """
    idx = (rp_id - 1) % len(ZONES)
    return ZONES[idx]


async def get_driver_stats(session: AsyncSession) -> Dict[str, Any]:
    """
    Compute per-zone 'driver' stats based on completed collections.

    Assumptions for demo:
    - Each bag collected is worth 50 cents (50 amountCents).
    - The driver earns 10% of that revenue.
    - The company keeps the remaining 90%.
    """

    # Base structure for each zone/driver
    drivers: Dict[str, Dict[str, Any]] = {
        zone: {
            "name": f"{zone} Zone Driver",
            "zone": zone,
            "collections": 0,
            "totalVoucherValueCents": 0,
            "driverEarningsCents": 0,
        }
        for zone in ZONES
    }

    # Get all COMPLETED collections with their return point
    stmt = (
        select(Collection, ReturnPoint)
        .join(ReturnPoint, Collection.return_point_id == ReturnPoint.id)
        .where(Collection.status == "completed")
    )

    result = await session.execute(stmt)

    rows = result.all()

    for col, rp in rows:
        zone = zone_for_return_point_id(rp.id)
        driver = drivers[zone]

        # Demo assumption: each bag is worth 50 cents
        bag_count = col.bag_count or 1
        revenue_cents = bag_count * 50

        driver_earning_cents = int(revenue_cents * 0.10)  # 10%

        driver["collections"] += 1
        driver["totalVoucherValueCents"] += revenue_cents
        driver["driverEarningsCents"] += driver_earning_cents

    # Totals across all drivers
    total_voucher_cents = sum(d["totalVoucherValueCents"] for d in drivers.values())
    total_driver_earnings_cents = sum(d["driverEarningsCents"] for d in drivers.values())
    company_revenue_cents = total_voucher_cents - total_driver_earnings_cents

    return {
        "drivers": list(drivers.values()),
        "totals": {
            "totalVoucherValueCents": total_voucher_cents,
            "driverPayoutsCents": total_driver_earnings_cents,
            "companyRevenueCents": company_revenue_cents,
        },
    }
