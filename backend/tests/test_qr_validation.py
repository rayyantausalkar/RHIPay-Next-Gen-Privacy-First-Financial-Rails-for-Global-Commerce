import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.services.request_service import RequestService

client = TestClient(app)


def test_qr_ingestion_and_validation_success():
    # 1. Create a dynamic request first
    create_payload = {
        "recipient_name": "Mei Ling",
        "recipient_proxy_type": "MOBILE",
        "recipient_proxy_value": "+6591234567",
        "destination_country": "SG",
        "destination_currency": "SGD",
        "requested_amount": 45.00,
        "note": "Dinner split",
        "expiry_seconds": 900,
    }
    create_res = client.post("/api/v1/requests/create", json=create_payload)
    assert create_res.status_code == 201
    qr_data = create_res.json()
    raw_uri = qr_data["qr_payload"]

    # 2. Ingest and validate via endpoint
    validation_payload = {
        "raw_payload": raw_uri,
    }
    val_res = client.post("/api/v1/requests/validate-payload", json=validation_payload)
    assert val_res.status_code == 200
    res_data = val_res.json()

    assert res_data["is_valid"] is True
    assert res_data["signature_verified"] is True
    assert res_data["is_expired"] is False
    assert res_data["reference_id"] == qr_data["reference_id"]
    assert res_data["recipient_name"] == "Mei Ling"
    assert res_data["destination_country"] == "SG"
    assert res_data["destination_currency"] == "SGD"
    assert float(res_data["requested_amount"]) == 45.00
    assert res_data["currency_decimals"] == 2
    assert res_data["validation_checks"]["schema_compliance"] is True
    assert res_data["validation_checks"]["signature_integrity"] is True
    assert res_data["validation_checks"]["expiry_validity"] is True
    assert res_data["validation_checks"]["proxy_standard"] is True


def test_qr_ingestion_tampered_amount_rejection():
    # 1. Create legitimate request
    create_payload = {
        "recipient_name": "Rahul Sharma",
        "recipient_proxy_type": "VPA",
        "recipient_proxy_value": "rahul@okhdfcbank",
        "destination_country": "IN",
        "destination_currency": "INR",
        "requested_amount": 1500.00,
    }
    create_res = client.post("/api/v1/requests/create", json=create_payload)
    assert create_res.status_code == 201
    raw_uri = create_res.json()["qr_payload"]

    # 2. Tamper the amount in URI (e.g. attacker changes 1500.00 to 1.00)
    tampered_uri = raw_uri.replace("amt=1500.00", "amt=1.00").replace("amt=1500.0", "amt=1.00")

    # 3. Ingest tampered URI
    val_res = client.post("/api/v1/requests/validate-payload", json={"raw_payload": tampered_uri})
    assert val_res.status_code == 200
    res_data = val_res.json()

    # Must be flagged as invalid due to signature mismatch
    assert res_data["is_valid"] is False
    assert res_data["signature_verified"] is False
    assert res_data["validation_checks"]["signature_integrity"] is False
    assert "tampered" in res_data["error_details"].lower() or "signature" in res_data["error_details"].lower()


def test_qr_ingestion_expired_request_rejection():
    # 1. Create a request with 1 second expiry
    create_payload = {
        "recipient_name": "Kenji Sato",
        "recipient_proxy_type": "MOBILE",
        "recipient_proxy_value": "+819012345678",
        "destination_country": "JP",
        "destination_currency": "JPY",
        "requested_amount": 5000,
        "expiry_seconds": 1,
    }
    create_res = client.post("/api/v1/requests/create", json=create_payload)
    assert create_res.status_code == 201
    qr_data = create_res.json()
    ref_id = qr_data["reference_id"]

    # Manually expire the stored item in memory
    req_obj = RequestService._active_requests.get(ref_id)
    if req_obj:
        req_obj["expires_at"] = datetime.now(timezone.utc) - timedelta(seconds=10)

    val_res = client.post("/api/v1/requests/validate-payload", json={"raw_payload": qr_data["qr_payload"]})
    assert val_res.status_code == 200
    res_data = val_res.json()

    assert res_data["is_valid"] is False
    assert res_data["is_expired"] is True
    assert res_data["validation_checks"]["expiry_validity"] is False
