import hashlib
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query, Body
from pydantic import BaseModel, Field
import requests
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from apps.api import auth
from apps.api.main import limiter

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

router = APIRouter(
    prefix="/external",
    tags=["external-api"],
    responses={404: {"description": "Not found"}},
)

# Pydantic Models for API Key Management
class ApiKeyCreate(BaseModel):
    label: str = Field(..., description="Human-readable label for the API key")
    description: Optional[str] = Field(None, description="Optional description")
    permissions: List[str] = Field(default=["read"], description="List of permissions")
    rate_limit: Optional[int] = Field(default=1000, description="Requests per hour")
    expires_at: Optional[datetime] = Field(None, description="Expiration date")

class ApiKeyResponse(BaseModel):
    id: str
    label: str
    description: Optional[str]
    key_preview: str
    permissions: List[str]
    rate_limit: int
    usage_count: int
    last_used: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    org_id: str

class ApiKeyUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    rate_limit: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

# Pydantic Models for Monitoring
class ApiHealthResponse(BaseModel):
    overall_status: str = Field(..., description="Overall API health status")
    api_gateway: Dict[str, Any]
    database: Dict[str, Any]
    external_services: Dict[str, Any]
    last_updated: datetime

class ApiMetricsResponse(BaseModel):
    response_time_avg: float
    response_time_p95: float
    response_time_p99: float
    success_rate: float
    error_rate: float
    total_requests: int
    uptime_percentage: float
    period: str

class RateLimitStatusResponse(BaseModel):
    current_usage: int
    limit: int
    reset_time: datetime
    remaining: int
    percentage_used: float

# Pydantic Models for Analytics
class UsageStatsResponse(BaseModel):
    period: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    top_endpoints: List[Dict[str, Any]]
    top_api_keys: List[Dict[str, Any]]
    error_breakdown: Dict[str, int]

class CostTrackingResponse(BaseModel):
    current_month_cost: float
    projected_month_cost: float
    cost_breakdown: Dict[str, float]
    cost_per_request: float
    budget_status: str
    cost_trend: List[Dict[str, Any]]

class UsageForecastResponse(BaseModel):
    predicted_requests: int
    confidence_level: float
    trend: str
    recommendations: List[str]
    forecast_period: str

# Pydantic Models for Documentation
class ApiVersionResponse(BaseModel):
    version: str
    status: str
    release_date: datetime
    changelog: List[str]
    endpoints: List[Dict[str, Any]]

class ApiDocumentationResponse(BaseModel):
    version: str
    endpoints: List[Dict[str, Any]]
    schemas: Dict[str, Any]
    authentication: Dict[str, Any]

class TestEndpointRequest(BaseModel):
    endpoint: str
    method: str
    parameters: Dict[str, Any] = {}
    headers: Dict[str, str] = {}
    body: Optional[Dict[str, Any]] = None

class CodeExampleRequest(BaseModel):
    endpoint: str
    method: str
    language: str
    parameters: Dict[str, Any] = {}

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
    
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API key validation error: {str(e)}")

def get_auth_context(
    current_user=Depends(auth.get_current_user),
    api_key=Depends(api_key_auth)
):
    """Get authentication context from either JWT or API key."""
    if api_key:
        return {
            "org_id": api_key["org_id"],
            "user_id": None,
            "auth_type": "api_key",
            "api_key_id": api_key["api_key_id"]
        }
    elif current_user:
        return {
            "org_id": current_user.get("org_id"),
            "user_id": current_user.get("id"),
            "auth_type": "jwt",
            "api_key_id": None
        }
    else:
        raise HTTPException(status_code=401, detail="Authentication required")

