from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from app.models.telemetry import (
    RecipientPushNotificationRequest,
    RecipientPushNotificationResponse,
    SenderReceiptRequest,
    SenderReceiptResponse,
    AdminDashboardTelemetryResponse,
)
from app.services.telemetry_service import telemetry_service

router = APIRouter()


@router.get(
    "/admin/dashboard",
    response_model=AdminDashboardTelemetryResponse,
    summary="Admin & Compliance Dashboard Telemetry Stream (Step 25)",
    description="Returns live multi-currency bilateral balance sheet, ZKP verification metrics, raw ISO 20022 messages, and statutory compliance status.",
)
def get_admin_dashboard_telemetry():
    return telemetry_service.get_admin_dashboard_telemetry()


@router.post(
    "/push/recipient",
    response_model=RecipientPushNotificationResponse,
    summary="Recipient Push Notification Dispatch (Step 23)",
    description="Dispatches a real-time WebSocket confirmation push event to the recipient's interface indicating instant cleared funds availability.",
)
async def dispatch_recipient_push(payload: RecipientPushNotificationRequest):
    return await telemetry_service.dispatch_recipient_push(payload)


@router.get(
    "/push/history",
    response_model=List[RecipientPushNotificationResponse],
    summary="Get Recent Push Notification History",
    description="Returns recent broadcasted push notifications for telemetry monitoring.",
)
def get_push_history(limit: int = 10):
    return telemetry_service.get_push_history(limit=limit)


@router.post(
    "/receipt/generate",
    response_model=SenderReceiptResponse,
    summary="Sender Wallet Digital Receipt Generation (Step 24)",
    description="Generates an official digital settlement receipt with deducted balance, cryptographic verification proof, and ISO 20022 clearing confirmation.",
)
def generate_sender_receipt(payload: SenderReceiptRequest):
    return telemetry_service.generate_sender_receipt(payload)


@router.get(
    "/receipt/{uetr}",
    response_model=SenderReceiptResponse,
    summary="Get Digital Settlement Receipt by UETR",
    description="Retrieves a signed settlement receipt for a given transaction reference.",
)
def get_sender_receipt(uetr: str):
    return telemetry_service.get_sender_receipt(uetr)


@router.websocket("/ws/{proxy_value}")
async def websocket_telemetry_endpoint(websocket: WebSocket, proxy_value: str):
    """
    Real-time WebSocket telemetry channel for recipient devices and admin dashboards.
    Subscribes to inbound payments, settlement state transitions, and clearance telemetry.
    """
    await telemetry_service.connect(websocket, proxy_value)
    try:
        # Initial connection acknowledgment
        await websocket.send_json({
            "event": "CONNECTED",
            "proxy": proxy_value,
            "status": "SUBSCRIBED_REALTIME_STREAM",
        })

        while True:
            data = await websocket.receive_json()
            # Handle client heartbeats or dynamic proxy resubscription
            if data.get("action") == "ping":
                await websocket.send_json({"event": "PONG", "timestamp": data.get("timestamp")})
            elif data.get("action") == "subscribe":
                await websocket.send_json({
                    "event": "SUBSCRIBED",
                    "proxy": data.get("proxy", proxy_value),
                    "channel": "RECIPIENT_PAYMENT_PUSH",
                })
    except WebSocketDisconnect:
        telemetry_service.disconnect(websocket, proxy_value)
    except Exception:
        telemetry_service.disconnect(websocket, proxy_value)
