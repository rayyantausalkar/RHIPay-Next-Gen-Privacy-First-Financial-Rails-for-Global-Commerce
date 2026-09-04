import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.payment_request import RequestStatus
from app.services.proxy_service import ProxyService

client = TestClient(app)


def test_network_spokes_registry():
    res = client.get("/api/v1/network/spokes")
    assert res.status_code == 200
    data = res.json()
    assert "spokes" in data
    assert data["total_active_spokes"] >= 10
    
    codes = [s["country_code"] for s in data["spokes"]]
    assert "IN" in codes
    assert "SG" in codes
    assert "AE" in codes
    assert "US" in codes
    assert "JP" in codes
    assert "GB" in codes

    # Test dynamic spoke registration for a new country (e.g. Switzerland CH / CHF)
    new_spoke = {
        "country_code": "CH",
        "country_name": "Switzerland",
        "currency": "CHF",
        "flag_emoji": "🇨🇭",
        "ips_scheme_name": "SIC Instant",
        "supported_proxy_types": ["MOBILE", "IBAN", "EMAIL"],
        "currency_decimals": 2,
        "default_proxy_example": "+41791234567",
    }
    reg_res = client.post("/api/v1/network/spokes", json=new_spoke)
    assert reg_res.status_code == 201
    assert reg_res.json()["country_code"] == "CH"

    # Verify retrieval
    get_ch = client.get("/api/v1/network/spokes/CH")
    assert get_ch.status_code == 200
    assert get_ch.json()["currency"] == "CHF"


def test_country_agnostic_qr_generation_various_pairs():
    # Test UAE (AE / AED)
    payload_ae = {
        "recipient_name": "Dubai Marina Suites",
        "recipient_proxy_type": "MOBILE",
        "recipient_proxy_value": "+971501234567",
        "destination_country": "AE",
        "destination_currency": "AED",
        "origin_spoke": "IN",
        "requested_amount": 550.00,
        "note": "Hotel booking deposit",
    }
    res_ae = client.post("/api/v1/requests/create", json=payload_ae)
    assert res_ae.status_code == 201
    data_ae = res_ae.json()
    assert data_ae["destination_country"] == "AE"
    assert data_ae["destination_currency"] == "AED"
    assert data_ae["origin_spoke"] == "IN"
    assert data_ae["amount_in_cents"] == 55000
    assert "country=AE" in data_ae["qr_payload"]
    assert "ccy=AED" in data_ae["qr_payload"]
    assert data_ae["qr_payload_json"]["destination_country"] == "AE"

    # Test Japan JPY (0-decimal currency)
    payload_jp = {
        "recipient_name": "Kyoto Crafts Co",
        "recipient_proxy_type": "EMAIL",
        "recipient_proxy_value": "orders@kyotocrafts.jp",
        "destination_country": "JP",
        "destination_currency": "JPY",
        "requested_amount": 12500,
        "note": "Pottery purchase",
    }
    res_jp = client.post("/api/v1/requests/create", json=payload_jp)
    assert res_jp.status_code == 201
    data_jp = res_jp.json()
    assert data_jp["destination_country"] == "JP"
    assert data_jp["destination_currency"] == "JPY"
    assert data_jp["amount_in_cents"] == 12500
    assert data_jp["currency_decimals"] == 0


def test_proxy_validation_country_agnostic():
    # UAE Mobile
    res_ae = ProxyService.validate_proxy("MOBILE", "+971501234567", "AE")
    assert res_ae.is_valid is True

    # UK Mobile
    res_gb = ProxyService.validate_proxy("MOBILE", "+447911123456", "GB")
    assert res_gb.is_valid is True

    # Generic International E.164 (e.g. Kenya +254712345678)
    res_ke = ProxyService.validate_proxy("MOBILE", "+254712345678", "KE")
    assert res_ke.is_valid is True

    # Universal Email
    res_email = ProxyService.validate_proxy("EMAIL", "user@nexus.global", "US")
    assert res_email.is_valid is True

    # Standard IBAN
    res_iban = ProxyService.validate_proxy("IBAN", "DE89370400440532013000", "DE")
    assert res_iban.is_valid is True


def test_direct_proxy_lookup_and_send_receive_consistency():
    # 1. Receiver creates dynamic payment QR
    create_res = client.post(
        "/api/v1/requests/create",
        json={
            "recipient_name": "Mei Ling",
            "recipient_proxy_type": "MOBILE",
            "recipient_proxy_value": "+6591234567",
            "destination_country": "SG",
            "destination_currency": "SGD",
            "requested_amount": 1.0,
            "expiry_seconds": 86400,
            "purpose_code": "P2P_TRANSFER",
        },
    )
    assert create_res.status_code == 201
    created_req = create_res.json()
    ref_id = created_req["reference_id"]
    assert created_req["status"] == "ACTIVE"

    # 2. Sender validates payload via direct phone number lookup
    val_res = client.post(
        "/api/v1/requests/validate-payload",
        json={"raw_payload": "+6591234567"},
    )
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["recipient_name"] == "Mei Ling"
    assert val_data["proxy_value"] == "+6591234567"

    # 3. Complete payment with transfer amount $75.00
    from app.services.request_service import request_service
    comp_req = request_service.mark_completed(ref_id, amount=75.0)
    assert comp_req is not None
    assert comp_req.status == RequestStatus.COMPLETED
    assert comp_req.requested_amount == 75.0
    assert comp_req.amount_in_cents == 7500

    # 4. Polling endpoint reflects COMPLETED status with exact settled amount $75.00
    poll_res = client.get(f"/api/v1/requests/{ref_id}")
    assert poll_res.status_code == 200
    poll_data = poll_res.json()
    assert poll_data["status"] == "COMPLETED"
    assert float(poll_data["requested_amount"]) == 75.0

