from datetime import datetime
from typing import Optional, Dict, Any, List
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


class TravelRuleDispatchRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    envelope_id: str = Field(..., description="Encrypted PII envelope ID")
    recipient_regulator_id: str = Field(default="MAS-SG-COMPLIANCE-NODE-01", description="Recipient authority compliance node")
    destination_spoke: str = Field(default="SG", description="Destination regulatory jurisdiction")
    origin_spoke: str = Field(default="IN", description="Originating regulatory jurisdiction")
    encrypted_aes_key: str = Field(..., description="Base64 encrypted AES session key")
    encrypted_pii_ciphertext: str = Field(..., description="Base64 encrypted PII payload")
    iv: str = Field(..., description="Base64 IV")
    auth_tag: str = Field(..., description="Base64 Auth tag")
    settlement_id: Optional[str] = Field(default=None, description="Linked settlement ledger reference")


class TravelRuleDispatchResponse(BaseModel):
    receipt_id: str
    uetr: str
    status: str = "FATF_TRAVEL_RULE_DISPATCHED"
    destination_spoke: str
    recipient_regulator_node: str
    compliance_handshake_protocol: str = "mTLS_TLS13_ENVELOPE_RELAY"
    regulatory_acknowledgement_token: str
    fatf_recommendation_16_compliant: bool = True
    sanction_screening_status: str = "CLEARED_PASS"
    decrypted_audit_available: bool = True
    dispatch_latency_ms: float
    dispatched_at: datetime


class SanctionScreeningResult(BaseModel):
    status: str = Field(default="CLEARED_PASS", description="CLEARED_PASS | FLAG_SUSPICIOUS | REJECTED")
    pep_detected: bool = Field(default=False, description="Politically Exposed Person detection")
    risk_score: float = Field(default=0.02, description="Calculated AML risk score (0.00 to 1.00)")
    aml_tier: str = Field(default="TIER_1_VERIFIED", description="AML Verification Tier")


class EnclaveDecryptionRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    envelope_id: str = Field(..., description="Encrypted PII envelope ID")
    destination_spoke: str = Field(default="SG", description="Destination regulatory spoke")
    encrypted_aes_key: str = Field(..., description="Base64 encoded encrypted AES session key")
    encrypted_pii_ciphertext: str = Field(..., description="Base64 encoded encrypted PII ciphertext")
    iv: str = Field(..., description="Base64 initialization vector")
    auth_tag: str = Field(..., description="Base64 GCM auth tag")
    auditor_node_id: Optional[str] = Field(default="MAS-SG-COMPLIANCE-NODE-01", description="Statutory compliance node ID")
    enclave_isolation_mode: Optional[str] = Field(default="HARDWARE_SECURE_ENCLAVE_HSM", description="Isolated hardware enclave execution")


class EnclaveDecryptionResponse(BaseModel):
    attestation_id: str
    uetr: str
    envelope_id: str
    status: str = "ENCLAVE_DECRYPTION_SUCCESS"
    is_valid: bool = True
    originator_name: str
    originator_proxy: str
    originator_address: str
    originator_national_id: str
    originator_bic: str
    beneficiary_name: str
    beneficiary_proxy: str
    beneficiary_bic: str
    fatf_travel_rule_compliant: bool = True
    sanction_screening: SanctionScreeningResult
    auditor_node_id: str
    enclave_security_tier: str = "FIPS_140_2_LEVEL_3_HSM"
    decryption_latency_ms: float
    decrypted_at: datetime


class WatchlistHit(BaseModel):
    list_name: str = Field(..., description="Watchlist source (OFAC_SDN, UN_SANCTIONS, MAS_TERRORISM, EU_CONSOLIDATED, PEP_REGISTER)")
    matched_entity: Optional[str] = Field(default=None, description="Matched entity name if flagged")
    similarity_score: float = Field(default=0.0, description="Fuzzy match percentage (0.0 to 1.0)")
    status: str = Field(default="CLEARED", description="CLEARED | MATCH_CONFIRMED | POTENTIAL_MATCH")


