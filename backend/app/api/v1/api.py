from fastapi import APIRouter
from app.api.v1.endpoints import requests, proxies, network

api_router = APIRouter()
api_router.include_router(network.router, prefix="/network", tags=["Nexus Network & Country Spokes"])
api_router.include_router(requests.router, prefix="/requests", tags=["Payment Requests & QR"])
api_router.include_router(proxies.router, prefix="/proxies", tags=["Proxy Directory & Validation"])
