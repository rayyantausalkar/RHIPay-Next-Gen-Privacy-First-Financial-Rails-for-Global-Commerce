from fastapi import APIRouter, HTTPException, status
from app.models.routing import (
    SupplementaryDataRouteRequest,
    SupplementaryDataRouteResponse,
)
from app.services.routing_service import routing_service

router = APIRouter()


@router.post(
    "/supplementary-data/dispatch",
    response_model=SupplementaryDataRouteResponse,
    status_code=status.HTTP_200_OK,
    summary="Supplementary Data Routing (Step 10)",
    description="Extracts ZK-proof, nullifier, and encrypted envelope from ISO 20022 Supplementary Data and dispatches to specialized non-blocking verification pipelines.",
)
def dispatch_supplementary_data(payload: SupplementaryDataRouteRequest):
    try:
        return routing_service.dispatch_supplementary_data(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supplementary data routing error: {str(e)}",
        )
