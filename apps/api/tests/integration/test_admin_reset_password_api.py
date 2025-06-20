import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from .test_api import override_admin, override_member
from apps.api import auth

client = TestClient(app)

ADMIN_TOKEN = "admin-test-token"  # Replace with real token or fixture
ORG_ID = "00000000-0000-0000-0000-000000000001"

def get_auth_headers(role="admin"):
    return {"Authorization": f"Bearer {ADMIN_TOKEN}", "X-User-Role": role}

def test_admin_can_trigger_password_reset(monkeypatch):
    app.dependency_overrides[auth.get_current_user] = override_admin
    # Mock Supabase API call
    def mock_post(*args, **kwargs):
        class MockResp:
            def raise_for_status(self):
                pass
        return MockResp()
    monkeypatch.setattr("requests.post", mock_post)
    resp = client.post(
        "/api/admin/reset-password",
        params={"org_id": ORG_ID},
        json={"user_email": "user@example.com"},
        headers=get_auth_headers("admin")
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert "Password reset email sent" in resp.json()["message"]
    app.dependency_overrides = {}

def test_non_admin_forbidden():
    app.dependency_overrides[auth.get_current_user] = override_member
    resp = client.post(
        "/api/admin/reset-password",
        params={"org_id": ORG_ID},
        json={"user_email": "user@example.com"},
        headers=get_auth_headers("user")
    )
    assert resp.status_code == 403
    assert "Admin access required" in resp.text
    app.dependency_overrides = {}

def test_missing_email():
    app.dependency_overrides[auth.get_current_user] = override_admin
    resp = client.post(
        "/api/admin/reset-password",
        params={"org_id": ORG_ID},
        json={},
        headers=get_auth_headers("admin")
    )
    assert resp.status_code == 422
    app.dependency_overrides = {}

def test_supabase_failure(monkeypatch):
    app.dependency_overrides[auth.get_current_user] = override_admin
    def mock_post(*args, **kwargs):
        raise Exception("Supabase error")
    monkeypatch.setattr("requests.post", mock_post)
    resp = client.post(
        "/api/admin/reset-password",
        params={"org_id": ORG_ID},
        json={"user_email": "user@example.com"},
        headers=get_auth_headers("admin")
    )
    assert resp.status_code == 500
    assert "Failed to trigger password reset" in resp.text
    app.dependency_overrides = {} 