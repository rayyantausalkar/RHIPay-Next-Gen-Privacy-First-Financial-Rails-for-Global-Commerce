import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_current_merkle_root():
    res = client.get("/api/v1/zk/merkle-root")
    assert res.status_code == 200
    data = res.json()
    assert "merkle_root" in data
    assert data["tree_depth"] == 16
    assert data["total_members"] >= 5
    assert data["merkle_root"].startswith("0x") or len(data["merkle_root"]) >= 32


def test_get_merkle_membership_path_for_participant():
    payload = {
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
    }
    res = client.post("/api/v1/zk/merkle-path", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_member"] is True
    assert len(data["path_elements"]) == 16
    assert len(data["path_indices"]) == 16
    assert "leaf_commitment" in data


def test_client_side_zk_proof_generation_under_1_2s():
    # 1. Lock a quote first
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    assert quote_res.status_code == 201
    quote_data = quote_res.json()
    quote_id = quote_data["quote_id"]

    # 2. Request client-side ZK membership proof generation
    proof_payload = {
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote_id,
        "kyc_tier_required": 1,
    }
    start_time = datetime.now(timezone.utc)
    proof_res = client.post("/api/v1/zk/generate-proof", json=proof_payload)
    elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000

    assert proof_res.status_code == 201
    proof_data = proof_res.json()

    # Verify execution speed (< 1200ms requirement)
    assert elapsed_ms < 1200
    assert proof_data["generation_time_ms"] < 1200
    assert proof_data["protocol"] == "groth16"
    assert proof_data["curve"] == "bn128"
    assert "nullifier_hash" in proof_data
    assert "merkle_root" in proof_data
    assert len(proof_data["pi_a"]) == 2
    assert len(proof_data["pi_b"]) == 2
    assert len(proof_data["pi_c"]) == 2


def test_verify_zk_membership_proof_success():
    # 1. Generate proof
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    quote_id = quote_res.json()["quote_id"]

    proof_res = client.post("/api/v1/zk/generate-proof", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote_id,
        "kyc_tier_required": 1,
    })
    proof_data = proof_res.json()

    # 2. Verify proof on Hub
    verify_res = client.post("/api/v1/zk/verify-proof", json={
        "merkle_root": proof_data["merkle_root"],
        "nullifier_hash": proof_data["nullifier_hash"],
        "quote_id": quote_id,
        "proof": proof_data["proof"],
        "public_signals": proof_data["public_signals"],
    })
    assert verify_res.status_code == 200
    ver_data = verify_res.json()
    assert ver_data["is_valid"] is True
    assert ver_data["nullifier_is_fresh"] is True
    assert ver_data["merkle_root_verified"] is True
