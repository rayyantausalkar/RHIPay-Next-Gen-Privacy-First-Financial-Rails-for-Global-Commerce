import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_proxy_alias_resolution_singapore_paynow():
    payload = {
        "proxy_type": "MOBILE",
        "proxy_value": "+6591234567",
        "destination_country": "SG",
    }
    response = client.post("/api/v1/proxies/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_resolved"] is True
    assert data["destination_country"] == "SG"
    assert data["destination_currency"] == "SGD"
    assert data["destination_spoke_scheme"] == "PayNow / FAST"
    assert data["destination_bic"] == "DBSGSGSG"
    assert data["destination_bank_name"] == "DBS Bank Singapore"
    assert data["masked_legal_name"] == "M** L***"
    assert data["masked_account_number"] == "•••-•••-4567"
    assert data["kyc_status"] == "VERIFIED"
    assert data["verification_token"].startswith("RHIPAY-VRF-")
    assert len(data["recipient_compliance_public_key"]) > 10


def test_proxy_alias_resolution_india_upi():
    payload = {
        "proxy_type": "VPA",
        "proxy_value": "rahul@okhdfcbank",
        "destination_country": "IN",
    }
    response = client.post("/api/v1/proxies/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_resolved"] is True
    assert data["destination_country"] == "IN"
    assert data["destination_currency"] == "INR"
    assert data["destination_spoke_scheme"] == "UPI / IMPS"
    assert data["destination_bic"] == "HDFCINBB"
    assert data["masked_legal_name"] == "R**** S*****"
    assert data["kyc_status"] == "VERIFIED"


def test_proxy_alias_resolution_uae_aani():
    payload = {
        "proxy_type": "MOBILE",
        "proxy_value": "+971501234567",
        "destination_country": "AE",
    }
    response = client.post("/api/v1/proxies/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_resolved"] is True
    assert data["destination_country"] == "AE"
    assert data["destination_currency"] == "AED"
    assert data["destination_bic"] == "FABAAEAD"
    assert data["masked_legal_name"] == "T**** A*-M******"


def test_proxy_alias_resolution_generic_fallback():
    # Test arbitrary country with generic proxy
    payload = {
        "proxy_type": "EMAIL",
        "proxy_value": "orders@kyotocrafts.jp",
        "destination_country": "JP",
    }
    response = client.post("/api/v1/proxies/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_resolved"] is True
    assert data["destination_country"] == "JP"
    assert data["destination_currency"] == "JPY"
    assert data["masked_legal_name"] != ""
    assert data["destination_bic"] != ""
