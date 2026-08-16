from fastapi import APIRouter, HTTPException, status
from app.models.payment_request import (
    ProxyValidationRequest,
    ProxyValidationResponse,
)
from app.models.proxy_resolution import (
    ProxyResolutionRequest,
    ProxyResolutionResponse,
)
from app.services.proxy_service import ProxyService

router = APIRouter()


@router.post(
    "/resolve",
    response_model=ProxyResolutionResponse,
    summary="Resolve Proxy Alias to Bank Routing Code & Masked Name (Step 2)",
    description="Resolves recipient proxy alias to underlying bank institution routing code (BIC) and returns a privacy-preserving masked legal name.",
)
def resolve_proxy_alias(payload: ProxyResolutionRequest):
    try:
        return ProxyService.resolve_proxy_alias(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.post(
    "/validate",
    response_model=ProxyValidationResponse,
    summary="Validate Recipient Proxy Identifier",
    description="Validates and normalizes proxy identifiers across domestic schemes.",
)
def validate_proxy(payload: ProxyValidationRequest):
    return ProxyService.validate_proxy(
        proxy_type=payload.proxy_type,
        proxy_value=payload.proxy_value,
        country=payload.country,
    )
