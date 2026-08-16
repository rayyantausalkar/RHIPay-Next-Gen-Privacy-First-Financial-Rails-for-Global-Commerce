from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class FXQuoteLockRequest(BaseModel):
    origin_currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$", description="ISO 4217 currency to debit from sender")
    destination_currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$", description="ISO 4217 currency to credit to recipient")
    destination_amount: Decimal = Field(..., gt=0, decimal_places=4, description="Exact amount required in destination currency")
    sender_spoke: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="Sender domestic spoke ISO country code")
    recipient_spoke: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="Recipient domestic spoke ISO country code")
    ttl_seconds: Optional[int] = Field(60, ge=10, le=300, description="Guaranteed quote validity window in seconds")


class FXQuoteResponse(BaseModel):
    quote_id: str = Field(..., description="Unique locked FX quote identifier (e.g. RHIPAY-FXQ-...)")
    origin_currency: str
    destination_currency: str
    fx_rate: Decimal = Field(..., description="Locked exchange rate: 1 Unit Dest Currency = fx_rate Origin Currency")
    inverse_fx_rate: Decimal = Field(..., description="Inverse exchange rate: 1 Unit Origin = inverse_fx_rate Dest")
    destination_amount: Decimal = Field(..., description="Exact credit amount in destination currency")
    origin_debit_amount: Decimal = Field(..., description="Exact locked debit amount in origin currency")
    destination_amount_in_cents: int
    origin_debit_amount_in_cents: int
    origin_decimals: int
    destination_decimals: int
    fx_markup_bps: int = Field(default=5, description="Transparent Nexus bilateral spread in basis points (5 bps = 0.05%)")
    fx_provider_id: str = Field(..., description="Bilateral Liquidity Provider Identifier (FXP)")
    fx_provider_name: str
    created_at: datetime
    expires_at: datetime
    ttl_remaining_seconds: int
    quote_signature: str = Field(..., description="HMAC cryptographic digital signature over locked FX parameters")
    slippage_protection: bool = Field(default=True, description="Guaranteed zero-slippage commitment")


class FXQuoteVerifyRequest(BaseModel):
    quote_id: str


class FXQuoteVerifyResponse(BaseModel):
    is_valid: bool
    signature_verified: bool
    is_expired: bool
    quote_id: str
    origin_currency: str
    destination_currency: str
    fx_rate: Decimal
    destination_amount: Decimal
    origin_debit_amount: Decimal
    ttl_remaining_seconds: int
    error_details: Optional[str] = None
