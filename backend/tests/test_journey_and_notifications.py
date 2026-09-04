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


def test_global_vs_local_transfer_restrictions():
    # 1. Login user without active travel journey (Sarah in US)
    sarah_login = client.post("/api/v1/auth/login", json={"email": "sarah.j@nexus.org", "password": "Password123!"})
    assert sarah_login.status_code == 200
    sarah_id = sarah_login.json()["user"]["id"]

    # 2. Local Transfer (US to US / USD) should succeed without travel journey
    local_transfer_payload = {
        "sender_user_id": sarah_id,
        "recipient_proxy": "+14155552671",
        "recipient_name": "Sarah Domestic Recipient",
        "destination_country": "US",
        "destination_currency": "USD",
        "requested_amount": 10.0,
        "purpose_code": "P2P_TRANSFER",
        "note": "Local Domestic Transfer",
    }
    local_res = client.post("/api/v1/auth/transfer/execute", json=local_transfer_payload)
    assert local_res.status_code == 200
    assert local_res.json()["success"] is True

    # 3. Global Transfer (US to SG / SGD) without active travel journey to SG should be RESTRICTED (400)
    global_transfer_payload = {
        "sender_user_id": sarah_id,
        "recipient_proxy": "meiling@dbs.sg",
        "recipient_name": "Mei Ling",
        "destination_country": "SG",
        "destination_currency": "SGD",
        "requested_amount": 50.0,
        "purpose_code": "P2P_TRANSFER",
        "note": "Cross-Border Transfer",
    }
    global_res = client.post("/api/v1/auth/transfer/execute", json=global_transfer_payload)
    assert global_res.status_code == 400
    assert "Global Transfer Restricted" in global_res.json()["detail"]


def test_cancel_journey_and_refund_to_bank():
    # 1. Login user
    login_res = client.post("/api/v1/auth/login", json={"email": "rahul@okhdfcbank.com", "password": "Password123!"})
    assert login_res.status_code == 200
    user_id = login_res.json()["user"]["id"]
    initial_balance = login_res.json()["user"]["wallet_balance"]

    # 2. Submit Journey Request
    req_payload = {
        "user_id": user_id,
        "destination_country": "AE",
        "purpose_of_travel": "Business & Vacation",
        "start_date": "2026-10-01",
        "end_date": "2026-10-10",
        "home_amount_requested": 10000.0,
        "passport_filename": "passport_dubai.pdf",
    }
    req_res = client.post("/api/v1/journey/request", json=req_payload)
    assert req_res.status_code == 201
    req_id = req_res.json()["request_id"]

    # 3. Admin Approves Journey
    approve_res = client.post(
        f"/api/v1/journey/admin/approve/{req_id}",
        json={"admin_email": "admin.rhipay@gmail.com"},
    )
    assert approve_res.status_code == 200
    approved_user = client.get(f"/api/v1/auth/user/{user_id}").json()
    assert approved_user["active_journey_country"] == "AE"
    assert approved_user["travel_wallet_balance"] > 0
    travel_bal = approved_user["travel_wallet_balance"]

    # 4. User Cancels Journey and gets refunded with 2.5% penalty
    cancel_res = client.post(f"/api/v1/journey/user/{user_id}/cancel", json={"cancellation_reason": "Trip cancelled by user"})
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()
    assert cancel_data["success"] is True
    assert cancel_data["gross_refund_home"] > 0
    assert cancel_data["penalty_fee_home"] > 0
    assert cancel_data["net_refund_home"] > 0

    # 5. Verify User Record Reset & Bank Balance Credited
    updated_user = client.get(f"/api/v1/auth/user/{user_id}").json()
    assert updated_user["active_journey_country"] is None
    assert updated_user["active_journey_currency"] is None
    assert updated_user["travel_wallet_balance"] == 0.0
    assert updated_user["wallet_balance"] == cancel_data["new_wallet_balance"]


def test_shared_travel_journey_wallet_p2p_transfer():
    """
    Test requirement: If two people have different home countries (e.g. IN and SG),
    but both have the same country Travel Journey Management wallet (e.g. US / USD),
    they must be able to transfer to each other seamlessly.
    """
    # 1. Login Rahul (Home: IN, INR)
    rahul_login = client.post("/api/v1/auth/login", json={"email": "rahul@okhdfcbank.com", "password": "Password123!"})
    assert rahul_login.status_code == 200
    rahul_id = rahul_login.json()["user"]["id"]

    # 2. Login Mei Ling (Home: SG, SGD)
    meiling_login = client.post("/api/v1/auth/login", json={"email": "meiling@dbs.sg", "password": "Password123!"})
    assert meiling_login.status_code == 200
    meiling_id = meiling_login.json()["user"]["id"]

    # 3. Setup US Travel Journey for Rahul (IN)
    rahul_req = client.post("/api/v1/journey/request", json={
        "user_id": rahul_id,
        "destination_country": "US",
        "purpose_of_travel": "Holiday in NYC",
        "start_date": "2026-10-01",
        "end_date": "2026-10-15",
        "home_amount_requested": 40000.0,
    }).json()
    client.post(f"/api/v1/journey/admin/approve/{rahul_req['request_id']}", json={"admin_email": "admin.rhipay@gmail.com"})

    # 4. Setup US Travel Journey for Mei Ling (SG)
    meiling_req = client.post("/api/v1/journey/request", json={
        "user_id": meiling_id,
        "destination_country": "US",
        "purpose_of_travel": "Conference in San Francisco",
        "start_date": "2026-10-02",
        "end_date": "2026-10-16",
        "home_amount_requested": 1000.0,
    }).json()
    client.post(f"/api/v1/journey/admin/approve/{meiling_req['request_id']}", json={"admin_email": "admin.rhipay@gmail.com"})

    # Check both users have active_journey_country == "US"
    r_user = client.get(f"/api/v1/auth/user/{rahul_id}").json()
    m_user = client.get(f"/api/v1/auth/user/{meiling_id}").json()
    assert r_user["home_country"] == "IN"
    assert m_user["home_country"] == "SG"
    assert r_user["active_journey_country"] == "US"
    assert m_user["active_journey_country"] == "US"
    r_initial_travel = r_user["travel_wallet_balance"]
    m_initial_travel = m_user["travel_wallet_balance"]

    # 5. Rahul sends $50.00 USD to Mei Ling (different home country, same travel journey destination)
    transfer_res = client.post("/api/v1/auth/transfer/execute", json={
        "sender_user_id": rahul_id,
        "recipient_proxy": "+6591234567",
        "recipient_name": "Mei Ling",
        "destination_country": "US",
        "destination_currency": "USD",
        "requested_amount": 50.0,
        "purpose_code": "TRAVEL_P2P_TRANSFER",
        "note": "Shared US Travel Wallet Transfer",
    })
    assert transfer_res.status_code == 200
    t_data = transfer_res.json()
    assert t_data["success"] is True

    # 6. Verify Rahul's USD travel wallet debited by 50.0 and Mei Ling's USD travel wallet credited by 50.0
    r_after = client.get(f"/api/v1/auth/user/{rahul_id}").json()
    m_after = client.get(f"/api/v1/auth/user/{meiling_id}").json()
    assert r_after["travel_wallet_balance"] == round(r_initial_travel - 50.0, 2)
    assert m_after["travel_wallet_balance"] == round(m_initial_travel + 50.0, 2)