# API Key Management Endpoints
@router.get("/api-keys", response_model=List[ApiKeyResponse])
@limiter.limit("30/minute")
async def list_api_keys(
    auth_context: dict = Depends(get_auth_context),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """List all API keys for the current organization."""
    org_id = auth_context["org_id"]
    
    url = f"{SUPABASE_URL}/rest/v1/api_keys?org_id=eq.{org_id}&limit={limit}&offset={offset}&order=created_at.desc"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch API keys")
        
        keys = resp.json()
        
        # Transform to response format (hide sensitive data)
        return [
            ApiKeyResponse(
                id=key["id"],
                label=key["label"],
                description=key.get("description"),
                key_preview=f"{key['key_hash'][:8]}...{key['key_hash'][-4:]}",
                permissions=key.get("permissions", ["read"]),
                rate_limit=key.get("rate_limit", 1000),
                usage_count=key.get("usage_count", 0),
                last_used=key.get("last_used"),
                created_at=key["created_at"],
                expires_at=key.get("expires_at"),
                is_active=key["is_active"],
                org_id=key["org_id"]
            )
            for key in keys
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching API keys: {str(e)}")

@router.post("/api-keys", response_model=Dict[str, str])
@limiter.limit("10/minute")
async def create_api_key(
    key_data: ApiKeyCreate,
    auth_context: dict = Depends(get_auth_context)
):
    """Create a new API key for the current organization."""
    org_id = auth_context["org_id"]
    
    # Generate a new API key
    api_key = f"sk-{uuid.uuid4().hex}"
    key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
    
    # Prepare the record
    record = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "label": key_data.label,
        "description": key_data.description,
        "key_hash": key_hash,
        "permissions": key_data.permissions,
        "rate_limit": key_data.rate_limit,
        "expires_at": key_data.expires_at.isoformat() if key_data.expires_at else None,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "usage_count": 0
    }
    
    # Insert into Supabase
    url = f"{SUPABASE_URL}/rest/v1/api_keys"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.post(url, headers=headers, json=record)
        if resp.status_code not in [200, 201]:
            raise HTTPException(status_code=500, detail="Failed to create API key")
        
        return {
            "id": record["id"],
            "api_key": api_key,  # Only returned once during creation
            "message": "API key created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating API key: {str(e)}")

@router.get("/api-keys/{key_id}", response_model=ApiKeyResponse)
@limiter.limit("30/minute")
async def get_api_key(
    key_id: str,
    auth_context: dict = Depends(get_auth_context)
):
    """Get details of a specific API key."""
    org_id = auth_context["org_id"]
    
    url = f"{SUPABASE_URL}/rest/v1/api_keys?id=eq.{key_id}&org_id=eq.{org_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch API key")
        
        keys = resp.json()
        if not keys:
            raise HTTPException(status_code=404, detail="API key not found")
        
        key = keys[0]
        return ApiKeyResponse(
            id=key["id"],
            label=key["label"],
            description=key.get("description"),
            key_preview=f"{key['key_hash'][:8]}...{key['key_hash'][-4:]}",
            permissions=key.get("permissions", ["read"]),
            rate_limit=key.get("rate_limit", 1000),
            usage_count=key.get("usage_count", 0),
            last_used=key.get("last_used"),
            created_at=key["created_at"],
            expires_at=key.get("expires_at"),
            is_active=key["is_active"],
            org_id=key["org_id"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching API key: {str(e)}")

@router.put("/api-keys/{key_id}", response_model=Dict[str, str])
@limiter.limit("20/minute")
async def update_api_key(
    key_id: str,
    update_data: ApiKeyUpdate,
    auth_context: dict = Depends(get_auth_context)
):
    """Update an existing API key."""
    org_id = auth_context["org_id"]
    
    # Prepare update data
    update_fields = {}
    if update_data.label is not None:
        update_fields["label"] = update_data.label
    if update_data.description is not None:
        update_fields["description"] = update_data.description
    if update_data.permissions is not None:
        update_fields["permissions"] = update_data.permissions
    if update_data.rate_limit is not None:
        update_fields["rate_limit"] = update_data.rate_limit
    if update_data.expires_at is not None:
        update_fields["expires_at"] = update_data.expires_at.isoformat()
    if update_data.is_active is not None:
        update_fields["is_active"] = update_data.is_active
    
    update_fields["updated_at"] = datetime.utcnow().isoformat()
    
    # Update in Supabase
    url = f"{SUPABASE_URL}/rest/v1/api_keys?id=eq.{key_id}&org_id=eq.{org_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.patch(url, headers=headers, json=update_fields)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to update API key")
        
        return {"message": "API key updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating API key: {str(e)}")

@router.delete("/api-keys/{key_id}")
@limiter.limit("10/minute")
async def delete_api_key(
    key_id: str,
    auth_context: dict = Depends(get_auth_context)
):
    """Delete an API key."""
    org_id = auth_context["org_id"]
    
    url = f"{SUPABASE_URL}/rest/v1/api_keys?id=eq.{key_id}&org_id=eq.{org_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.delete(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to delete API key")
        
        return {"message": "API key deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")

