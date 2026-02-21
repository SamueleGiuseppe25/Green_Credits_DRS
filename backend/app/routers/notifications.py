from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.notifications import (
    get_user_notifications as svc_get_user_notifications,
    mark_as_read as svc_mark_as_read,
)
from ..schemas import NotificationOut

router = APIRouter()


def _to_out(n) -> dict:
    return {
        "id": n.id,
        "userId": n.user_id,
        "title": n.title,
        "body": n.body,
        "isRead": n.is_read,
        "createdAt": n.created_at,
    }


@router.get("/me", response_model=list[NotificationOut])
async def get_my_notifications(
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    items = await svc_get_user_notifications(session, current_user.id)
    return [_to_out(n) for n in items]


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: int,
    current_user: CurrentUserDep,
    session: AsyncSession = Depends(get_db_session),
):
    n = await svc_mark_as_read(session, notification_id, current_user.id)
    if n is None:
        raise HTTPException(status_code=404, detail="Notification not found or not yours")
    return _to_out(n)
