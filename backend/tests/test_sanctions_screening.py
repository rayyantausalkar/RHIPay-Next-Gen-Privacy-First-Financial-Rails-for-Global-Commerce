import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_automated_sanctions_screening_clean_user():
    payload = {
        "uetr": "bfb85f64-5717-4562-b3fc-2c963f66afc6",
        "originator_name": "Rahul Sharma",
        "originator_proxy": "+919876543210",
        "originator_national_id": "IND-AADHAAR-8910-2345",
        "originator_country": "IN",
        "beneficiary_name": "Tan Wei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_country": "SG",
        "transaction_amount": 45.00,
        "currency": "SGD",
    }

    res = client.post("/api/v1/compliance/sanctions/screen", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["overall_verdict"] == "CLEARED_PASS"
    assert data["is_cleared"] is True
    assert data["risk_score"] < 0.10
    assert data["risk_tier"] == "LOW_RISK_TIER_1"
    assert data["pep_screening"]["is_pep"] is False
    assert len(data["watchlist_breakdown"]) >= 5
    assert data["audit_log_id"].startswith("AML-LOG-")
    assert data["audit_seal_hash"].startswith("0x")
    assert data["screening_latency_ms"] < 10.0


def test_sanctions_screening_flags_sanctioned_entity():
    payload = {
        "uetr": "bfb85f64-5717-4562-b3fc-2c963f66afc7",
        "originator_name": "SANCTIONED_TARGET_INDIVIDUAL_OFAC",
        "originator_proxy": "+919876543299",
        "originator_country": "IN",
        "beneficiary_name": "Tan Wei Ling",
        "beneficiary_proxy": "+6591234567",
        "beneficiary_country": "SG",
        "transaction_amount": 100000.00,
        "currency": "USD",
    }

    res = client.post("/api/v1/compliance/sanctions/screen", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["overall_verdict"] == "SANCTIONS_HIT_BLOCKED"
    assert data["is_cleared"] is False
    assert data["risk_score"] >= 0.90
    assert data["compliance_officer_bypass_required"] is True
