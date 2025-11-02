from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubscriptionActivateRequest(BaseModel):
    planId: int


class SubscriptionCancelRequest(BaseModel):
    reason: Optional[str] = None


class SubscriptionStatusResponse(BaseModel):
    id: int
    userId: int
    active: bool
    planId: int
    startedAt: datetime
    expiresAt: Optional[datetime]
