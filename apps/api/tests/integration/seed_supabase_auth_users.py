"""
Seed Supabase Auth users for E2E and integration tests using the REST API (service role key required).

Usage:
  export SUPABASE_URL=... # your Supabase project URL
  export SUPABASE_KEY=... # your Supabase service role key
  python tests/integration/seed_supabase_auth_users.py

This script ensures all test users exist in Supabase Auth (Auth > Users) with email confirmed.
"""
import os
import requests
import sys

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

assert SUPABASE_URL and SUPABASE_KEY, "Set SUPABASE_URL and SUPABASE_KEY in your environment."

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Test users for both orgs (keep in sync with DB seeding script)
USERS = [
    {"email": "testuser@example.com", "password": "testpassword"},
    {"email": "nonadmin@example.com", "password": "testpassword"},
    {"email": "lastadmin@example.com", "password": "testpassword"},
    {"email": "org2admin@example.com", "password": "org2password"},
    {"email": "org2user@example.com", "password": "org2password"},
    {"email": "testuser2@example.com", "password": "testpassword"},
    {"email": "regularuser@example.com", "password": "testpassword"},
]

ADMIN_USERS_ENDPOINT = f"{SUPABASE_URL}/auth/v1/admin/users"

success = True
for user in USERS:
    # Check if user exists
    params = {"email": user["email"]}
    resp = requests.get(ADMIN_USERS_ENDPOINT, headers=headers, params=params)
    if resp.status_code == 200 and resp.json().get("users"):
        print(f"User {user['email']} already exists in Auth.")
        continue
    # Create user
    payload = {
        "email": user["email"],
        "password": user["password"],
        "email_confirm": True
    }
    resp = requests.post(ADMIN_USERS_ENDPOINT, headers=headers, json=payload)
    if resp.status_code == 201:
        print(f"Created Auth user: {user['email']}")
    elif resp.status_code == 200 and resp.json().get("user"):
        print(f"User {user['email']} created (200).")
    else:
        print(f"Error creating user {user['email']}: {resp.status_code} {resp.text}")
        success = False
if not success:
    sys.exit(1) 