import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_merkle_root_validation_current_root():
    # 1. Fetch current active Merkle root
    root_res = client.get("/api/v1/zk/merkle-root")
    assert root_res.status_code == 200
    active_root_info = root_res.json()
    current_root = active_root_info["merkle_root"]

    # 2. Validate current root
    val_res = client.post("/api/v1/zk/merkle-root/validate", json={
        "merkle_root": current_root,
        "sender_spoke": "IN",
        "kyc_tier_required": 1,
    })
    assert val_res.status_code == 200
    data = val_res.json()

    assert data["is_valid"] is True
    assert data["is_current_root"] is True
    assert data["tree_depth"] == 16
    assert data["total_participants"] >= 1
    assert data["validation_time_ms"] < 5.0
    assert data["status"] == "ACTIVE_ROOT_VERIFIED"


def test_merkle_root_validation_historical_cached_root():
    # 1. Fetch current root
    root_res = client.get("/api/v1/zk/merkle-root")
    current_root = root_res.json()["merkle_root"]

    # 2. Simulate a tree update that preserves current root as historical
    update_res = client.post("/api/v1/zk/merkle-root/push-update", json={
        "new_leaf_proxy": "+919999888877",
        "spoke": "IN",
    })
    assert update_res.status_code == 200
    new_root = update_res.json()["new_merkle_root"]
    assert new_root != current_root

    # 3. Validate previous root as a valid historical root within TTL
    val_res = client.post("/api/v1/zk/merkle-root/validate", json={
        "merkle_root": current_root,
        "sender_spoke": "IN",
    })
    assert val_res.status_code == 200
    data = val_res.json()
    assert data["is_valid"] is True
    assert data["is_current_root"] is False
    assert data["is_historical_cached"] is True
    assert data["status"] == "HISTORICAL_ROOT_ACCEPTED"


def test_merkle_root_validation_rejected_unknown_root():
    # Tampered / Fake Merkle root
    fake_root = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
    val_res = client.post("/api/v1/zk/merkle-root/validate", json={
        "merkle_root": fake_root,
        "sender_spoke": "IN",
    })
    assert val_res.status_code == 200
    data = val_res.json()

    assert data["is_valid"] is False
    assert data["is_current_root"] is False
    assert data["is_historical_cached"] is False
    assert data["status"] == "ROOT_REJECTED_UNKNOWN"
    assert "Invalid or unrecognized Merkle tree root" in data["error_details"]
