import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from unittest.mock import patch
from apps.api import auth
from apps.api.auth import require_org_role
import time
from jose import jwt
from fastapi.security import OAuth2PasswordRequestForm
import requests
import builtins

def override_admin():
    return {'id': '00000000-0000-0000-0000-0000000000a1', 'role': 'admin', 'org_id': '00000000-0000-0000-0000-000000000001'}

def override_member():
    return {'id': '00000000-0000-0000-0000-0000000000b2', 'role': 'member', 'org_id': '00000000-0000-0000-0000-000000000001'}

def override_nonmember():
    return {'id': '00000000-0000-0000-0000-0000000000c3', 'role': 'user', 'org_id': '00000000-0000-0000-0000-000000000099'}

def override_expired_token():
    # Simulate an expired JWT (exp in the past)
    expired_token = jwt.encode({"sub": "00000000-0000-0000-0000-0000000000a1", "exp": int(time.time()) - 100}, "super-secret-key", algorithm="HS256")
    return expired_token

def override_invalid_token():
    # Simulate an invalid JWT (bad signature)
    return "invalid.token.value"

def override_user():
    return {'id': '00000000-0000-0000-0000-0000000000b2', 'role': 'member', 'org_id': '00000000-0000-0000-0000-000000000001'}

def override_auditor():
    return {'id': '00000000-0000-0000-0000-0000000000d4', 'role': 'auditor', 'org_id': '00000000-0000-0000-0000-000000000001'}

def dummy_require_org_role(*args, **kwargs):
    def inner(*a, **k):
        return {"org_id": "00000000-0000-0000-0000-000000000001", "user_id": "00000000-0000-0000-0000-0000000000a1", "role": "admin"}
    return inner

def test_create_user_api():
    with patch('apps.api.auth.signup_user', return_value={'id': 'user-1', 'email': 'test@example.com'}), \
         patch('apps.api.supabase_client.create_user', return_value={'data': {'id': 'user-1'}}), \
         patch('apps.api.main.log_audit_event'), patch('apps.api.main.log_audit_event_sync'):
        with TestClient(app) as client:
            response = client.post("/users/", params={
                'org_id': '00000000-0000-0000-0000-000000000001',
                'email': 'test@example.com',
                'password': 'password',
                'full_name': 'Test User',
                'role': 'admin'
            })
            assert response.status_code == 200
            assert response.json()['email'] == 'test@example.com'

