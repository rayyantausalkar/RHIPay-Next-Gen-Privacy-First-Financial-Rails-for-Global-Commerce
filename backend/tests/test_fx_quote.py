import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_request_guaranteed_fx_quote_inr_sgd():
    payload = {
        "origin_currency": "INR",
        "destination_currency": "SGD",
        "destination_amount": 45.00,
        "sender_spoke": "IN",
        "recipient_spoke": "SG",
        "ttl_seconds": 60,
    }
    res = client.post("/api/v1/fx/quotes/lock", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["quote_id"].startswith("RHIPAY-FXQ-")
    assert data["origin_currency"] == "INR"
    assert data["destination_currency"] == "SGD"
    assert float(data["destination_amount"]) == 45.00
    assert float(data["origin_debit_amount"]) > 0
    assert float(data["fx_rate"]) > 0
    assert data["fx_provider_id"] != ""
    assert data["slippage_protection"] is True
    assert data["ttl_remaining_seconds"] <= 60
    assert data["quote_signature"] != ""


def test_request_guaranteed_fx_quote_various_pairs():
    # Test AED to INR
    payload_aed_inr = {
        "origin_currency": "AED",
        "destination_currency": "INR",
        "destination_amount": 5000.00,
        "sender_spoke": "AE",
        "recipient_spoke": "IN",
    }
    res_aed = client.post("/api/v1/fx/quotes/lock", json=payload_aed_inr)
    assert res_aed.status_code == 201
    data_aed = res_aed.json()
    assert data_aed["origin_currency"] == "AED"
    assert data_aed["destination_currency"] == "INR"
    assert float(data_aed["destination_amount"]) == 5000.00
    assert float(data_aed["origin_debit_amount"]) > 0

    # Test USD to SGD
    payload_usd_sgd = {
        "origin_currency": "USD",
        "destination_currency": "SGD",
        "destination_amount": 100.00,
        "sender_spoke": "US",
        "recipient_spoke": "SG",
    }
    res_usd = client.post("/api/v1/fx/quotes/lock", json=payload_usd_sgd)
    assert res_usd.status_code == 201
    assert res_usd.json()["origin_currency"] == "USD"


def test_get_fx_quote_by_id():
    # 1. Lock a quote
    payload = {
        "origin_currency": "SGD",
        "destination_currency": "INR",
        "destination_amount": 2500.00,
        "sender_spoke": "SG",
        "recipient_spoke": "IN",
        "ttl_seconds": 60,
    }
    res = client.post("/api/v1/fx/quotes/lock", json=payload)
    assert res.status_code == 201
    quote_id = res.json()["quote_id"]

    # 2. Retrieve quote
    get_res = client.post(f"/api/v1/fx/quotes/{quote_id}/verify", json={"quote_id": quote_id})
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["quote_id"] == quote_id
    assert retrieved["is_valid"] is True
    assert retrieved["signature_verified"] is True
