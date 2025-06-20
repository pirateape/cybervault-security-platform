import pytest
from fastapi.testclient import TestClient
from apps.ai_risk_service.main import app
from jose import jwt

client = TestClient(app)

# Example input from README
valid_input = {
    "org_id": "123e4567-e89b-12d3-a456-426614174000",
    "scan_id": "abc123",
    "user_id": "user42",
    "finding": "non-compliant",
    "severity": "high",
    "compliance_framework": "NIST",
    "details": {"control": "MFA"}
}

JWT_SECRET = "super-secret-key"
ALGORITHM = "HS256"

def make_jwt(payload=None):
    if payload is None:
        payload = {"sub": "test-user", "org_id": "test-org"}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def auth_headers():
    return {"Authorization": f"Bearer {make_jwt()}"}

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_supabase_health():
    resp = client.get("/supabase-health")
    assert resp.status_code == 200
    assert "status" in resp.json()
    # Accept both ok and error (if no Supabase connection in test env)
    assert resp.json()["status"] in ("ok", "error")

def test_predict_valid():
    resp = client.post("/predict", json=valid_input, headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "risk_score" in data
    assert "recommendation" in data
    assert "model_version" in data

def test_predict_missing_field():
    bad_input = valid_input.copy()
    del bad_input["finding"]
    resp = client.post("/predict", json=bad_input, headers=auth_headers())
    assert resp.status_code == 422

def test_predict_invalid_type():
    bad_input = valid_input.copy()
    bad_input["details"] = "not-a-dict"
    resp = client.post("/predict", json=bad_input, headers=auth_headers())
    assert resp.status_code == 422

def test_predict_no_token():
    resp = client.post("/predict", json=valid_input)
    assert resp.status_code == 401

def test_predict_invalid_token():
    resp = client.post("/predict", json=valid_input, headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401 