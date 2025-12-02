from datetime import time, datetime

from sqlalchemy import SmallInteger, Time, String
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class CollectionSlot(Base):
    __tablename__ = "collection_slots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False, index=True)

    weekday: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    preferred_return_point_id: Mapped[int | None] = mapped_column(nullable=True)
    frequency: Mapped[str] = mapped_column(String(16), nullable=False, default="weekly")

    created_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(nullable=False, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())



