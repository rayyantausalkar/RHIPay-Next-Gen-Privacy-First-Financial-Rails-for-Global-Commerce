import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_compliance_message_archival_success():
    payload = {
        "uetr": "efb85f64-5717-4562-b3fc-2c963f66afc9",
        "message_id": "MSG-20260816-IN01-SG01-009",
        "pacs008_xml": "<Document xmlns='urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10'>...</Document>",
        "zk_public_signals": [
            "0x25890fa389812903829038290382903829038290382903829038290382903829",
            "0x1928301928301928301928301928301928301928301928301928301928301928",
            "0x0987654321098765432109876543210987654321098765432109876543210987",
            "1",
        ],
        "zk_proof_id": "RHIPAY-ZKP-TEST-001",
        "merkle_root": "0x25890fa389812903829038290382903829038290382903829038290382903829",
        "nullifier_hash": "0x1928301928301928301928301928301928301928301928301928301928301928",
        "travel_rule_receipt_id": "TR-REC-20260816-001",
        "regulatory_ack_token": "TR-ACK-SG-TEST001",
        "enclave_attestation_id": "MAS-AUDIT-CLEARED-001",
        "sanctions_audit_log_id": "AML-LOG-20260816-001",
        "sanctions_verdict": "CLEARED_PASS",
        "sanctions_seal_hash": "0x7f4a9b208c5d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
        "ledger_commitment_id": "LEDGER-COMMIT-20260816-001",
        "ledger_block_height": 10493,
        "retention_period_years": 7,
        "storage_tier": "WORM_COMPLIANT_SECURE_STORAGE",
    }

    res = client.post("/api/v1/compliance/archival/commit", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "COMPLIANCE_ARCHIVED_IMMUTABLE"
    assert data["archive_id"].startswith("ARCH-")
    assert data["archive_seal_hash"].startswith("0x")
    assert data["persisted_components"]["pacs008_xml"] is True
    assert data["persisted_components"]["zk_public_signals"] is True
    assert data["persisted_components"]["travel_rule_envelope"] is True
    assert data["persisted_components"]["sanctions_screening_record"] is True
    assert data["persisted_components"]["double_entry_ledger_block"] is True
    assert data["archival_latency_ms"] < 15.0


def test_compliance_archival_retrieval():
    uetr = "efb85f64-5717-4562-b3fc-2c963f66afc9"
    res = client.get(f"/api/v1/compliance/archival/{uetr}")
    assert res.status_code == 200
    data = res.json()
    assert data["uetr"] == uetr
    assert data["status"] == "COMPLIANCE_ARCHIVED_IMMUTABLE"
