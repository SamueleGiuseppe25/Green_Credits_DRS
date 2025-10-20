from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from ..services.db import Base


class ReturnPoint(Base):
    __tablename__ = "return_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    eircode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    retailer: Mapped[str | None] = mapped_column(String(128), nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)


