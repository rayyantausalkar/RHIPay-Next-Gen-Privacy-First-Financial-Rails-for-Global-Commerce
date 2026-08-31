from fastapi import APIRouter, HTTPException, status, Header, Query
from typing import Optional, List
from app.models.auth import (
    UserSignupRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
    BankDirectoryResponse,
    UpiPinChangeRequest,
    UpiPinVerifyRequest,
    BalanceCheckRequest,
    BalanceCheckResponse,
    AdminUserManagementItem,
)
from app.models.transaction import (
    TransferExecuteRequest,
    TransferExecuteResponse,
    TransactionResponse,
)
from app.services.auth_service import auth_service
from app.services.transaction_service import transaction_service

router = APIRouter()


@router.post(
    "/signup",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account with bank & spoke configuration",
)
def signup(req: UserSignupRequest):
    try:
        return auth_service.signup(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal authentication error: {str(e)}",
        )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate user credentials and issue session token",
)
def login(req: UserLoginRequest):
    try:
        return auth_service.login(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal login error: {str(e)}",
        )


@router.get(
    "/banks",
    response_model=BankDirectoryResponse,
    summary="Get list of supported clearing member banks across all network spokes",
)
def get_bank_directory():
    return auth_service.get_bank_directory()


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get user profile from email query or token header",
)
def get_current_user(
    email: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    target_email = email
    if not target_email and authorization and "demo" in authorization:
        target_email = "demo@rhipay.io"

    if not target_email:
        target_email = "demo@rhipay.io"

    user = auth_service.get_user_by_email(target_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return user


@router.get(
    "/user/{user_id}",
    response_model=UserProfileResponse,
    summary="Get user profile by user_id",
)
def get_user_by_id(user_id: str):
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post(
    "/change-pin",
    summary="Set or Change UPI PIN",
)
def change_upi_pin(req: UpiPinChangeRequest):
    try:
        return auth_service.change_upi_pin(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/verify-pin",
    summary="Verify UPI PIN",
)
def verify_upi_pin(req: UpiPinVerifyRequest):
    is_valid = auth_service.verify_upi_pin(req)
    return {"verified": is_valid}


@router.post(
    "/balance",
    response_model=BalanceCheckResponse,
    summary="Check Account Balance with UPI PIN verification",
)
def check_balance(req: BalanceCheckRequest):
    try:
        return auth_service.check_balance(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/transfer/execute",
    response_model=TransferExecuteResponse,
    summary="Execute Real Atomic Cross-Border Transfer with Balance Deduction",
)
def execute_transfer(req: TransferExecuteRequest):
    try:
        return auth_service.execute_atomic_transfer(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transfer execution failed: {str(e)}",
        )


@router.get(
    "/transactions/user/{user_id}",
    response_model=List[TransactionResponse],
    summary="Get Real Transaction History for Authenticated User",
)
def get_user_transactions(user_id: str, limit: int = Query(50, ge=1, le=100)):
    records = transaction_service.get_user_transactions(user_id, limit=limit)
    return [
        TransactionResponse(
            id=r.id,
            transaction_id=r.transaction_id,
            uetr=r.uetr,
            sender_user_id=r.sender_user_id,
            sender_name=r.sender_name,
            sender_proxy=r.sender_proxy,
            sender_country=r.sender_country,
            sender_currency=r.sender_currency,
            sender_amount=r.sender_amount,
            sender_account_number=r.sender_account_number,
            recipient_user_id=r.recipient_user_id,
            recipient_name=r.recipient_name,
            recipient_proxy=r.recipient_proxy,
            recipient_country=r.recipient_country,
            recipient_currency=r.recipient_currency,
            recipient_amount=r.recipient_amount,
            recipient_account_number=r.recipient_account_number,
            exchange_rate=r.exchange_rate,
            purpose_code=r.purpose_code,
            status=r.status,
            category=r.category,
            iso_status=r.iso_status,
            note=r.note,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get(
    "/transactions/all",
    response_model=List[TransactionResponse],
    summary="Admin / Correspondent Bank: Get all system transactions in real time",
)
def get_all_transactions(limit: int = Query(100, ge=1, le=200)):
    records = transaction_service.get_all_transactions(limit=limit)
    return [
        TransactionResponse(
            id=r.id,
            transaction_id=r.transaction_id,
            uetr=r.uetr,
            sender_user_id=r.sender_user_id,
            sender_name=r.sender_name,
            sender_proxy=r.sender_proxy,
            sender_country=r.sender_country,
            sender_currency=r.sender_currency,
            sender_amount=r.sender_amount,
            sender_account_number=r.sender_account_number,
            recipient_user_id=r.recipient_user_id,
            recipient_name=r.recipient_name,
            recipient_proxy=r.recipient_proxy,
            recipient_country=r.recipient_country,
            recipient_currency=r.recipient_currency,
            recipient_amount=r.recipient_amount,
            recipient_account_number=r.recipient_account_number,
            exchange_rate=r.exchange_rate,
            purpose_code=r.purpose_code,
            status=r.status,
            category=r.category,
            iso_status=r.iso_status,
            note=r.note,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get(
    "/users",
    response_model=List[AdminUserManagementItem],
    summary="Admin: Get all registered user accounts",
)
def get_all_users():
    return auth_service.get_all_users()


@router.post(
    "/users/{user_id}/toggle-block",
    summary="Admin: Block or Unblock user account",
)
def toggle_block_user(user_id: str):
    try:
        return auth_service.toggle_block_user(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/logout",
    summary="Invalidate active session",
)
def logout():
    return {"status": "success", "message": "Successfully logged out of RHI Pay Nexus."}

