from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import SQLModel, Field as DBField


# Database Table Model for Persistent User Accounts
class UserRecord(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = DBField(default=None, primary_key=True)
    user_id: str = DBField(index=True, unique=True)
    email: str = DBField(index=True, unique=True)
    hashed_password: str
    salt: str
    name: str
    contact_number: str
    home_country: str
    bank_name: str
    bic: Optional[str] = None
    account_type: str = "INDIVIDUAL"  # INDIVIDUAL | MERCHANT
    preferred_currency: str = "USD"
    proxy_type: str = "MOBILE"
    proxy_value: str = ""
    kyc_status: str = "VERIFIED"  # VERIFIED | PENDING | TIER_1
    created_at: datetime = DBField(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


# Pydantic Schemas for API Requests & Responses
class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Legal Name")
    contact_number: str = Field(..., min_length=5, max_length=30, description="Contact Number with Dial Code")
    home_country: str = Field(..., min_length=2, max_length=2, description="2-letter ISO Country Code")
    bank_name: str = Field(..., min_length=2, max_length=100, description="Clearing Member Bank Name")
    email: str = Field(..., pattern=r"^[\w\.\+\-]+@[\w\.-]+\.\w{2,}$", description="Valid Email Address")
    password: str = Field(..., min_length=6, description="Set Password")
    confirm_password: str = Field(..., min_length=6, description="Re-type Password")
    account_type: Optional[str] = Field(default="INDIVIDUAL", description="INDIVIDUAL or MERCHANT")
    preferred_currency: Optional[str] = Field(default=None, description="Preferred Settlement Currency")
    proxy_type: Optional[str] = Field(default=None, description="Preferred Proxy Type: MOBILE, EMAIL, VPA, IBAN")
    proxy_value: Optional[str] = Field(default=None, description="Custom Proxy Identifier (optional)")


class UserLoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.\+\-]+@[\w\.-]+\.\w{2,}$", description="Registered Email Address")
    password: str = Field(..., min_length=1, description="Account Password")


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    contact_number: str
    home_country: str
    bank_name: str
    bic: Optional[str] = None
    account_type: str
    preferred_currency: str
    proxy_type: str
    proxy_value: str
    kyc_status: str
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: str = "Authentication successful"


class BankInfo(BaseModel):
    name: str
    bic: str
    country_code: str
    popular: bool = False


class BankDirectoryResponse(BaseModel):
    banks: Dict[str, List[BankInfo]]
    total_countries: int
