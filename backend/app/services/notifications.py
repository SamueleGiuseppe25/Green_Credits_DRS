from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.notification import Notification


async def create_notification(
    session: AsyncSession, user_id: int | None, title: str, body: str
) -> Notification:
    notification = Notification(user_id=user_id, title=title, body=body)
    session.add(notification)
    await session.commit()
    await session.refresh(notification)
    return notification


async def get_user_notifications(session: AsyncSession, user_id: int) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        .order_by(Notification.created_at.desc())
    )
    return list(result.scalars().all())


async def mark_as_read(
    session: AsyncSession, notification_id: int, user_id: int
) -> Notification | None:
    notification = await session.get(Notification, notification_id)
    if notification is None:
        return None
    if notification.user_id is not None and notification.user_id != user_id:
        return None
    notification.is_read = True
    await session.commit()
    await session.refresh(notification)
    return notification


async def get_all_notifications(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Notification], int]:
    base = select(Notification)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await session.execute(
        base.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), int(total)
