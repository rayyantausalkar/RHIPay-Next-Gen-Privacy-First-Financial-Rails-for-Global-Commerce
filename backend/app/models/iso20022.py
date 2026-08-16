from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class Pacs008AssembleRequest(BaseModel):
    quote_id: str = Field(..., description="Locked FX Quote ID")
    sender_proxy: str = Field(..., description="Sender proxy alias")
    sender_spoke: str = Field(..., min_length=2, max_length=2, description="Sender spoke country code")
    sender_currency: str = Field(..., min_length=3, max_length=3, description="Sender home currency")
    sender_bic: str = Field(..., description="Sender originating institution BIC")
    recipient_proxy: str = Field(..., description="Recipient proxy alias")
    recipient_spoke: str = Field(..., min_length=2, max_length=2, description="Recipient spoke country code")
    recipient_currency: str = Field(..., min_length=3, max_length=3, description="Recipient destination currency")
    recipient_bic: str = Field(..., description="Recipient destination institution BIC")
    recipient_name: str = Field(..., description="Recipient masked legal name")
    destination_amount: float = Field(..., gt=0, description="Amount to credit recipient in destination currency")
    origin_debit_amount: float = Field(..., gt=0, description="Amount to debit sender in origin currency")
    fx_rate: float = Field(..., gt=0, description="Guaranteed FX rate multiplier")
    zk_proof: Dict[str, Any] = Field(..., description="Client-side Groth16 proof points and public signals")
    nullifier_hash: str = Field(..., description="Poseidon anti-replay nullifier hash")
    encrypted_envelope: Dict[str, Any] = Field(..., description="FATF Travel Rule encrypted PII envelope")
    purpose_code: str = Field(default="P2PR", description="ISO 20022 purpose code (e.g. P2PR for P2P Transfer)")
    payment_note: Optional[str] = Field(None, description="Optional remittance narrative")


class Pacs008MessageResponse(BaseModel):
    message_id: str
    uetr: str = Field(..., description="RFC 4122 UUID v4 Unique End-to-End Transaction Reference")
    end_to_end_id: str
    message_type: str = "pacs.008.001.10"
    settlement_method: str = "CLRG"
    clearing_system: str = "NEXUS"
    instructed_amount: float
    instructed_currency: str
    settlement_amount: float
    settlement_currency: str
    exchange_rate: float
    xml_payload: str = Field(..., description="Standard ISO 20022 XML document with ZKP Supplementary Data")
    canonical_json: Dict[str, Any]
    is_valid: bool
    created_at: datetime


class Pacs008ValidateRequest(BaseModel):
    xml_payload: str


class Pacs008ValidateResponse(BaseModel):
    schema_valid: bool
    message_type: str = "pacs.008.001.10"
    details: Optional[str] = None
