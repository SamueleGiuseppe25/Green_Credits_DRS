from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClaimSubmitRequest(BaseModel):
    amountCents: int
    description: Optional[str] = None


class ClaimResponse(BaseModel):
    id: int
    userId: int
    amountCents: int
    description: Optional[str]
    status: str
    submittedAt: datetime
    processedAt: Optional[datetime]
