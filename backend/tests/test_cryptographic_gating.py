import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cryptographic_gate_all_checks_pass_grants_clearance():
    payload = {
        "uetr": "4fb85f64-5717-4562-b3fc-2c963f66afa7",
        "message_id": "MSG-20260816-IN01-SG01-001",
        "quote_id": "quote_in_sg_987654",
        "proof_validity": True,
        "root_consistency": True,
        "nullifier_uniqueness": True,
        "kyc_tier_satisfied": True,
        "envelope_integrity": True,
        "merkle_root": "0x25890fa389812903829038290382903829038290382903829038290382903829",
        "nullifier_hash": "0x1928301928301928301928301928301928301928301928301928301928301928",
    }

    res = client.post("/api/v1/zk/crypto-gate/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["gate_approved"] is True
    assert data["clearance_status"] == "CLEARANCE_GRANTED"
    assert data["ledger_execution_unlocked"] is True
    assert data["clearance_token"] is not None
    assert data["clearance_token"].startswith("RHIPAY_CLEARANCE_")
    assert data["clearance_token_signature"] is not None
    assert len(data["rejection_reasons"]) == 0
    assert data["evaluation_latency_ms"] < 2.0


def test_cryptographic_gate_failsafe_trips_on_any_failed_check():
    # Simulate failed proof validity
    payload = {
        "uetr": "4fb85f64-5717-4562-b3fc-2c963f66afa7",
        "message_id": "MSG-20260816-IN01-SG01-001",
        "quote_id": "quote_in_sg_987654",
        "proof_validity": False,  # FAIL
        "root_consistency": True,
        "nullifier_uniqueness": True,
        "kyc_tier_satisfied": True,
        "envelope_integrity": True,
        "merkle_root": "0x25890fa389812903829038290382903829038290382903829038290382903829",
        "nullifier_hash": "0x1928301928301928301928301928301928301928301928301928301928301928",
    }

    res = client.post("/api/v1/zk/crypto-gate/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["gate_approved"] is False
    assert data["clearance_status"] == "FAIL_SAFE_TRIPPED_REJECTED"
    assert data["ledger_execution_unlocked"] is False
    assert data["clearance_token"] is None
    assert len(data["rejection_reasons"]) > 0
    assert any("Groth16 mathematical proof constraint failure" in r for r in data["rejection_reasons"])