@router.post("/api-keys/{key_id}/rotate")
@limiter.limit("5/minute")
async def rotate_api_key(
    key_id: str,
    auth_context: dict = Depends(get_auth_context)
):
    """Rotate an API key (generate new key, keep same permissions)."""
    org_id = auth_context["org_id"]
    
    # Generate new API key
    new_api_key = f"sk-{uuid.uuid4().hex}"
    new_key_hash = hashlib.sha256(new_api_key.encode("utf-8")).hexdigest()
    
    # Update the key hash in Supabase
    update_data = {
        "key_hash": new_key_hash,
        "updated_at": datetime.utcnow().isoformat(),
        "usage_count": 0  # Reset usage count
    }
    
    url = f"{SUPABASE_URL}/rest/v1/api_keys?id=eq.{key_id}&org_id=eq.{org_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.patch(url, headers=headers, json=update_data)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to rotate API key")
        
        return {
            "api_key": new_api_key,  # Return new key
            "message": "API key rotated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rotating API key: {str(e)}")

# Monitoring Endpoints
@router.get("/monitoring/health", response_model=ApiHealthResponse)
@limiter.limit("60/minute")
async def get_api_health(
    auth_context: dict = Depends(get_auth_context)
):
    """Get overall API health status."""
    # Mock implementation - in production, this would check actual services
    current_time = datetime.utcnow()
    
    # Simulate health checks
    api_gateway_status = {
        "status": "healthy",
        "response_time": 45,
        "uptime": "99.9%",
        "last_check": current_time.isoformat()
    }
    
    database_status = {
        "status": "healthy",
        "connections": 12,
        "query_time": 23,
        "last_check": current_time.isoformat()
    }
    
    external_services = {
        "status": "healthy",
        "active_connections": 8,
        "failed_connections": 0,
        "last_check": current_time.isoformat()
    }
    
    overall_status = "healthy" if all(
        s["status"] == "healthy" 
        for s in [api_gateway_status, database_status, external_services]
    ) else "degraded"
    
    return ApiHealthResponse(
        overall_status=overall_status,
        api_gateway=api_gateway_status,
        database=database_status,
        external_services=external_services,
        last_updated=current_time
    )

@router.get("/monitoring/metrics", response_model=List[ApiMetricsResponse])
@limiter.limit("60/minute")
async def get_api_metrics(
    time_range: str = Query(default="1h", description="Time range: 15m, 1h, 6h, 24h, 7d"),
    auth_context: dict = Depends(get_auth_context)
):
    """Get API performance metrics."""
    # Mock implementation - in production, this would query actual metrics
    metrics_data = []
    
    # Generate mock metrics based on time range
    if time_range == "15m":
        periods = ["15m ago", "10m ago", "5m ago", "now"]
    elif time_range == "1h":
        periods = ["1h ago", "45m ago", "30m ago", "15m ago", "now"]
    elif time_range == "6h":
        periods = ["6h ago", "4h ago", "2h ago", "now"]
    elif time_range == "24h":
        periods = ["24h ago", "18h ago", "12h ago", "6h ago", "now"]
    else:  # 7d
        periods = ["7d ago", "5d ago", "3d ago", "1d ago", "now"]
    
    for period in periods:
        metrics_data.append(ApiMetricsResponse(
            response_time_avg=120.5 + (hash(period) % 50),
            response_time_p95=245.2 + (hash(period) % 100),
            response_time_p99=456.7 + (hash(period) % 200),
            success_rate=99.2 + (hash(period) % 8) / 10,
            error_rate=0.8 - (hash(period) % 8) / 10,
            total_requests=1500 + (hash(period) % 500),
            uptime_percentage=99.9,
            period=period
        ))
    
    return metrics_data

