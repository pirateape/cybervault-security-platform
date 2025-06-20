import os
import requests
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from typing import Optional
import logging
from datetime import datetime
try:
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
except ImportError:
    retry = None

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def log_error(error_type, message, user=None, endpoint=None, exc=None):
    logging.error({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "error_type": error_type,
        "user": user,
        "endpoint": endpoint,
        "message": str(message),
        "exception": str(exc) if exc else None
    })

# --- Retry Decorator (Tenacity or Manual) ---
def retry_decorator(func):
    if retry:
        return retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            retry=retry_if_exception_type((Exception,)),
            reraise=True
        )(func)
    else:
        async def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < 3:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts >= 3:
                        raise
                    import asyncio
                    await asyncio.sleep(2 ** attempts)
        return wrapper

def signup_user(email: str, password: str):
    url = f"{SUPABASE_URL}/auth/v1/signup"
    payload = {"email": email, "password": password}
    resp = requests.post(url, headers=headers, json=payload)
    try:
        resp.raise_for_status()
        data = resp.json()
        if "user" in data:
            return data["user"]
        return data
    except Exception as e:
        log_error("AuthSignupError", "Failed to sign up user", email, "/signup", e)
        raise HTTPException(status_code=400, detail="Failed to sign up user")

def login_user(email: str, password: str):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {"email": email, "password": password}
    resp = requests.post(url, headers=headers, json=payload)
    try:
        resp.raise_for_status()
        data = resp.json()
        if "access_token" in data:
            return data["access_token"]
        return data
    except Exception as e:
        log_error("AuthLoginError", "Failed to login user", email, "/login", e)
        raise HTTPException(status_code=400, detail="Failed to login user")

def verify_jwt_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    return payload

def require_org_role(org_id_param: str, required_role: str):
    """
    FastAPI dependency to enforce org-based role checks.
    Usage: Depends(require_org_role("org_id", "admin"))
    org_id_param: the name of the parameter in the endpoint (e.g., 'org_id')
    required_role: the minimum role required (e.g., 'admin')
    """
    def dependency(request: Request, current_user=Depends(get_current_user)):
        # Extract org_id from path/query/body
        org_id = request.query_params.get(org_id_param) or request.path_params.get(org_id_param)
        if not org_id:
            raise HTTPException(status_code=400, detail=f"Missing org_id parameter: {org_id_param}")
        user_id = current_user.get("id") or current_user.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")
        # Query org_members for role
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/org_members",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
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
        # Role hierarchy: owner > admin > member > ...
        role_order = ["owner", "admin", "member", "user"]
        try:
            user_idx = role_order.index(user_role)
            required_idx = role_order.index(required_role)
        except ValueError:
            raise HTTPException(status_code=403, detail="Invalid role configuration")
        if user_idx > required_idx:
            raise HTTPException(status_code=403, detail=f"Insufficient role: {user_role} (required: {required_role})")
        return {"org_id": org_id, "user_id": user_id, "role": user_role}
    return dependency 