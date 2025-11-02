from fastapi import APIRouter, Query, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from ..services.db import get_db_session
from ..services.return_points import list_return_points as svc_list
from app.schemas.return_points import ReturnPointListResponse as ReturnPointsResponse, ReturnPoint as ReturnPointSchema


router = APIRouter()


@router.get("", response_model=ReturnPointsResponse)
async def list_return_points_endpoint(
    chain: str | None = Query(default=None),
    q: str | None = Query(default=None),
    near: str | None = Query(default=None, description="lat,lng"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_db_session),
):
    rows, total = await svc_list(session, chain, q, page, pageSize)
    items = [
        ReturnPointSchema(
            id=r.id,
            name=r.name,
            type=r.type,
            eircode=r.eircode,
            retailer=r.retailer,
            lat=r.lat,
            lng=r.lng,
        )
        for r in rows
    ]
    return {"items": items, "total": total}


