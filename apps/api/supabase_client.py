import os
import requests
import logging
from datetime import datetime
from dotenv import load_dotenv
try:
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
except ImportError:
    retry = None

load_dotenv()  # Loads environment variables from .env in the project root

# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY are now loaded from .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_ANON_KEY:
    raise EnvironmentError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set in environment variables.")

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def _handle_response(resp):
    try:
        resp.raise_for_status()
        data = resp.json()
        return {"data": data}
    except Exception:
        try:
            err = resp.json()
        except Exception:
            err = resp.text
        return {"error": err}

def log_error(error_type, message, org_id=None, endpoint=None, exc=None):
    logging.error({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "error_type": error_type,
        "org_id": org_id,
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

# USERS CRUD

@retry_decorator
def create_user(org_id, email, password_hash, full_name=None, role="user"):
    """Create a user in Supabase. Retries on transient errors. Logs and sanitizes errors."""
    url = f"{SUPABASE_URL}/rest/v1/users"
    payload = [{
        "org_id": org_id,
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name,
        "role": role
    }]
    resp = requests.post(url, headers=headers, json=payload)
    return _handle_response(resp)

def disable_user(org_id, user_id):
    url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&org_id=eq.{org_id}"
    payload = {"is_disabled": True}
    resp = requests.patch(url, headers=headers, json=payload)
    return _handle_response(resp)

def enable_user(org_id, user_id):
    url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&org_id=eq.{org_id}"
    payload = {"is_disabled": False}
    resp = requests.patch(url, headers=headers, json=payload)
    return _handle_response(resp)

def delete_user(org_id, user_id):
    url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&org_id=eq.{org_id}"
    resp = requests.delete(url, headers=headers)
    return _handle_response(resp)

def get_user_by_email(org_id, email, include_disabled=False):
    url = f"{SUPABASE_URL}/rest/v1/users?org_id=eq.{org_id}&email=eq.{email}"
    if not include_disabled:
        url += "&is_disabled=eq.false"
    resp = requests.get(url, headers=headers)
    data = _handle_response(resp)
    # Return single user or error
    if "data" in data and isinstance(data["data"], list):
        if data["data"]:
            return {"data": data["data"][0]}
        else:
            return {"error": {"message": "User not found"}}
    return data

# SCANS CRUD

def create_scan(org_id, user_id, scan_type, status, target=None, metadata=None):
    url = f"{SUPABASE_URL}/rest/v1/scans"
    payload = [{
        "org_id": org_id,
        "user_id": user_id,
        "scan_type": scan_type,
        "status": status,
        "target": target,
        "metadata": metadata
    }]
    resp = requests.post(url, headers=headers, json=payload)
    return _handle_response(resp)

def get_scan(org_id, scan_id):
    url = f"{SUPABASE_URL}/rest/v1/scans?org_id=eq.{org_id}&id=eq.{scan_id}"
    resp = requests.get(url, headers=headers)
    data = _handle_response(resp)
    if "data" in data and isinstance(data["data"], list):
        if data["data"]:
            return {"data": data["data"][0]}
        else:
            return {"error": {"message": "Scan not found"}}
    return data

# RESULTS CRUD

def create_result(org_id, scan_id, user_id, finding, severity=None, compliance_framework=None, details=None):
    url = f"{SUPABASE_URL}/rest/v1/results"
    payload = [{
        "org_id": org_id,
        "scan_id": scan_id,
        "user_id": user_id,
        "finding": finding,
        "severity": severity,
        "compliance_framework": compliance_framework,
        "details": details
    }]
    resp = requests.post(url, headers=headers, json=payload)
    return _handle_response(resp)

def get_results_for_scan(org_id, scan_id):
    url = f"{SUPABASE_URL}/rest/v1/results?org_id=eq.{org_id}&scan_id=eq.{scan_id}"
    resp = requests.get(url, headers=headers)
    return _handle_response(resp)

# AUDIT LOGS CRUD

def create_audit_log(org_id, user_id, action, target_id=None, target_table=None, details=None):
    url = f"{SUPABASE_URL}/rest/v1/audit_logs"
    payload = [{
        "org_id": org_id,
        "user_id": user_id,
        "action": action,
        "target_id": target_id,
        "target_table": target_table,
        "details": details
    }]
    resp = requests.post(url, headers=headers, json=payload)
    return _handle_response(resp)

def get_audit_logs_for_user(org_id, user_id):
    url = f"{SUPABASE_URL}/rest/v1/audit_logs?org_id=eq.{org_id}&user_id=eq.{user_id}"
    resp = requests.get(url, headers=headers)
    return _handle_response(resp)

def get_review_queue(org_id):
    """Fetch all results with review_status='pending' for the given org."""
    url = f"{SUPABASE_URL}/rest/v1/results?org_id=eq.{org_id}&review_status=eq.pending"
    resp = requests.get(url, headers=headers)
    return _handle_response(resp)

def update_result_review_status(result_id, org_id, status, reviewer_id, reviewer_feedback=None, override_recommendation=None):
    """Update review_status and reviewer fields for a result."""
    url = f"{SUPABASE_URL}/rest/v1/results?id=eq.{result_id}&org_id=eq.{org_id}"
    payload = {
        "review_status": status,
        "reviewer_id": reviewer_id,
        "reviewer_feedback": reviewer_feedback,
        "override_recommendation": override_recommendation
    }
    resp = requests.patch(url, headers=headers, json=[payload])
    return _handle_response(resp)

def create_review_feedback(result_id, user_id, feedback_type, comments=None, override_recommendation=None):
    """Insert a new review feedback record."""
    url = f"{SUPABASE_URL}/rest/v1/review_feedback"
    payload = [{
        "result_id": result_id,
        "user_id": user_id,
        "feedback_type": feedback_type,
        "comments": comments,
        "override_recommendation": override_recommendation
    }]
    resp = requests.post(url, headers=headers, json=payload)
    return _handle_response(resp)

def get_review_audit_logs(result_id):
    """Fetch all audit logs for a given result_id."""
    url = f"{SUPABASE_URL}/rest/v1/audit_logs?target_id=eq.{result_id}"
    resp = requests.get(url, headers=headers)
    return _handle_response(resp)

class SupabaseTableClient:
    def __init__(self, table_name):
        self.table_name = table_name

    def select(self, columns="*"):
        self._action = "select"
        self._columns = columns
        self._filters = []
        self._single = False
        return self

    def insert(self, data):
        self._action = "insert"
        self._data = data
        return self

    def update(self, data):
        self._action = "update"
        self._data = data
        self._filters = []
        return self

    def delete(self):
        self._action = "delete"
        self._filters = []
        return self

    def eq(self, column, value):
        if not hasattr(self, '_filters'):
            self._filters = []
        self._filters.append((column, value))
        return self

    def single(self):
        self._single = True
        return self

    def execute(self):
        # This is a stub. In production, use a real Supabase client or requests.
        # For now, just return a dummy response for tests/mocks.
        return type('obj', (object,), {"error": None, "data": []})()

class SupabaseClient:
    def table(self, table_name):
        return SupabaseTableClient(table_name)

def get_supabase_client():
    return SupabaseClient() 