from typing import Tuple, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ReturnPoint


async def list_return_points(
    session: AsyncSession,
    chain: str | None,
    q: str | None,
    page: int,
    page_size: int,
    near: tuple[float, float] | None = None,
) -> Tuple[List[ReturnPoint], int]:
    stmt = select(ReturnPoint)
    if chain:
        stmt = stmt.where(ReturnPoint.retailer == chain)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (ReturnPoint.name.ilike(like))
            | (ReturnPoint.eircode.ilike(like))
            | (ReturnPoint.retailer.ilike(like))
        )

    total = await session.scalar(select(func.count()).select_from(stmt.subquery()))

    # Basic nearest: order by squared distance if near provided
    if near is not None:
        lat, lng = near
        # naive Euclidean in lat/lng degrees is sufficient for MVP sorting over city-scale distances
        stmt = stmt.order_by(((ReturnPoint.lat - lat) * (ReturnPoint.lat - lat) + (ReturnPoint.lng - lng) * (ReturnPoint.lng - lng)))

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await session.execute(stmt)).scalars().all()
    return rows, int(total or 0)



