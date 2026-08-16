import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_recipient_push_notification_dispatch_success():
    payload = {
        "uetr": "1fb85f64-5717-4562-b3fc-2c963f66afc1",
        "recipient_proxy": "+6591234567",
        "recipient_name": "Tan Wei Ling",
        "recipient_currency": "SGD",
        "amount_credited": 45.00,
        "amount_credited_cents": 4500,
        "origin_currency": "INR",
        "origin_amount": 2835.00,
        "sender_masked_name": "Rahul Sharma",
        "sender_proxy": "+919876543210",
        "host_ips_reference": "PAYNOW/RHIPAY/20260816/8FA2B4C6",
        "settlement_status": "ACCP_SETTLED_FUNDS_AVAILABLE",
    }

    res = client.post("/api/v1/telemetry/push/recipient", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "DELIVERED_INSTANT_CONFIRMATION"
    assert data["notification_id"].startswith("PUSH-")
    assert data["delivery_channel"] == "WEBSOCKET_REALTIME_PUSH"
    assert data["uetr"] == "1fb85f64-5717-4562-b3fc-2c963f66afc1"
    assert data["push_latency_ms"] < 15.0


def test_recipient_push_rejects_zero_or_negative_amount():
    payload = {
        "uetr": "1fb85f64-5717-4562-b3fc-2c963f66afc2",
        "recipient_proxy": "+6591234567",
        "recipient_name": "Tan Wei Ling",
        "recipient_currency": "SGD",
        "amount_credited": 0.00,
        "amount_credited_cents": 0,
        "origin_currency": "INR",
        "origin_amount": 2835.00,
        "sender_masked_name": "Rahul Sharma",
        "sender_proxy": "+919876543210",
        "host_ips_reference": "PAYNOW/RHIPAY/20260816/8FA2B4C6",
    }

    res = client.post("/api/v1/telemetry/push/recipient", json=payload)
    assert res.status_code == 400
    assert "Invalid credited amount" in res.json()["detail"]


def test_recipient_websocket_telemetry_connection():
    with client.websocket_connect("/api/v1/telemetry/ws/%2B6591234567") as ws:
        # Send a ping/init message
        ws.send_json({"action": "subscribe", "proxy": "+6591234567"})
        data = ws.receive_json()
        assert data["event"] in ["CONNECTED", "SUBSCRIBED"]
