import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_double_entry_ledger_commitment_success():
    payload = {
        "uetr": "cfb85f64-5717-4562-b3fc-2c963f66afc8",
        "quote_id": "RHIPAY-FXQ-TEST-001",
        "sender_proxy": "+919876543210",
        "sender_spoke": "IN",
        "sender_currency": "INR",
        "recipient_proxy": "+6591234567",
        "recipient_spoke": "SG",
        "recipient_currency": "SGD",
        "origin_debit_amount": 2835.00,
        "destination_credit_amount": 45.00,
        "fx_rate": 63.00,
        "fx_provider_id": "FXP-DBS-GLOBAL-01",
        "spoke_a_settlement_id": "SETTLE-A-001",
        "spoke_b_disbursement_id": "DISBURSE-B-001",
        "screening_id": "SCR-TEST-001",
    }

    res = client.post("/api/v1/settlement/ledger/commit", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "DOUBLE_ENTRY_COMMITTED"
    assert data["zero_sum_invariant_verified"] is True
    assert data["journal_entries_count"] == 4
    assert data["currency_balances_delta"]["INR"] == 0.0
    assert data["currency_balances_delta"]["SGD"] == 0.0
    assert data["commitment_id"].startswith("LEDGER-COMMIT-")
    assert data["commitment_hash"].startswith("0x")
    assert len(data["journal_entries"]) == 4
    assert data["commitment_latency_ms"] < 15.0


def test_ledger_commitment_rejects_negative_or_zero_amounts():
    payload = {
        "uetr": "cfb85f64-5717-4562-b3fc-2c963f66afc9",
        "quote_id": "RHIPAY-FXQ-TEST-002",
        "sender_proxy": "+919876543210",
        "sender_spoke": "IN",
        "sender_currency": "INR",
        "recipient_proxy": "+6591234567",
        "recipient_spoke": "SG",
        "recipient_currency": "SGD",
        "origin_debit_amount": 0.00,
        "destination_credit_amount": 45.00,
        "fx_rate": 63.00,
    }

    res = client.post("/api/v1/settlement/ledger/commit", json=payload)
    assert res.status_code == 400
    assert "Invalid transaction amount" in res.json()["detail"]
