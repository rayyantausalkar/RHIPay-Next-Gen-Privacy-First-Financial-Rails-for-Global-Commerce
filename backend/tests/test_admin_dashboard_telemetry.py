import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_admin_dashboard_telemetry_stream():
    res = client.get("/api/v1/telemetry/admin/dashboard")
    assert res.status_code == 200
    data = res.json()

    assert data["hub_status"] == "HEALTHY_OPERATIONAL"
    assert data["active_spokes_count"] >= 5
    assert data["e2e_settlement_p99_latency_ms"] < 2500.0
    assert data["zkp_verification_p99_latency_ms"] < 300.0

    # Balance sheet verification
    assert data["balance_sheet"]["zero_sum_verified"] is True
    assert len(data["balance_sheet"]["accounts"]) >= 4

    # ZKP telemetry
    assert data["live_zkp_telemetry"]["nullifier_uniqueness_rate_pct"] == 100.0
    assert len(data["live_zkp_telemetry"]["latest_public_signals"]) == 4

    # ISO 20022 Messages stream
    assert len(data["live_iso20022_messages"]) >= 1
    assert "pacs.008" in data["live_iso20022_messages"][0]["message_type"]

    # Compliance status
    assert data["statutory_compliance_status"]["fatf_enclave_attestation_rate_pct"] == 100.0
    assert data["statutory_compliance_status"]["sanctions_screening_pass_rate_pct"] == 100.0
