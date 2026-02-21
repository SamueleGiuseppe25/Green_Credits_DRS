from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.claims import create_claim as svc_create, get_user_claims as svc_get_mine
from ..schemas import ClaimCreate, ClaimOut

router = APIRouter()


def _to_out(claim) -> dict:
    return {
        "id": claim.id,
        "userId": claim.user_id,
        "description": claim.description,
        "imageUrl": claim.image_url,
        "status": claim.status,
        "adminResponse": claim.admin_response,
        "createdAt": claim.created_at,
        "updatedAt": claim.updated_at,
    }


@router.post("", response_model=ClaimOut, status_code=201)
async def submit_claim(
    payload: ClaimCreate,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    claim = await svc_create(
        session, current_user.id, payload.description, payload.imageUrl
    )
    return _to_out(claim)


@router.get("/me", response_model=list[ClaimOut])
async def get_my_claims(
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    claims = await svc_get_mine(session, current_user.id)
    return [_to_out(c) for c in claims]
