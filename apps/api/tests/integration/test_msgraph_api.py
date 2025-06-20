import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch, MagicMock
from apps.api import auth
from .test_api import override_user, override_admin
import os
from apps.api.ms_api import get_org_ms_creds

def test_list_msgraph_users_api():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('ms_api.list_ms_users', return_value=[{'id': 'msuser-1', 'display_name': 'User One', 'mail': 'user1@example.com'}]):
        with TestClient(app) as client:
            resp = client.get("/msgraph/users/", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp.status_code == 200
            users = resp.json()
            assert isinstance(users, list)
            assert users[0]['id'] == 'msuser-1'
    app.dependency_overrides = {} 

# --- PII Filtering Tests ---
def test_msgraph_users_pii_filtered(monkeypatch):
    # STORE_PII is not set or is not 'true' => PII should be stripped
    monkeypatch.delenv('STORE_PII', raising=False)
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('ms_api.list_ms_users', return_value=[{'id': 'msuser-1', 'display_name': 'User One', 'mail': 'user1@example.com'}]):
        with TestClient(app) as client:
            resp = client.get("/msgraph/users/", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp.status_code == 200
            users = resp.json()
            assert isinstance(users, list)
            assert users[0]['id'] == 'msuser-1'
            assert 'mail' not in users[0]
            assert 'display_name' not in users[0]
    app.dependency_overrides = {}

def test_msgraph_users_pii_present(monkeypatch):
    # STORE_PII is 'true' => PII should be present
    monkeypatch.setenv('STORE_PII', 'true')
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('ms_api.list_ms_users', return_value=[{'id': 'msuser-1', 'display_name': 'User One', 'mail': 'user1@example.com'}]):
        with TestClient(app) as client:
            resp = client.get("/msgraph/users/", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp.status_code == 200
            users = resp.json()
            assert isinstance(users, list)
            assert users[0]['id'] == 'msuser-1'
            assert users[0]['mail'] == 'user1@example.com'
            assert users[0]['display_name'] == 'User One'
    app.dependency_overrides = {}

def test_get_org_ms_creds_valid(monkeypatch):
    # Mock Supabase response
    monkeypatch.setenv("SUPABASE_URL", "https://fake.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake-key")
    monkeypatch.setenv("AZURE_KEYVAULT_URL", "https://fake.vault.azure.net")
    with patch("requests.get") as mock_get, patch("azure_keyvault.get_secret_from_keyvault") as mock_kv:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"secret_ref": "my-secret"}]
        mock_kv.return_value = {"client_id": "id", "client_secret": "secret", "tenant_id": "tid"}
        creds = get_org_ms_creds("org-123")
        assert creds["client_id"] == "id"
        assert creds["client_secret"] == "secret"
        assert creds["tenant_id"] == "tid"

def test_get_org_ms_creds_fallback_dev(monkeypatch):
    monkeypatch.setenv("ENV", "development")
    monkeypatch.setenv("MS_CLIENT_ID", "dev-id")
    monkeypatch.setenv("MS_CLIENT_SECRET", "dev-secret")
    monkeypatch.setenv("MS_TENANT_ID", "dev-tid")
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = []
        creds = get_org_ms_creds("org-404")
        assert creds["client_id"] == "dev-id"
        assert creds["client_secret"] == "dev-secret"
        assert creds["tenant_id"] == "dev-tid"

def test_get_org_ms_creds_error(monkeypatch):
    monkeypatch.delenv("ENV", raising=False)
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = []
        try:
            get_org_ms_creds("org-404")
            assert False, "Should raise Exception if no record and not dev"
        except Exception as e:
            assert "No ms_org_credentials found" in str(e) 