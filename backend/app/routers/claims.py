from fastapi import APIRouter, UploadFile, File, Form
from app.schemas.claims import ClaimSubmitRequest, ClaimResponse

router = APIRouter()


@router.post("/submit", status_code=202)
async def submit_claim(image: UploadFile = File(...), note: str | None = Form(default=None)):
    return {
        "claimId": "clm_dev",
        "status": "Pending",
        "parsed": {"receiptId": None, "retailer": None, "amountCents": None, "ts": None},
    }


