from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

class ActivateSubscriptionRequest(BaseModel):
    start_date: Optional[date] = None

class SubscriptionStatusResponse(BaseModel):
    is_active: bool
    start_date: Optional[date] = None
    cancel_date: Optional[datetime] = None

    class Config:
        orm_mode = True
