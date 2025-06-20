#!/usr/bin/env python3
"""
Simple script to populate org_id for test users.
This script creates test organizations and assigns users to them for user testing.
"""

import os
import requests
import json
import uuid
from passlib.hash import bcrypt

# Use frontend environment variables as fallback
SUPABASE_URL = os.getenv("SUPABASE_URL") or "https://nsrgcbdlidvrruhkunsl.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_KEY:
    print("❌ SUPABASE_KEY (service role key) is required but not found.")
    print("Please set SUPABASE_KEY environment variable with your service role key.")
    print("You can find this in your Supabase project settings under API.")
    exit(1)

print(f"🔗 Using Supabase URL: {SUPABASE_URL}")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# Test organizations
TEST_ORG_ID = "00000000-0000-0000-0000-000000000001"
TEST_ORG2_ID = "00000000-0000-0000-0000-000000000002"

def make_request(method, endpoint, data=None):
    """Make a request to Supabase REST API with error handling."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data)
        elif method == "PATCH":
            resp = requests.patch(url, headers=headers, json=data)
        
        if resp.ok:
            return resp.json() if resp.content else []
        else:
            print(f"❌ Error {method} {endpoint}: {resp.status_code} {resp.text}")
            return None
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None

def check_existing_data():
    """Check what users and organizations currently exist."""
    print("\n📊 Checking existing data...")
    
    # Check users
    users = make_request("GET", "users?select=id,email,org_id,role,full_name")
    if users is not None:
        print(f"Found {len(users)} users:")
        for user in users:
            org_status = "✅ Has org_id" if user.get('org_id') else "❌ Missing org_id"
            print(f"  - {user['email']} ({user.get('role', 'unknown')}) - {org_status}")
    
    return users

def create_test_organizations():
    """Create test organizations if they don't exist."""
    print("\n🏢 Creating test organizations...")
    
    orgs = [
        {
            "id": TEST_ORG_ID,
            "name": "Test Organization 1",
            "domain": "testorg1.com",
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": TEST_ORG2_ID,
            "name": "Test Organization 2", 
            "domain": "testorg2.com",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    # Note: We're assuming organizations table exists, but if not, we'll just assign org_ids to users
    for org in orgs:
        result = make_request("POST", "organizations", [org])
        if result is not None:
            print(f"✅ Created/updated organization: {org['name']}")

def create_test_users():
    """Create test users with org_id assigned."""
    print("\n👥 Creating test users...")
    
    password_hash = bcrypt.hash("testpassword")
    
    users = [
        {
            "id": "00000000-0000-0000-0000-0000000000c1",
            "org_id": TEST_ORG_ID,
            "email": "testuser@example.com",
            "password_hash": password_hash,
            "full_name": "Test Admin",
            "role": "admin",
            "is_disabled": False
        },
        {
            "id": "00000000-0000-0000-0000-0000000000c2",
            "org_id": TEST_ORG_ID,
            "email": "nonadmin@example.com",
            "password_hash": password_hash,
            "full_name": "Non Admin User",
            "role": "user",
            "is_disabled": False
        },
        {
            "id": "00000000-0000-0000-0000-0000000000c3",
            "org_id": TEST_ORG_ID,
            "email": "lastadmin@example.com",
            "password_hash": password_hash,
            "full_name": "Last Admin",
            "role": "admin",
            "is_disabled": False
        },
        {
            "id": "00000000-0000-0000-0000-0000000001c1",
            "org_id": TEST_ORG2_ID,
            "email": "org2admin@example.com",
            "password_hash": password_hash,
            "full_name": "Org2 Admin",
            "role": "admin",
            "is_disabled": False
        },
        {
            "id": "00000000-0000-0000-0000-0000000001c2",
            "org_id": TEST_ORG2_ID,
            "email": "org2user@example.com",
            "password_hash": password_hash,
            "full_name": "Org2 User",
            "role": "user",
            "is_disabled": False
        }
    ]
    
    result = make_request("POST", "users", users)
    if result is not None:
        print(f"✅ Created/updated {len(users)} test users")
        return True
    return False

def update_existing_users_org_id():
    """Update existing users to have org_id if they don't have one."""
    print("\n🔄 Updating existing users with org_id...")
    
    users = make_request("GET", "users?select=id,email,org_id")
    if not users:
        return False
    
    users_without_org = [u for u in users if not u.get('org_id')]
    
    if not users_without_org:
        print("✅ All users already have org_id assigned")
        return True
    
    print(f"Found {len(users_without_org)} users without org_id")
    
    # Assign users to test org
    for i, user in enumerate(users_without_org):
        org_id = TEST_ORG_ID if i % 2 == 0 else TEST_ORG2_ID
        
        update_data = {"org_id": org_id}
        result = make_request("PATCH", f"users?id=eq.{user['id']}", update_data)
        
        if result is not None:
            print(f"✅ Updated {user['email']} with org_id: {org_id}")
        else:
            print(f"❌ Failed to update {user['email']}")
    
    return True

def main():
    """Main function to populate org_id for user testing."""
    print("🚀 Starting org_id population for user testing...")
    
    # Check existing data
    existing_users = check_existing_data()
    
    if not existing_users:
        print("No existing users found. Creating test users...")
        create_test_organizations()
        success = create_test_users()
    else:
        print("Existing users found. Updating org_id where needed...")
        create_test_organizations()  # Ensure orgs exist
        success = update_existing_users_org_id()
    
    if success:
        print("\n✅ org_id population completed successfully!")
        print("\n📋 Test users available:")
        print("  - testuser@example.com / testpassword (admin, org1)")
        print("  - nonadmin@example.com / testpassword (user, org1)")
        print("  - lastadmin@example.com / testpassword (admin, org1)")
        print("  - org2admin@example.com / testpassword (admin, org2)")
        print("  - org2user@example.com / testpassword (user, org2)")
        print("\n🎯 You can now start user testing!")
    else:
        print("\n❌ org_id population failed. Please check the errors above.")

if __name__ == "__main__":
    main()