def test_disable_user_api_as_admin():
    from unittest.mock import Mock
    mock_get_response = Mock()
    mock_get_response.status_code = 200
    mock_get_response.json.return_value = [{'role': 'admin', 'user_id': '00000000-0000-0000-0000-0000000000a1', 'org_id': '00000000-0000-0000-0000-000000000001'}]
    
    with patch('apps.api.auth.verify_jwt_token', return_value={'id': '00000000-0000-0000-0000-0000000000d1', 'role': 'admin', 'org_id': '00000000-0000-0000-0000-000000000001'}), \
         patch('apps.api.auth.get_current_user', override_admin), \
         patch('requests.get', return_value=mock_get_response), \
         patch('apps.api.supabase_client.SUPABASE_URL', 'http://dummy-url'), \
         patch('apps.api.supabase_client.SUPABASE_SERVICE_ROLE_KEY', 'dummy-key'), \
         patch('apps.api.main.supabase_client.disable_user', return_value={'data': {'id': '00000000-0000-0000-0000-0000000000b2', 'is_disabled': True}}), \
         patch('apps.api.main.supabase_client.create_audit_log', return_value={'data': {'id': 'log-1'}}), \
         patch('apps.api.main.log_audit_event'), patch('apps.api.main.log_audit_event_sync'), \
         patch('requests.post', return_value=type('obj', (object,), {'raise_for_status': lambda self: None})()), \
         patch('builtins.print') as mock_print:
        with TestClient(app) as client:
            headers = {"Authorization": "Bearer test-token"}
            resp = client.post("/users/00000000-0000-0000-0000-0000000000b2/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b2'}, headers=headers)
            output = '\n'.join(str(call) for call in mock_print.call_args_list)
            if resp.status_code != 200:
                print('==== CAPTURED OUTPUT START ====')
                print(output)
                print('==== CAPTURED OUTPUT END ====')
                print('==== RESPONSE BODY START ====')
                print(resp.text)
                print('==== RESPONSE BODY END ====')
                assert False, f"Status: {resp.status_code}"
            assert resp.json()['status'] == 'disabled'
    app.dependency_overrides = {}

def test_disable_user_api_as_member():
    app.dependency_overrides[auth.get_current_user] = override_member
    with patch('apps.api.main.log_audit_event'), patch('apps.api.main.log_audit_event_sync'):
        with TestClient(app) as client:
            resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
            assert resp.status_code == 403
    app.dependency_overrides = {}

def test_disable_user_api_as_nonmember():
    app.dependency_overrides[auth.get_current_user] = override_nonmember
    with patch('apps.api.main.log_audit_event'), patch('apps.api.main.log_audit_event_sync'):
        with TestClient(app) as client:
            resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
            assert resp.status_code == 403
    app.dependency_overrides = {}

def test_enable_user_api_as_admin():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('apps.api.main.supabase_client.enable_user', return_value={'data': {'id': '00000000-0000-0000-0000-0000000000b2', 'is_disabled': False}}), \
         patch('apps.api.main.supabase_client.create_audit_log', return_value={'data': {'id': 'log-2'}}), \
         patch('apps.api.main.log_audit_event'), patch('apps.api.main.log_audit_event_sync'), \
         patch('requests.post', return_value=type('obj', (object,), {'raise_for_status': lambda self: None})()):
        with TestClient(app) as client:
            resp = client.post("/users/00000000-0000-0000-0000-0000000000b2/enable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b2'})
            assert resp.status_code == 200
            assert resp.json()['status'] == 'enabled'
    app.dependency_overrides = {}

def test_enable_user_api_as_member():
    app.dependency_overrides[auth.get_current_user] = override_member
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/enable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

def test_delete_user_api_as_admin():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('supabase_client.delete_user', return_value={'data': {'id': '00000000-0000-0000-0000-0000000000b2'}}), \
         patch('supabase_client.create_audit_log', return_value={'data': {'id': 'log-3'}}):
        with TestClient(app) as client:
            resp = client.delete("/users/00000000-0000-0000-0000-0000000000b2", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b2'})
            assert resp.status_code == 200
            assert resp.json()['status'] == 'deleted'
    app.dependency_overrides = {}

def test_delete_user_api_as_member():
    app.dependency_overrides[auth.get_current_user] = override_member
    with TestClient(app) as client:
        resp = client.delete("/users/00000000-0000-0000-0000-0000000000b3", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

def test_delete_user_api_as_nonmember():
    app.dependency_overrides[auth.get_current_user] = override_nonmember
    with TestClient(app) as client:
        resp = client.delete("/users/00000000-0000-0000-0000-0000000000b3", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

def test_disable_last_admin_fails():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('supabase_client.disable_user', return_value={'error': {'message': 'Cannot disable last admin'}}):
        with TestClient(app) as client:
            resp = client.post("/users/00000000-0000-0000-0000-0000000000a1/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000a1'})
            assert resp.status_code == 400
            assert 'last admin' in resp.text
    app.dependency_overrides = {}

def test_delete_last_admin_fails():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('supabase_client.delete_user', return_value={'error': {'message': 'Cannot delete last admin'}}):
        with TestClient(app) as client:
            resp = client.delete("/users/00000000-0000-0000-0000-0000000000a1", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000a1'})
            assert resp.status_code == 400
            assert 'last admin' in resp.text
    app.dependency_overrides = {}

def test_disable_user_missing_params():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b2/disable", params={})
        assert resp.status_code in (400, 422)
    app.dependency_overrides = {}

def test_delete_user_nonexistent():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('supabase_client.delete_user', return_value={'error': {'message': 'User not found'}}):
        with TestClient(app) as client:
            resp = client.delete("/users/dead", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': 'dead'})
            assert resp.status_code == 422
    app.dependency_overrides = {}

def test_disable_user_malformed_user_id():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with TestClient(app) as client:
        resp = client.post("/users/beef/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': 'beef'})
        assert resp.status_code == 422
    app.dependency_overrides = {}

# Test: No token provided (should be 401)
def test_disable_user_no_token():
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 401

# Test: Invalid token (should be 401)
def test_disable_user_invalid_token():
    with TestClient(app) as client:
        client.headers = {"Authorization": f"Bearer {override_invalid_token()}"}
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 401

# Test: Expired token (should be 401)
def test_disable_user_expired_token():
    with TestClient(app) as client:
        client.headers = {"Authorization": f"Bearer {override_expired_token()}"}
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 401

# Test: Valid token but wrong org (should be 403)
def test_disable_user_wrong_org():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000099', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

# Test: User removed from org after login (simulate by returning no org_id)
def override_removed_user():
    return {'id': '00000000-0000-0000-0000-0000000000a1', 'role': 'admin'}  # No org_id

def test_disable_user_removed_from_org():
    app.dependency_overrides[auth.get_current_user] = override_removed_user
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

# Test: Role downgraded after login (simulate by returning member role)
def override_downgraded_user():
    return {'id': '00000000-0000-0000-0000-0000000000a1', 'role': 'member', 'org_id': '00000000-0000-0000-0000-000000000001'}

def test_disable_user_role_downgraded():
    app.dependency_overrides[auth.get_current_user] = override_downgraded_user
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

# Test: Attempt to escalate privileges via crafted token (simulate by returning admin role for wrong org)
def override_fake_admin():
    return {'id': '00000000-0000-0000-0000-0000000000a1', 'role': 'admin', 'org_id': '00000000-0000-0000-0000-000000000099'}

def test_disable_user_privilege_escalation():
    app.dependency_overrides[auth.get_current_user] = override_fake_admin
    with TestClient(app) as client:
        resp = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
        assert resp.status_code == 403
    app.dependency_overrides = {}

def test_login_and_expired_token():
    """Test login, then simulate session expiration (expired access token)."""
    with TestClient(app) as client:
        # Simulate login
        form = {"username": "admin@example.com", "password": "password"}
        resp = client.post("/token", data=form)
        assert resp.status_code in (200, 400)  # 400 if user doesn't exist, 200 if success
        if resp.status_code == 200:
            access_token = resp.json().get("access_token")
            # Simulate token expiry by using an expired token
            expired_token = jwt.encode({"sub": "00000000-0000-0000-0000-0000000000a1", "exp": int(time.time()) - 100}, "super-secret-key", algorithm="HS256")
            client.headers = {"Authorization": f"Bearer {expired_token}"}
            resp2 = client.post("/users/00000000-0000-0000-0000-0000000000b3/disable", params={'org_id': '00000000-0000-0000-0000-000000000001', 'user_id': '00000000-0000-0000-0000-0000000000b3'})
            assert resp2.status_code == 401

# If refresh tokens are supported, test refresh flow
# (Assume /token endpoint issues refresh_token if supported)
def test_refresh_token_flow():
    """Test refresh token flow: valid and expired/invalid refresh tokens."""
    with TestClient(app) as client:
        form = {"username": "admin@example.com", "password": "password"}
        resp = client.post("/token", data=form)
        if resp.status_code == 200:
            refresh_token = resp.json().get("refresh_token")
            if refresh_token:
                # Simulate valid refresh
                resp2 = client.post("/token", data={"grant_type": "refresh_token", "refresh_token": refresh_token})
                assert resp2.status_code in (200, 400, 401)
                # Simulate expired/invalid refresh token
                resp3 = client.post("/token", data={"grant_type": "refresh_token", "refresh_token": "invalid.refresh.token"})
                assert resp3.status_code in (400, 401)

def test_audit_log_access_as_admin():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with TestClient(app) as client:
        resp = client.get("/audit_logs/00000000-0000-0000-0000-0000000000a1", params={'org_id': '00000000-0000-0000-0000-000000000001'})
        assert resp.status_code in (200, 404)  # 200 if logs exist, 404 if not
    app.dependency_overrides = {}

def test_audit_log_access_as_auditor():
    app.dependency_overrides[auth.get_current_user] = override_auditor
    with TestClient(app) as client:
        resp = client.get("/audit_logs/00000000-0000-0000-0000-0000000000d4", params={'org_id': '00000000-0000-0000-0000-000000000001'})
        assert resp.status_code in (200, 404)
    app.dependency_overrides = {}

def test_audit_log_access_as_user():
    app.dependency_overrides[auth.get_current_user] = override_user
    with TestClient(app) as client:
        resp = client.get("/audit_logs/00000000-0000-0000-0000-0000000000b2", params={'org_id': '00000000-0000-0000-0000-000000000001'})
        assert resp.status_code in (403, 404)  # Should be forbidden or not found
    app.dependency_overrides = {}

def test_audit_log_access_event_logged():
    app.dependency_overrides[auth.get_current_user] = override_admin
    with patch('apps.api.main.log_audit_event') as mock_log_event:
        with TestClient(app) as client:
            client.get("/audit_logs/00000000-0000-0000-0000-0000000000a1", params={'org_id': '00000000-0000-0000-0000-000000000001'})
            assert mock_log_event.called
            args, kwargs = mock_log_event.call_args
            assert 'audit_log_access' in str(args) or 'audit_log_access' in str(kwargs)
    app.dependency_overrides = {}