from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.payment_request import (
    DynamicPaymentRequestCreate,
    DynamicPaymentRequestResponse,
)
from app.services.request_service import request_service

router = APIRouter()


@router.post(
    "/create",
    response_model=DynamicPaymentRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Dynamic Payment Request & QR Code",
    description="Recipient generates a dynamic payment request containing destination proxy, currency, amount, and reference ID.",
)
def create_payment_request(request_in: DynamicPaymentRequestCreate):
    try:
        return request_service.create_dynamic_request(request_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.get(
    "/{reference_id}",
    response_model=DynamicPaymentRequestResponse,
    summary="Get Payment Request Details",
    description="Resolves and retrieves payment request details and status by unique reference ID (used by Sender scanner).",
)
def get_payment_request(reference_id: str):
    req = request_service.get_request(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request '{reference_id}' not found",
        )
    return req


@router.post(
    "/{reference_id}/scanned",
    response_model=DynamicPaymentRequestResponse,
    summary="Mark Payment Request as Scanned",
    description="Updates the payment request status to SCANNED when payer reads QR code.",
)
def mark_request_scanned(reference_id: str):
    req = request_service.mark_scanned(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request '{reference_id}' not found",
        )
    return req


@router.post(
    "/{reference_id}/complete",
    response_model=DynamicPaymentRequestResponse,
    summary="Mark Payment Request as Completed (Settled)",
    description="Simulates/records instant settlement completion for the payment request.",
)
def complete_payment_request(reference_id: str):
    req = request_service.mark_completed(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request '{reference_id}' not found",
        )
    return req


@router.post(
    "/{reference_id}/cancel",
    response_model=DynamicPaymentRequestResponse,
    summary="Cancel Payment Request",
    description="Cancels an active payment request.",
)
def cancel_payment_request(reference_id: str):
    req = request_service.cancel_request(reference_id)
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment request '{reference_id}' not found",
        )
    return req


@router.get(
    "/",
    response_model=List[DynamicPaymentRequestResponse],
    summary="List Recent Requests",
    description="Retrieves the most recent payment requests.",
)
def list_recent_requests(limit: int = 10):
    return request_service.list_recent_requests(limit=limit)
