from fastapi import APIRouter, HTTPException, status
from app.models.compliance import (
    RegulatorPublicKeyResponse,
    PIIEnvelopeEncryptRequest,
    PIIEnvelopeEncryptResponse,
    PIIEnvelopeDecryptRequest,
    PIIEnvelopeDecryptResponse,
    TravelRuleDispatchRequest,
    TravelRuleDispatchResponse,
    EnclaveDecryptionRequest,
    EnclaveDecryptionResponse,
    SanctionsScreeningRequest,
    SanctionsScreeningResponse,
    ComplianceArchivalRequest,
    ComplianceArchivalResponse,
)
from app.services.compliance_service import envelope_service

router = APIRouter()


@router.get(
    "/keys/{spoke_code}",
    response_model=RegulatorPublicKeyResponse,
    summary="Get Regulatory Compliance Public Key for Spoke",
    description="Retrieves the RSA-2048 / ECIES compliance public key of the destination country's statutory authority.",
)
def get_compliance_key(spoke_code: str):
    return envelope_service.get_regulator_key(spoke_code)


@router.post(
    "/encrypt-envelope",
    response_model=PIIEnvelopeEncryptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Encrypt FATF Travel Rule PII Envelope (Step 7)",
    description="Asymmetrically encrypts originator PII using destination regulatory public key. Intermediate hubs remain zero-knowledge.",
)
def encrypt_pii_envelope(payload: PIIEnvelopeEncryptRequest):
    try:
        return envelope_service.encrypt_pii_envelope(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/decrypt-envelope",
    response_model=PIIEnvelopeDecryptResponse,
    summary="Regulatory Compliance Node Decryption (AML/CFT Inspection)",
    description="Simulates statutory regulatory node decrypting the FATF Travel Rule envelope using private key.",
)
def decrypt_pii_envelope(payload: PIIEnvelopeDecryptRequest):
    return envelope_service.decrypt_pii_envelope(payload)


@router.post(
    "/travel-rule/dispatch",
    response_model=TravelRuleDispatchResponse,
    summary="FATF Travel Rule Direct Dispatch (Step 18)",
    description="Delivers the encrypted PII envelope to the recipient nation's Beneficiary Compliance Node, satisfying FATF Recommendation 16 cross-border mandates.",
)
def dispatch_travel_rule(payload: TravelRuleDispatchRequest):
    return envelope_service.dispatch_travel_rule_envelope(payload)


@router.post(
    "/enclave/decrypt",
    response_model=EnclaveDecryptionResponse,
    summary="Private Key Envelope Decryption in Secure Enclave (Step 19)",
    description="The compliance node decrypts the sender's identifying PII using its private key inside a hardware secure enclave for legal AML/CFT inspection.",
)
def execute_enclave_decryption(payload: EnclaveDecryptionRequest):
    return envelope_service.execute_enclave_decryption(payload)


@router.post(
    "/sanctions/screen",
    response_model=SanctionsScreeningResponse,
    summary="Automated Real-Time Sanctions Screening (Step 20)",
    description="Screens decrypted identity against global sanctions watchlists (OFAC, UN, MAS, EU, PEP) and records an immutable cryptographic audit log.",
)
def screen_sanctions(payload: SanctionsScreeningRequest):
    return envelope_service.execute_sanctions_screening(payload)


@router.post(
    "/archival/commit",
    response_model=ComplianceArchivalResponse,
    summary="Compliance Message Archival (Step 22)",
    description="Archives the processed pacs.008 XML, proof public signals, sanctions audit status, and double-entry ledger block for immutable statutory retention.",
)
def archive_compliance_record(payload: ComplianceArchivalRequest):
    return envelope_service.archive_compliance_record(payload)


@router.get(
    "/archival/{uetr}",
    response_model=ComplianceArchivalResponse,
    summary="Retrieve Compliance Archival Record",
    description="Retrieves the immutable compliance audit bundle for a specific transaction UETR.",
)
def get_compliance_archive(uetr: str):
    return envelope_service.get_compliance_archive(uetr)
