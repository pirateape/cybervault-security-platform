import os
import requests
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import json
import functools
import asyncio
import time

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# OAuth2 scheme for token extraction
oauth2_scheme = HTTPBearer()

# Headers for Supabase API calls
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
}

def log_error(error_type, message, user=None, endpoint=None, exc=None):
    """
    Log authentication errors with context
    """
    timestamp = datetime.now().isoformat()
    error_detail = f"[{timestamp}] {error_type}: {message}"
    if user:
        error_detail += f" | User: {user}"
    if endpoint:
        error_detail += f" | Endpoint: {endpoint}"
    if exc:
        error_detail += f" | Exception: {str(exc)}"
    print(error_detail)

# Validate required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]
for var in required_vars:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

# Retry decorator for API calls
def retry_decorator(func):
    """
    Decorator to retry failed API calls with exponential backoff
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                delay = base_delay * (2 ** attempt)
                await asyncio.sleep(delay)
        
    return wrapper

def signup_user(email: str, password: str, full_name: Optional[str] = None, role: str = "user", org_id: Optional[str] = None):
    """
    Register a new user with Supabase Auth
    """
    try:
        url = f"{SUPABASE_URL}/auth/v1/signup"
        payload = {
            "email": email,
            "password": password,
            "data": {
                "full_name": full_name,
                "role": role,
                "org_id": org_id
            }
        }
        
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        
        return resp.json()
        
    except Exception as e:
        log_error("SignupError", "Failed to create user", email, "/auth/signup", e)
        raise HTTPException(status_code=400, detail="Failed to create user")

def login_user(email: str, password: str):
    """
    Authenticate user with Supabase Auth
    """
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        payload = {
            "email": email,
            "password": password
        }
        
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        
        return resp.json()
        
    except Exception as e:
        log_error("LoginError", "Failed to authenticate user", email, "/auth/login", e)
        raise HTTPException(status_code=401, detail="Invalid credentials")

@retry_decorator
def verify_supabase_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token using Supabase Auth API (primary method)
    """
    try:
        url = f"{SUPABASE_URL}/auth/v1/user"
        token_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        resp = requests.get(url, headers=token_headers)
        resp.raise_for_status()
        
        user_data = resp.json()
        return user_data
        
    except Exception as e:
        log_error("TokenVerificationError", "Failed to verify token with Supabase", None, "/auth/verify", e)
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    FastAPI dependency to get the current user from Supabase JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify the token with Supabase Auth API
    user_data = verify_supabase_jwt_token(token)
    
    if not user_data:
        raise credentials_exception
    
    return user_data

def require_org_role(org_id_param: str, required_role: str):
    """
    FastAPI dependency to enforce org-based role checks.
    Usage: Depends(require_org_role("org_id", "admin"))
    org_id_param: the name of the parameter in the endpoint (e.g., 'org_id')
    required_role: the minimum role required (e.g., 'admin')
    """
    async def dependency(request: Request, current_user=Depends(get_current_user)):
        # Extract org_id from path/query/body
        org_id = request.query_params.get(org_id_param) or request.path_params.get(org_id_param)
        if not org_id:
            raise HTTPException(status_code=400, detail=f"Missing org_id parameter: {org_id_param}")
        
        user_id = current_user.get("id") or current_user.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")
        
        try:
            # Query org_members for role using service key
            service_headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            }
            
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/org_members",
                headers=service_headers,
                params={
                    "org_id": f"eq.{org_id}",
                    "user_id": f"eq.{user_id}"
                }
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to query org membership")
            
            data = resp.json()
            if not data or not isinstance(data, list) or len(data) == 0:
                raise HTTPException(status_code=403, detail="User is not a member of this organization")
            
            user_role = data[0].get("role")
            if not user_role:
                raise HTTPException(status_code=403, detail="User has no role in this organization")
            
            # Role hierarchy: owner > admin > member > user
            role_order = ["owner", "admin", "member", "user"]
            try:
                user_idx = role_order.index(user_role)
                required_idx = role_order.index(required_role)
            except ValueError:
                raise HTTPException(status_code=403, detail="Invalid role configuration")
            
            if user_idx > required_idx:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient role: {user_role} (required: {required_role})"
                )
            
            return {"org_id": org_id, "user_id": user_id, "role": user_role}
            
        except HTTPException:
            raise
        except Exception as e:
            log_error("RoleCheckError", "Failed to check user role", user_id, "/auth/role_check", e)
            raise HTTPException(status_code=500, detail="Internal error during role verification")
    
    return dependency

async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    FastAPI dependency to ensure the current user is active (not disabled)
    """
    # Check if user is disabled in their metadata or user_metadata
    user_metadata = current_user.get("user_metadata", {})
    app_metadata = current_user.get("app_metadata", {})
    
    is_disabled = (
        user_metadata.get("disabled", False) or 
        app_metadata.get("disabled", False) or
        current_user.get("disabled", False)
    )
    
    if is_disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    return current_user

# Legacy support for existing endpoints
def get_current_user_sync(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Synchronous version for backward compatibility
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(get_current_user(token))
    except RuntimeError:
        # If no event loop is running, create a new one
        return asyncio.run(get_current_user(token))

# Utility functions for admin operations
def admin_reset_password(email: str) -> Dict[str, Any]:
    """
    Admin function to trigger password reset for a user
    """
    try:
        url = f"{SUPABASE_URL}/auth/v1/recover"
        payload = {"email": email}
        
        # Use service key for admin operations
        admin_headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        resp = requests.post(url, headers=admin_headers, json=payload)
        resp.raise_for_status()
        
        return {"success": True, "message": f"Password reset email sent to {email}"}
        
    except Exception as e:
        log_error("AdminPasswordResetError", "Failed to send password reset", email, "/auth/admin/reset", e)
        return {"success": False, "error": str(e)}

def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    Refresh access token using refresh token
    """
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
        payload = {"refresh_token": refresh_token}
        
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        
        return resp.json()
        
    except Exception as e:
        log_error("TokenRefreshError", "Failed to refresh token", None, "/auth/refresh", e)
        raise HTTPException(status_code=400, detail="Failed to refresh token") 