import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_deterministic_nullifier_computation():
    # 1. Lock a quote
    quote_res = client.post("/api/v1/fx/quotes/lock", json={
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
    })
    assert quote_res.status_code == 201
    quote_id = quote_res.json()["quote_id"]

    # 2. Compute nullifier
    payload = {
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote_id,
        "nonce": "tx-nonce-001",
    }
    res1 = client.post("/api/v1/zk/nullifier/compute", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()

    assert data1["nullifier_hash"].startswith("0x")
    assert data1["is_fresh"] is True
    assert data1["protocol"] == "poseidon_bn254"

    # 3. Same inputs must produce exact same deterministic nullifier
    res2 = client.post("/api/v1/zk/nullifier/compute", json=payload)
    assert res2.status_code == 200
    assert res2.json()["nullifier_hash"] == data1["nullifier_hash"]


def test_nullifier_unlinkability_across_transactions():
    # Different quotes / nonces for same user must produce completely uncorrelatable nullifiers
    payload1 = {
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": "RHIPAY-FXQ-20260816-TX001",
        "nonce": "nonce-1",
    }
    payload2 = {
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": "RHIPAY-FXQ-20260816-TX002",
        "nonce": "nonce-2",
    }
    res1 = client.post("/api/v1/zk/nullifier/compute", json=payload1)
    res2 = client.post("/api/v1/zk/nullifier/compute", json=payload2)

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["nullifier_hash"] != res2.json()["nullifier_hash"]


def test_nullifier_double_spend_rejection():
    # 1. Compute nullifier
    payload = {
        "identity_proxy": "+6591234567",
        "sender_spoke": "SG",
        "quote_id": "RHIPAY-FXQ-20260816-REPLAY-TEST",
        "nonce": "replay-nonce",
    }
    res = client.post("/api/v1/zk/nullifier/compute", json=payload)
    assert res.status_code == 200
    nullifier_hash = res.json()["nullifier_hash"]

    # 2. Check freshness (should be fresh initially)
    check_res1 = client.post("/api/v1/zk/nullifier/verify", json={"nullifier_hash": nullifier_hash})
    assert check_res1.status_code == 200
    assert check_res1.json()["is_fresh"] is True

    # 3. Mark nullifier as spent (simulating transaction settlement)
    spend_res = client.post("/api/v1/zk/nullifier/spend", json={
        "nullifier_hash": nullifier_hash,
        "quote_id": "RHIPAY-FXQ-20260816-REPLAY-TEST",
    })
    assert spend_res.status_code == 200
    assert spend_res.json()["status"] == "SPENT"

    # 4. Subsequent check must report SPENT / Double Spend detected
    check_res2 = client.post("/api/v1/zk/nullifier/verify", json={"nullifier_hash": nullifier_hash})
    assert check_res2.status_code == 200
    assert check_res2.json()["is_fresh"] is False
    assert check_res2.json()["is_spent"] is True
