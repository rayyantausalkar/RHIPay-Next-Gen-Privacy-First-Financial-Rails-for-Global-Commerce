from fastapi import APIRouter, HTTPException, status
from app.models.spoke_registry import (
    SpokeListResponse,
    SpokeNetworkConfig,
    SpokeRegisterRequest,
)
from app.services.spoke_service import spoke_service

router = APIRouter()


@router.get(
    "/spokes",
    response_model=SpokeListResponse,
    summary="Get Connected Country Spokes & Rails",
    description="Returns the active registry of connected country spokes, ISO 3166-1 alpha-2 codes, domestic IPS schemes, and ISO 4217 currencies.",
)
def get_connected_spokes():
    spokes = spoke_service.list_spokes()
    return SpokeListResponse(
        spokes=spokes,
        total_active_spokes=len(spokes),
    )


@router.get(
    "/spokes/{country_code}",
    response_model=SpokeNetworkConfig,
    summary="Get Spoke Details by Country Code",
    description="Retrieves spoke configuration, currency, and IPS scheme details for a specific ISO country code.",
)
def get_spoke_by_code(country_code: str):
    spoke = spoke_service.get_spoke(country_code)
    if not spoke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country spoke '{country_code.upper()}' is not registered",
        )
    return spoke


@router.post(
    "/spokes",
    response_model=SpokeNetworkConfig,
    status_code=status.HTTP_201_CREATED,
    summary="Register / Update Country Spoke",
    description="Dynamically registers a new country spoke and currency rail into the RHIPay Nexus Hub.",
)
def register_spoke(req: SpokeRegisterRequest):
    return spoke_service.register_or_update_spoke(req)
