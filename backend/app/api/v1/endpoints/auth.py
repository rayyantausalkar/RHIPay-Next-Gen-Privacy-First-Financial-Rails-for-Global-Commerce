from fastapi import APIRouter, HTTPException, status, Header
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
from app.services.auth_service import auth_service

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
