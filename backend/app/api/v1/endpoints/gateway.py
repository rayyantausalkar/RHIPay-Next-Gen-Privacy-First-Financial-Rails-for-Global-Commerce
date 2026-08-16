from typing import Optional
from fastapi import APIRouter, Header, status, HTTPException
from app.models.gateway import GatewayIngestRequest, GatewayIngestResponse
from app.services.gateway_service import gateway_service

router = APIRouter()


@router.post(
    "/ingest",
    response_model=GatewayIngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="API Gateway Request Ingestion (Step 9)",
    description="Central API Gateway receives the transmission, verifies idempotency headers, isolates network traffic, and parses the request into financial, routing, and cryptographic payloads.",
)
def ingest_transmission(
    payload: GatewayIngestRequest,
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    x_nexus_spoke: Optional[str] = Header(None, alias="X-Nexus-Spoke"),
    x_nexus_client_version: Optional[str] = Header(None, alias="X-Nexus-Client-Version"),
    x_signature_algorithm: Optional[str] = Header(None, alias="X-Signature-Algorithm"),
):
    try:
        return gateway_service.ingest_request(
            req=payload,
            idempotency_key=x_idempotency_key,
            origin_spoke_header=x_nexus_spoke,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gateway ingestion error: {str(e)}",
        )
