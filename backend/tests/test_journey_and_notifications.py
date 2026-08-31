import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_journey_lifecycle():
    # 1. User login (Rahul)
    login_res = client.post("/api/v1/auth/login", json={"email": "rahul@okhdfcbank.com", "password": "Password123!"})
    assert login_res.status_code == 200
    user_id = login_res.json()["user"]["id"]

    # 2. Submit Journey Request
    req_payload = {
        "user_id": user_id,
        "destination_country": "US",
        "purpose_of_travel": "Tourism & Leisure Vacation",
        "start_date": "2026-09-15",
        "end_date": "2026-09-30",
        "home_amount_requested": 50000.0,
        "passport_filename": "passport_rahul.pdf",
    }
    res = client.post("/api/v1/journey/request", json=req_payload)
    assert res.status_code == 201
    j_data = res.json()
    assert j_data["status"] == "PENDING"
    assert j_data["destination_country"] == "US"
    assert j_data["destination_currency"] == "USD"
    req_id = j_data["request_id"]

    # 3. Check notifications
    notif_res = client.get(f"/api/v1/notifications/user/{user_id}")
    assert notif_res.status_code == 200
    assert len(notif_res.json()) >= 1

    # 4. Admin list requests
    admin_list = client.get("/api/v1/journey/admin/requests")
    assert admin_list.status_code == 200
    assert any(r["request_id"] == req_id for r in admin_list.json())

    # 5. Admin Approve
    approve_res = client.post(
        f"/api/v1/journey/admin/approve/{req_id}",
        json={"admin_email": "admin.rhipay@gmail.com"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 6. Verify User Balance
    user_res = client.get(f"/api/v1/auth/user/{user_id}")
    assert user_res.status_code == 200
    assert user_res.json()["active_journey_country"] == "US"
    assert user_res.json()["travel_wallet_balance"] > 0


def test_upi_pin_and_balance_check():
    login_res = client.post("/api/v1/auth/login", json={"email": "meiling@dbs.sg", "password": "Password123!"})
    assert login_res.status_code == 200
    user_id = login_res.json()["user"]["id"]

    # Change PIN
    pin_res = client.post("/api/v1/auth/change-pin", json={"user_id": user_id, "current_pin": "1234", "new_pin": "5678"})
    assert pin_res.status_code == 200

    # Verify PIN
    verify_res = client.post("/api/v1/auth/verify-pin", json={"user_id": user_id, "pin": "5678"})
    assert verify_res.json()["verified"] is True

    # Balance check
    bal_res = client.post("/api/v1/auth/balance", json={"user_id": user_id, "pin": "5678"})
    assert bal_res.status_code == 200
    assert bal_res.json()["verified"] is True


def test_admin_login():
    res = client.post("/api/v1/auth/login", json={"email": "admin.rhipay@gmail.com", "password": "admin@123."})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "ADMIN"
