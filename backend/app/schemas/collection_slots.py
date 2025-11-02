from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CollectionSlot(BaseModel):
    id: int
    userId: int
    returnPointId: int
    weekday: str
    timeWindow: str
    createdAt: datetime
    updatedAt: datetime


class CollectionSlotUpdateRequest(BaseModel):
    returnPointId: Optional[int] = None
    weekday: Optional[str] = None
    timeWindow: Optional[str] = None


class CollectionSlotResponse(BaseModel):
    id: int
    userId: int
    returnPointId: int
    weekday: str
    timeWindow: str
    createdAt: datetime
    updatedAt: datetime