@router.get("/monitoring/rate-limits", response_model=RateLimitStatusResponse)
@limiter.limit("60/minute")
async def get_rate_limit_status(
    auth_context: dict = Depends(get_auth_context)
):
    """Get current rate limit status."""
    # Mock implementation - in production, this would check actual rate limits
    current_usage = 750
    limit = 1000
    reset_time = datetime.utcnow() + timedelta(minutes=30)
    
    return RateLimitStatusResponse(
        current_usage=current_usage,
        limit=limit,
        reset_time=reset_time,
        remaining=limit - current_usage,
        percentage_used=(current_usage / limit) * 100
    )

# Analytics Endpoints
@router.get("/analytics/usage", response_model=UsageStatsResponse)
@limiter.limit("30/minute")
async def get_usage_stats(
    period: str = Query(default="day", description="Period: hour, day, week, month"),
    auth_context: dict = Depends(get_auth_context)
):
    """Get API usage statistics."""
    org_id = auth_context["org_id"]
    
    # Mock implementation - in production, this would query actual usage data
    total_requests = 15000 + (hash(org_id + period) % 5000)
    successful_requests = int(total_requests * 0.97)
    failed_requests = total_requests - successful_requests
    
    return UsageStatsResponse(
        period=period,
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=failed_requests,
        average_response_time=125.4,
        top_endpoints=[
            {"endpoint": "/api/scans", "requests": 4500, "percentage": 30.0},
            {"endpoint": "/api/rules", "requests": 3000, "percentage": 20.0},
            {"endpoint": "/api/reports", "requests": 2250, "percentage": 15.0},
            {"endpoint": "/api/users", "requests": 1500, "percentage": 10.0},
            {"endpoint": "/api/audit", "requests": 750, "percentage": 5.0}
        ],
        top_api_keys=[
            {"key_id": "key_1", "label": "Production Key", "requests": 6000, "percentage": 40.0},
            {"key_id": "key_2", "label": "Development Key", "requests": 4500, "percentage": 30.0},
            {"key_id": "key_3", "label": "Testing Key", "requests": 3000, "percentage": 20.0}
        ],
        error_breakdown={
            "400": 120,
            "401": 80,
            "403": 45,
            "404": 200,
            "429": 25,
            "500": 30
        }
    )

@router.get("/analytics/costs", response_model=CostTrackingResponse)
@limiter.limit("30/minute")
async def get_cost_tracking(
    auth_context: dict = Depends(get_auth_context)
):
    """Get API cost tracking information."""
    org_id = auth_context["org_id"]
    
    # Mock implementation
    current_month_cost = 245.67 + (hash(org_id) % 100)
    
    return CostTrackingResponse(
        current_month_cost=current_month_cost,
        projected_month_cost=current_month_cost * 1.2,
        cost_breakdown={
            "api_calls": current_month_cost * 0.6,
            "data_transfer": current_month_cost * 0.25,
            "storage": current_month_cost * 0.15
        },
        cost_per_request=0.0023,
        budget_status="within_budget",
        cost_trend=[
            {"date": "2024-01-01", "cost": 180.45},
            {"date": "2024-02-01", "cost": 210.23},
            {"date": "2024-03-01", "cost": current_month_cost}
        ]
    )

