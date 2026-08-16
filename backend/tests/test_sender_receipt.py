import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_sender_digital_receipt_generation_success():
    payload = {
        "uetr": "2fb85f64-5717-4562-b3fc-2c963f66afc2",
        "message_id": "MSG-20260816-IN01-SG01-002",
        "sender_proxy": "+919876543210",
        "sender_name": "Rahul Sharma",
        "sender_currency": "INR",
        "amount_debited": 2835.00,
        "amount_debited_cents": 283500,
        "recipient_name": "Tan Wei Ling",
        "recipient_proxy": "+6591234567",
        "recipient_currency": "SGD",
        "amount_credited": 45.00,
        "fx_rate": 63.00,
        "zk_proof_id": "RHIPAY-ZKP-TEST-001",
        "nullifier_hash": "0x1928301928301928301928301928301928301928301928301928301928301928",
        "archive_id": "ARCH-20260816-001",
        "ledger_block_height": 10493,
    }

    res = client.post("/api/v1/telemetry/receipt/generate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "SETTLED_IRREVOCABLE_FINAL"
    assert data["receipt_id"].startswith("REC-")
    assert data["iso_status_code"] == "ACCP"
    assert data["amount_debited_formatted"] == "INR 2,835.00"
    assert data["amount_credited_formatted"] == "SGD 45.00"
    assert data["effective_fx_rate"] == 63.00
    assert data["sender_balance_after"] == 47165.00
    assert data["receipt_signature_digest"].startswith("0x")
    assert data["total_settlement_duration_ms"] < 2500.0


def test_sender_receipt_retrieval_by_uetr():
    uetr = "2fb85f64-5717-4562-b3fc-2c963f66afc2"
    res = client.get(f"/api/v1/telemetry/receipt/{uetr}")
    assert res.status_code == 200
    data = res.json()
    assert data["uetr"] == uetr
    assert data["status"] == "SETTLED_IRREVOCABLE_FINAL"
