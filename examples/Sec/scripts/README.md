# Security Compliance Platform - Scripts

This directory contains utility scripts for maintaining and verifying the security compliance platform.

## Scripts Overview

### `verify_security.py`

Comprehensive security verification script that checks critical security features.

**Features:**

- ✅ Audit log append-only enforcement verification
- ✅ Log shipping functionality testing
- ✅ API security endpoint protection
- ✅ Frontend security file exposure checks

**Usage:**

```bash
# Set environment variables
export TEST_DB_DSN="postgresql://user:pass@localhost:5432/testdb"
export API_BASE_URL="http://localhost:8000"

# Run verification
python scripts/verify_security.py
```

**Requirements:**

- `psycopg2` for database testing
- `requests` for API testing
- Environment variables for database and API access

## Environment Variables

| Variable       | Description                              | Example                                        |
| -------------- | ---------------------------------------- | ---------------------------------------------- |
| `TEST_DB_DSN`  | PostgreSQL connection string for testing | `postgresql://user:pass@localhost:5432/testdb` |
| `API_BASE_URL` | Base URL for API testing                 | `http://localhost:8000`                        |

## Security Verification Checklist

The security verification script validates:

1. **Database Security**

   - Audit logs table prevents UPDATE operations
   - Audit logs table prevents DELETE operations
   - Triggers are properly configured

2. **API Security**

   - Health endpoints are accessible
   - Protected endpoints require authentication
   - Proper HTTP status codes for unauthorized access

3. **Log Shipping**

   - Export functionality works
   - Files are created in expected format
   - Shipping mechanism is operational

4. **Frontend Security**
   - Sensitive files are not exposed
   - Environment files are properly excluded
   - Build artifacts don't contain secrets

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
- name: Run Security Verification
  run: |
    pip install psycopg2-binary requests
    python scripts/verify_security.py
  env:
    TEST_DB_DSN: ${{ secrets.TEST_DB_DSN }}
    API_BASE_URL: http://localhost:8000
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify connection string format
- Check user permissions

### API Connection Issues

- Ensure backend server is running
- Verify API_BASE_URL is correct
- Check firewall/network settings

### Permission Issues

- Ensure script has execute permissions: `chmod +x scripts/verify_security.py`
- Verify database user has necessary permissions

## Adding New Security Checks

To add new security verification checks:

1. Create a new function in `verify_security.py`
2. Add it to the `checks` list in `main()`
3. Follow the pattern of returning `True` for pass, `False` for fail
4. Add appropriate error handling and logging

Example:

```python
def check_new_security_feature():
    """Check new security feature"""
    print("🔍 Checking new security feature...")
    try:
        # Your verification logic here
        return True
    except Exception as e:
        print(f"❌ New security check failed: {e}")
        return False
```