@router.get("/analytics/forecast", response_model=UsageForecastResponse)
@limiter.limit("30/minute")
async def get_usage_forecast(
    auth_context: dict = Depends(get_auth_context)
):
    """Get usage forecasting data."""
    org_id = auth_context["org_id"]
    
    # Mock implementation
    base_requests = 25000 + (hash(org_id) % 10000)
    
    return UsageForecastResponse(
        predicted_requests=base_requests,
        confidence_level=0.85,
        trend="increasing",
        recommendations=[
            "Consider upgrading to higher tier for better rates",
            "Implement caching to reduce API calls",
            "Review and optimize high-usage endpoints"
        ],
        forecast_period="next_month"
    )

@router.post("/analytics/export")
@limiter.limit("10/minute")
async def export_usage_report(
    format: str = Query(default="csv", description="Export format: csv, pdf, excel"),
    period: str = Query(default="month", description="Period: week, month, quarter"),
    auth_context: dict = Depends(get_auth_context)
):
    """Export usage analytics report."""
    # Mock implementation - in production, this would generate actual reports
    return {
        "export_id": str(uuid.uuid4()),
        "format": format,
        "period": period,
        "status": "processing",
        "download_url": f"/external/analytics/exports/{uuid.uuid4()}.{format}",
        "estimated_completion": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    }

# Documentation Endpoints
@router.get("/documentation/versions", response_model=List[ApiVersionResponse])
@limiter.limit("60/minute")
async def get_api_versions(
    auth_context: dict = Depends(get_auth_context)
):
    """Get available API versions."""
    # Mock implementation - in production, this would query actual version data
    return [
        ApiVersionResponse(
            version="v2.1.0",
            status="active",
            release_date=datetime(2024, 3, 15),
            changelog=[
                "Added new analytics endpoints",
                "Improved rate limiting",
                "Enhanced error handling"
            ],
            endpoints=[
                {"path": "/api/scans", "methods": ["GET", "POST"]},
                {"path": "/api/rules", "methods": ["GET", "POST", "PUT", "DELETE"]},
                {"path": "/api/reports", "methods": ["GET"]},
                {"path": "/api/analytics", "methods": ["GET"]}
            ]
        ),
        ApiVersionResponse(
            version="v2.0.0",
            status="deprecated",
            release_date=datetime(2024, 1, 10),
            changelog=[
                "Major API restructure",
                "Improved authentication",
                "Added monitoring endpoints"
            ],
            endpoints=[
                {"path": "/api/scans", "methods": ["GET", "POST"]},
                {"path": "/api/rules", "methods": ["GET", "POST"]},
                {"path": "/api/reports", "methods": ["GET"]}
            ]
        ),
        ApiVersionResponse(
            version="v1.5.0",
            status="retired",
            release_date=datetime(2023, 10, 5),
            changelog=[
                "Legacy version",
                "Basic functionality only"
            ],
            endpoints=[
                {"path": "/api/scans", "methods": ["GET"]},
                {"path": "/api/rules", "methods": ["GET"]}
            ]
        )
    ]

