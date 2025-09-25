from fastapi import APIRouter, Query

router = APIRouter()


@router.get("")
async def list_return_points(
    bbox: str | None = Query(default=None, description='minLng,minLat,maxLng,maxLat'),
    type: str | None = Query(default=None),
    openNow: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=100, ge=1, le=500),
):
    return {"items": [], "total": 0}


