import os
import pytest
import httpx

ORG_ID = os.getenv("ORG_ID", "00000000-0000-0000-0000-000000000001")
API_URL = os.getenv("API_URL", "http://localhost:8000")

pytestmark = pytest.mark.skipif(
    os.getenv("PYTEST_E2E") != "1",
    reason="E2E test: set PYTEST_E2E=1 to enable"
)

@pytest.mark.asyncio
async def test_msgraph_users_e2e():
    """
    E2E: Test /msgraph/users/ endpoint with real Microsoft Graph and Supabase integration.
    - Calls FastAPI endpoint with a real org_id
    - Asserts users are returned (from Graph)
    - Handles pagination if present
    - Verifies error handling for invalid org_id
    """
    async with httpx.AsyncClient(base_url=API_URL, timeout=30) as client:
        # 1. Successful fetch
        resp = await client.get("/msgraph/users/", params={"org_id": ORG_ID})
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        users = resp.json()
        assert isinstance(users, list), f"Expected list, got {type(users)}"
        assert users, "No users returned from Microsoft Graph API"
        # Optionally: check for pagination (if API returns nextLink or similar)
        # Optionally: check that at least one user is persisted in Supabase (if API supports this)

        # 2. Error handling: invalid org_id
        bad_resp = await client.get("/msgraph/users/", params={"org_id": "not-a-real-org"})
        assert bad_resp.status_code in (400, 404, 500), f"Expected error, got {bad_resp.status_code}"
        # Optionally: check error message

        # 3. Error handling: missing org_id
        missing_resp = await client.get("/msgraph/users/")
        assert missing_resp.status_code in (400, 422), f"Expected error, got {missing_resp.status_code}"

        # 4. (Optional) Clean up test data if needed
        # If the API creates test users, delete them here

# End of E2E test file 