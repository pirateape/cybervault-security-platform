#!/usr/bin/env python3
"""
reset_all_user_passwords.py

WARNING: This script is for TEST ENVIRONMENTS ONLY. It will DELETE ALL USERS and recreate them with the password 'testpassword'.

Usage:
  export SUPABASE_URL=https://your-project.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  python scripts/reset_all_user_passwords.py

Dependencies:
  pip install requests
"""
import os
import sys
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as environment variables.")
    sys.exit(1)

ADMIN_USERS_ENDPOINT = f"{SUPABASE_URL}/auth/v1/admin/users"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. List all users
def list_users():
    users = []
    next_page = ADMIN_USERS_ENDPOINT
    while next_page:
        resp = requests.get(next_page, headers=HEADERS)
        if resp.status_code != 200:
            print(f"Failed to list users: {resp.status_code} {resp.text}")
            sys.exit(1)
        data = resp.json()
        users.extend(data.get('users', []))
        next_page = data.get('next_page', None)
    return users

# 2. Delete a user
def delete_user(user_id):
    url = f"{ADMIN_USERS_ENDPOINT}/{user_id}"
    resp = requests.delete(url, headers=HEADERS)
    if resp.status_code not in (200, 204):
        print(f"Failed to delete user {user_id}: {resp.status_code} {resp.text}")
    else:
        print(f"Deleted user {user_id}")

# 3. Create a user
def create_user(email, password):
    data = {"email": email, "password": password, "email_confirm": True}
    resp = requests.post(ADMIN_USERS_ENDPOINT, headers=HEADERS, json=data)
    if resp.status_code not in (200, 201):
        print(f"Failed to create user {email}: {resp.status_code} {resp.text}")
    else:
        print(f"Created user {email}")

def main():
    print("WARNING: This will DELETE ALL USERS and recreate them with password 'testpassword'.")
    confirm = input("Type 'YES' to proceed: ")
    if confirm != 'YES':
        print("Aborted.")
        sys.exit(0)
    users = list_users()
    print(f"Found {len(users)} users.")
    for user in users:
        email = user.get('email')
        user_id = user.get('id')
        if not email or not user_id:
            print(f"Skipping user with missing email or id: {user}")
            continue
        delete_user(user_id)
        create_user(email, 'testpassword')
    print("All users have been reset.")

if __name__ == "__main__":
    main() 