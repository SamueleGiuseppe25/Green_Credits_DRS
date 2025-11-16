from datetime import datetime

from sqlalchemy import ForeignKey, String, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    collection_id: Mapped[int] = mapped_column(nullable=False, index=True)


    store_chain: Mapped[str] = mapped_column(String(64), nullable=False)
    store_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    voucher_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    proof_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    donated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.utcnow())



