from datetime import date, datetime

from sqlalchemy import String, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(index=True, nullable=False)

    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    plan_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)



