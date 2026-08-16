from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ProxyType(str, Enum):
    MOBILE = "MOBILE"
    VPA = "VPA"                  # UPI Virtual Payment Address (e.g., user@bank)
    EMAIL = "EMAIL"
    NATIONAL_ID = "NATIONAL_ID"  # NRIC / Aadhaar / Thai ID / Passport / Emirates ID
    UEN = "UEN"                  # Unique Entity Number / Commercial Registry
    IBAN = "IBAN"
    ALIAS = "ALIAS"


class RequestStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SCANNED = "SCANNED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class DynamicQRCreateRequest(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=100, description="Recipient or Merchant display name")
    recipient_proxy_type: str = Field(default="MOBILE", description="Proxy identifier type (e.g. MOBILE, VPA, EMAIL, IBAN, ALIAS)")
    recipient_proxy_value: str = Field(..., min_length=2, max_length=100, description="Proxy identifier value")
    destination_country: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="ISO 3166-1 alpha-2 country code (e.g. SG, IN, AE, US, GB, JP)")
    destination_currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$", description="ISO 4217 currency code (e.g. SGD, INR, AED, USD, EUR, JPY)")
    requested_amount: Decimal = Field(..., gt=0, decimal_places=4, description="Requested amount in destination currency")
    origin_spoke: Optional[str] = Field(None, min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="Optional Originating Country Spoke")
    note: Optional[str] = Field(None, max_length=200, description="Payment note / invoice reference")
    expiry_seconds: Optional[int] = Field(900, ge=60, le=86400, description="QR code validity duration in seconds")
    purpose_code: Optional[str] = Field("P2P_TRANSFER", description="ISO 20022 Purpose Code")
    recipient_public_key: Optional[str] = Field(None, description="Public key for FATF encrypted envelope")


# Alias for backward compatibility
DynamicPaymentRequestCreate = DynamicQRCreateRequest


class QRPayloadData(BaseModel):
    version: str = "2.0"
    scheme: str = "rhipay"
    reference_id: str
    recipient_name: str
    proxy_type: str
    proxy_value: str
    destination_country: str
    destination_currency: str
    origin_spoke: Optional[str] = None
    requested_amount: str
    amount_in_minor_units: int
    decimals: int
    expires_at: str
    purpose_code: str
    note: Optional[str] = None
    recipient_public_key: Optional[str] = None


class DynamicPaymentRequestResponse(BaseModel):
    reference_id: str = Field(..., description="Unique payment request identifier (e.g. RHIPAY-REQ-...)")
    status: RequestStatus
    recipient_name: str
    recipient_proxy_type: str
    recipient_proxy_value: str
    destination_country: str = Field(..., min_length=2, max_length=2, description="ISO 3166-1 alpha-2 destination country")
    destination_currency: str = Field(..., min_length=3, max_length=3, description="ISO 4217 destination currency")
    origin_spoke: Optional[str] = None
    requested_amount: Decimal
    amount_in_cents: int = Field(..., description="Scaled integer representation in minor currency units")
    currency_decimals: int = Field(default=2)
    note: Optional[str] = None
    purpose_code: str
    recipient_public_key: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    qr_payload: str = Field(..., description="Standardized machine-readable URI payload")
    qr_payload_json: QRPayloadData = Field(..., description="Structured machine-readable payload")
    qr_code_base64: str = Field(..., description="Base64 encoded PNG Data URI of the generated QR code")
    time_remaining_seconds: int


class ProxyValidationRequest(BaseModel):
    proxy_type: str
    proxy_value: str
    country: str = Field(..., min_length=2, max_length=2, description="ISO 3166-1 alpha-2 country code")


class ProxyValidationResponse(BaseModel):
    is_valid: bool
    formatted_value: str
    proxy_type: str
    country: str
    error_message: Optional[str] = None
