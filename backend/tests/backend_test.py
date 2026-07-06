"""GLO Venture backend API tests."""
import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback to frontend env
    fe_env = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if fe_env.exists():
        for line in fe_env.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@gloventure.mw")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ----------------- Health -----------------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ----------------- Products -----------------
def test_products_returns_three(session):
    r = session.get(f"{API}/products")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 3
    by_id = {p["id"]: p for p in data}
    assert by_id["rice-5kg"]["price_mwk"] == 8500
    assert by_id["rice-5kg"]["size_kg"] == 5
    assert by_id["rice-25kg"]["price_mwk"] == 38000
    assert by_id["rice-25kg"]["size_kg"] == 25
    assert by_id["rice-50kg"]["price_mwk"] == 72000
    assert by_id["rice-50kg"]["size_kg"] == 50


# ----------------- Orders create -----------------
def test_create_order_happy(session):
    payload = {
        "customer_name": "TEST_Alice",
        "phone": "+265999000111",
        "location": "Dowa",
        "address_details": "Near the big tree, House 12",
        "items": [{"product_id": "rice-5kg", "quantity": 2}, {"product_id": "rice-25kg", "quantity": 1}],
        "notes": "TEST order",
    }
    r = session.post(f"{API}/orders", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "pending"
    assert d["total_mwk"] == 2 * 8500 + 38000
    assert len(d["items"]) == 2
    assert d["items"][0]["name"] and d["items"][0]["size_kg"] and d["items"][0]["unit_price_mwk"]
    assert d["items"][0]["line_total_mwk"] == d["items"][0]["unit_price_mwk"] * d["items"][0]["quantity"]
    assert isinstance(d["id"], str) and len(d["id"]) > 8
    pytest.created_order_id = d["id"]


def test_create_order_unknown_product(session):
    payload = {
        "customer_name": "TEST_Bob",
        "phone": "+265999000112",
        "location": "Dowa",
        "address_details": "Addr",
        "items": [{"product_id": "rice-999kg", "quantity": 1}],
    }
    r = session.post(f"{API}/orders", json=payload)
    assert r.status_code == 400


def test_create_order_empty_items(session):
    payload = {
        "customer_name": "TEST_Carol",
        "phone": "+265999000113",
        "location": "Dowa",
        "address_details": "Addr",
        "items": [],
    }
    r = session.post(f"{API}/orders", json=payload)
    # Pydantic may return 422 OR custom 400. Spec says 400, but empty list passes pydantic validation
    # so it should hit our 400 branch.
    assert r.status_code in (400, 422)


# ----------------- Admin login -----------------
def test_admin_login_bad(session):
    r = session.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_admin_login_good(session):
    r = session.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    j = r.json()
    assert "access_token" in j and j["token_type"] == "bearer"
    assert j["user"]["email"] == ADMIN_EMAIL


# ----------------- Admin endpoints auth -----------------
def test_orders_list_requires_auth(session):
    r = session.get(f"{API}/orders")
    assert r.status_code == 401


def test_orders_list_with_auth(session, auth_headers):
    r = session.get(f"{API}/orders", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Must not contain mongo _id
    for o in data:
        assert "_id" not in o
    # Sorted by created_at desc
    if len(data) >= 2:
        assert data[0]["created_at"] >= data[1]["created_at"]


def test_admin_me(session, auth_headers):
    r = session.get(f"{API}/admin/me")
    assert r.status_code == 401
    r = session.get(f"{API}/admin/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL
    assert r.json()["role"] == "admin"


def test_admin_stats(session, auth_headers):
    r = session.get(f"{API}/admin/stats", headers=auth_headers)
    assert r.status_code == 200
    j = r.json()
    for k in ("total_orders", "pending", "delivered", "revenue_mwk"):
        assert k in j


# ----------------- Patch order status -----------------
def test_patch_order_invalid_status(session, auth_headers):
    oid = getattr(pytest, "created_order_id", None)
    assert oid, "Order must have been created"
    r = session.patch(f"{API}/orders/{oid}", json={"status": "weird"}, headers=auth_headers)
    assert r.status_code == 400


def test_patch_order_unknown_id(session, auth_headers):
    r = session.patch(f"{API}/orders/does-not-exist-xyz", json={"status": "confirmed"}, headers=auth_headers)
    assert r.status_code == 404


def test_patch_order_requires_auth(session):
    oid = getattr(pytest, "created_order_id", None)
    assert oid
    r = session.patch(f"{API}/orders/{oid}", json={"status": "confirmed"})
    assert r.status_code == 401


def test_patch_order_success(session, auth_headers):
    oid = getattr(pytest, "created_order_id", None)
    assert oid
    r = session.patch(f"{API}/orders/{oid}", json={"status": "confirmed"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "confirmed"
    # verify persisted
    r2 = session.get(f"{API}/orders", headers=auth_headers)
    found = next((o for o in r2.json() if o["id"] == oid), None)
    assert found and found["status"] == "confirmed"
