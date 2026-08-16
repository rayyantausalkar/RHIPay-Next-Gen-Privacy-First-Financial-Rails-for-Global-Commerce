import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_assemble_and_validate_pacs008_message():
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

    # 2. Generate ZK Proof
    zk_res = client.post("/api/v1/zk/generate-proof", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "kyc_tier_required": 1,
    })
    assert zk_res.status_code == 201
    zk_proof = zk_res.json()

    # 3. Compute Nullifier
    null_res = client.post("/api/v1/zk/nullifier/compute", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "nonce": "test-nonce-iso-001",
    })
    assert null_res.status_code == 200
    nullifier = null_res.json()

    # 4. Encrypt PII Envelope
    env_res = client.post("/api/v1/compliance/encrypt-envelope", json={
        "destination_spoke": "SG",
        "quote_id": quote["quote_id"],
        "originator_name": "Rahul Sharma",
        "originator_proxy": "+919876543210",
        "originator_address": "Mumbai, IN",
        "originator_national_id": "IN-AADHAAR-8912",
        "originator_bic": "HDFCINBBXXX",
        "beneficiary_name": "Mei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_bic": "DBSSSGSGXXX",
    })
    assert env_res.status_code == 201
    envelope = env_res.json()

    # 5. Assemble ISO 20022 pacs.008.001.10 message
    assemble_payload = {
        "quote_id": quote["quote_id"],
        "sender_proxy": "+919876543210",
        "sender_spoke": "IN",
        "sender_currency": "INR",
        "sender_bic": "HDFCINBBXXX",
        "recipient_proxy": "+6591234567",
        "recipient_spoke": "SG",
        "recipient_currency": "SGD",
        "recipient_bic": "DBSSSGSGXXX",
        "recipient_name": "Mei Ling",
        "destination_amount": 45.00,
        "origin_debit_amount": quote["origin_debit_amount"],
        "fx_rate": quote["fx_rate"],
        "zk_proof": zk_proof,
        "nullifier_hash": nullifier["nullifier_hash"],
        "encrypted_envelope": envelope,
        "purpose_code": "P2PR",
        "payment_note": "Split dinner bill",
    }

    pacs_res = client.post("/api/v1/iso20022/pacs008/assemble", json=assemble_payload)
    assert pacs_res.status_code == 201
    pacs_data = pacs_res.json()

    assert "message_id" in pacs_data
    assert "uetr" in pacs_data
    assert pacs_data["message_type"] == "pacs.008.001.10"
    assert "xml_payload" in pacs_data
    assert "<Document xmlns=" in pacs_data["xml_payload"]
    assert "<SplmtryData>" in pacs_data["xml_payload"]
    assert "RHIPAY_ZKP_PRIVACY_ENVELOPE_V1" in pacs_data["xml_payload"]
    assert pacs_data["is_valid"] is True


def test_validate_pacs008_message():
    # Test validating pacs.008 schema and syntax
    validate_res = client.post("/api/v1/iso20022/pacs008/validate", json={
        "xml_payload": """<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>RHIPAY/20260816/IN/SG/0001</MsgId>
            <CreDtTm>2026-08-16T12:00:00Z</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
        </GrpHdr>
    </FIToFICstmrCdtTrf>
</Document>"""
    })
    assert validate_res.status_code == 200
    assert validate_res.json()["schema_valid"] is True
