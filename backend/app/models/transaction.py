from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as DBField


class TransactionRecord(SQLModel, table=True):
    __tablename__ = "transactions"

    id: Optional[int] = DBField(default=None, primary_key=True)
    transaction_id: str = DBField(index=True, unique=True)
    uetr: str = DBField(index=True)
    sender_user_id: str = DBField(index=True)
    sender_name: str
    sender_proxy: str
    sender_country: str
    sender_currency: str
    sender_amount: float
    sender_account_number: str = ""
    recipient_user_id: Optional[str] = DBField(default=None, index=True)
    recipient_name: str
    recipient_proxy: str
    recipient_country: str
    recipient_currency: str
    recipient_amount: float
    recipient_account_number: str = ""
    exchange_rate: float
    purpose_code: str = "P2P_TRANSFER"
    status: str = "SETTLED"  # SETTLED | PROCESSING | FAILED
    category: str = "TRANSFER"  # TRANSFER | JOURNEY_ALLOCATION | JOURNEY_CANCELLATION_REFUND
    iso_status: str = "ACCP_SETTLED_FUNDS_AVAILABLE"
    note: Optional[str] = None
    created_at: datetime = DBField(default_factory=lambda: datetime.now(timezone.utc))


class TransactionResponse(BaseModel):
    id: Optional[int] = None
    transaction_id: str
    uetr: str
    sender_user_id: str
    sender_name: str
    sender_proxy: str
    sender_country: str
    sender_currency: str
    sender_amount: float
    sender_account_number: str
    recipient_user_id: Optional[str] = None
    recipient_name: str
    recipient_proxy: str
    recipient_country: str
    recipient_currency: str
    recipient_amount: float
    recipient_account_number: str
    exchange_rate: float
    purpose_code: str
    status: str
    category: str
    iso_status: str
    note: Optional[str] = None
    created_at: datetime


class TransferExecuteRequest(BaseModel):
    sender_user_id: str
    recipient_proxy: str
    recipient_name: str
    destination_country: str
    destination_currency: str
    requested_amount: float = Field(..., gt=0, description="Amount in destination currency")
    reference_id: Optional[str] = None
    purpose_code: Optional[str] = "P2P_TRANSFER"
    note: Optional[str] = None
    upi_pin: Optional[str] = None


class TransferExecuteResponse(BaseModel):
    success: bool
    transaction: TransactionResponse
    sender_wallet_balance: float
    sender_travel_wallet_balance: float
    recipient_wallet_balance: float
    message: str


class JourneyCancelRequest(BaseModel):
    user_id: Optional[str] = None
    cancellation_reason: Optional[str] = "Trip Cancelled by User"


class JourneyCancelResponse(BaseModel):
    success: bool
    user_id: str
    gross_refund_home: float
    penalty_fee_home: float
    net_refund_home: float
    home_currency: str
    new_wallet_balance: float
    message: str
