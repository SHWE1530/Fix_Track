def test_registration_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "full_name": "Test User",
        "phone": "+1234567890",
        "role": "customer"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "customer"
    assert "password_hash" not in data["user"]

def test_registration_duplicate_email(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "customer@example.com",
        "password": "AnotherPassword123!",
        "full_name": "Duplicate User",
        "role": "customer"
    })
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()

def test_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "customer@example.com",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert "incorrect email or password" in res.json()["detail"].lower()

def test_current_user_profile(client, customer_token):
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {customer_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "customer@example.com"
    assert data["full_name"] == "Alice Morgan"

def test_unauthenticated_request_rejected(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
