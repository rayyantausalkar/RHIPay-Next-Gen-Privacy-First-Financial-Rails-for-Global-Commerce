import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_travel_rule_direct_dispatch_success():
    # 1. Encrypt PII Envelope (Step 7)
    encrypt_payload = {
        "destination_spoke": "SG",
        "quote_id": "quote_in_sg_987654",
        "originator_name": "Rahul Sharma",
        "originator_proxy": "+919876543210",
        "originator_address": "42 MG Road, Bangalore, India",
        "originator_national_id": "IND-AADHAAR-8910-2345",
        "originator_bic": "HDFCINBBXXX",
        "beneficiary_name": "Tan Wei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_bic": "DBSSSGSGXXX",
    }
    encrypt_res = client.post("/api/v1/compliance/encrypt-envelope", json=encrypt_payload)
    assert encrypt_res.status_code == 201
    env = encrypt_res.json()

    # 2. Step 18: Travel Rule Direct Dispatch to Beneficiary Compliance Node
    dispatch_payload = {
        "uetr": "9fb85f64-5717-4562-b3fc-2c963f66afc4",
        "envelope_id": env["envelope_id"],
        "recipient_regulator_id": env["recipient_regulator_id"],
        "destination_spoke": "SG",
        "origin_spoke": "IN",
        "encrypted_aes_key": env["encrypted_aes_key"],
        "encrypted_pii_ciphertext": env["encrypted_pii_ciphertext"],
        "iv": env["iv"],
        "auth_tag": env["auth_tag"],
        "settlement_id": "SETTLE-SPOKEA-TEST-01",
    }

    res = client.post("/api/v1/compliance/travel-rule/dispatch", json=dispatch_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "FATF_TRAVEL_RULE_DISPATCHED"
    assert data["fatf_recommendation_16_compliant"] is True
    assert data["sanction_screening_status"] == "CLEARED_PASS"
    assert data["recipient_regulator_node"] == "MAS-SG-COMPLIANCE-NODE-01"
    assert data["regulatory_acknowledgement_token"].startswith("TR-ACK-SG-")
    assert data["dispatch_latency_ms"] < 15.0


def test_travel_rule_dispatch_rejects_missing_envelope():
    dispatch_payload = {
        "uetr": "9fb85f64-5717-4562-b3fc-2c963f66afc4",
        "envelope_id": "ENV-INVALID",
        "recipient_regulator_id": "MAS-SG-COMPLIANCE-NODE-01",
        "destination_spoke": "SG",
        "origin_spoke": "IN",
        "encrypted_aes_key": "",
        "encrypted_pii_ciphertext": "",
        "iv": "",
        "auth_tag": "",
    }

    res = client.post("/api/v1/compliance/travel-rule/dispatch", json=dispatch_payload)
    assert res.status_code == 400
    assert "Ciphertext or encryption parameters missing" in res.json()["detail"]
