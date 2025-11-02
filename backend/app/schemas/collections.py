from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CreateCollectionRequest(BaseModel):
    scheduledAt: str
    returnPointId: int
    bagCount: Optional[int] = 1
    notes: Optional[str] = None


class CollectionResponse(BaseModel):
    id: int
    userId: int
    scheduledAt: datetime
    returnPointId: int
    status: str
    bagCount: int
    notes: Optional[str]
    createdAt: datetime
    updatedAt: datetime


class CollectionListResponse(BaseModel):
    items: List[CollectionResponse]
    total: int
    page: int
    pageSize: int
