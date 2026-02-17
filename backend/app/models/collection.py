from datetime import datetime

from sqlalchemy import String, DateTime, Integer, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False, index=True)
    return_point_id: Mapped[int] = mapped_column(nullable=False, index=True)
    collection_slot_id: Mapped[int | None] = mapped_column(nullable=True, index=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True, default="scheduled")

    bag_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    driver_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    proof_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    voucher_amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.utcnow(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )



