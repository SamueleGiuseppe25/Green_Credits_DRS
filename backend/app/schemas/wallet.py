from pydantic import BaseModel
from datetime import datetime
from typing import List


class Transaction(BaseModel):
    id: int
    ts: datetime
    kind: str
    amountCents: int
    note: str | None = None


class WalletBalanceResponse(BaseModel):
    balanceCents: int
    lastUpdated: datetime


class WalletHistoryResponse(BaseModel):
    items: List[Transaction]
    total: int
    page: int
    pageSize: int
