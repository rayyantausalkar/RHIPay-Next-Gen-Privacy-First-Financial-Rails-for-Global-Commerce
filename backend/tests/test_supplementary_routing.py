import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_supplementary_data_routing_dispatch():
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
        "nonce": "nonce-route-test-01",
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
        "payment_note": "Split dinner bill",
    })
    assert assemble_res.status_code == 201
    pacs = assemble_res.json()

    # 6. Gateway Ingestion (Step 9)
    headers = {
        "X-Idempotency-Key": f"idem-{quote['quote_id']}",
        "X-Nexus-Spoke": "IN",
    }
    ingest_res = client.post("/api/v1/gateway/ingest", json={
        "pacs008_message": pacs,
        "transmission_channel": "NEXUS_HTTPS_TLS13",
    }, headers=headers)
    assert ingest_res.status_code == 202
    ingest_data = ingest_res.json()

    # 7. Step 10: Dispatch Supplementary Data to Specialized Verification Queues
    route_payload = {
        "ingestion_id": ingest_data["ingestion_id"],
        "uetr": pacs["uetr"],
        "pacs008_message": pacs,
    }

    dispatch_res = client.post("/api/v1/routing/supplementary-data/dispatch", json=route_payload)
    assert dispatch_res.status_code == 200
    dispatch_data = dispatch_res.json()

    assert dispatch_data["dispatch_id"].startswith("DISP-")
    assert dispatch_data["status"] == "DISPATCHED"
    assert dispatch_data["core_ledger_unblocked"] is True

    # Check the 4 specialized pipelines
    pipelines = dispatch_data["pipelines"]
    assert "zk_snark_queue" in pipelines
    assert pipelines["zk_snark_queue"]["status"] == "ROUTED"
    assert pipelines["zk_snark_queue"]["target_engine"] == "GROTH16_BN254_VERIFIER_POOL"

    assert "nullifier_registry_queue" in pipelines
    assert pipelines["nullifier_registry_queue"]["status"] == "ROUTED"
    assert pipelines["nullifier_registry_queue"]["nullifier_hash"] == nullifier["nullifier_hash"]

    assert "regulatory_compliance_queue" in pipelines
    assert pipelines["regulatory_compliance_queue"]["status"] == "ROUTED"
    assert pipelines["regulatory_compliance_queue"]["destination_spoke"] == "SG"

    assert "core_settlement_highway" in pipelines
    assert pipelines["core_settlement_highway"]["status"] == "READY_PARALLEL"
