from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.journey import (
    JourneyCreateRequest,
    JourneyResponse,
    JourneyApproveRequest,
    JourneyRejectRequest,
)
from app.services.journey_service import journey_service

router = APIRouter()


@router.post(
    "/request",
    response_model=JourneyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Travel Journey & Currency Request",
)
def create_journey_request(req: JourneyCreateRequest):
    try:
        record = journey_service.create_journey_request(req)
        return record
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/user/{user_id}",
    response_model=JourneyResponse,
    summary="Get User's Latest Journey Request",
)
def get_user_journey(user_id: str):
    record = journey_service.get_user_journey(user_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No journey requests found for this user",
        )
    return record


@router.get(
    "/admin/requests",
    response_model=List[JourneyResponse],
    summary="Admin Review Queue: List all Journey Requests",
)
def list_admin_journey_requests(limit: int = 50):
    return journey_service.list_all_requests(limit=limit)


@router.post(
    "/admin/approve/{request_id}",
    response_model=JourneyResponse,
    summary="Admin Approve Journey & Credit Wallet",
)
def approve_journey_request(request_id: str, approve_data: JourneyApproveRequest):
    try:
        return journey_service.approve_journey(request_id, approve_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/admin/reject/{request_id}",
    response_model=JourneyResponse,
    summary="Admin Reject Journey with Mandatory Reason",
)
def reject_journey_request(request_id: str, reject_data: JourneyRejectRequest):
    try:
        return journey_service.reject_journey(request_id, reject_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
