import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_simultaneous_atomic_cross_currency_swap_success():
    # 1. Step 14: Gate Evaluation
    gate_payload = {
        "uetr": "7fb85f64-5717-4562-b3fc-2c963f66afc2",
        "message_id": "MSG-20260816-IN01-SG01-003",
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
        "uetr": "7fb85f64-5717-4562-b3fc-2c963f66afc2",
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
    assert spoke_a_res.status_code == 200
    spoke_a_data = spoke_a_res.json()

    # 3. Step 16: Simultaneous Atomic Cross-Currency Swap Execution
    swap_payload = {
        "uetr": "7fb85f64-5717-4562-b3fc-2c963f66afc2",
        "settlement_id": spoke_a_data["settlement_id"],
        "quote_id": "quote_in_sg_987654",
        "origin_currency": "INR",
        "origin_amount_cents": 283500,
        "destination_currency": "SGD",
        "destination_amount_cents": 4500,
        "fx_rate": 63.00,
        "fx_provider_id": "DBS_GLOBAL_LIQUIDITY_DESK",
    }

    res = client.post("/api/v1/settlement/fx-swap/execute", json=swap_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "ATOMIC_FX_SWAP_SETTLED"
    assert data["herstatt_risk_status"] == "HERSTATT_RISK_ELIMINATED"
    assert data["pvp_atomic_commit_guaranteed"] is True
    assert data["effective_fx_rate"] == 63.00
    assert len(data["journal_entries"]) == 2

    # Check journal lines
    debit_sgd = next(e for e in data["journal_entries"] if e["currency"] == "SGD")
    credit_inr = next(e for e in data["journal_entries"] if e["currency"] == "INR")

    assert debit_sgd["entry_type"] == "DEBIT"
    assert debit_sgd["account_type"] == "FXP_SPOKE_B_POOL"
    assert debit_sgd["amount_cents"] == 4500

    assert credit_inr["entry_type"] == "CREDIT"
    assert credit_inr["account_type"] == "FXP_SPOKE_A_POOL"
    assert credit_inr["amount_cents"] == 283500

    assert data["atomic_execution_latency_ms"] < 10.0
