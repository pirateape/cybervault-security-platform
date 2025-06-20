from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from .model.dummy_risk_model import DummyRiskModel
import os
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import uuid
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None
# Import unified authentication from main API
try:
    from apps.api import auth
except ImportError:
    # Fallback for development/testing
    auth = None

print("[DEBUG] Top of main.py loaded"); import sys; sys.stdout.flush()

app = FastAPI(title="AI Risk Analysis Microservice")

print("[DEBUG] Before FastAPI app creation"); sys.stdout.flush()

# Load the dummy model (replace with real model in production)
model = DummyRiskModel()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Legacy JWT constants removed - now using unified Supabase authentication

# Legacy JWT verification removed - now using unified Supabase authentication

async def get_current_user():
    """
    Get current user using unified authentication from main API.
    Falls back to mock user if auth module is not available (for testing).
    """
    if auth is not None:
        # Import the dependency function from main API auth
        from apps.api.auth import get_current_user as api_get_current_user
        # Note: This will be used as a dependency in the endpoint
        return api_get_current_user
    else:
        # Fallback for testing/development when auth module is not available
        return {"sub": "test-user", "email": "test@example.com"}

# Create the dependency for FastAPI endpoints
def create_auth_dependency():
    """Create the appropriate auth dependency based on available modules"""
    if auth is not None:
        return auth.get_current_user
    else:
        # Fallback dependency for testing
        async def mock_auth():
            return {"sub": "test-user", "email": "test@example.com"}
        return mock_auth

# Set up the auth dependency
auth_dependency = create_auth_dependency()

def get_supabase_client():
    if not create_client or not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        return None

# Debug: Print Supabase connection info at startup
print(f"[DEBUG] SUPABASE_URL: {SUPABASE_URL}"); sys.stdout.flush()
print(f"[DEBUG] SUPABASE_KEY: {SUPABASE_KEY}"); sys.stdout.flush()

class ScanResultInput(BaseModel):
    org_id: str
    scan_id: str
    user_id: str
    finding: str
    severity: Optional[str] = None
    compliance_framework: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

    class Config:
        schema_extra = {
            "example": {
                "org_id": "org1",
                "scan_id": "scan1",
                "user_id": "user1",
                "finding": "test finding",
                "severity": "high",
                "compliance_framework": "NIST",
                "details": {"key": "value"}
            }
        }

class RiskAnalysisOutput(BaseModel):
    risk_score: float = Field(..., ge=0, le=1, description="Predicted risk score (0-1)")
    recommendation: str
    model_version: Optional[str] = None

def log_audit_event(user_id, org_id, action, target_id, target_table, details):
    print(f"[DEBUG] log_audit_event called with user_id={user_id}, org_id={org_id}, action={action}, target_id={target_id}, target_table={target_table}, details={details}"); sys.stdout.flush()
    # Ensure details is a dict
    import collections.abc
    if not isinstance(details, dict):
        if hasattr(details, 'dict'):
            details = details.dict()
        elif hasattr(details, 'model_dump'):
            details = details.model_dump()
        else:
            details = dict(details)
    payload = {
        "user_id": user_id,
        "org_id": org_id,
        "action": action,
        "target_id": target_id,
        "target_table": target_table,
        "details": details
    }
    print(f"[DEBUG] payload to supabase: {payload}"); sys.stdout.flush()
    try:
        supabase = get_supabase_client()
        if supabase:
            response = supabase.table("audit_logs").insert(payload).execute()
            print(f"[DEBUG] Full audit log insert response: {response}"); sys.stdout.flush()
            if hasattr(response, 'error') and response.error:
                print(f"Audit log insert error: {response.error}"); sys.stdout.flush()
            else:
                print(f"Audit log insert response: {getattr(response, 'data', response)}"); sys.stdout.flush()
    except Exception as e:
        print(f"Exception in log_audit_event: {e}"); sys.stdout.flush()

@app.post("/predict", response_model=RiskAnalysisOutput, tags=["risk-analysis"], summary="Predict risk for a scan finding", description="Predicts the risk score and recommendation for a given scan finding using the AI risk model.", response_description="Risk analysis result")
def predict_risk(scan: ScanResultInput, current_user=Depends(auth_dependency)):
    print("[DEBUG] /predict endpoint called"); sys.stdout.flush()
    print(f"[DEBUG] details type in /predict: {type(scan.details)}, value: {scan.details}"); sys.stdout.flush()
    user_id = "aca6d17d-88ce-4365-931f-17604350c079"  # Replace with real user_id if available
    org_id = "1"  # Use real org_id as string
    print(f"[DEBUG] using org_id: {org_id}"); sys.stdout.flush()
    action = "predict"
    target_id = None
    target_table = "scan_results"
    details = {
        "input": scan.dict() if hasattr(scan, 'dict') else dict(scan),
        "output": {
            "risk_score": 0.7,
            "recommendation": "Immediate remediation required.",
            "model_version": "v0.1-dummy"
        }
    }
    try:
        log_audit_event(user_id, org_id, action, target_id, target_table, details)
    except Exception as e:
        print(f"Exception in /predict: {e}"); sys.stdout.flush()
    try:
        result = model.predict(scan.dict())
        print(f"[DEBUG] model result: {result}"); sys.stdout.flush()
        print("[DEBUG] Returning RiskAnalysisOutput"); sys.stdout.flush()
        return RiskAnalysisOutput(**result)
    except Exception as e:
        print(e); sys.stdout.flush()
        raise

@app.get("/health", tags=["health"], summary="Health check endpoint", description="Returns 200 OK if the service is running.")
def health_check():
    """
    Health check endpoint for container orchestration and monitoring.
    Returns a simple status message if the service is healthy.
    """
    return {"status": "ok"}

@app.get("/supabase-health", tags=["health"], summary="Supabase health check endpoint", description="Checks Supabase connectivity by performing a simple query.")
def supabase_health_check():
    """
    Health check endpoint for Supabase connectivity.
    Attempts a simple query to verify the backend can reach Supabase.
    Returns status and error details if any.
    """
    supabase = get_supabase_client()
    if not supabase:
        return {"status": "error", "error": "Supabase client not configured or invalid credentials."}
    try:
        response = supabase.table("audit_logs").select("id").limit(1).execute()
        if hasattr(response, 'error') and response.error:
            return {"status": "error", "error": str(response.error)}
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Add OpenAPI security scheme
app.openapi_schema = None
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            if method.get("operationId", "").startswith("predict_risk"):
                method["security"] = [{"OAuth2PasswordBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi 