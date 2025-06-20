import os
import requests
import uuid
from passlib.hash import bcrypt

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key required

assert SUPABASE_URL and SUPABASE_KEY, "Set SUPABASE_URL and SUPABASE_KEY in your environment."

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# Org 1
ORG_ID = "00000000-0000-0000-0000-000000000001"
TESTUSER_ID = "00000000-0000-0000-0000-0000000000c1"
NONADMIN_ID = "00000000-0000-0000-0000-0000000000c2"
LASTADMIN_ID = "00000000-0000-0000-0000-0000000000c3"
SCAN1_ID = "00000000-0000-0000-0000-00000000c001"
RESULT1_ID = "00000000-0000-0000-0000-00000000d001"
LOG1_ID = "00000000-0000-0000-0000-00000000e001"
TARGET1_ID = "00000000-0000-0000-0000-00000000f001"

# Org 2
ORG2_ID = "00000000-0000-0000-0000-000000000002"
ORG2_ADMIN_ID = "00000000-0000-0000-0000-0000000001c1"
ORG2_USER_ID = "00000000-0000-0000-0000-0000000001c2"
ORG2_SCAN_ID = "00000000-0000-0000-0000-00000001c001"
ORG2_RESULT_ID = "00000000-0000-0000-0000-00000001d001"
ORG2_LOG_ID = "00000000-0000-0000-0000-00000001e001"
ORG2_TARGET_ID = "00000000-0000-0000-0000-00000001f001"

PASSWORD = "testpassword"
PASSWORD_HASH = bcrypt.hash(PASSWORD)

def upsert(table, rows):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=headers, json=rows)
    if not resp.ok:
        print(f"Error upserting {table}: {resp.status_code} {resp.text}")
    else:
        print(f"Upserted {len(rows)} row(s) into {table}")

# Users Org 1
users = [
    {"id": TESTUSER_ID, "org_id": ORG_ID, "email": "testuser@example.com", "password_hash": PASSWORD_HASH, "full_name": "Test Admin", "role": "admin", "is_disabled": False},
    {"id": NONADMIN_ID, "org_id": ORG_ID, "email": "nonadmin@example.com", "password_hash": PASSWORD_HASH, "full_name": "Non Admin", "role": "user", "is_disabled": False},
    {"id": LASTADMIN_ID, "org_id": ORG_ID, "email": "lastadmin@example.com", "password_hash": PASSWORD_HASH, "full_name": "Last Admin", "role": "admin", "is_disabled": False},
    {"id": "00000000-0000-0000-0000-0000000000c4", "org_id": ORG_ID, "email": "testuser2@example.com", "password_hash": PASSWORD_HASH, "full_name": "Test User 2", "role": "user", "is_disabled": False},
    {"id": "00000000-0000-0000-0000-0000000000c5", "org_id": ORG_ID, "email": "regularuser@example.com", "password_hash": PASSWORD_HASH, "full_name": "Regular User", "role": "user", "is_disabled": False},
]
upsert("users", users)

# Users Org 2
users2 = [
    {"id": ORG2_ADMIN_ID, "org_id": ORG2_ID, "email": "org2admin@example.com", "password_hash": PASSWORD_HASH, "full_name": "Org2 Admin", "role": "admin", "is_disabled": False},
    {"id": ORG2_USER_ID, "org_id": ORG2_ID, "email": "org2user@example.com", "password_hash": PASSWORD_HASH, "full_name": "Org2 User", "role": "user", "is_disabled": False},
]
upsert("users", users2)

# Scan Org 1
scan = [{"id": SCAN1_ID, "org_id": ORG_ID, "user_id": TESTUSER_ID, "scan_type": "type", "status": "pending", "target": "target", "metadata": {}}]
upsert("scans", scan)

# Scan Org 2
scan2 = [{"id": ORG2_SCAN_ID, "org_id": ORG2_ID, "user_id": ORG2_ADMIN_ID, "scan_type": "type", "status": "pending", "target": "target", "metadata": {}}]
upsert("scans", scan2)

# Result Org 1
result = [{"id": RESULT1_ID, "org_id": ORG_ID, "scan_id": SCAN1_ID, "user_id": TESTUSER_ID, "finding": "finding", "severity": "high", "compliance_framework": "NIST", "details": {}}]
upsert("results", result)

# Result Org 2
result2 = [{"id": ORG2_RESULT_ID, "org_id": ORG2_ID, "scan_id": ORG2_SCAN_ID, "user_id": ORG2_ADMIN_ID, "finding": "finding", "severity": "high", "compliance_framework": "NIST", "details": {}}]
upsert("results", result2)

# Audit log Org 1
log = [{"id": LOG1_ID, "org_id": ORG_ID, "user_id": TESTUSER_ID, "action": "login", "target_id": TARGET1_ID, "target_table": "users", "details": {}}]
upsert("audit_logs", log)

# Audit log Org 2
log2 = [{"id": ORG2_LOG_ID, "org_id": ORG2_ID, "user_id": ORG2_ADMIN_ID, "action": "login", "target_id": ORG2_TARGET_ID, "target_table": "users", "details": {}}]
upsert("audit_logs", log2)

print("Test DB seeded with required E2E users and data for two organizations.")
print("Seeded users:")
print("  testuser@example.com (org1 admin) / testpassword")
print("  nonadmin@example.com (org1 user) / testpassword")
print("  lastadmin@example.com (org1 admin, last admin edge case) / testpassword")
print("  org2admin@example.com (org2 admin) / testpassword")
print("  org2user@example.com (org2 user) / testpassword") 