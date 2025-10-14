from sqlalchemy import Column, DateTime, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.services.db import Base

class UserSubscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, default=func.now())
    cancel_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
