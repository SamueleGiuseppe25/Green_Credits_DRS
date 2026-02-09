from datetime import datetime, date, time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ReturnPoint(BaseModel):
    id: int
    name: str
    type: str
    eircode: Optional[str] = None
    retailer: Optional[str] = None
    lat: float
    lng: float


class ReturnPointsResponse(BaseModel):
    items: List[ReturnPoint]
    total: int


class WalletBalanceResponse(BaseModel):
    balanceCents: int
    lastUpdated: datetime


class Transaction(BaseModel):
    id: int
    ts: datetime
    kind: str
    amountCents: int
    note: Optional[str] = None


class WalletHistoryResponse(BaseModel):
    items: List[Transaction]
    total: int
    page: int
    pageSize: int


class Subscription(BaseModel):
    status: str
    planCode: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    currentPeriodStart: Optional[date] = None
    currentPeriodEnd: Optional[date] = None


class CollectionSlot(BaseModel):
    weekday: int
    startTime: str
    endTime: str
    preferredReturnPointId: Optional[int] = None
    frequency: str = "weekly"

class CollectionSlotOut(CollectionSlot):
    enabled: bool


class Collection(BaseModel):
    id: int
    userId: int
    scheduledAt: datetime
    returnPointId: int
    status: str
    bagCount: Optional[int] = Field(default=1)
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False

# Registration
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

# --- Auth Schemas (for JWT endpoints) ---
#This line is commented out because the auth schemas are not used in the current implementation
# from .schemas.auth import LoginRequest, TokenResponse, UserOut
# if you need to use them, uncomment the line below
# from .schemas.auth import LoginRequest, TokenResponse, UserOut







