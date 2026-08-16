from fastapi import APIRouter
from app.api.v1.endpoints import requests, proxies, network, fx, zk, compliance, iso20022

api_router = APIRouter()
api_router.include_router(network.router, prefix="/network", tags=["Nexus Network & Country Spokes"])
api_router.include_router(requests.router, prefix="/requests", tags=["Payment Requests & QR"])
api_router.include_router(proxies.router, prefix="/proxies", tags=["Proxy Directory & Validation"])
api_router.include_router(fx.router, prefix="/fx", tags=["FX Liquidity & Zero-Slippage Quotes"])
api_router.include_router(zk.router, prefix="/zk", tags=["Zero-Knowledge Proofs & Merkle Tree"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["FATF Travel Rule & Encrypted Envelopes"])
api_router.include_router(iso20022.router, prefix="/iso20022", tags=["ISO 20022 Financial Messaging Standards"])
