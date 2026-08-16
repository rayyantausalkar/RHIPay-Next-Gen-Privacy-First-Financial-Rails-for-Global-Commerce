from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict
from pydantic import BaseModel, Field


class PayloadValidationRequest(BaseModel):
    raw_payload: str = Field(..., min_length=5, description="Raw payment URI (rhipay://pay?...) or JSON payload to ingest and validate")


class ValidationChecks(BaseModel):
    schema_compliance: bool = Field(..., description="ISO 20022 and RHIPay protocol structure check")
    signature_integrity: bool = Field(..., description="Cryptographic HMAC/ECDSA digital signature check")
    expiry_validity: bool = Field(..., description="Time-To-Live freshness & expiration check")
    proxy_standard: bool = Field(..., description="Destination spoke proxy normalization check")


class PayloadValidationResponse(BaseModel):
    is_valid: bool
    signature_verified: bool
    is_expired: bool
    reference_id: str
    recipient_name: str
    proxy_type: str
    proxy_value: str
    destination_country: str
    destination_currency: str
    origin_spoke: Optional[str] = None
    requested_amount: Decimal
    currency_decimals: int
    amount_in_minor_units: int
    expires_at: datetime
    purpose_code: str = "P2P_TRANSFER"
    note: Optional[str] = None
    recipient_public_key: Optional[str] = None
    payload_digest: str = Field(..., description="SHA-256 digest of canonical payment parameters")
    signature: str = Field(..., description="HMAC-SHA256 signature verifying unaltered integrity")
    validation_checks: ValidationChecks
    error_details: Optional[str] = None
