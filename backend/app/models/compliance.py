from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RegulatorPublicKeyResponse(BaseModel):
    country_code: str = Field(..., description="Destination spoke ISO country code")
    regulator_name: str = Field(..., description="Destination statutory regulatory authority")
    compliance_node_id: str = Field(..., description="Unique hardware security module (HSM) compliance node ID")
    public_key_pem: str = Field(..., description="Asymmetric public key (RSA-2048 / X25519 PEM)")
    key_algorithm: str = Field(default="RSA-OAEP-256", description="Asymmetric encryption algorithm")


class PIIEnvelopeEncryptRequest(BaseModel):
    destination_spoke: str = Field(..., min_length=2, max_length=2, description="Destination spoke country code")
    quote_id: str = Field(..., description="Locked FX Quote reference")
    originator_name: str = Field(..., description="Payer legal name for FATF Travel Rule")
    originator_proxy: str = Field(..., description="Payer proxy alias / phone / VPA")
    originator_address: str = Field(..., description="Payer physical residential address / city")
    originator_national_id: str = Field(..., description="Payer national identity / passport / tax number")
    originator_bic: str = Field(..., description="Payer originating financial institution BIC")
    beneficiary_name: str = Field(..., description="Payee legal name")
    beneficiary_proxy: str = Field(..., description="Payee destination proxy")
    beneficiary_bic: str = Field(..., description="Payee destination bank routing BIC")


class PIIEnvelopeEncryptResponse(BaseModel):
    envelope_id: str
    destination_spoke: str
    recipient_regulator_id: str
    encryption_algorithm: str = "RSA-OAEP-256 + AES-256-GCM"
    encrypted_aes_key: str = Field(..., description="Base64 encoded AES key encrypted via regulator RSA public key")
    encrypted_pii_ciphertext: str = Field(..., description="Base64 encoded AES-256-GCM encrypted FATF Travel Rule payload")
    iv: str = Field(..., description="Base64 initialization vector (96-bit GCM nonce)")
    auth_tag: str = Field(..., description="Base64 GCM authentication tag (128-bit integrity tag)")
    envelope_digest: str = Field(..., description="SHA-256 canonical digest of complete envelope")
    created_at: datetime


class PIIEnvelopeDecryptRequest(BaseModel):
    destination_spoke: str
    envelope_id: str
    encrypted_aes_key: str
    encrypted_pii_ciphertext: str
    iv: str
    auth_tag: str


class PIIEnvelopeDecryptResponse(BaseModel):
    is_valid: bool
    envelope_id: str
    originator_name: str
    originator_proxy: str
    originator_address: str
    originator_national_id: str
    originator_bic: str
    beneficiary_name: str
    beneficiary_proxy: str
    beneficiary_bic: str
    fatf_travel_rule_compliant: bool
    decrypted_at: datetime
    error_details: Optional[str] = None
