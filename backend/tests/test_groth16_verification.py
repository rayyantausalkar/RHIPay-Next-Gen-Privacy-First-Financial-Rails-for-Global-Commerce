import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_groth16_mathematical_circuit_verification_success():
    # 1. Lock Quote
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    assert quote_res.status_code == 201
    quote = quote_res.json()

    # 2. Generate ZK Proof (Step 5)
    zk_res = client.post("/api/v1/zk/generate-proof", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "kyc_tier_required": 1,
    })
    assert zk_res.status_code == 201
    zk_data = zk_res.json()

    # 3. Step 12: Mathematical Bilinear Pairing Verification
    verify_payload = {
        "proof": zk_data["proof"],
        "public_signals": zk_data["public_signals"],
        "circuit_name": "rhipay_identity_membership_v1",
    }

    res = client.post("/api/v1/zk/groth16/verify-circuit", json=verify_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_valid"] is True
    assert data["pairing_check_passed"] is True
    assert data["public_signals_verified"] is True
    assert data["curve"] == "bn128"
    assert data["protocol"] == "groth16"
    assert data["verification_time_ms"] < 25.0
    assert "e(πA, πB)" in data["pairing_equation_evaluated"]


def test_groth16_verification_rejected_tampered_proof():
    # 1. Generate Proof
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    zk_res = client.post("/api/v1/zk/generate-proof", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote_res.json()["quote_id"],
    })
    zk_data = zk_res.json()

    # 2. Tamper with πA curve coordinate
    tampered_proof = dict(zk_data["proof"])
    tampered_proof["pi_a"] = [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
    ]

    verify_payload = {
        "proof": tampered_proof,
        "public_signals": zk_data["public_signals"],
    }

    res = client.post("/api/v1/zk/groth16/verify-circuit", json=verify_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["is_valid"] is False
    assert data["pairing_check_passed"] is False
    assert "Bilinear pairing constraint violation" in data["error_details"]
