import hashlib
import os
import requests
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from apps.api import auth
from apps.api.main import limiter

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

router = APIRouter(
    prefix="/external",
    tags=["external"],
    responses={404: {"description": "Not found"}},
)

def api_key_auth(x_api_key: Optional[str] = Header(None)):
    """Validate API key against api.api_keys table. Return org/role context if valid."""
    if not x_api_key:
        return None
    # Hash the API key using SHA-256
    key_hash = hashlib.sha256(x_api_key.encode("utf-8")).hexdigest()
    # Query Supabase for a matching key
    url = f"{SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.{key_hash}&is_active=eq.true"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="API key validation failed")
    data = resp.json()
    if not data:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")
    # Return org/role context for RBAC/tenant isolation
    key_record = data[0]
    return {
        "org_id": key_record["org_id"],
        "role": key_record["role"],
        "label": key_record.get("label"),
        "api_key_id": key_record["id"]
    }

# Placeholder: Scan Trigger Endpoint
@router.post("/scans/trigger", summary="Trigger a new scan", description="Trigger a compliance scan for the current tenant. Accepts either JWT or API key authentication.")
@limiter.limit("10/minute")
async def trigger_scan(
    current_user=Depends(auth.get_current_user),
    api_key=Depends(api_key_auth),
):
    """Trigger a compliance scan for the current tenant. Requires authentication (JWT or API key) and RBAC."""
    # TODO: Add RBAC/tenant context enforcement
    # TODO: If api_key is present, skip JWT auth and use API key context
    return {"message": "Scan triggered (placeholder)"}

# Placeholder: Rule Management Endpoints
@router.get("/rules/", summary="List rules", description="List all compliance rules for the current tenant. Accepts either JWT or API key authentication.")
@limiter.limit("30/minute")
async def list_rules(
    current_user=Depends(auth.get_current_user),
    api_key=Depends(api_key_auth),
):
    """List all compliance rules for the current tenant. Requires authentication (JWT or API key) and RBAC."""
    # TODO: Add RBAC/tenant context enforcement
    # TODO: If api_key is present, skip JWT auth and use API key context
    return {"rules": []}

@router.post("/rules/", summary="Create rule", description="Create a new compliance rule for the current tenant. Accepts either JWT or API key authentication.")
@limiter.limit("10/minute")
async def create_rule(
    current_user=Depends(auth.get_current_user),
    api_key=Depends(api_key_auth),
):
    """Create a new compliance rule for the current tenant. Requires authentication (JWT or API key) and RBAC."""
    # TODO: Add RBAC/tenant context enforcement
    # TODO: If api_key is present, skip JWT auth and use API key context
    return {"message": "Rule created (placeholder)"}

# Placeholder: Reporting Endpoint
@router.get("/reports/summary", summary="Get compliance summary report", description="Fetch a summary compliance report for the current tenant. Accepts either JWT or API key authentication.")
@limiter.limit("10/minute")
async def get_summary_report(
    current_user=Depends(auth.get_current_user),
    api_key=Depends(api_key_auth),
):
    """Fetch a summary compliance report for the current tenant. Requires authentication (JWT or API key) and RBAC."""
    # TODO: Add RBAC/tenant context enforcement
    # TODO: If api_key is present, skip JWT auth and use API key context
    return {"summary": {}} 