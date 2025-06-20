import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch
from apps.api import auth
from .test_api import override_user, override_admin

def test_create_and_get_scan_api():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('supabase_client.create_scan', return_value={'data': {'id': '00000000-0000-0000-0000-00000000c001'}}), \
         patch('supabase_client.get_scan', return_value={'data': {'id': '00000000-0000-0000-0000-00000000c001'}}):
        with TestClient(app) as client:
            resp = client.post("/scans/", params={
                'org_id': '00000000-0000-0000-0000-000000000001',
                'user_id': '00000000-0000-0000-0000-000000000001',
                'scan_type': 'type',
                'status': 'pending',
                'target': 'target',
                'metadata': '{}'
            })
            assert resp.status_code == 200
            assert resp.json()['id'] == '00000000-0000-0000-0000-00000000c001'
            resp2 = client.get("/scans/00000000-0000-0000-0000-00000000c001", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp2.status_code == 200
            assert resp2.json()['id'] == '00000000-0000-0000-0000-00000000c001'
    app.dependency_overrides = {}

def test_create_scan_missing_params():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.post("/scans/", params={})
        assert resp.status_code == 401
    app.dependency_overrides = {}

def test_create_scan_unauthorized():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.post("/scans/", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b2', 'scan_type': 'type', 'status': 'pending', 'target': 'target', 'metadata': '{}'})
        assert resp.status_code == 401
    app.dependency_overrides = {}

def test_get_scan_nonexistent():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('supabase_client.get_scan', return_value={'error': {'message': 'Scan not found'}}):
        with TestClient(app) as client:
            resp = client.get("/scans/00000000-0000-0000-0000-00000000dead", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp.status_code == 404
    app.dependency_overrides = {}

def test_get_scan_malformed_scan_id():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.get("/scans/00000000-0000-0000-0000-00000000beef", params={'org_id': '00000000-0000-0000-0000-000000000001'})
        assert resp.status_code == 422
    app.dependency_overrides = {} 