@router.get("/documentation/{version}", response_model=ApiDocumentationResponse)
@limiter.limit("60/minute")
async def get_api_documentation(
    version: str,
    auth_context: dict = Depends(get_auth_context)
):
    """Get API documentation for a specific version."""
    # Mock implementation - in production, this would query actual documentation
    if version not in ["v2.1.0", "v2.0.0", "v1.5.0"]:
        raise HTTPException(status_code=404, detail="API version not found")
    
    endpoints = []
    
    if version in ["v2.1.0", "v2.0.0"]:
        endpoints.extend([
            {
                "path": "/api/scans",
                "method": "GET",
                "description": "List security scans",
                "parameters": [
                    {"name": "limit", "type": "integer", "required": False, "description": "Number of results to return"},
                    {"name": "offset", "type": "integer", "required": False, "description": "Number of results to skip"}
                ],
                "responses": {
                    "200": {"description": "Success", "schema": "ScanList"},
                    "401": {"description": "Unauthorized"},
                    "429": {"description": "Rate limit exceeded"}
                },
                "authentication_required": True,
                "rate_limit": 100,
                "permissions_required": ["read:scans"]
            },
            {
                "path": "/api/scans",
                "method": "POST",
                "description": "Create a new security scan",
                "parameters": [
                    {"name": "target", "type": "string", "required": True, "description": "Target to scan"},
                    {"name": "scan_type", "type": "string", "required": True, "description": "Type of scan to perform"}
                ],
                "responses": {
                    "201": {"description": "Scan created", "schema": "Scan"},
                    "400": {"description": "Bad request"},
                    "401": {"description": "Unauthorized"},
                    "429": {"description": "Rate limit exceeded"}
                },
                "authentication_required": True,
                "rate_limit": 50,
                "permissions_required": ["write:scans"]
            },
            {
                "path": "/api/rules",
                "method": "GET",
                "description": "List security rules",
                "parameters": [
                    {"name": "category", "type": "string", "required": False, "description": "Filter by rule category"},
                    {"name": "severity", "type": "string", "required": False, "description": "Filter by severity level"}
                ],
                "responses": {
                    "200": {"description": "Success", "schema": "RuleList"},
                    "401": {"description": "Unauthorized"},
                    "429": {"description": "Rate limit exceeded"}
                },
                "authentication_required": True,
                "rate_limit": 100,
                "permissions_required": ["read:rules"]
            },
            {
                "path": "/api/reports",
                "method": "GET",
                "description": "Get security reports",
                "parameters": [
                    {"name": "scan_id", "type": "string", "required": False, "description": "Filter by scan ID"},
                    {"name": "format", "type": "string", "required": False, "description": "Report format (json, pdf, csv)"}
                ],
                "responses": {
                    "200": {"description": "Success", "schema": "Report"},
                    "401": {"description": "Unauthorized"},
                    "404": {"description": "Report not found"},
                    "429": {"description": "Rate limit exceeded"}
                },
                "authentication_required": True,
                "rate_limit": 50,
                "permissions_required": ["read:reports"]
            }
        ])
    
    if version == "v2.1.0":
        endpoints.append({
            "path": "/api/analytics",
            "method": "GET",
            "description": "Get analytics data",
            "parameters": [
                {"name": "period", "type": "string", "required": False, "description": "Time period for analytics"},
                {"name": "metric", "type": "string", "required": False, "description": "Specific metric to retrieve"}
            ],
            "responses": {
                "200": {"description": "Success", "schema": "Analytics"},
                "401": {"description": "Unauthorized"},
                "429": {"description": "Rate limit exceeded"}
            },
            "authentication_required": True,
            "rate_limit": 30,
            "permissions_required": ["read:analytics"]
        })
    
    schemas = {
        "Scan": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Unique scan identifier"},
                "target": {"type": "string", "description": "Scan target"},
                "status": {"type": "string", "description": "Scan status"},
                "created_at": {"type": "string", "format": "date-time"},
                "completed_at": {"type": "string", "format": "date-time", "nullable": True}
            }
        },
        "Rule": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Unique rule identifier"},
                "name": {"type": "string", "description": "Rule name"},
                "category": {"type": "string", "description": "Rule category"},
                "severity": {"type": "string", "description": "Severity level"}
            }
        },
        "Report": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Unique report identifier"},
                "scan_id": {"type": "string", "description": "Associated scan ID"},
                "findings": {"type": "array", "items": {"type": "object"}},
                "summary": {"type": "object", "description": "Report summary"}
            }
        }
    }
    
    authentication = {
        "type": "bearer",
        "description": "JWT token authentication",
        "header": "Authorization",
        "format": "Bearer <token>",
        "alternative": {
            "type": "api_key",
            "description": "API key authentication",
            "header": "X-API-Key",
            "format": "<api_key>"
        }
    }
    
    return ApiDocumentationResponse(
        version=version,
        endpoints=endpoints,
        schemas=schemas,
        authentication=authentication
    )

