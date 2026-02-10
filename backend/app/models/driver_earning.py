from datetime import datetime

from sqlalchemy import Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class DriverEarning(Base):
    __tablename__ = "driver_earnings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    driver_id: Mapped[int] = mapped_column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    collection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("collections.id"), nullable=False, unique=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), default=lambda: datetime.utcnow()
    )

