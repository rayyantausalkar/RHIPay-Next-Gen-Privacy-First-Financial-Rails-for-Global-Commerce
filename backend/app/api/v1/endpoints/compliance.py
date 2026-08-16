from fastapi import APIRouter, HTTPException, status
from app.models.compliance import (
    RegulatorPublicKeyResponse,
    PIIEnvelopeEncryptRequest,
    PIIEnvelopeEncryptResponse,
    PIIEnvelopeDecryptRequest,
    PIIEnvelopeDecryptResponse,
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
