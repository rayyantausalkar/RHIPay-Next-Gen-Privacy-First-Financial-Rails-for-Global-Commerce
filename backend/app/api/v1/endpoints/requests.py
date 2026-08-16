from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from app.models.payment_request import (
    DynamicQRCreateRequest,
    DynamicPaymentRequestResponse,
)
from app.models.payload_validation import (
    PayloadValidationRequest,
    PayloadValidationResponse,
)
from app.services.request_service import request_service

router = APIRouter()


@router.post(
    "/create",
    response_model=DynamicPaymentRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Dynamic Request / QR Presenting (Step 1)",
    description="Recipient generates a dynamic payment request and HMAC-signed QR containing destination proxy, requested amount, and reference ID.",
)
def create_payment_request(payload: DynamicQRCreateRequest):
    try:
        return request_service.create_dynamic_request(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.post(
    "/validate-payload",
    response_model=PayloadValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest and Cryptographically Validate QR / Payment Payload (Step 3)",
    description="Sender mobile wallet parses payment parameters, confirms cryptographic signature integrity, TTL expiry, and ISO standard proxy conformity.",
)
def validate_payment_payload(payload: PayloadValidationRequest):
    return request_service.validate_payload(payload.raw_payload)


@router.get(
    "/",
    response_model=List[DynamicPaymentRequestResponse],
    summary="List Recent Payment Requests",
)
def list_recent_requests(
    limit: int = Query(10, ge=1, le=50, description="Max number of items to return")
):
    return request_service.list_recent_requests(limit=limit)


@router.get(
    "/{reference_id}",
    response_model=DynamicPaymentRequestResponse,
    summary="Retrieve Payment Request State",
)
def get_payment_request(reference_id: str):
    req = request_service.get_request(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request {reference_id} not found",
        )
    return req


@router.post(
    "/{reference_id}/scanned",
    response_model=DynamicPaymentRequestResponse,
    summary="Mark Request as Scanned by Sender",
)
def mark_request_scanned(reference_id: str):
    req = request_service.mark_scanned(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request {reference_id} not found",
        )
    return req


@router.post(
    "/{reference_id}/complete",
    response_model=DynamicPaymentRequestResponse,
    summary="Complete and Settle Payment Request",
)
def complete_payment_request(reference_id: str):
    req = request_service.mark_completed(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request {reference_id} not found",
        )
    return req


@router.post(
    "/{reference_id}/cancel",
    response_model=DynamicPaymentRequestResponse,
    summary="Cancel Active Payment Request",
)
def cancel_payment_request(reference_id: str):
    req = request_service.cancel_request(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request {reference_id} not found",
        )
    return req
