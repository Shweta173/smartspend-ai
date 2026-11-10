"""Basic auth endpoint tests."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_smartspend.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_register_and_login():
    r = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test@1234",
        "full_name": "Test User",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data

    r2 = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Test@1234",
    })
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_login_wrong_password():
    client.post("/api/v1/auth/register", json={
        "email": "test2@example.com",
        "password": "Test@1234",
        "full_name": "Test User",
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "test2@example.com",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_me_requires_auth():
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_me_with_token():
    client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "Test@1234",
        "full_name": "Me User",
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "me@example.com",
        "password": "Test@1234",
    })
    token = r.json()["access_token"]
    r2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "me@example.com"
