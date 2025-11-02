from pydantic import BaseModel
from typing import List


class ReturnPoint(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    externalId: str


class ReturnPointListResponse(BaseModel):
    items: List[ReturnPoint]
