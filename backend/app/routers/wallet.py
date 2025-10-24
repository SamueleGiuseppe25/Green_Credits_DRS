from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.schemas.wallet import WalletOut, TransactionCreate, TransactionOut
from app.auth import get_current_user

router = APIRouter(tags=["Wallet"])

@router.get("/", response_model=WalletOut)
def get_wallet(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@router.post("/add", response_model=TransactionOut)
def add_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    transaction = Transaction(
        wallet_id=wallet.id,
        amount=data.amount,
        type=data.type,
        description=data.description
    )

    if data.type == "credit":
        wallet.balance += data.amount
    elif data.type == "donation":
        wallet.balance -= data.amount

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.refresh(wallet)

    return transaction
