from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as DBField


class JourneyRequestRecord(SQLModel, table=True):
    __tablename__ = "journey_requests"

    id: Optional[int] = DBField(default=None, primary_key=True)
    request_id: str = DBField(index=True, unique=True)
    user_id: str = DBField(index=True)
    user_name: str
    user_email: str
    home_country: str
    home_currency: str
    bank_name: str
    destination_country: str
    destination_currency: str
    purpose_of_travel: str
    start_date: str
    end_date: str
    home_amount_requested: float
    destination_amount_calculated: float
    exchange_rate: float
    passport_data_url: Optional[str] = None
    passport_filename: Optional[str] = None
    status: str = "PENDING"  # PENDING | APPROVED | REJECTED
    rejection_reason: Optional[str] = None
    created_at: datetime = DBField(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None


class JourneyCreateRequest(BaseModel):
    user_id: str
    destination_country: str
    purpose_of_travel: str
    start_date: str
    end_date: str
    home_amount_requested: float = Field(..., gt=0, description="Amount in home country currency")
    passport_data_url: Optional[str] = None
    passport_filename: Optional[str] = None


class JourneyResponse(BaseModel):
    id: Optional[int] = None
    request_id: str
    user_id: str
    user_name: str
    user_email: str
    home_country: str
    home_currency: str
    bank_name: str
    destination_country: str
    destination_currency: str
    purpose_of_travel: str
    start_date: str
    end_date: str
    home_amount_requested: float
    destination_amount_calculated: float
    exchange_rate: float
    passport_data_url: Optional[str] = None
    passport_filename: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None


class JourneyApproveRequest(BaseModel):
    admin_email: str = "admin.rhipay@gmail.com"
    custom_amount_approved: Optional[float] = None
    notes: Optional[str] = None


class JourneyRejectRequest(BaseModel):
    admin_email: str = "admin.rhipay@gmail.com"
    rejection_reason: str = Field(..., min_length=5, description="Compulsory reason for rejection")
