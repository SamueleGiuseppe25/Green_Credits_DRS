from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.db import get_db_session
from ..services.admin_stats import get_driver_stats
from ..dependencies.auth import CurrentUserDep

router = APIRouter()


@router.get("/driver-stats")
async def driver_stats(
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    # If you already have is_admin on user, you could enforce it here:
    # if not getattr(current_user, "is_admin", False):
    #     raise HTTPException(status_code=403, detail="Admin only")
    return await get_driver_stats(session)
