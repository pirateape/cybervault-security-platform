from fastapi import FastAPI, HTTPException, Depends, status, Query, APIRouter, Body, Path, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from . import supabase_client
from . import auth
from . import ms_api
import asyncio
from uuid import UUID
# Add this import for robust error handling
try:
    from postgrest.exceptions import APIError
except ImportError:
    APIError = Exception
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from pydantic import BaseModel, Field, EmailStr
import requests
from .auth import require_org_role
from .ms_api import ENABLE_M365_CORE, ENABLE_INTUNE, ENABLE_POWER_PLATFORM, ENABLE_POWER_BI
from datetime import datetime
from dotenv import load_dotenv
import os
from apps.api.compliance_engine.remediation import (
    RemediationAction,
    create_remediation_action,
    get_remediation_action,
    update_remediation_action,
    list_remediation_actions,
    update_remediation_status,
    assign_remediation_action,
    verify_remediation_action
)
from .ai_risk_service_client import get_risk_analysis
from apps.api.compliance_engine.ingestion import DataIngestionPipeline
from .review import router as review_router
import time
import json
from apps.api.compliance_engine.rules_api import router as rules_router
from src.api.routes import external_api

load_dotenv()  # Loads environment variables from .env in the project root

app = FastAPI(title="Security Compliance Tool API")

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development server
        "http://localhost:3001",  # Alternative frontend port
        "https://localhost:3000", # HTTPS variant
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Set up logging for audit and error logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def log_audit_event_sync(
    event_type,
    resource,
    resource_id,
    outcome,
    details,
    user_id,
    ip_address=None,
    user_agent=None
):
    """
    Synchronous audit log write (file + Supabase). Intended for use in background tasks only.
    """
    payload = {
        "event_type": event_type,
        "resource": resource,
        "resource_id": resource_id,
        "outcome": outcome,
        "metadata": details,
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    # Log to file/console
    logging.info(f"AUDIT: {json.dumps(payload)}")
    try:
        with open("audit_log_export.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception as e:
        logging.error(f"Failed to write audit log to file: {e}")
    # Write to Supabase
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/audit_log",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            data=json.dumps(payload)
        )
        resp.raise_for_status()
    except Exception as e:
        logging.error(f"Failed to write audit log to Supabase: {e}")


def log_audit_event(
    background_tasks: BackgroundTasks,
    event_type,
    resource,
    resource_id,
    outcome,
    details,
    user_id,
    ip_address=None,
    user_agent=None
):
    """
    Non-blocking audit log write using FastAPI BackgroundTasks.
    Usage: pass background_tasks from endpoint, call log_audit_event(background_tasks, ...)
    """
    background_tasks.add_task(
        log_audit_event_sync,
        event_type,
        resource,
        resource_id,
        outcome,
        details,
        user_id,
        ip_address,
        user_agent
    )

def extract_audit_log_context(request: Request, user, event_type: str, resource: str, resource_id: str, outcome: str, details, extra: dict = None):
    """
    Helper to extract audit log context from request and user for logging.
    Returns tuple of arguments for log_audit_event or log_audit_event_sync.
    """
    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    if extra:
        if isinstance(details, dict):
            details = {**details, **extra}
        else:
            details = {"details": details, **extra}
    return (
        event_type,
        resource,
        resource_id,
        outcome,
        details,
        user,
        ip_address,
        user_agent
    )

# Update error handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    print('EXCEPTION CAUGHT:', exc)
    print(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Catch all validation errors, log them, and return sanitized 422 error."""
    user = getattr(request.state, 'user', None)
    args = extract_audit_log_context(
        request,
        user,
        "ValidationError",
        "API",
        str(request.url),
        "error",
        exc.errors()
    )
    try:
        log_audit_event_sync(*args)
    except Exception as log_exc:
        logging.error(f"Audit log failed in validation_exception_handler: {log_exc}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    """Catch all HTTP exceptions, log them, and return sanitized error."""
    user = getattr(request.state, 'user', None)
    args = extract_audit_log_context(
        request,
        user,
        "HTTPException",
        "API",
        str(request.url),
        "error",
        exc.detail
    )
    try:
        log_audit_event_sync(*args)
    except Exception as log_exc:
        logging.error(f"Audit log failed in http_exception_handler: {log_exc}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

def extract_error(result):
    # Handles both dict and supabase-py APIResponse
    if isinstance(result, dict):
        return result.get("error")
    if hasattr(result, "error"):
        return getattr(result, "error", None)
    return None

def extract_data(result):
    if isinstance(result, dict):
        return result.get("data")
    if hasattr(result, "data"):
        return getattr(result, "data", None)
    return None

def validate_uuid(value: str, name: str = "id"):
    try:
        return str(UUID(value))
    except Exception:
        raise HTTPException(status_code=422, detail=f"Malformed UUID for {name}: {value}")

def map_supabase_error(e):
    msg = str(e)
    if 'malformed' in msg.lower() or 'uuid' in msg.lower():
        return HTTPException(status_code=422, detail=msg)
    if 'not found' in msg.lower() or '0 rows' in msg.lower():
        return HTTPException(status_code=404, detail=msg)
    return HTTPException(status_code=400, detail=msg)

# USERS
@app.post("/users/")
@limiter.limit("5/minute")
async def create_user(request: Request, background_tasks: BackgroundTasks, org_id: str = Query(...), email: str = Query(...), password: str = Query(...), full_name: Optional[str] = None, role: str = "user"):
    user = auth.signup_user(email, password)
    supabase_client.create_user(org_id, email, "<hashed>", full_name, role)
    log_audit_event(
        background_tasks,
        event_type="create_user",
        resource="user",
        resource_id=email,
        outcome="success",
        details={"org_id": org_id, "full_name": full_name, "role": role},
        user_id=email,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    return user

@app.get("/users/{email}")
def get_user(org_id: str = Query(...), email: str = Path(...)):
    org_id = validate_uuid(org_id, "org_id")
    try:
        result = supabase_client.get_user_by_email(org_id, email)
    except APIError as e:
        raise map_supabase_error(e)
    if extract_error(result):
        raise HTTPException(status_code=404, detail="User not found")
    return extract_data(result)

@app.post("/users/{user_id}/disable")
async def disable_user(request: Request, background_tasks: BackgroundTasks, org_id: str = Query(...), user_id: str = Path(...), role_check=Depends(require_org_role("org_id", "admin")), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    try:
        result = supabase_client.disable_user(org_id, user_id)
        supabase_client.create_audit_log(org_id, current_user["id"], "disable_user", user_id, "users", {"action": "disable"})
        log_audit_event(
            background_tasks,
            event_type="disable_user",
            resource="user",
            resource_id=user_id,
            outcome="success",
            details={"org_id": org_id, "user_id": user_id},
            user_id=current_user["id"],
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        if extract_error(result):
            msg = extract_error(result)
            if isinstance(msg, dict):
                msg = msg.get("message", "Error")
            raise HTTPException(status_code=400, detail=msg)
        return {"status": "disabled", "user_id": user_id}
    except Exception as exc:
        print('DISABLE USER ENDPOINT EXCEPTION:', exc)
        import traceback
        print(traceback.format_exc())
        raise

@app.post("/users/{user_id}/enable")
async def enable_user(request: Request, background_tasks: BackgroundTasks, org_id: str = Query(...), user_id: str = Path(...), role_check=Depends(require_org_role("org_id", "admin")), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    try:
        result = supabase_client.enable_user(org_id, user_id)
        supabase_client.create_audit_log(org_id, current_user["id"], "enable_user", user_id, "users", {"action": "enable"})
        log_audit_event(
            background_tasks,
            event_type="enable_user",
            resource="user",
            resource_id=user_id,
            outcome="success",
            details={"org_id": org_id, "user_id": user_id},
            user_id=current_user["id"],
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        if extract_error(result):
            msg = extract_error(result)
            if isinstance(msg, dict):
                msg = msg.get("message", "Error")
            raise HTTPException(status_code=400, detail=msg)
        return {"status": "enabled", "user_id": user_id}
    except Exception as exc:
        print('ENABLE USER ENDPOINT EXCEPTION:', exc)
        import traceback
        print(traceback.format_exc())
        raise

@app.delete("/users/{user_id}")
def delete_user(org_id: str = Query(...), user_id: str = Path(...), role_check=Depends(require_org_role("org_id", "admin")), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    result = supabase_client.delete_user(org_id, user_id)
    supabase_client.create_audit_log(org_id, current_user["id"], "delete_user", user_id, "users", {"action": "delete"})
    log_audit_event(
        event_type="delete_user",
        resource="user",
        resource_id=user_id,
        outcome="success",
        details={"org_id": org_id, "user_id": user_id},
        user_id=current_user["id"],
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    if extract_error(result):
        msg = extract_error(result)
        if isinstance(msg, dict):
            msg = msg.get("message", "Error")
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "deleted"}

# AUTHENTICATION
@app.post("/token")
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    access_token = auth.login_user(form_data.username, form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}

# SCANS
@app.post("/scans/")
def create_scan(org_id: str = Query(...), user_id: str = Query(...), scan_type: str = Query(...), status: str = Query(...), target: Optional[str] = None, metadata: Optional[dict] = None, current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    result = supabase_client.create_scan(org_id, user_id, scan_type, status, target, metadata)
    log_audit_event(
        event_type="create_scan",
        resource="scan",
        resource_id=f"{org_id}-{user_id}-{scan_type}",
        outcome="success",
        details={"org_id": org_id, "user_id": user_id, "scan_type": scan_type, "target": target},
        user_id=current_user["id"],
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    if extract_error(result):
        msg = extract_error(result)
        if isinstance(msg, dict):
            msg = msg.get("message", "Error")
        raise HTTPException(status_code=400, detail=msg)
    return extract_data(result)

@app.get("/scans/{scan_id}")
def get_scan(org_id: str = Query(...), scan_id: str = Path(...), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    scan_id = validate_uuid(scan_id, "scan_id")
    try:
        result = supabase_client.get_scan(org_id, scan_id)
    except APIError as e:
        raise map_supabase_error(e)
    if extract_error(result):
        raise HTTPException(status_code=404, detail="Scan not found")
    return extract_data(result)

# RESULTS
@app.post("/results/")
async def create_result(org_id: str = Query(...), scan_id: str = Query(...), user_id: str = Query(...), finding: str = Query(...), severity: Optional[str] = None, compliance_framework: Optional[str] = None, details: Optional[dict] = None, current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    scan_id = validate_uuid(scan_id, "scan_id")
    user_id = validate_uuid(user_id, "user_id")
    result = supabase_client.create_result(org_id, scan_id, user_id, finding, severity, compliance_framework, details)
    log_audit_event(
        event_type="create_result",
        resource="result",
        resource_id=f"{org_id}-{scan_id}-{user_id}-{finding}",
        outcome="success",
        details={"org_id": org_id, "scan_id": scan_id, "user_id": user_id, "finding": finding},
        user_id=current_user["id"],
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    if extract_error(result):
        msg = extract_error(result)
        if isinstance(msg, dict):
            msg = msg.get("message", "Error")
        raise HTTPException(status_code=400, detail=msg)
    # Prepare scan result payload for AI risk analysis
    scan_payload = {
        "org_id": org_id,
        "scan_id": scan_id,
        "user_id": user_id,
        "finding": finding,
        "severity": severity,
        "compliance_framework": compliance_framework,
        "details": details
    }
    # Preprocess scan_payload using the data pipeline
    pipeline = DataIngestionPipeline()
    scan_payload = pipeline.preprocess(scan_payload)
    try:
        # Forward user's JWT for auth
        jwt_token = current_user.get("token") if "token" in current_user else None
        if not jwt_token:
            from fastapi import Request
            import inspect
            frame = inspect.currentframe()
            while frame:
                if "request" in frame.f_locals:
                    request = frame.f_locals["request"]
                    break
                frame = frame.f_back
            else:
                request = None
            if request:
                jwt_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not jwt_token:
            raise Exception("No JWT token found for AI risk service call")
        ai_result = await get_risk_analysis(scan_payload, jwt_token)
        # Update result record with risk analysis output
        supabase_client.update_result_with_risk(scan_id, ai_result)
        log_audit_event(
            event_type="risk_analysis",
            resource="result",
            resource_id=scan_id,
            outcome="success",
            details={"scan_id": scan_id, "risk_score": ai_result.get("risk_score"), "recommendation": ai_result.get("recommendation"), "model_version": ai_result.get("model_version")},
            user_id=current_user["id"],
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
    except Exception as e:
        log_audit_event(
            event_type="risk_analysis_error",
            resource="result",
            resource_id=scan_id,
            outcome="error",
            details={"scan_id": scan_id, "error": str(e)},
            user_id=current_user["id"],
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        # Optionally, continue without risk score or raise error
    return extract_data(result)

@app.get("/results/{scan_id}")
def get_results_for_scan(org_id: str = Query(...), scan_id: str = Path(...), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    scan_id = validate_uuid(scan_id, "scan_id")
    result = supabase_client.get_results_for_scan(org_id, scan_id)
    if extract_error(result):
        raise HTTPException(status_code=404, detail="No results found for scan")
    return extract_data(result)

# AUDIT LOGS
@app.post("/audit_logs/")
def create_audit_log(org_id: str = Query(...), user_id: str = Query(...), action: str = Query(...), target_id: Optional[str] = None, target_table: Optional[str] = None, details: Optional[dict] = None, current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    if target_id:
        target_id = validate_uuid(target_id, "target_id")
    result = supabase_client.create_audit_log(org_id, user_id, action, target_id, target_table, details)
    log_audit_event(
        event_type="create_audit_log",
        resource="audit_log",
        resource_id=f"{org_id}-{user_id}-{action}-{target_id if target_id else 'no_target'}",
        outcome="success",
        details={"org_id": org_id, "user_id": user_id, "action": action, "target_id": target_id, "target_table": target_table},
        user_id=current_user["id"],
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    if extract_error(result):
        msg = extract_error(result)
        if isinstance(msg, dict):
            msg = msg.get("message", "Error")
        raise HTTPException(status_code=400, detail=msg)
    return extract_data(result)

@app.get("/audit_logs/{user_id}")
def get_audit_logs_for_user(request: Request, background_tasks: BackgroundTasks, org_id: str = Query(...), user_id: str = Path(...), current_user=Depends(auth.get_current_user)):
    org_id = validate_uuid(org_id, "org_id")
    user_id = validate_uuid(user_id, "user_id")
    args = extract_audit_log_context(
        request,
        current_user["id"],
        "audit_log_access",
        "audit_log",
        user_id,
        "success",
        {"org_id": org_id, "queried_by": current_user["id"]}
    )
    try:
        log_audit_event(background_tasks, *args)
    except Exception as log_exc:
        logging.error(f"Audit log failed in get_audit_logs_for_user: {log_exc}")
    result = supabase_client.get_audit_logs_for_user(org_id, user_id)
    if extract_error(result):
        raise HTTPException(status_code=404, detail="No audit logs found for user")
    return extract_data(result)

ms_router = APIRouter(prefix="/msgraph", tags=["Microsoft Graph"])

@ms_router.get("/users/")
async def api_list_ms_users(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    if not ENABLE_M365_CORE:
        return []
    return await ms_api.list_ms_users(org_id)

@ms_router.get("/groups/")
async def api_list_ms_groups(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    if not ENABLE_M365_CORE:
        return []
    return await ms_api.list_ms_groups(org_id)

@ms_router.get("/conditional_access_policies/")
async def api_check_conditional_access_policies(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    return await ms_api.check_conditional_access_policies(org_id)

@ms_router.get("/compliance/users_without_mfa/")
async def api_scan_users_without_mfa(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    return await ms_api.scan_users_without_mfa(org_id)

@ms_router.get("/compliance/inactive_users/")
async def api_scan_inactive_users(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    return await ms_api.scan_inactive_users(org_id)

@ms_router.get("/compliance/encryption_policies/")
async def api_check_encryption_policies(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    return await ms_api.check_encryption_policies(org_id)

app.include_router(ms_router)

# Robust audit logging function
import threading
import time
import json

def log_audit_event(user, action, details):
    logging.info(f"AUDIT: user={user} action={action} details={details}")
    # Also append to local audit log file for shipping
    try:
        with open("audit_log_export.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps({"user": user, "action": action, "details": details, "timestamp": time.time()}) + "\n")
    except Exception as e:
        logging.error(f"Failed to write audit log to file: {e}")

# Background thread for periodic log shipping (stub: extend for S3/SIEM)
def ship_audit_logs_periodically(interval_sec=3600):
    def ship():
        while True:
            try:
                # Example: move/export the file, or send to SIEM
                # For now, just log that shipping would occur
                if os.path.exists("audit_log_export.jsonl"):
                    logging.info("[Log Shipping] Would ship audit_log_export.jsonl to secure storage/SIEM")
                time.sleep(interval_sec)
            except Exception as e:
                logging.error(f"Log shipping error: {e}")
    t = threading.Thread(target=ship, daemon=True)
    t.start()

# Start log shipping thread on app startup
ship_audit_logs_periodically()

# Example usage in endpoints (add to sensitive endpoints as needed):
# log_audit_event(current_user["id"], "some_action", {"details": "..."})

class CodeAnalysisRequest(BaseModel):
    code: str = Field(..., example="print('Hello, world!')")
    language: str = Field(..., example="python")
    org_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174001")
    metadata: Optional[dict] = Field(default=None, example={"project": "demo"})

class Diagnostic(BaseModel):
    message: str
    severity: str
    line: int
    column: int
    endLine: int
    endColumn: int
    code: Optional[str] = None

class CodeAnalysisResponse(BaseModel):
    diagnostics: List[Diagnostic]
    summary: str
    success: bool = True

class AIFeedbackRequest(BaseModel):
    code: str = Field(..., example="print('Hello, world!')")
    language: str = Field(..., example="python")
    org_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174001")
    metadata: Optional[dict] = Field(default=None, example={"project": "demo"})

class FeedbackItem(BaseModel):
    suggestion: str
    explanation: str
    confidence: float
    line: int
    column: int

class AIFeedbackResponse(BaseModel):
    feedback: List[FeedbackItem]
    summary: str
    success: bool = True

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict

@app.post("/api/code-analysis", response_model=CodeAnalysisResponse, responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}}, tags=["analysis"])
async def code_analysis_endpoint(request: CodeAnalysisRequest, current_user=Depends(auth.get_current_user)):
    """
    Analyze code and return diagnostics. This is a scaffold: plug in your static analysis, linter, or external service here.
    """
    validate_uuid(request.org_id, "org_id")
    validate_uuid(request.user_id, "user_id")
    try:
        # TODO: Replace this with your static analysis logic or call to external service
        # Example: result = await call_external_code_analysis(request.code, request.language, ...)
        diagnostics = [
            Diagnostic(
                message="Example error: Missing semicolon",
                severity="error",
                line=1,
                column=15,
                endLine=1,
                endColumn=16,
                code="E001"
            )
        ]
        summary = "1 error found."
        return CodeAnalysisResponse(diagnostics=diagnostics, summary=summary, success=True)
    except Exception as e:
        logging.error(f"Code analysis failed: {e}")
        return ErrorResponse(success=False, error={"type": "analysis_error", "message": str(e), "details": {}})

@app.post("/api/ai-feedback", response_model=AIFeedbackResponse, responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}}, tags=["ai"])
async def ai_feedback_endpoint(request: AIFeedbackRequest, current_user=Depends(auth.get_current_user)):
    """
    Provide AI-powered feedback on code. This is a scaffold: plug in your OpenAI, HuggingFace, Ollama, or other LLM service here.
    """
    validate_uuid(request.org_id, "org_id")
    validate_uuid(request.user_id, "user_id")
    try:
        # TODO: Replace this with your AI feedback logic or call to external LLM service
        # Example: feedback = await call_external_ai_feedback(request.code, request.language, ...)
        feedback = [
            FeedbackItem(
                suggestion="Consider using a function for reusability.",
                explanation="Functions help organize code and improve maintainability.",
                confidence=0.95,
                line=1,
                column=1
            )
        ]
        summary = "1 suggestion provided."
        return AIFeedbackResponse(feedback=feedback, summary=summary, success=True)
    except Exception as e:
        logging.error(f"AI feedback failed: {e}")
        return ErrorResponse(success=False, error={"type": "ai_feedback_error", "message": str(e), "details": {}})

router = APIRouter()

class AdminResetPasswordRequest(BaseModel):
    user_email: EmailStr

@router.post("/api/admin/reset-password", tags=["admin"], summary="Admin: Trigger password reset email for a user")
async def admin_reset_password(
    req: AdminResetPasswordRequest,
    role_check=Depends(require_org_role("org_id", "admin")),
    current_user=Depends(auth.get_current_user)
):
    """
    Admin-only endpoint to trigger a password reset email for a user via Supabase Admin API.
    Requires admin authentication. Logs all actions for audit.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_service_key:
        raise HTTPException(status_code=500, detail="Supabase admin credentials not configured.")
    reset_url = f"{supabase_url}/auth/v1/admin/users/by-email/{req.user_email}/generate_recovery_link"
    headers = {"apikey": supabase_service_key, "Authorization": f"Bearer {supabase_service_key}"}
    data = {"type": "recovery"}
    try:
        resp = requests.post(reset_url, headers=headers, json=data, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logging.error(f"Admin password reset failed for {req.user_email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger password reset: {e}")
    logging.info(f"Admin {current_user['id']} triggered password reset for {req.user_email}")
    return {"success": True, "message": f"Password reset email sent to {req.user_email}"}

# Intune endpoint example
@app.get("/intune/devices/")
async def api_list_intune_devices(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    """List all Intune managed devices for the given org."""
    if not ENABLE_INTUNE:
        return []
    return await ms_api.list_intune_devices(org_id)

@app.get("/intune/compliance_policies/")
async def api_list_intune_compliance_policies(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    """List all Intune device compliance policies for the given org."""
    if not ENABLE_INTUNE:
        return []
    return await ms_api.list_intune_compliance_policies(org_id)

# Power Platform endpoint example
@app.get("/powerapps/")
async def api_list_powerapps(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    if not ENABLE_POWER_PLATFORM:
        return []
    return await ms_api.list_powerapps(org_id)

@app.get("/powerapps/solutions/")
async def api_list_powerapps_solutions(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    """List all Power Apps solutions for the given org."""
    if not ENABLE_POWER_PLATFORM:
        return []
    return await ms_api.list_powerapps_solutions(org_id)

@app.get("/powerapps/environments/")
async def api_list_powerapps_environments(org_id: str = Query(...), current_user=Depends(auth.get_current_user)):
    """List all Power Platform environments for the given org."""
    if not ENABLE_POWER_PLATFORM:
        return []
    return await ms_api.list_powerapps_environments(org_id)

app.include_router(router)

remediation_router = APIRouter(prefix="/api/remediation", tags=["remediation"])

@remediation_router.post("/", response_model=RemediationAction)
async def api_create_remediation_action(action: RemediationAction, current_user=Depends(auth.get_current_user)):
    return await create_remediation_action(action)

@remediation_router.get("/{action_id}", response_model=RemediationAction)
async def api_get_remediation_action(action_id: UUID, current_user=Depends(auth.get_current_user)):
    action = await get_remediation_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Remediation action not found")
    return action

@remediation_router.patch("/{action_id}", response_model=RemediationAction)
async def api_update_remediation_action(action_id: UUID, updates: dict, current_user=Depends(auth.get_current_user)):
    action = await update_remediation_action(action_id, updates)
    if not action:
        raise HTTPException(status_code=404, detail="Remediation action not found or not updated")
    return action

@remediation_router.get("/", response_model=List[RemediationAction])
async def api_list_remediation_actions(
    result_id: Optional[UUID] = None,
    assigned_to: Optional[UUID] = None,
    status: Optional[str] = None,
    current_user=Depends(auth.get_current_user)
):
    return await list_remediation_actions(result_id, assigned_to, status)

@remediation_router.post("/{action_id}/status", response_model=RemediationAction)
async def api_update_remediation_status(action_id: UUID, new_status: str, current_user=Depends(auth.get_current_user)):
    try:
        return await update_remediation_status(action_id, new_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@remediation_router.post("/{action_id}/assign", response_model=RemediationAction)
async def api_assign_remediation_action(action_id: UUID, user_id: UUID, current_user=Depends(auth.get_current_user)):
    return await assign_remediation_action(action_id, user_id)

@remediation_router.post("/{action_id}/verify", response_model=RemediationAction)
async def api_verify_remediation_action(action_id: UUID, verified: bool = True, current_user=Depends(auth.get_current_user)):
    return await verify_remediation_action(action_id, verified)

app.include_router(remediation_router)
app.include_router(review_router)
app.include_router(rules_router)
app.include_router(external_api.router) 