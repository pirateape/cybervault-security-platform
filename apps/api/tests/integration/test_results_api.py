import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch, AsyncMock
from apps.api import auth
from .test_api import override_user, override_admin

def test_create_and_get_results_api():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('supabase_client.create_result', return_value={'data': {'id': '00000000-0000-0000-0000-00000000d001'}}), \
         patch('supabase_client.get_results_for_scan', return_value={'data': [{'id': '00000000-0000-0000-0000-00000000d001'}]}):
        with TestClient(app) as client:
            resp = client.post("/results/", params={
                'org_id': '00000000-0000-0000-0000-000000000001',
                'scan_id': '00000000-0000-0000-0000-00000000c001',
                'user_id': '00000000-0000-0000-0000-0000000000b2',
                'finding': 'finding',
                'severity': 'high',
                'compliance_framework': 'NIST',
                'details': '{}'
            })
            assert resp.status_code == 200
            assert resp.json()['id'] == '00000000-0000-0000-0000-00000000d001'
            resp2 = client.get("/results/00000000-0000-0000-0000-00000000c001", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp2.status_code == 200
            assert resp2.json()[0]['id'] == '00000000-0000-0000-0000-00000000d001'
    app.dependency_overrides = {}

def test_create_result_missing_params():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.post("/results/", params={})
        assert resp.status_code == 401
    app.dependency_overrides = {}

def test_create_result_unauthorized():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.post("/results/", params={'org_id': '00000000-0000-0000-0000-000000000001', 'scan_id': '00000000-0000-0000-0000-00000000c001', 'user_id': '00000000-0000-0000-0000-0000000000b2', 'finding': 'finding', 'severity': 'high', 'compliance_framework': 'NIST', 'details': '{}'})
        assert resp.status_code == 401
    app.dependency_overrides = {}

def test_get_results_for_scan_nonexistent():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('supabase_client.get_results_for_scan', return_value={'error': {'message': 'Results not found'}}):
        with TestClient(app) as client:
            resp = client.get("/results/dead", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert resp.status_code == 404
    app.dependency_overrides = {}

def test_get_results_for_scan_malformed_scan_id():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.get("/results/beef", params={'org_id': '00000000-0000-0000-0000-000000000001'})
        assert resp.status_code == 422
    app.dependency_overrides = {}

def test_auto_create_remediation_on_failed_result():
    app.dependency_overrides[auth.get_current_user] = override_user
    with patch('supabase_client.create_result', return_value={'data': [{'id': '00000000-0000-0000-0000-00000000d002'}]}), \
         patch('apps.api.compliance_engine.remediation.create_remediation_action', new_callable=AsyncMock) as mock_create_remediation:
        from apps.api.compliance_engine.result_storage import store_scan_result
        import asyncio
        # Simulate a failed scan result (passed=False)
        asyncio.run(store_scan_result(
            org_id='00000000-0000-0000-0000-000000000001',
            scan_id='00000000-0000-0000-0000-00000000c002',
            user_id='00000000-0000-0000-0000-0000000000b2',
            finding='non-compliant',
            severity='high',
            compliance_framework='NIST',
            details={},
            passed=False
        ))
        mock_create_remediation.assert_awaited_once()
    app.dependency_overrides = {} 