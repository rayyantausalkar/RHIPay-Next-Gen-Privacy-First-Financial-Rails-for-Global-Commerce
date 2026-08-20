from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from app.models.auth import (
    UserSignupRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
    BankDirectoryResponse,
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
    """
    Registers a new user in the persistent SQLite database.
    Performs password confirmation check, hashes credentials,
    and assigns default proxy identifiers and clearing member bank BIC.
    """
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
    """
    Authenticates user email and password against stored cryptographic hashes in SQLite.
    Returns authenticated user profile and bearer session token.
    """
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
    """
    Returns the comprehensive directory of member banks organized by country code.
    Used by the frontend to dynamically populate the bank selector.
    """
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
    """
    Retrieves current active user profile for session hydration.
    """
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


@router.post(
    "/logout",
    summary="Invalidate active session",
)
def logout():
    """
    Logs out the current user and acknowledges session termination.
    """
    return {"status": "success", "message": "Successfully logged out of RHI Pay Nexus."}