@router.post("/documentation/test-endpoint")
@limiter.limit("30/minute")
async def test_api_endpoint(
    request: TestEndpointRequest,
    auth_context: dict = Depends(get_auth_context)
):
    """Test an API endpoint with provided parameters."""
    # Mock implementation - in production, this would make actual API calls
    endpoint = request.endpoint
    method = request.method.upper()
    
    # Simulate different responses based on endpoint
    if "/scans" in endpoint:
        if method == "GET":
            response_data = {
                "scans": [
                    {"id": "scan_123", "target": "example.com", "status": "completed"},
                    {"id": "scan_124", "target": "test.com", "status": "running"}
                ],
                "total": 2
            }
            status_code = 200
        elif method == "POST":
            response_data = {
                "id": "scan_125",
                "target": request.parameters.get("target", "example.com"),
                "status": "initiated",
                "created_at": datetime.utcnow().isoformat()
            }
            status_code = 201
        else:
            response_data = {"error": "Method not allowed"}
            status_code = 405
    elif "/rules" in endpoint:
        response_data = {
            "rules": [
                {"id": "rule_1", "name": "SQL Injection Check", "category": "security"},
                {"id": "rule_2", "name": "XSS Detection", "category": "security"}
            ],
            "total": 2
        }
        status_code = 200
    else:
        response_data = {"error": "Endpoint not found"}
        status_code = 404
    
    return {
        "status_code": status_code,
        "response_time": 145,  # milliseconds
        "headers": {
            "Content-Type": "application/json",
            "X-Rate-Limit-Remaining": "95",
            "X-Rate-Limit-Reset": "1640995200"
        },
        "body": response_data,
        "request_info": {
            "endpoint": endpoint,
            "method": method,
            "parameters": request.parameters,
            "headers": request.headers
        }
    }

