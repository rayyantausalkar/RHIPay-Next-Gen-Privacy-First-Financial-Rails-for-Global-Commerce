import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_spoke_a_settlement_execution_success():
    # 1. Evaluate Gating (Step 14) to obtain a clearance token
    gate_payload = {
        "uetr": "6fb85f64-5717-4562-b3fc-2c963f66afc1",
        "message_id": "MSG-20260816-IN01-SG01-002",
        "quote_id": "quote_in_sg_987654",
        "proof_validity": True,
        "root_consistency": True,
        "nullifier_uniqueness": True,
        "kyc_tier_satisfied": True,
        "envelope_integrity": True,
        "merkle_root": "0x25890fa389812903829038290382903829038290382903829038290382903829",
        "nullifier_hash": "0x1928301928301928301928301928301928301928301928301928301928301928",
    }
    gate_res = client.post("/api/v1/zk/crypto-gate/evaluate", json=gate_payload)
    assert gate_res.status_code == 200
    gate_data = gate_res.json()
    clearance_token = gate_data["clearance_token"]

    # 2. Step 15: Spoke A Execution Request
    spoke_a_payload = {
        "uetr": "6fb85f64-5717-4562-b3fc-2c963f66afc1",
        "clearance_token": clearance_token,
        "sender_proxy": "+919876543210",
        "sender_spoke": "IN",
        "sender_currency": "INR",
        "sender_bic": "HDFCINBBXXX",
        "origin_debit_amount": 2835.00,
        "fx_rate": 63.00,
        "destination_amount": 45.00,
        "recipient_currency": "SGD",
        "quote_id": "quote_in_sg_987654",
        "fx_provider_id": "DBS_GLOBAL_LIQUIDITY_DESK",
    }

    res = client.post("/api/v1/settlement/spoke-a/execute", json=spoke_a_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "SPOKE_A_SETTLED"
    assert data["double_entry_balanced"] is True
    assert data["amount_debited_cents"] == 283500
    assert data["fxp_pool_credited_cents"] == 283500
    assert len(data["journal_entries"]) == 2

    # Verify Journal Entries (Debit & Credit)
    debit_entry = next(e for e in data["journal_entries"] if e["entry_type"] == "DEBIT")
    credit_entry = next(e for e in data["journal_entries"] if e["entry_type"] == "CREDIT")

    assert debit_entry["account_type"] == "SENDER_RETAIL_ACCT"
    assert debit_entry["amount_cents"] == 283500
    assert credit_entry["account_type"] == "FXP_SPOKE_A_POOL"
    assert credit_entry["amount_cents"] == 283500
    assert data["settlement_latency_ms"] < 15.0


def test_spoke_a_settlement_rejects_missing_clearance_token():
    spoke_a_payload = {
        "uetr": "6fb85f64-5717-4562-b3fc-2c963f66afc1",
        "clearance_token": "INVALID_OR_MISSING_TOKEN",
        "sender_proxy": "+919876543210",
        "sender_spoke": "IN",
        "sender_currency": "INR",
        "sender_bic": "HDFCINBBXXX",
        "origin_debit_amount": 2835.00,
        "fx_rate": 63.00,
        "destination_amount": 45.00,
        "recipient_currency": "SGD",
        "quote_id": "quote_in_sg_987654",
    }

    res = client.post("/api/v1/settlement/spoke-a/execute", json=spoke_a_payload)
    assert res.status_code == 403
    assert "Cryptographic clearance token invalid" in res.json()["detail"]
