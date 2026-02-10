from datetime import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class DriverPayout(Base):
    __tablename__ = "driver_payouts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    driver_id: Mapped[int] = mapped_column(Integer, ForeignKey("drivers.id"), nullable=False, index=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), default=lambda: datetime.utcnow()
    )

