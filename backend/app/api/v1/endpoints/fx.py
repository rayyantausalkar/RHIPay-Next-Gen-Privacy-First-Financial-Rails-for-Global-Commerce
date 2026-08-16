from fastapi import APIRouter, HTTPException, status
from app.models.fx_quote import (
    FXQuoteLockRequest,
    FXQuoteResponse,
    FXQuoteVerifyRequest,
    FXQuoteVerifyResponse,
)
from app.services.fx_service import fx_service

router = APIRouter()


@router.post(
    "/quotes/lock",
    response_model=FXQuoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Lock Guaranteed FX Quote with Zero Slippage (Step 4)",
    description="Requests a locked foreign exchange rate from the liquidity provider with a defined TTL window (e.g., 60 seconds) and guaranteed zero slippage.",
)
def lock_fx_quote(payload: FXQuoteLockRequest):
    try:
        return fx_service.lock_quote(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/quotes/{quote_id}/verify",
    response_model=FXQuoteVerifyResponse,
    summary="Verify Locked FX Quote and TTL Freshness",
    description="Verifies the cryptographic integrity and active TTL status of a locked FX quote.",
)
def verify_fx_quote(quote_id: str, payload: FXQuoteVerifyRequest):
    return fx_service.verify_quote(quote_id)
