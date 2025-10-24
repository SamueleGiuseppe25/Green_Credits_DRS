from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float
    type: str
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

class WalletOut(BaseModel):
    id: str
    balance: float
    transactions: List[TransactionOut] = []

    class Config:
        orm_mode = True
