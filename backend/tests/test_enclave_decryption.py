import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_private_key_enclave_decryption_success():
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

    # 2. Step 19: Private Key Enclave Decryption
    enclave_payload = {
        "uetr": "afb85f64-5717-4562-b3fc-2c963f66afc5",
        "envelope_id": env["envelope_id"],
        "destination_spoke": "SG",
        "encrypted_aes_key": env["encrypted_aes_key"],
        "encrypted_pii_ciphertext": env["encrypted_pii_ciphertext"],
        "iv": env["iv"],
        "auth_tag": env["auth_tag"],
        "auditor_node_id": "MAS-SG-COMPLIANCE-NODE-01",
    }

    res = client.post("/api/v1/compliance/enclave/decrypt", json=enclave_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "ENCLAVE_DECRYPTION_SUCCESS"
    assert data["is_valid"] is True
    assert data["originator_name"] == "Rahul Sharma"
    assert data["originator_proxy"] == "+919876543210"
    assert data["originator_national_id"] == "IND-AADHAAR-8910-2345"
    assert data["beneficiary_name"] == "Tan Wei Ling"
    assert data["beneficiary_proxy"] == "+6591234567"
    assert data["fatf_travel_rule_compliant"] is True
    assert data["sanction_screening"]["status"] == "CLEARED_PASS"
    assert data["sanction_screening"]["pep_detected"] is False
    assert data["decryption_latency_ms"] < 15.0


def test_enclave_decryption_rejects_tampered_ciphertext():
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
    env = encrypt_res.json()

    # Tamper with the ciphertext
    tampered_ciphertext = env["encrypted_pii_ciphertext"][:-4] + "AAAA"

    enclave_payload = {
        "uetr": "afb85f64-5717-4562-b3fc-2c963f66afc5",
        "envelope_id": env["envelope_id"],
        "destination_spoke": "SG",
        "encrypted_aes_key": env["encrypted_aes_key"],
        "encrypted_pii_ciphertext": tampered_ciphertext,
        "iv": env["iv"],
        "auth_tag": env["auth_tag"],
    }

    res = client.post("/api/v1/compliance/enclave/decrypt", json=enclave_payload)
    assert res.status_code == 400
    assert "Decryption failed" in res.json()["detail"]
