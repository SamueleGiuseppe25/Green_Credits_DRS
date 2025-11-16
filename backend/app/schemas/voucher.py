# backend/app/schemas/vouchers.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class VoucherUpdateProofRequest(BaseModel):
    proofUrl: Optional[str] = None
    donated: Optional[bool] = None

class VoucherResponse(BaseModel):
    id: int
    userId: int
    amountCents: int
    voucherCode: str | None
    proofUrl: str | None
    donated: bool
    createdAt: datetime
    updatedAt: datetime

class VoucherListResponse(BaseModel):
    items: List[VoucherResponse]
    total: int
