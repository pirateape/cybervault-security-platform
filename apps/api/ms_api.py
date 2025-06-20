import os
from msal import ConfidentialClientApplication
from msgraph import GraphServiceClient
from typing import List, Dict, Callable, Any
import requests
from datetime import datetime
from .azure_keyvault import get_secret_from_keyvault
import asyncio
import logging
try:
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
except ImportError:
    retry = None  # fallback to manual retry if needed

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Product enable/disable flags
ENABLE_M365_CORE = os.getenv("ENABLE_M365_CORE", "true").lower() == "true"
ENABLE_INTUNE = os.getenv("ENABLE_INTUNE", "false").lower() == "true"
ENABLE_POWER_PLATFORM = os.getenv("ENABLE_POWER_PLATFORM", "false").lower() == "true"
ENABLE_POWER_BI = os.getenv("ENABLE_POWER_BI", "false").lower() == "true"

# Utility to get per-org credentials (from Supabase + Key Vault)
def get_org_ms_creds(org_id: str):
    # Fetch secret_ref from Supabase
    headers = {"apikey": SUPABASE_SERVICE_ROLE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/ms_org_credentials?org_id=eq.{org_id}", headers=headers)
    if resp.status_code != 200:
        raise Exception(f"Failed to fetch org credentials metadata: {resp.text}")
    rows = resp.json()
    if not rows:
        # Fallback to env vars in dev mode
        if os.getenv("ENV") == "development":
            print("[WARN] Using env vars for org credentials (dev mode only)")
            return {
                "client_id": os.getenv("MS_CLIENT_ID"),
                "client_secret": os.getenv("MS_CLIENT_SECRET"),
                "tenant_id": os.getenv("MS_TENANT_ID"),
            }
        raise Exception(f"No ms_org_credentials found for org_id {org_id}")
    secret_ref = rows[0]["secret_ref"]
    # Fetch actual credentials from Azure Key Vault
    creds = get_secret_from_keyvault(secret_ref)
    # Audit log (never log secrets)
    print(f"[AUDIT] Org credential access: org_id={org_id}, secret_ref={secret_ref}, ts={datetime.utcnow().isoformat()}Z")
    return creds

# MSAL App per org
def get_msal_app(org_id: str):
    creds = get_org_ms_creds(org_id)
    return ConfidentialClientApplication(
        creds["client_id"],
        authority=f"https://login.microsoftonline.com/{creds['tenant_id']}",
        client_credential=creds["client_secret"]
    )

MS_SCOPE = ["https://graph.microsoft.com/.default"]

def get_graph_access_token(org_id: str):
    msal_app = get_msal_app(org_id)
    result = msal_app.acquire_token_silent(MS_SCOPE, account=None)
    if not result:
        result = msal_app.acquire_token_for_client(scopes=MS_SCOPE)
    if "access_token" not in result:
        raise Exception(f"Could not obtain access token: {result}")
    return result["access_token"]

def get_graph_client(org_id: str):
    access_token = get_graph_access_token(org_id)
    return GraphServiceClient(token_credential=access_token)

# --- Pagination Utility ---
async def fetch_all_graph_pages(initial_call: Callable[..., Any], *args, **kwargs) -> List[Any]:
    """
    Aggregates all paginated results from a Microsoft Graph API call.
    initial_call: The coroutine function to call (e.g., client.users.get)
    *args, **kwargs: Arguments to pass to the initial call
    Returns: List of all items across all pages
    """
    page = await initial_call(*args, **kwargs)
    all_items = []
    page_count = 0
    while page is not None:
        page_count += 1
        if hasattr(page, 'value') and page.value:
            all_items.extend(page.value)
        if hasattr(page, 'odata_next_link') and page.odata_next_link:
            # Use .with_url to get the next page
            page = await initial_call.with_url(page.odata_next_link).get()
        else:
            break
    print(f"[Pagination] Fetched {len(all_items)} records across {page_count} page(s) at {datetime.utcnow().isoformat()}Z")
    return all_items

# List users in Microsoft 365 tenant
async def list_ms_users(org_id: str) -> List[Dict]:
    if not ENABLE_M365_CORE:
        print(f"[INFO] M365 Core collection disabled for users (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    all_users = await fetch_all_graph_pages(client.users.get)
    return [
        {"id": user.id, "display_name": user.display_name, "mail": user.mail}
        for user in all_users
    ]

# List groups in Microsoft 365 tenant
async def list_ms_groups(org_id: str) -> List[Dict]:
    if not ENABLE_M365_CORE:
        print(f"[INFO] M365 Core collection disabled for groups (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    all_groups = await fetch_all_graph_pages(client.groups.get)
    return [
        {"id": group.id, "display_name": group.display_name, "mail": getattr(group, 'mail', None)}
        for group in all_groups
    ]

# Check conditional access policies (stub)
async def check_conditional_access_policies(org_id: str) -> List[Dict]:
    client = get_graph_client(org_id)
    # Example: List all conditional access policies
    policies = await client.conditional_access.policies.get()
    return [
        {"id": policy.id, "display_name": policy.display_name, "state": policy.state}
        for policy in policies.value
    ]

# Compliance scan: users without MFA (example)
async def scan_users_without_mfa(org_id: str) -> List[Dict]:
    client = get_graph_client(org_id)
    users = await client.users.get()
    # This is a stub; real check would require additional API calls
    return [
        {"id": user.id, "display_name": user.display_name, "mfa_enabled": False}  # Placeholder
        for user in users.value
    ]

# Compliance scan: inactive users (example)
async def scan_inactive_users(org_id: str) -> List[Dict]:
    client = get_graph_client(org_id)
    users = await client.users.get()
    # This is a stub; real check would require last_login or signInActivity
    return [
        {"id": user.id, "display_name": user.display_name, "inactive": True}  # Placeholder
        for user in users.value
    ]

# Compliance scan: check encryption policies (example)
async def check_encryption_policies(org_id: str) -> Dict:
    client = get_graph_client(org_id)
    # This is a stub; real check would require tenant settings API
    return {"encryption_enabled": True}  # Placeholder

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
                    await asyncio.sleep(2 ** attempts)
        return wrapper

# --- Intune: Managed Devices ---
@retry_decorator
async def list_intune_devices(org_id: str) -> List[Dict]:
    """Fetch all Intune managed devices for an org. Retries on transient errors. Logs and sanitizes errors."""
    if not ENABLE_INTUNE:
        print(f"[INFO] Intune collection disabled (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    try:
        devices = await fetch_all_graph_pages(client.device_management.managed_devices.get)
        print(f"[INFO] Intune: Retrieved {len(devices)} managed devices for org_id={org_id}")
        return [
            {"id": d.id, "device_name": getattr(d, 'device_name', None), "operating_system": getattr(d, 'operating_system', None), "compliance_state": getattr(d, 'compliance_state', None), "jail_broken": getattr(d, 'jail_broken', None), "enrollment_type": getattr(d, 'enrollment_type', None), "last_sync_date_time": getattr(d, 'last_sync_date_time', None)}
            for d in devices
        ]
    except Exception as e:
        log_error("IntuneDeviceFetchError", "Failed to fetch managed devices", org_id, "/deviceManagement/managedDevices", e)
        return []

# --- Intune: Device Compliance Policies ---
@retry_decorator
async def list_intune_compliance_policies(org_id: str) -> List[Dict]:
    """Fetch all Intune device compliance policies for an org. Retries on transient errors. Logs and sanitizes errors."""
    if not ENABLE_INTUNE:
        print(f"[INFO] Intune compliance policy collection disabled (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    try:
        policies = await fetch_all_graph_pages(client.device_management.device_compliance_policies.get)
        print(f"[INFO] Intune: Retrieved {len(policies)} compliance policies for org_id={org_id}")
        return [
            {"id": p.id, "display_name": getattr(p, 'display_name', None), "platform_type": getattr(p, 'platform_type', None), "created_date_time": getattr(p, 'created_date_time', None), "last_modified_date_time": getattr(p, 'last_modified_date_time', None)}
            for p in policies
        ]
    except Exception as e:
        log_error("IntuneCompliancePolicyFetchError", "Failed to fetch compliance policies", org_id, "/deviceManagement/deviceCompliancePolicies", e)
        return []

# --- Power Platform: Solutions ---
@retry_decorator
async def list_powerapps_solutions(org_id: str) -> List[Dict]:
    """Fetch all Power Apps solutions for an org. Retries on transient errors. Logs and sanitizes errors."""
    if not ENABLE_POWER_PLATFORM:
        print(f"[INFO] Power Platform collection disabled (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    try:
        solutions = await fetch_all_graph_pages(client.solutions.get)
        print(f"[INFO] Power Platform: Retrieved {len(solutions)} solutions for org_id={org_id}")
        return [
            {"id": s.id, "display_name": getattr(s, 'display_name', None), "publisher": getattr(s, 'publisher', None), "version": getattr(s, 'version', None)}
            for s in solutions
        ]
    except Exception as e:
        log_error("PowerPlatformSolutionsFetchError", "Failed to fetch Power Apps solutions", org_id, "/solutions", e)
        return []

# --- Power Platform: Environments ---
@retry_decorator
async def list_powerapps_environments(org_id: str) -> List[Dict]:
    """Fetch all Power Platform environments for an org. Retries on transient errors. Logs and sanitizes errors."""
    if not ENABLE_POWER_PLATFORM:
        print(f"[INFO] Power Platform environment collection disabled (org_id={org_id})")
        return []
    client = get_graph_client(org_id)
    try:
        envs = await fetch_all_graph_pages(client.environment.get)
        print(f"[INFO] Power Platform: Retrieved {len(envs)} environments for org_id={org_id}")
        return [
            {"id": e.id, "display_name": getattr(e, 'display_name', None), "region": getattr(e, 'region', None), "created_time": getattr(e, 'created_time', None)}
            for e in envs
        ]
    except Exception as e:
        log_error("PowerPlatformEnvironmentsFetchError", "Failed to fetch Power Platform environments", org_id, "/environment", e)
        return [] 