@router.post("/documentation/code-examples")
@limiter.limit("30/minute")
async def generate_code_example(
    request: CodeExampleRequest,
    auth_context: dict = Depends(get_auth_context)
):
    """Generate code examples for API endpoints."""
    endpoint = request.endpoint
    method = request.method.upper()
    language = request.language.lower()
    params = request.parameters
    
    # Base URL for examples
    base_url = "https://api.securityplatform.com"
    full_url = f"{base_url}{endpoint}"
    
    # Generate code examples based on language
    if language == "javascript":
        if method == "GET":
            params_str = ", ".join([f"{k}: '{v}'" for k, v in params.items()]) if params else ""
            code = f"""// JavaScript (fetch API)
const response = await fetch('{full_url}?{params_str}', {{
  method: 'GET',
  headers: {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }}
}});

const data = await response.json();
console.log(data);

// JavaScript (axios)
const axios = require('axios');

const response = await axios.get('{full_url}', {{
  params: {{{params_str}}},
  headers: {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }}
}});

console.log(response.data);"""
        else:  # POST
            body_str = json.dumps(params, indent=2) if params else "{}"
            code = f"""// JavaScript (fetch API)
const response = await fetch('{full_url}', {{
  method: 'POST',
  headers: {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }},
  body: JSON.stringify({body_str})
}});

const data = await response.json();
console.log(data);

// JavaScript (axios)
const axios = require('axios');

const response = await axios.post('{full_url}', {body_str}, {{
  headers: {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }}
}});

console.log(response.data);"""
    
    elif language == "python":
        if method == "GET":
            params_str = ", ".join([f"'{k}': '{v}'" for k, v in params.items()]) if params else ""
            code = f"""# Python (requests)
import requests

headers = {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}}

params = {{{params_str}}}

response = requests.get('{full_url}', headers=headers, params=params)
data = response.json()
print(data)

# Python (httpx)
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(
        '{full_url}',
        headers=headers,
        params=params
    )
    data = response.json()
    print(data)"""
        else:  # POST
            body_str = json.dumps(params, indent=4) if params else "{}"
            code = f"""# Python (requests)
import requests
import json

headers = {{
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}}

data = {body_str}

response = requests.post('{full_url}', headers=headers, json=data)
result = response.json()
print(result)

# Python (httpx)
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        '{full_url}',
        headers=headers,
        json=data
    )
    result = response.json()
    print(result)"""
    
    elif language == "curl":
        if method == "GET":
            params_str = "&".join([f"{k}={v}" for k, v in params.items()]) if params else ""
            url_with_params = f"{full_url}?{params_str}" if params_str else full_url
            code = f"""# cURL
curl -X GET '{url_with_params}' \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json'

# cURL with API Key
curl -X GET '{url_with_params}' \\
  -H 'X-API-Key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json'"""
        else:  # POST
            body_str = json.dumps(params, indent=2) if params else "{}"
            code = f"""# cURL
curl -X POST '{full_url}' \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{body_str}'

# cURL with API Key
curl -X POST '{full_url}' \\
  -H 'X-API-Key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{body_str}'"""
    
    elif language == "php":
        if method == "GET":
            params_str = ", ".join([f"'{k}' => '{v}'" for k, v in params.items()]) if params else ""
            code = f"""<?php
// PHP (cURL)
$ch = curl_init();
$params = array({params_str});
$url = '{full_url}' . '?' . http_build_query($params);

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer YOUR_JWT_TOKEN',
    'Content-Type: application/json'
));

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

print_r($data);

// PHP (Guzzle)
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->get('{full_url}', [
    'query' => $params,
    'headers' => [
        'Authorization' => 'Bearer YOUR_JWT_TOKEN'
    ]
]);

$data = json_decode($response->getBody(), true);
print_r($data);
?>"""
        else:  # POST
            body_str = json.dumps(params, indent=4) if params else "{}"
            code = f"""<?php
// PHP (cURL)
$ch = curl_init();
$data = json_encode({body_str});

curl_setopt($ch, CURLOPT_URL, '{full_url}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer YOUR_JWT_TOKEN',
    'Content-Type: application/json'
));

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

print_r($result);

// PHP (Guzzle)
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->post('{full_url}', [
    'json' => {body_str},
    'headers' => [
        'Authorization' => 'Bearer YOUR_JWT_TOKEN'
    ]
]);

$result = json_decode($response->getBody(), true);
print_r($result);
?>"""
    
    elif language == "go":
        if method == "GET":
            params_str = ", ".join([f'"{k}": "{v}"' for k, v in params.items()]) if params else ""
            code = f"""// Go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
)

func main() {{
    baseURL := "{full_url}"
    
    // Add query parameters
    params := url.Values{{}}
    {chr(10).join([f'    params.Add("{k}", "{v}")' for k, v in params.items()]) if params else ""}
    
    fullURL := baseURL + "?" + params.Encode()
    
    req, err := http.NewRequest("GET", fullURL, nil)
    if err != nil {{
        panic(err)
    }}
    
    req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{{}}
    resp, err := client.Do(req)
    if err != nil {{
        panic(err)
    }}
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {{
        panic(err)
    }}
    
    var data map[string]interface{{}}
    json.Unmarshal(body, &data)
    fmt.Println(data)
}}"""
        else:  # POST
            body_str = json.dumps(params, indent=4) if params else "{}"
            code = f"""// Go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {{
    url := "{full_url}"
    
    data := map[string]interface{{{chr(10).join([f'        "{k}": "{v}",' for k, v in params.items()]) if params else ""}
    }}
    
    jsonData, err := json.Marshal(data)
    if err != nil {{
        panic(err)
    }}
    
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {{
        panic(err)
    }}
    
    req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{{}}
    resp, err := client.Do(req)
    if err != nil {{
        panic(err)
    }}
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {{
        panic(err)
    }}
    
    var result map[string]interface{{}}
    json.Unmarshal(body, &result)
    fmt.Println(result)
}}"""
    
    else:
        code = f"# Code example for {language} is not available yet.\n# Supported languages: javascript, python, curl, php, go"
    
    return {
        "language": language,
        "endpoint": endpoint,
        "method": method,
        "code": code,
        "parameters": params
    }
