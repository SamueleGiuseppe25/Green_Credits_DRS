from fastapi import APIRouter, Header

router = APIRouter()


@router.post("/return")
async def simulate_return(Idempotency_Key: str | None = Header(default=None)):
    return {"receiptId": "rcp_dev", "creditedCents": 0, "newBalanceCents": 0}


