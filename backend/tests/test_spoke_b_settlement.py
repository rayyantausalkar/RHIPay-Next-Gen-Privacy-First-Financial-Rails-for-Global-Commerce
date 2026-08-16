import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_spoke_b_settlement_execution_success():
    # 1. Step 14: Cryptographic Gate Clearance Token
    gate_payload = {
        "uetr": "8fb85f64-5717-4562-b3fc-2c963f66afc3",
        "message_id": "MSG-20260816-IN01-SG01-004",
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
    clearance_token = gate_res.json()["clearance_token"]

    # 2. Step 15: Spoke A Execution
    spoke_a_payload = {
        "uetr": "8fb85f64-5717-4562-b3fc-2c963f66afc3",
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
    }
    spoke_a_res = client.post("/api/v1/settlement/spoke-a/execute", json=spoke_a_payload)
    spoke_a_data = spoke_a_res.json()

    # 3. Step 16: Atomic FX Swap
    swap_payload = {
        "uetr": "8fb85f64-5717-4562-b3fc-2c963f66afc3",
        "settlement_id": spoke_a_data["settlement_id"],
        "quote_id": "quote_in_sg_987654",
        "origin_currency": "INR",
        "origin_amount_cents": 283500,
        "destination_currency": "SGD",
        "destination_amount_cents": 4500,
        "fx_rate": 63.00,
    }
    swap_res = client.post("/api/v1/settlement/fx-swap/execute", json=swap_payload)
    swap_data = swap_res.json()

    # 4. Step 17: Spoke B Execution (Host IPS - Receiver Leg)
    spoke_b_payload = {
        "uetr": "8fb85f64-5717-4562-b3fc-2c963f66afc3",
        "swap_id": swap_data["swap_id"],
        "quote_id": "quote_in_sg_987654",
        "recipient_proxy": "+6591234567",
        "recipient_spoke": "SG",
        "recipient_currency": "SGD",
        "recipient_bic": "DBSSSGSGXXX",
        "recipient_name": "Tan Wei Ling",
        "destination_amount": 45.00,
        "destination_amount_cents": 4500,
        "fx_provider_id": "DBS_GLOBAL_LIQUIDITY_DESK",
    }

    res = client.post("/api/v1/settlement/spoke-b/execute", json=spoke_b_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "SPOKE_B_SETTLED"
    assert data["double_entry_balanced"] is True
    assert data["amount_credited_cents"] == 4500
    assert data["recipient_currency"] == "SGD"
    assert data["recipient_name"] == "Tan Wei Ling"
    assert len(data["journal_entries"]) == 2

    # Verify Journal Entries (Debit & Credit)
    debit_entry = next(e for e in data["journal_entries"] if e["entry_type"] == "DEBIT")
    credit_entry = next(e for e in data["journal_entries"] if e["entry_type"] == "CREDIT")

    assert debit_entry["account_type"] == "FXP_SPOKE_B_POOL"
    assert debit_entry["amount_cents"] == 4500
    assert credit_entry["account_type"] == "RECIPIENT_RETAIL_ACCT"
    assert credit_entry["amount_cents"] == 4500
    assert data["settlement_latency_ms"] < 10.0
