import pytest
from fastapi.testclient import TestClient
from app.db.init_indexes import init_db_indexes
from app.db.mongodb import DatabaseManager
from app.db.seed_data import seed_initial_data
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Force in-memory mock database for fast, isolated, reliable tests
    DatabaseManager.connect(force_mock=True)
    init_db_indexes()
    seed_initial_data()
    yield
    DatabaseManager.disconnect()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@fixtrack.com",
        "password": "AdminPass123!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def business_owner_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "owner@apexrepair.com",
        "password": "OwnerPass123!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def technician_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "tech@apexrepair.com",
        "password": "TechPass123!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def customer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "customer@example.com",
        "password": "CustomerPass123!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def customer2_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "david@example.com",
        "password": "CustomerPass123!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]
