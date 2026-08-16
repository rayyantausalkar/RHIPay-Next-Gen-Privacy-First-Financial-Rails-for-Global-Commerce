from typing import List, Optional
from pydantic import BaseModel, Field


class SpokeNetworkConfig(BaseModel):
    country_code: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$", description="ISO 3166-1 alpha-2 country code")
    country_name: str = Field(..., description="Country name")
    currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$", description="ISO 4217 currency code")
    flag_emoji: str = Field(..., description="Flag emoji")
    ips_scheme_name: str = Field(..., description="Domestic Instant Payment System (IPS) name")
    supported_proxy_types: List[str] = Field(default_factory=lambda: ["MOBILE", "EMAIL", "VPA", "NATIONAL_ID", "ALIAS", "IBAN"])
    currency_decimals: int = Field(default=2, ge=0, le=4)
    active: bool = True
    default_proxy_example: Optional[str] = None


class SpokeRegisterRequest(BaseModel):
    country_code: str = Field(..., min_length=2, max_length=2, pattern="^[A-Z]{2}$")
    country_name: str
    currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    flag_emoji: str
    ips_scheme_name: str
    supported_proxy_types: Optional[List[str]] = None
    currency_decimals: Optional[int] = 2
    default_proxy_example: Optional[str] = None


class SpokeListResponse(BaseModel):
    spokes: List[SpokeNetworkConfig]
    total_active_spokes: int
