from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.claim import Claim


async def create_claim(
    session: AsyncSession, user_id: int, description: str, image_url: str | None
) -> Claim:
    claim = Claim(user_id=user_id, description=description, image_url=image_url)
    session.add(claim)
    await session.commit()
    await session.refresh(claim)
    return claim


async def get_user_claims(session: AsyncSession, user_id: int) -> list[Claim]:
    result = await session.execute(
        select(Claim).where(Claim.user_id == user_id).order_by(Claim.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_claims(
    session: AsyncSession,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Claim], int]:
    base = select(Claim)
    if status:
        base = base.where(Claim.status == status)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await session.execute(
        base.order_by(Claim.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), int(total)


async def update_claim_status(
    session: AsyncSession,
    claim_id: int,
    status: str,
    admin_response: str | None,
) -> Claim | None:
    claim = await session.get(Claim, claim_id)
    if claim is None:
        return None
    claim.status = status
    if admin_response is not None:
        claim.admin_response = admin_response
    claim.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(claim)
    return claim
