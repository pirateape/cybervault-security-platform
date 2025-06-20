from fastapi import APIRouter, HTTPException, Depends, status, Query, Path, Body, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import List, Optional, Dict, Any
from .rule_schema import ComplianceRule
from ..supabase_client import get_supabase_client
from ..auth import get_current_user
import logging
import os
from datetime import datetime

router = APIRouter(prefix="/rules", tags=["rules"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# --- Error Models ---
class ErrorModel(BaseModel):
    message: str
    code: Optional[int] = None
    detail: Optional[Any] = None

# --- Exception Handlers ---
@router.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation error: {exc.errors()} | Body: {getattr(exc, 'body', None)}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"message": "Validation error", "detail": exc.errors()}),
    )

@router.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logging.error(f"HTTP error: {exc.detail}")
    return await http_exception_handler(request, exc)

# RBAC: Only allow users with 'admin' or 'auditor' roles to manage rules
# Document required roles in endpoint docs

def rbac_check(current_user=Depends(get_current_user)):
    if not current_user or current_user.get("role") not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions. Requires 'admin' or 'auditor' role.")
    return current_user

# --- Endpoints ---
@router.get("/", response_model=List[ComplianceRule], responses={
    200: {"description": "List of rules."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="List all compliance rules", tags=["rules"])
def list_rules(org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """List all compliance rules for an organization. Requires 'admin' or 'auditor' role."""
    try:
        resp = supabase.table("rules").select("*").eq("org_id", org_id).execute()
        if resp.error:
            raise HTTPException(status_code=400, detail=resp.error.message)
        return resp.data or []
    except Exception as e:
        logging.error(f"Error listing rules: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.get("/{rule_id}", response_model=ComplianceRule, responses={
    200: {"description": "Rule details."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    404: {"model": ErrorModel, "description": "Rule not found."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Get a compliance rule", tags=["rules"])
def get_rule(rule_id: str = Path(..., description="Rule ID"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Get a compliance rule by ID. Requires 'admin' or 'auditor' role."""
    try:
        resp = supabase.table("rules").select("*").eq("id", rule_id).eq("org_id", org_id).single().execute()
        if resp.error or not resp.data:
            raise HTTPException(status_code=404, detail="Rule not found.")
        return resp.data
    except Exception as e:
        logging.error(f"Error getting rule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.get("/{rule_id}/versions", response_model=List[dict], responses={
    200: {"description": "Version history for a rule."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    404: {"model": ErrorModel, "description": "Rule not found."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Get version history for a rule", tags=["rules"])
def get_rule_versions(rule_id: str = Path(..., description="Rule ID"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Get version history for a rule. Requires 'admin' or 'auditor' role."""
    try:
        resp = supabase.table("rule_versions").select("*").eq("rule_id", rule_id).eq("org_id", org_id).order("created_at", desc=True).execute()
        if resp.error:
            raise HTTPException(status_code=400, detail=resp.error.message)
        return resp.data or []
    except Exception as e:
        logging.error(f"Error getting rule versions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.post("/{rule_id}/restore", response_model=dict, responses={
    200: {"description": "Rule restored."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    404: {"model": ErrorModel, "description": "Version not found."},
    409: {"model": ErrorModel, "description": "Conflict restoring rule."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Restore a rule to a previous version", tags=["rules"])
def restore_rule_version(rule_id: str = Path(..., description="Rule ID"), version_id: str = Body(..., embed=True, description="Version ID to restore"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Restore a rule to a previous version. Requires 'admin' or 'auditor' role."""
    try:
        version_resp = supabase.table("rule_versions").select("content").eq("id", version_id).eq("rule_id", rule_id).single().execute()
        if version_resp.error or not version_resp.data:
            raise HTTPException(status_code=404, detail="Version not found.")
        content = version_resp.data["content"]
        update_resp = supabase.table("rules").update(content).eq("id", rule_id).eq("org_id", org_id).execute()
        if update_resp.error:
            raise HTTPException(status_code=409, detail=update_resp.error.message)
        # Audit log here
        log_rule_audit(request, current_user, "restore", rule_id, content)
        return {"restored": True, "rule": update_resp.data[0] if update_resp.data else None}
    except Exception as e:
        logging.error(f"Error restoring rule version: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.post("/", response_model=ComplianceRule, status_code=status.HTTP_201_CREATED, responses={
    201: {"description": "Rule created."},
    400: {"model": ErrorModel, "description": "Validation error."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    409: {"model": ErrorModel, "description": "Conflict creating rule."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Create a new rule", tags=["rules"])
def create_rule(request: Request, rule: ComplianceRule = Body(..., description="Rule object"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Create a new compliance rule. Requires 'admin' or 'auditor' role."""
    try:
        rule_dict = rule.dict()
        rule_dict["org_id"] = org_id
        resp = supabase.table("rules").insert(rule_dict).execute()
        if resp.error:
            raise HTTPException(status_code=409, detail=resp.error.message)
        if not resp.data or len(resp.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create rule.")
        log_rule_audit(request, current_user, "create", resp.data[0]["id"], rule_dict)
        return resp.data[0]
    except Exception as e:
        logging.error(f"Error creating rule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.put("/{rule_id}", response_model=ComplianceRule, responses={
    200: {"description": "Rule updated."},
    400: {"model": ErrorModel, "description": "Validation error."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    404: {"model": ErrorModel, "description": "Rule not found."},
    409: {"model": ErrorModel, "description": "Conflict updating rule."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Update a rule", tags=["rules"])
def update_rule(request: Request, rule_id: str = Path(..., description="Rule ID"), rule: ComplianceRule = Body(..., description="Rule object"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Update a compliance rule. Requires 'admin' or 'auditor' role."""
    try:
        rule_dict = rule.dict()
        rule_dict["org_id"] = org_id
        resp = supabase.table("rules").update(rule_dict).eq("id", rule_id).eq("org_id", org_id).execute()
        if resp.error:
            raise HTTPException(status_code=409, detail=resp.error.message)
        if not resp.data or len(resp.data) == 0:
            raise HTTPException(status_code=404, detail="Rule not found.")
        log_rule_audit(request, current_user, "update", rule_id, rule_dict)
        return resp.data[0]
    except Exception as e:
        logging.error(f"Error updating rule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, responses={
    204: {"description": "Rule deleted."},
    400: {"model": ErrorModel, "description": "Delete error."},
    401: {"model": ErrorModel, "description": "Not authenticated."},
    403: {"model": ErrorModel, "description": "Insufficient permissions."},
    404: {"model": ErrorModel, "description": "Rule not found."},
    422: {"model": ErrorModel, "description": "Validation error."},
    500: {"model": ErrorModel, "description": "Internal server error."},
}, summary="Delete a rule", tags=["rules"])
def delete_rule(request: Request, rule_id: str = Path(..., description="Rule ID"), org_id: str = Query(..., description="Organization ID"), current_user=Depends(rbac_check), supabase=Depends(get_supabase_client)):
    """Delete a compliance rule. Requires 'admin' or 'auditor' role."""
    try:
        resp = supabase.table("rules").delete().eq("id", rule_id).eq("org_id", org_id).execute()
        if resp.error:
            raise HTTPException(status_code=400, detail=resp.error.message)
        log_rule_audit(request, current_user, "delete", rule_id, {"org_id": org_id})
        return None
    except Exception as e:
        logging.error(f"Error deleting rule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

# --- Helper: Audit Logging ---
def log_rule_audit(request: Request, user: dict, event_type: str, rule_id: str, metadata: dict):
    # Implement robust audit logging here (e.g., insert into audit_log table)
    logging.info(f"AUDIT: {event_type} | user={user.get('id')} | rule={rule_id} | meta={metadata}")
    # TODO: Insert into audit.audit_log via Supabase or direct DB call
    pass 