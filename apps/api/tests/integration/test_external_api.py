import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch

client = TestClient(app)

# Dummy JWT and API key for testing
dummy_jwt = "Bearer test.jwt.token"
dummy_api_key = "test-api-key"

def mock_api_key_auth_valid(*args, **kwargs):
    return {"org_id": "org-1", "role": "admin", "label": "test", "api_key_id": "key-1"}

def mock_api_key_auth_invalid(*args, **kwargs):
    from fastapi import HTTPException
    raise HTTPException(status_code=403, detail="Invalid or inactive API key")

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_valid)
def test_trigger_scan_api_key(mock_auth):
    resp = client.post("/external/scans/trigger", headers={"x-api-key": dummy_api_key})
    assert resp.status_code == 200
    assert "Scan triggered" in resp.json().get("message", "")

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_invalid)
def test_trigger_scan_invalid_api_key(mock_auth):
    resp = client.post("/external/scans/trigger", headers={"x-api-key": "bad-key"})
    assert resp.status_code == 403

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_valid)
def test_list_rules_api_key(mock_auth):
    resp = client.get("/external/rules/", headers={"x-api-key": dummy_api_key})
    assert resp.status_code == 200
    assert "rules" in resp.json()

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_valid)
def test_create_rule_api_key(mock_auth):
    resp = client.post("/external/rules/", headers={"x-api-key": dummy_api_key})
    assert resp.status_code == 200
    assert "Rule created" in resp.json().get("message", "")

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_valid)
def test_get_summary_report_api_key(mock_auth):
    resp = client.get("/external/reports/summary", headers={"x-api-key": dummy_api_key})
    assert resp.status_code == 200
    assert "summary" in resp.json()

@patch("src.api.routes.external_api.api_key_auth", side_effect=mock_api_key_auth_valid)
def test_rate_limit_trigger_scan(mock_auth):
    # Exceed rate limit (10/minute)
    for _ in range(11):
        resp = client.post("/external/scans/trigger", headers={"x-api-key": dummy_api_key})
    assert resp.status_code == 429
    assert "Too Many Requests" in resp.text 