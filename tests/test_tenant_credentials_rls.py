import pytest
import httpx

SUPABASE_URL = 'https://<your-supabase-url>.supabase.co/rest/v1'
ADMIN_TOKEN = '<admin-jwt-for-tenant-a>'
MEMBER_TOKEN = '<member-jwt-for-tenant-b>'
TENANT_A_ORG_ID = '<tenant-a-org-id>'
TENANT_B_ORG_ID = '<tenant-b-org-id>'

# Helper to make authorized requests

def supabase_request(token, method, path, **kwargs):
    headers = {'apikey': token, 'Authorization': f'Bearer {token}'}
    return httpx.request(method, f"{SUPABASE_URL}{path}", headers=headers, **kwargs)

@pytest.mark.skipif('not all test users/orgs/tokens are available', reason='Requires seeded test data and JWTs')
def test_tenant_admin_crud_own_credentials():
    # Admin can create
    resp = supabase_request(ADMIN_TOKEN, 'POST', '/tenant_credentials', json={
        'org_id': TENANT_A_ORG_ID,
        'name': 'test-cred',
        'encrypted_value': 'secret',
    })
    assert resp.status_code in (200, 201)
    cred_id = resp.json()['id']

    # Admin can read
    resp = supabase_request(ADMIN_TOKEN, 'GET', f'/tenant_credentials?id=eq.{cred_id}')
    assert resp.status_code == 200
    assert resp.json()[0]['org_id'] == TENANT_A_ORG_ID

    # Admin can update
    resp = supabase_request(ADMIN_TOKEN, 'PATCH', f'/tenant_credentials?id=eq.{cred_id}', json={'encrypted_value': 'new-secret'})
    assert resp.status_code == 204

    # Admin can delete
    resp = supabase_request(ADMIN_TOKEN, 'DELETE', f'/tenant_credentials?id=eq.{cred_id}')
    assert resp.status_code == 204

@pytest.mark.skipif('not all test users/orgs/tokens are available', reason='Requires seeded test data and JWTs')
def test_tenant_member_cannot_crud_credentials():
    # Member cannot create
    resp = supabase_request(MEMBER_TOKEN, 'POST', '/tenant_credentials', json={
        'org_id': TENANT_B_ORG_ID,
        'name': 'should-fail',
        'encrypted_value': 'fail',
    })
    assert resp.status_code in (401, 403)

    # Member cannot update/delete (assume a credential exists)
    cred_id = '<existing-tenant-b-cred-id>'
    resp = supabase_request(MEMBER_TOKEN, 'PATCH', f'/tenant_credentials?id=eq.{cred_id}', json={'encrypted_value': 'fail'})
    assert resp.status_code in (401, 403)
    resp = supabase_request(MEMBER_TOKEN, 'DELETE', f'/tenant_credentials?id=eq.{cred_id}')
    assert resp.status_code in (401, 403)

@pytest.mark.skipif('not all test users/orgs/tokens are available', reason='Requires seeded test data and JWTs')
def test_cross_tenant_access_denied():
    # Admin from Tenant A cannot access Tenant B's credentials
    cred_id = '<existing-tenant-b-cred-id>'
    resp = supabase_request(ADMIN_TOKEN, 'GET', f'/tenant_credentials?id=eq.{cred_id}')
    assert resp.status_code in (401, 403) or (resp.status_code == 200 and not resp.json())

# Security/abuse case: member tries to escalate privileges
@pytest.mark.skipif('not all test users/orgs/tokens are available', reason='Requires seeded test data and JWTs')
def test_member_privilege_escalation_attempts():
    # Try to create a credential for another org
    resp = supabase_request(MEMBER_TOKEN, 'POST', '/tenant_credentials', json={
        'org_id': TENANT_A_ORG_ID,
        'name': 'escalate',
        'encrypted_value': 'fail',
    })
    assert resp.status_code in (401, 403)
    # Try to update/delete a credential in another org
    cred_id = '<existing-tenant-a-cred-id>'
    resp = supabase_request(MEMBER_TOKEN, 'PATCH', f'/tenant_credentials?id=eq.{cred_id}', json={'encrypted_value': 'fail'})
    assert resp.status_code in (401, 403)
    resp = supabase_request(MEMBER_TOKEN, 'DELETE', f'/tenant_credentials?id=eq.{cred_id}')
    assert resp.status_code in (401, 403) 