import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_bank_directory():
    """Verify bank directory provides clearing member banks across spokes."""
    response = client.get("/api/v1/auth/banks")
    assert response.status_code == 200
    data = response.json()
    assert "banks" in data
    assert "SG" in data["banks"]
    assert "IN" in data["banks"]
    assert "US" in data["banks"]
    assert any(b["name"] == "DBS Bank Singapore" for b in data["banks"]["SG"])
    assert any(b["name"] == "HDFC Bank Ltd" for b in data["banks"]["IN"])


def test_seed_demo_user_login():
    """Verify seeded benchmark demo accounts can log in."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "rahul@okhdfcbank.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Rahul Sharma"
    assert data["user"]["home_country"] == "IN"
    assert data["user"]["bank_name"] == "HDFC Bank Ltd"


def test_signup_new_user_success():
    """Test full registration lifecycle with unique user credentials."""
    import uuid
    unique_email = f"john.doe.{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Johnathan Doe",
        "contact_number": "+6598761234",
        "home_country": "SG",
        "bank_name": "DBS Bank Singapore",
        "email": unique_email,
        "password": "SecurePassword999!",
        "confirm_password": "SecurePassword999!",
        "account_type": "INDIVIDUAL",
        "preferred_currency": "SGD",
        "proxy_type": "MOBILE",
        "proxy_value": "+6598761234",
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == unique_email
    assert data["user"]["name"] == "Johnathan Doe"
    assert data["user"]["home_country"] == "SG"
    assert data["user"]["bic"] == "DBSGSGSG"
    assert "access_token" in data

    # Verify subsequent login works with new user
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": unique_email,
            "password": "SecurePassword999!",
        },
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["id"] == data["user"]["id"]


def test_signup_password_mismatch():
    """Verify signup fails when password and confirm_password do not match."""
    payload = {
        "name": "Mismatch Test",
        "contact_number": "+919123456789",
        "home_country": "IN",
        "bank_name": "State Bank of India (SBI)",
        "email": "mismatch@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword456!",
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]


def test_signup_short_password():
    """Verify signup rejects passwords shorter than 6 characters."""
    payload = {
        "name": "Short Password",
        "contact_number": "+971501234567",
        "home_country": "AE",
        "bank_name": "Emirates NBD",
        "email": "short@example.com",
        "password": "123",
        "confirm_password": "123",
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422 or response.status_code == 400


def test_login_invalid_password():
    """Verify login failure with incorrect password."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "rahul@okhdfcbank.com",
            "password": "WrongPassword999!",
        },
    )
    assert response.status_code == 401
    assert "Invalid email address or password" in response.json()["detail"]


def test_login_nonexistent_user():
    """Verify login failure with non-registered email."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "ghost.user.999@domain.xyz",
            "password": "Password123!",
        },
    )
    assert response.status_code == 401
