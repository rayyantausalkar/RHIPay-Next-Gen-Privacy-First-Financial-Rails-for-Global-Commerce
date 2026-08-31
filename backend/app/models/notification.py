from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as DBField


class NotificationRecord(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = DBField(default=None, primary_key=True)
    notification_id: str = DBField(index=True, unique=True)
    user_id: str = DBField(index=True)  # user_id or 'ALL'
    title: str
    message: str
    type: str = "SYSTEM"  # JOURNEY_APPROVAL | JOURNEY_REJECTION | PAYMENT_RECEIVED | PAYMENT_SENT | ADMIN_ALERT | SYSTEM
    is_read: bool = False
    metadata_json: Optional[str] = None
    created_at: datetime = DBField(default_factory=lambda: datetime.now(timezone.utc))


class NotificationResponse(BaseModel):
    id: Optional[int] = None
    notification_id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    metadata_json: Optional[str] = None
    created_at: datetime


class BroadcastNotificationRequest(BaseModel):
    target_user_id: Optional[str] = "ALL"
    title: str = Field(..., min_length=2)
    message: str = Field(..., min_length=2)
    type: str = "ADMIN_ALERT"
