from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProxyResolutionRequest(BaseModel):
    proxy_type: str = Field(..., description="Proxy identifier type (e.g. MOBILE, VPA, EMAIL, NATIONAL_ID, ALIAS)")
    proxy_value: str = Field(..., min_length=2, max_length=100, description="Proxy identifier string")
    destination_country: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="ISO 3166-1 alpha-2 destination country")
    origin_country: Optional[str] = Field(None, min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="Optional ISO 3166-1 alpha-2 origin country")


class ProxyResolutionResponse(BaseModel):
    is_resolved: bool
    proxy_type: str
    proxy_value: str
    destination_country: str
    destination_currency: str
    destination_spoke_scheme: str
    masked_legal_name: str = Field(..., description="Privacy-preserving masked beneficiary legal name (e.g. M** L***)")
    destination_bic: str = Field(..., description="Underlying destination bank identifier code (ISO 9362 BIC / Routing Code)")
    destination_bank_name: str
    masked_account_number: str = Field(..., description="Masked underlying account identifier (e.g. •••-•••-4567)")
    kyc_status: str = Field(default="VERIFIED", description="KYC compliance verification status")
    recipient_compliance_public_key: str = Field(..., description="Destination compliance node public key for FATF envelope encryption")
    resolution_timestamp: datetime
    verification_token: str = Field(..., description="Signed cryptographic resolution token to prevent tampered authorization")
