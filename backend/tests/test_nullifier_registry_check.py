import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_nullifier_registry_check_fresh_success():
    # 1. Lock Quote
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    quote = quote_res.json()

    # 2. Compute Nullifier
    unique_nonce = f"nonce-step13-test-{quote['quote_id'][:8]}"
    null_res = client.post("/api/v1/zk/nullifier/compute", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "nonce": unique_nonce,
    })
    nullifier_data = null_res.json()
    null_hash = nullifier_data["nullifier_hash"]

    # 3. Step 13: Anti-Replay Registry Query & Atomic Reservation
    check_res = client.post("/api/v1/zk/nullifier/registry-check", json={
        "nullifier_hash": null_hash,
        "quote_id": quote["quote_id"],
        "uetr": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    })
    assert check_res.status_code == 200
    data = check_res.json()

    assert data["is_fresh"] is True
    assert data["is_spent"] is False
    assert data["is_reserved"] is True
    assert data["status"] == "FRESH_NULLIFIER_ACQUIRED"
    assert data["check_latency_ms"] < 5.0
    assert data["nullifier_hash"] == null_hash


def test_nullifier_registry_check_blocks_replay_attack():
    # 1. Lock Quote & Compute Nullifier
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    quote = quote_res.json()

    unique_nonce = f"nonce-replay-attack-{quote['quote_id'][:8]}"
    null_res = client.post("/api/v1/zk/nullifier/compute", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "nonce": unique_nonce,
    })
    null_hash = null_res.json()["nullifier_hash"]

    # 2. Spend the nullifier
    spend_res = client.post("/api/v1/zk/nullifier/spend", json={
        "nullifier_hash": null_hash,
        "quote_id": quote["quote_id"],
    })
    assert spend_res.status_code == 200

    # 3. Step 13: Registry check on the spent nullifier must fail
    check_res = client.post("/api/v1/zk/nullifier/registry-check", json={
        "nullifier_hash": null_hash,
        "quote_id": quote["quote_id"],
        "uetr": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    })
    assert check_res.status_code == 200
    data = check_res.json()

    assert data["is_fresh"] is False
    assert data["is_spent"] is True
    assert data["status"] == "REPLAY_DOUBLE_SPEND_BLOCKED"
    assert "Double-spend detected" in data["error_details"]
