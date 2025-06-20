import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

assert SUPABASE_URL and SUPABASE_KEY, "Set SUPABASE_URL and SUPABASE_KEY in your environment."

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpassword"

# list_users returns a list directly in supabase-py; filter for the test email
users = supabase.auth.admin.list_users()
user = next((u for u in users if u.email == TEST_EMAIL), None)
if user:
    print(f"Test user {TEST_EMAIL} already exists.")
else:
    # Create user and ensure email_confirm is True
    result = supabase.auth.admin.create_user({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "email_confirm": True
    })
    print(f"Created test user: {result}") 