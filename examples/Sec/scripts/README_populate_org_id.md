# Populate org_id for User Testing

This guide helps you set up test users with proper organization IDs so you can start user testing.

## Quick Setup

1. **Get your Supabase Service Role Key:**

   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (not the anon key)

2. **Set the environment variable:**

   ```bash
   # Windows (PowerShell)
   $env:SUPABASE_KEY="your-service-role-key-here"

   # Windows (Command Prompt)
   set SUPABASE_KEY=your-service-role-key-here

   # Linux/Mac
   export SUPABASE_KEY="your-service-role-key-here"
   ```

3. **Run the population script:**
   ```bash
   python scripts/populate_org_id.py
   ```

## What This Script Does

- ✅ Creates two test organizations
- ✅ Creates test users with proper org_id assignments
- ✅ Updates existing users to have org_id if missing
- ✅ Provides test credentials for immediate use

## Test Users Created

After running the script, you'll have these test users:

| Email                 | Password     | Role  | Organization        |
| --------------------- | ------------ | ----- | ------------------- |
| testuser@example.com  | testpassword | admin | Test Organization 1 |
| nonadmin@example.com  | testpassword | user  | Test Organization 1 |
| lastadmin@example.com | testpassword | admin | Test Organization 1 |
| org2admin@example.com | testpassword | admin | Test Organization 2 |
| org2user@example.com  | testpassword | user  | Test Organization 2 |

## Testing Multi-Org Functionality

1. **Login as different users** to test org isolation
2. **Verify data separation** between organizations
3. **Test role-based permissions** (admin vs user)
4. **Check user management** features work within org context

## Troubleshooting

### "SUPABASE_KEY is required" Error

- Make sure you're using the **service_role** key, not the anon key
- The service_role key starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### "Error 401" or "Error 403"

- Double-check your service_role key is correct
- Ensure your Supabase project is active

### Users Already Exist

- The script will update existing users with org_id
- No data will be lost, only org_id will be added

### Frontend Still Shows "Missing org_id"

- Clear browser cache and localStorage
- Logout and login again
- Check browser console for any auth errors

## Manual Alternative

If the script doesn't work, you can manually update users in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor → users
3. For each user, set the `org_id` field to:
   - `00000000-0000-0000-0000-000000000001` (for org1 users)
   - `00000000-0000-0000-0000-000000000002` (for org2 users)

## Next Steps

Once org_id is populated:

1. Start the frontend: `cd frontend && npm run dev`
2. Start the backend: `cd backend && python -m uvicorn main:app --reload`
3. Login with any test user
4. Verify the dashboard loads without org_id errors
5. Test user management, scans, and other features

Happy testing! 🚀
