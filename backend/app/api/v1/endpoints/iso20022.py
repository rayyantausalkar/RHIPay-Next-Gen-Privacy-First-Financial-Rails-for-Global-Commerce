from fastapi import APIRouter, HTTPException, status
from app.models.iso20022 import (
    Pacs008AssembleRequest,
    Pacs008MessageResponse,
    Pacs008ValidateRequest,
    Pacs008ValidateResponse,
)
from app.services.iso20022_service import iso20022_service

router = APIRouter()


@router.post(
    "/pacs008/assemble",
    response_model=Pacs008MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assemble ISO 20022 pacs.008.001.10 Transfer Message (Step 8)",
    description="Packages the financial transfer instruction, ZK-SNARK proof, nullifier, and encrypted FATF envelope into a standard pacs.008 ISO 20022 message.",
)
def assemble_pacs008(payload: Pacs008AssembleRequest):
    try:
        return iso20022_service.assemble_pacs008(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/pacs008/validate",
    response_model=Pacs008ValidateResponse,
    summary="Validate ISO 20022 pacs.008 XML Message",
    description="Validates schema and syntax structure of a pacs.008 XML payload.",
)
def validate_pacs008(payload: Pacs008ValidateRequest):
    return iso20022_service.validate_pacs008(payload)