class PepScreeningResult(BaseModel):
    is_pep: bool = Field(default=False, description="Politically Exposed Person flag")
    confidence: float = Field(default=0.0, description="Match confidence")
    details: str = Field(default="No PEP exposure detected")


class SanctionsScreeningRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    originator_name: str = Field(..., description="Originator legal name")
    originator_proxy: str = Field(..., description="Originator proxy identifier")
    originator_national_id: Optional[str] = Field(default=None, description="Originator national ID / Tax ID")
    originator_country: str = Field(default="IN", description="Origin country code")
    beneficiary_name: str = Field(..., description="Beneficiary legal name")
    beneficiary_proxy: str = Field(..., description="Beneficiary proxy identifier")
    beneficiary_country: str = Field(default="SG", description="Beneficiary country code")
    transaction_amount: float = Field(default=45.00, description="Transaction amount")
    currency: str = Field(default="SGD", description="Transaction currency")
    screening_profile: Optional[str] = Field(default="STRICT_GLOBAL_WATCHLISTS", description="Screening profile tier")


class SanctionsScreeningResponse(BaseModel):
    screening_id: str
    uetr: str
    overall_verdict: str = Field(default="CLEARED_PASS", description="CLEARED_PASS | FLAG_SUSPICIOUS | SANCTIONS_HIT_BLOCKED")
    is_cleared: bool = True
    risk_score: float = Field(default=0.02, description="Composite AML risk score (0.00 to 1.00)")
    risk_tier: str = Field(default="LOW_RISK_TIER_1", description="LOW_RISK_TIER_1 | MEDIUM_RISK_TIER_2 | HIGH_RISK_TIER_3 | BLOCKED")
    pep_screening: PepScreeningResult
    watchlist_breakdown: List[WatchlistHit]
    audit_log_id: str
    audit_seal_hash: str
    compliance_officer_bypass_required: bool = False
    screening_latency_ms: float
    screened_at: datetime


class ComplianceArchivalRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    message_id: str = Field(..., description="ISO 20022 Message Identification")
    pacs008_xml: str = Field(..., description="Raw pacs.008.001.10 XML wire payload")
    zk_public_signals: List[str] = Field(..., description="Groth16 ZK proof public signals")
    zk_proof_id: Optional[str] = Field(default=None, description="Groth16 proof identifier")
    merkle_root: str = Field(..., description="KYC participant Merkle state root")
    nullifier_hash: str = Field(..., description="Anti-replay nullifier cryptographic hash")
    travel_rule_receipt_id: str = Field(..., description="FATF Travel Rule dispatch receipt ID")
    regulatory_ack_token: str = Field(..., description="Regulatory node mTLS acknowledgement token")
    enclave_attestation_id: str = Field(..., description="HSM enclave decryption attestation ID")
    sanctions_audit_log_id: str = Field(..., description="Sanctions screening audit log ID")
    sanctions_verdict: str = Field(default="CLEARED_PASS", description="Sanctions evaluation verdict")
    sanctions_seal_hash: str = Field(..., description="Sanctions screening cryptographic seal")
    ledger_commitment_id: str = Field(..., description="Double-entry ledger commitment ID")
    ledger_block_height: int = Field(default=10493, description="Double-entry ledger block sequence")
    retention_period_years: int = Field(default=7, description="Mandatory statutory retention period in years")
    storage_tier: str = Field(default="WORM_COMPLIANT_SECURE_STORAGE", description="Write-Once-Read-Many secure storage tier")


class ComplianceArchivalResponse(BaseModel):
    archive_id: str
    uetr: str
    message_id: str
    status: str = "COMPLIANCE_ARCHIVED_IMMUTABLE"
    archive_seal_hash: str
    worm_retention_until: datetime
    non_repudiation_signature: str
    audit_bundle_size_bytes: int
    persisted_components: Dict[str, bool] = Field(
        default_factory=lambda: {
            "pacs008_xml": True,
            "zk_public_signals": True,
            "travel_rule_envelope": True,
            "sanctions_screening_record": True,
            "double_entry_ledger_block": True,
        }
    )
    archival_latency_ms: float
    archived_at: datetime

