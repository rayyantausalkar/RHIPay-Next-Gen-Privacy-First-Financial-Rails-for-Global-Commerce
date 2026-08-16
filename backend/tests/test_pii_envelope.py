import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_regulator_compliance_public_key():
    # Retrieve MAS Singapore regulatory node public key
    res = client.get("/api/v1/compliance/keys/SG")
    assert res.status_code == 200
    data = res.json()
    assert data["country_code"] == "SG"
    assert data["regulator_name"] == "Monetary Authority of Singapore (MAS)"
    assert "public_key_pem" in data
    assert data["key_algorithm"] == "RSA-OAEP-256"


def test_encrypt_fatf_travel_rule_pii_envelope():
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

    # 2. Encrypt PII envelope for destination spoke (SG)
    payload = {
        "destination_spoke": "SG",
        "quote_id": quote_id,
        "originator_name": "Rahul Sharma",
        "originator_proxy": "+919876543210",
        "originator_address": "42 Marine Drive, Mumbai, IN",
        "originator_national_id": "IN-AADHAAR-8912",
        "originator_bic": "HDFCINBBXXX",
        "beneficiary_name": "Mei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_bic": "DBSSSGSGXXX",
    }
    res = client.post("/api/v1/compliance/encrypt-envelope", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["destination_spoke"] == "SG"
    assert "envelope_id" in data
    assert "encrypted_aes_key" in data
    assert "encrypted_pii_ciphertext" in data
    assert "iv" in data
    assert "auth_tag" in data
    assert data["encryption_algorithm"] == "RSA-OAEP-256 + AES-256-GCM"
    assert "Rahul Sharma" not in data["encrypted_pii_ciphertext"]  # Zero-knowledge transit


def test_regulator_decrypt_pii_envelope():
    # 1. Encrypt envelope
    payload = {
        "destination_spoke": "SG",
        "quote_id": "RHIPAY-FXQ-TEST-ENVELOPE",
        "originator_name": "Rahul Sharma",
        "originator_proxy": "+919876543210",
        "originator_address": "42 Marine Drive, Mumbai, IN",
        "originator_national_id": "IN-AADHAAR-8912",
        "originator_bic": "HDFCINBBXXX",
        "beneficiary_name": "Mei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_bic": "DBSSSGSGXXX",
    }
    enc_res = client.post("/api/v1/compliance/encrypt-envelope", json=payload)
    assert enc_res.status_code == 201
    enc_data = enc_res.json()

    # 2. Regulatory compliance node decrypts envelope
    dec_res = client.post("/api/v1/compliance/decrypt-envelope", json={
        "destination_spoke": "SG",
        "envelope_id": enc_data["envelope_id"],
        "encrypted_aes_key": enc_data["encrypted_aes_key"],
        "encrypted_pii_ciphertext": enc_data["encrypted_pii_ciphertext"],
        "iv": enc_data["iv"],
        "auth_tag": enc_data["auth_tag"],
    })
    assert dec_res.status_code == 200
    dec_data = dec_res.json()

    assert dec_data["is_valid"] is True
    assert dec_data["originator_name"] == "Rahul Sharma"
    assert dec_data["originator_proxy"] == "+919876543210"
    assert dec_data["beneficiary_name"] == "Mei Ling"
    assert dec_data["fatf_travel_rule_compliant"] is True
