# backend/app/routers/vouchers.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.services.db import get_db_session
from app.dependencies.auth import CurrentUserDep
from app.models.voucher import Voucher
from app.schemas.voucher import (
    VoucherUpdateProofRequest, VoucherResponse, VoucherListResponse
)
from app.services.vouchers import update_voucher_proof_or_donation

router = APIRouter()

def to_vo(v: Voucher) -> VoucherResponse:
    return VoucherResponse(
        id=v.id,
        userId=v.user_id,
        amountCents=v.amount_cents,
        voucherCode=v.voucher_code,
        proofUrl=v.proof_url,
        donated=v.donated,
        createdAt=v.created_at,
        updatedAt=v.updated_at,
    )

@router.get("/me", response_model=VoucherListResponse)
async def list_my_vouchers(
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
):
    base = select(Voucher).where(Voucher.user_id == current_user.id)
    total = await session.scalar(select(func.count()).select_from(base.subquery()))
    rows = (await session.execute(
        base.order_by(Voucher.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize)
    )).scalars().all()

    return VoucherListResponse(
        items=[to_vo(v) for v in rows],
        total=int(total or 0),
    )

@router.patch("/{id}/proof", response_model=VoucherResponse)
async def update_proof(
    id: int,
    payload: VoucherUpdateProofRequest,
    current_user: CurrentUserDep = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    v = await update_voucher_proof_or_donation(
        session,
        user_id=current_user.id,
        voucher_id=id,
        proof_url=payload.proofUrl,
        donated=payload.donated,
    )
    if v is None:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return to_vo(v)
