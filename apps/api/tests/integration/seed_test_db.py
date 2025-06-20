import os
from supabase import create_client
from uuid import UUID
from passlib.hash import bcrypt

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

assert SUPABASE_URL and SUPABASE_KEY, "Set SUPABASE_URL and SUPABASE_KEY in your environment."

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ORG_ID = "00000000-0000-0000-0000-000000000001"
ADMIN_ID = "00000000-0000-0000-0000-0000000000a1"
USER2_ID = "00000000-0000-0000-0000-0000000000b2"
USER3_ID = "00000000-0000-0000-0000-0000000000b3"
TESTUSER_ID = "00000000-0000-0000-0000-0000000000c1"
NONADMIN_ID = "00000000-0000-0000-0000-0000000000c2"
LASTADMIN_ID = "00000000-0000-0000-0000-0000000000c3"
SCAN1_ID = "00000000-0000-0000-0000-00000000c001"
RESULT1_ID = "00000000-0000-0000-0000-00000000d001"
LOG1_ID = "00000000-0000-0000-0000-00000000e001"
TARGET1_ID = "00000000-0000-0000-0000-00000000f001"

PASSWORD = "testpassword"
PASSWORD_HASH = bcrypt.hash(PASSWORD)

# Insert users for E2E
users = [
    {"id": TESTUSER_ID, "org_id": ORG_ID, "email": "testuser@example.com", "password_hash": PASSWORD_HASH, "full_name": "Test Admin", "role": "admin", "is_disabled": False},
    {"id": NONADMIN_ID, "org_id": ORG_ID, "email": "nonadmin@example.com", "password_hash": PASSWORD_HASH, "full_name": "Non Admin", "role": "user", "is_disabled": False},
    {"id": LASTADMIN_ID, "org_id": ORG_ID, "email": "lastadmin@example.com", "password_hash": PASSWORD_HASH, "full_name": "Last Admin", "role": "admin", "is_disabled": False},
]
for user in users:
    exists = supabase.table("users").select("id").eq("id", user["id"]).execute().data
    if not exists:
        supabase.table("users").insert(user).execute()

# Insert scan
scan = {"id": SCAN1_ID, "org_id": ORG_ID, "user_id": TESTUSER_ID, "scan_type": "type", "status": "pending", "target": "target", "metadata": {}}
exists = supabase.table("scans").select("id").eq("id", scan["id"]).execute().data
if not exists:
    supabase.table("scans").insert(scan).execute()

# Insert result
result = {"id": RESULT1_ID, "org_id": ORG_ID, "scan_id": SCAN1_ID, "user_id": TESTUSER_ID, "finding": "finding", "severity": "high", "compliance_framework": "NIST", "details": {}}
exists = supabase.table("results").select("id").eq("id", result["id"]).execute().data
if not exists:
    supabase.table("results").insert(result).execute()

# Insert audit log
log = {"id": LOG1_ID, "org_id": ORG_ID, "user_id": TESTUSER_ID, "action": "login", "target_id": TARGET1_ID, "target_table": "users", "details": {}}
exists = supabase.table("audit_logs").select("id").eq("id", log["id"]).execute().data
if not exists:
    supabase.table("audit_logs").insert(log).execute()

print("Test DB seeded with required E2E users and data.")
print("Seeded users:")
print("  testuser@example.com (admin) / testpassword")
print("  nonadmin@example.com (user) / testpassword")
print("  lastadmin@example.com (admin, for last admin edge case) / testpassword") 