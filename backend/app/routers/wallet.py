from fastapi import APIRouter

router = APIRouter()


@router.get("/balance")
async def balance():
    return {"balanceCents": 0, "lastUpdated": "1970-01-01T00:00:00Z"}


@router.get("/history")
async def history(page: int = 1, pageSize: int = 20):
    return {"items": [], "total": 0, "page": page, "pageSize": pageSize}


