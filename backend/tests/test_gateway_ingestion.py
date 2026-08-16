import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_gateway_ingestion_success():
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

    # 2. ZK Proof
    zk_res = client.post("/api/v1/zk/generate-proof", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
    })
    assert zk_res.status_code == 201
    zk_proof = zk_res.json()

    # 3. Nullifier
    null_res = client.post("/api/v1/zk/nullifier/compute", json={
        "identity_proxy": "+919876543210",
        "sender_spoke": "IN",
        "quote_id": quote["quote_id"],
        "nonce": "nonce-gw-test-01",
    })
    assert null_res.status_code == 200
    nullifier = null_res.json()

    # 4. FATF Envelope
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

    # 5. Assemble pacs.008 message
    assemble_res = client.post("/api/v1/iso20022/pacs008/assemble", json={
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
        "payment_note": "Gateway test transfer",
    })
    assert assemble_res.status_code == 201
    pacs = assemble_res.json()

    # 6. Gateway Ingestion Request with Required Security Headers
    headers = {
        "X-Idempotency-Key": f"idem-{quote['quote_id']}",
        "X-Nexus-Spoke": "IN",
        "X-Nexus-Client-Version": "rhipay-client-v2.0",
        "X-Signature-Algorithm": "HMAC-SHA256",
    }

    ingest_payload = {
        "pacs008_message": pacs,
        "transmission_channel": "NEXUS_HTTPS_TLS13",
        "client_timestamp": "2026-08-16T18:45:00Z",
    }

    res = client.post("/api/v1/gateway/ingest", json=ingest_payload, headers=headers)
    assert res.status_code == 202  # Accepted for processing
    data = res.json()

    assert data["ingestion_id"].startswith("ING-")
    assert data["status"] == "INGESTED"
    assert data["financial_payload"]["uetr"] == pacs["uetr"]
    assert data["financial_payload"]["instructed_amount"] == pacs["instructed_amount"]
    assert data["routing_payload"]["origin_spoke"] == "IN"
    assert data["routing_payload"]["destination_spoke"] == "SG"
    assert data["crypto_payload"]["nullifier_hash"] == nullifier["nullifier_hash"]
    assert data["crypto_payload"]["merkle_root"] != ""
    assert data["crypto_payload"]["encrypted_envelope_id"] == envelope["envelope_id"]
    assert data["pipeline_isolation"]["financial_queue"] == "HIGH_PRIORITY_ROUTING"
    assert data["pipeline_isolation"]["crypto_queue"] == "ASYNC_ZK_VERIFIER_POOL"


def test_gateway_ingestion_idempotency_duplicate():
    # If the same X-Idempotency-Key is sent twice, gateway returns cached response
    headers = {
        "X-Idempotency-Key": "idem-test-duplicate-key-100",
        "X-Nexus-Spoke": "IN",
    }

    # Dummy minimal pacs message
    pacs = {
        "message_id": "RHIPAY/20260816/IN/SG/0001",
        "uetr": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "end_to_end_id": "quote-idem-001",
        "message_type": "pacs.008.001.10",
        "settlement_method": "CLRG",
        "clearing_system": "NEXUS",
        "instructed_amount": 2909.85,
        "instructed_currency": "INR",
        "settlement_amount": 45.0,
        "settlement_currency": "SGD",
        "exchange_rate": 64.663333,
        "xml_payload": "<Document></Document>",
        "canonical_json": {
            "CdtTrfTxInf": {
                "DbtrAgt": {"Ctry": "IN", "BICFI": "HDFCINBBXXX"},
                "CdtrAgt": {"Ctry": "SG", "BICFI": "DBSSSGSGXXX"},
                "SplmtryData": {
                    "nullifier_hash": "0x123nullifier",
                    "zk_proof": {"merkle_root": "0x123root", "protocol": "groth16", "curve": "bn128"},
                    "encrypted_pii_envelope": {"envelope_id": "ENV-001", "recipient_regulator_id": "MAS-SG"},
                }
            }
        },
        "is_valid": True,
        "created_at": "2026-08-16T18:45:00Z",
    }

    payload = {
        "pacs008_message": pacs,
        "transmission_channel": "NEXUS_HTTPS_TLS13",
        "client_timestamp": "2026-08-16T18:45:00Z",
    }

    res1 = client.post("/api/v1/gateway/ingest", json=payload, headers=headers)
    assert res1.status_code == 202

    res2 = client.post("/api/v1/gateway/ingest", json=payload, headers=headers)
    assert res2.status_code == 202
    assert res2.json()["ingestion_id"] == res1.json()["ingestion_id"]
    assert res2.json()["is_idempotent_replay"] is True
