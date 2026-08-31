from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    journey,
    notifications,
    requests,
    proxies,
    network,
    fx,
    zk,
    compliance,
    iso20022,
    gateway,
    routing,
    settlement,
    telemetry,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Accounts"])
api_router.include_router(journey.router, prefix="/journey", tags=["Travel Journey & Currency Allocation"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Authority Alerts"])
api_router.include_router(network.router, prefix="/network", tags=["Nexus Network & Country Spokes"])
api_router.include_router(requests.router, prefix="/requests", tags=["Payment Requests & QR"])
api_router.include_router(proxies.router, prefix="/proxies", tags=["Proxy Directory & Validation"])
api_router.include_router(fx.router, prefix="/fx", tags=["FX Liquidity & Zero-Slippage Quotes"])
api_router.include_router(zk.router, prefix="/zk", tags=["Zero-Knowledge Proofs & Merkle Tree"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["FATF Travel Rule & Encrypted Envelopes"])
api_router.include_router(iso20022.router, prefix="/iso20022", tags=["ISO 20022 Financial Messaging Standards"])
api_router.include_router(gateway.router, prefix="/gateway", tags=["Central API Gateway & Message Ingestion"])
api_router.include_router(routing.router, prefix="/routing", tags=["Supplementary Data Routing & Isolation"])
api_router.include_router(settlement.router, prefix="/settlement", tags=["Two-Leg Atomic Settlement & Double-Entry Ledger"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Real-Time Telemetry & Asynchronous Push"])
